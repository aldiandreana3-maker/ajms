import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WaterTariff {
  id: string;
  abonemen: number;
  price_per_m3: number;
  updated_at: string;
}

export const DEFAULT_WATER_TARIFF: WaterTariff = {
  id: "",
  abonemen: 17000,
  price_per_m3: 12600,
  updated_at: "",
};

export function useWaterTariff() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["water-tariff"],
    queryFn: async (): Promise<WaterTariff> => {
      const { data, error } = await (supabase as any)
        .from("water_tariff_settings")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as WaterTariff) || DEFAULT_WATER_TARIFF;
    },
  });

  const update = useMutation({
    mutationFn: async (input: { abonemen: number; price_per_m3: number }) => {
      const current = query.data;
      if (!current?.id) {
        const { error } = await (supabase as any).from("water_tariff_settings").insert(input);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("water_tariff_settings")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("id", current.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-tariff"] });
      toast.success("Tarif air berhasil diperbarui");
    },
    onError: (e: Error) => toast.error("Gagal: " + e.message),
  });

  return {
    tariff: query.data || DEFAULT_WATER_TARIFF,
    isLoading: query.isLoading,
    update: update.mutateAsync,
    isUpdating: update.isPending,
  };
}

export function calcWaterNominal(usage: number, abonemen = 17000, pricePerM3 = 12600): number {
  const u = Math.max(0, usage);
  return abonemen + u * pricePerM3;
}
