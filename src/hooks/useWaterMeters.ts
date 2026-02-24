import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WaterMeter {
  id: string;
  unit_id: string | null;
  unit_number: string;
  penghuni_name: string | null;
  photo_url: string | null;
  photo_start_url: string | null;
  photo_end_url: string | null;
  meter_start: number;
  meter_end: number;
  usage_m3: number;
  nominal: number;
  billing_month: string;
  recorded_by: string | null;
  recorded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

interface WaterMeterInput {
  unit_id?: string | null;
  unit_number: string;
  penghuni_name?: string | null;
  photo_url?: string | null;
  photo_start_url?: string | null;
  photo_end_url?: string | null;
  meter_start: number;
  meter_end: number;
  billing_month: string;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
}

export function useWaterMeters(filters?: { search?: string; month?: string; year?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["water-meters", filters],
    queryFn: async () => {
      let q = (supabase as any)
        .from("water_meters")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.search) {
        q = q.or(`unit_number.ilike.%${filters.search}%,penghuni_name.ilike.%${filters.search}%`);
      }

      if (filters?.year) {
        const year = parseInt(filters.year);
        if (filters?.month) {
          const month = parseInt(filters.month);
          const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
          const endMonth = month === 12 ? 1 : month + 1;
          const endYear = month === 12 ? year + 1 : year;
          const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;
          q = q.gte("billing_month", startDate).lt("billing_month", endDate);
        } else {
          q = q.gte("billing_month", `${year}-01-01`).lt("billing_month", `${year + 1}-01-01`);
        }
      }

      const { data, error } = await q;
      if (error) throw error;
      return data as WaterMeter[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: WaterMeterInput) => {
      const { data: wmData, error: wmError } = await (supabase as any)
        .from("water_meters")
        .insert(input)
        .select()
        .single();

      if (wmError) {
        if (wmError.code === "23505") {
          throw new Error("Data meteran untuk unit dan bulan ini sudah ada.");
        }
        throw wmError;
      }

      // Auto-create water bill
      const usage = input.meter_end - input.meter_start;
      const nominal = usage * 17000;
      const billingDate = new Date(input.billing_month);
      const dueDate = new Date(billingDate);
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(15);

      const { data: penghuniData } = await supabase
        .from("penghuni")
        .select("id")
        .eq("unit_number", input.unit_number)
        .eq("is_active", true)
        .limit(1)
        .single();

      // Build proper period label from billing month
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const periodLabel = `${monthNames[billingDate.getMonth()]} ${billingDate.getFullYear()}`;

      const { error: billError } = await supabase
        .from("bills")
        .insert({
          unit_id: input.unit_id,
          unit_number: input.unit_number,
          penghuni_id: penghuniData?.id || null,
          bill_type: "air" as const,
          amount: nominal,
          total_amount: nominal,
          billing_period: input.billing_month,
          due_date: dueDate.toISOString().split("T")[0],
          payment_status: "unpaid" as const,
          is_auto_generated: true,
          quarter_label: periodLabel,
          notes: `Pemakaian air: ${usage} m³ (Meteran ${input.meter_start} → ${input.meter_end})`,
        });

      if (billError) {
        console.warn("Gagal membuat tagihan otomatis:", billError);
        toast.warning("Data meteran tersimpan, tapi gagal membuat tagihan otomatis.");
      }

      return wmData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-meters"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Data meteran air berhasil disimpan dan tagihan dibuat.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyimpan data meteran air.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("water_meters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["water-meters"] });
      toast.success("Data meteran air berhasil dihapus.");
    },
    onError: () => {
      toast.error("Gagal menghapus data meteran air.");
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    remove: deleteMutation.mutateAsync,
  };
}
