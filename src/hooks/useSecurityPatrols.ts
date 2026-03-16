import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SecurityPatrol {
  id: string;
  patrol_date: string;
  patrol_time: string;
  location: string;
  status: string;
  photo_url: string | null;
  notes: string | null;
  officer_id: string | null;
  officer_name: string | null;
  created_at: string;
}

export function useSecurityPatrols() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const patrols = useQuery({
    queryKey: ["security-patrols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_patrols")
        .select("*")
        .order("patrol_time", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as SecurityPatrol[];
    },
  });

  const addPatrol = useMutation({
    mutationFn: async (patrol: Partial<SecurityPatrol>) => {
      const { data, error } = await supabase
        .from("security_patrols")
        .insert(patrol as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-patrols"] });
      toast({ title: "Patroli berhasil dicatat" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal mencatat patroli", description: e.message, variant: "destructive" });
    },
  });

  const uploadPhoto = async (file: File) => {
    const ext = file.name.split(".").pop();
    const path = `security/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kepenghunian-files").upload(path, file);
    if (error) throw error;
    const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl || "";
  };

  return { patrols, addPatrol, uploadPhoto };
}
