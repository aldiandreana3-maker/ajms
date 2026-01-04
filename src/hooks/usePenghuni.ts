import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Penghuni {
  id: string;
  user_id: string | null;
  unit_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  ktp_number: string | null;
  is_owner: boolean | null;
  is_active: boolean | null;
  move_in_date: string | null;
  move_out_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  units?: { unit_number: string } | null;
}

interface CreatePenghuniData {
  full_name: string;
  unit_id: string;
  email?: string;
  phone?: string;
  ktp_number?: string;
  is_owner?: boolean;
  is_active?: boolean;
}

interface UpdatePenghuniData extends Partial<CreatePenghuniData> {
  id: string;
}

export function usePenghuni() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["penghuni"],
    queryFn: async (): Promise<Penghuni[]> => {
      const { data, error } = await supabase
        .from("penghuni")
        .select(`
          *,
          units:unit_id(unit_number)
        `)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Penghuni[];
    },
  });

  const createPenghuni = useMutation({
    mutationFn: async (data: CreatePenghuniData) => {
      const { data: result, error } = await supabase
        .from("penghuni")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
    },
  });

  const updatePenghuni = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePenghuniData) => {
      const { data: result, error } = await supabase
        .from("penghuni")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
    },
  });

  const deletePenghuni = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("penghuni")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
    },
  });

  return {
    penghuni: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPenghuni,
    updatePenghuni,
    deletePenghuni,
  };
}
