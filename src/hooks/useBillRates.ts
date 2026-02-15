import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BillRate {
  id: string;
  area_label: string;
  area_sqm: number;
  quarterly_amount: number;
  monthly_amount: number;
  monthly_sc: number;
  monthly_sf: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useBillRates() {
  return useQuery({
    queryKey: ["bill-rates"],
    queryFn: async (): Promise<BillRate[]> => {
      const { data, error } = await supabase
        .from("bill_rates")
        .select("*")
        .eq("is_active", true)
        .order("area_sqm", { ascending: true });

      if (error) throw error;
      return data as BillRate[];
    },
  });
}

export function useCreateBillRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { area_label: string; area_sqm: number; quarterly_amount: number; monthly_sc: number; monthly_sf: number }) => {
      const { data, error } = await supabase
        .from("bill_rates")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-rates"] });
      toast.success("Tarif berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan tarif: " + error.message);
    },
  });
}

export function useUpdateBillRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; area_label?: string; area_sqm?: number; quarterly_amount?: number; monthly_sc?: number; monthly_sf?: number }) => {
      const { data, error } = await supabase
        .from("bill_rates")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-rates"] });
      toast.success("Tarif berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui tarif: " + error.message);
    },
  });
}

export function useDeleteBillRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bill_rates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-rates"] });
      toast.success("Tarif berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus tarif: " + error.message);
    },
  });
}
