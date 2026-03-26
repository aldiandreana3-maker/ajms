import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Bicycle {
  id: string;
  code: string;
  brand: string;
  photo_url: string | null;
  photo_display_url?: string | null;
  owner_name: string | null;
  unit_number: string | null;
  unit_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const resolveStoragePath = (photoUrl: string | null) => {
  if (!photoUrl) return null;
  const marker = "/kepenghunian-files/";

  if (photoUrl.startsWith("http") && photoUrl.includes(marker)) {
    return photoUrl.split(marker)[1] ?? null;
  }

  return photoUrl;
};

export function useBicycles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bicycles = [], isLoading } = useQuery({
    queryKey: ["bicycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bicycles" as any)
        .select("*")
        .order("code", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as unknown as Bicycle[];

      const bicyclesWithPhotos = await Promise.all(
        rows.map(async (bicycle) => {
          const storagePath = resolveStoragePath(bicycle.photo_url);

          if (!storagePath) {
            return { ...bicycle, photo_display_url: null };
          }

          const { data: signedData, error: signedError } = await supabase.storage
            .from("kepenghunian-files")
            .createSignedUrl(storagePath, 60 * 60);

          if (signedError) {
            console.error("Signed URL error:", signedError);
            return { ...bicycle, photo_display_url: null };
          }

          return {
            ...bicycle,
            photo_display_url: signedData.signedUrl,
          };
        })
      );

      return bicyclesWithPhotos;
    },
  });

  const addBicycle = useMutation({
    mutationFn: async (bicycle: Omit<Bicycle, "id" | "created_at" | "updated_at" | "photo_display_url">) => {
      const { data, error } = await supabase
        .from("bicycles" as any)
        .insert(bicycle as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bicycles"] });
      toast({ title: "Berhasil", description: "Data sepeda berhasil ditambahkan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const updateBicycle = useMutation({
    mutationFn: async ({ id, photo_display_url, ...updates }: Partial<Bicycle> & { id: string }) => {
      const { data, error } = await supabase
        .from("bicycles" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bicycles"] });
      toast({ title: "Berhasil", description: "Data sepeda berhasil diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const deleteBicycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bicycles" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bicycles"] });
      toast({ title: "Berhasil", description: "Data sepeda berhasil dihapus" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const getNextCode = () => {
    if (bicycles.length === 0) return "0001";
    const maxCode = Math.max(...bicycles.map((b) => parseInt(b.code) || 0));
    return String(maxCode + 1).padStart(4, "0");
  };

  return { bicycles, isLoading, addBicycle, updateBicycle, deleteBicycle, getNextCode };
}
