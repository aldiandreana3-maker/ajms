import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeePermit {
  id: string;
  user_id: string;
  permit_type: string;
  permit_date: string;
  reason: string;
  document_url: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployeePermits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-permits", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_permits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeePermit[];
    },
    enabled: !!user,
  });
}

export function useCreatePermit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { permit_type: string; permit_date: string; reason: string; document_url?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("employee_permits").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-permits"] });
      toast({ title: "Berhasil", description: "Pengajuan izin berhasil dikirim" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePermitStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("employee_permits")
        .update({ status, approved_by: user.id, approved_at: new Date().toISOString(), notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-permits"] });
      toast({ title: "Berhasil", description: "Status izin diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}
