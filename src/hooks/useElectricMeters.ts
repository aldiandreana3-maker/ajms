import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ElectricMeter {
  id: string;
  unit_id: string | null;
  unit_number: string;
  meter_number: string;
  meter_type: string;
  penghuni_name: string | null;
  install_date: string | null;
  meter_status: string;
  kwh_balance: number;
  price_per_kwh: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useElectricMeters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["electric-meters"],
    queryFn: async (): Promise<ElectricMeter[]> => {
      const { data, error } = await supabase
        .from("electric_meters")
        .select("*")
        .order("unit_number", { ascending: true });
      if (error) throw error;
      return data as unknown as ElectricMeter[];
    },
  });

  const createMeter = useMutation({
    mutationFn: async (meter: Partial<ElectricMeter>) => {
      const { data, error } = await supabase
        .from("electric_meters")
        .insert(meter as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electric-meters"] });
      toast({ title: "Meter berhasil ditambahkan" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menambahkan meter", description: e.message, variant: "destructive" });
    },
  });

  const updateMeter = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ElectricMeter> & { id: string }) => {
      const { error } = await supabase
        .from("electric_meters")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electric-meters"] });
      toast({ title: "Meter berhasil diperbarui" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal memperbarui meter", description: e.message, variant: "destructive" });
    },
  });

  const deleteMeter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("electric_meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electric-meters"] });
      toast({ title: "Meter berhasil dihapus" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menghapus meter", description: e.message, variant: "destructive" });
    },
  });

  return {
    meters: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createMeter,
    updateMeter,
    deleteMeter,
  };
}
