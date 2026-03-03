import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FieldInspection {
  id: string;
  unit_number: string;
  unit_id: string | null;
  finding_description: string;
  photo_before_url: string | null;
  photo_after_url: string | null;
  work_status: string;
  completed_by: string | null;
  completed_by_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateInspectionData {
  unit_number: string;
  unit_id?: string | null;
  finding_description: string;
  photo_before_url?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
}

interface UpdateInspectionData {
  id: string;
  work_status?: string;
  photo_after_url?: string | null;
  completed_by?: string | null;
  completed_by_name?: string | null;
}

export function useFieldInspections(search?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["field_inspections", search],
    queryFn: async () => {
      let query = supabase
        .from("field_inspections")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        query = query.or(`unit_number.ilike.%${search}%,finding_description.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FieldInspection[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateInspectionData) => {
      const { error } = await supabase.from("field_inspections").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field_inspections"] });
      toast({ title: "Berhasil", description: "Laporan inspeksi berhasil ditambahkan" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateInspectionData) => {
      const { error } = await supabase.from("field_inspections").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field_inspections"] });
      toast({ title: "Berhasil", description: "Laporan inspeksi berhasil diperbarui" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("field_inspections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field_inspections"] });
      toast({ title: "Berhasil", description: "Laporan inspeksi berhasil dihapus" });
    },
    onError: (err: Error) => {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    },
  });

  return {
    data,
    isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutate,
  };
}
