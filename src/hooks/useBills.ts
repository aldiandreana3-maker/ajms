import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type BillType = "ipl" | "kebersihan" | "keamanan" | "sinking_fund" | "listrik" | "air" | "denda" | "perbaikan";
type PaymentStatus = "unpaid" | "paid" | "overdue";

interface Bill {
  id: string;
  unit_id: string;
  penghuni_id: string | null;
  bill_type: BillType;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: PaymentStatus;
  paid_at: string | null;
  paid_amount: number | null;
  is_auto_generated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  units?: { unit_number: string } | null;
  penghuni?: { full_name: string } | null;
}

interface CreateBillInput {
  unit_id?: string;
  unit_number?: string;
  penghuni_id?: string;
  bill_type: BillType;
  amount: number;
  billing_period: string;
  due_date: string;
  is_auto_generated?: boolean;
  notes?: string;
}

export function useBills() {
  return useQuery({
    queryKey: ["bills"],
    queryFn: async (): Promise<Bill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select(`
          *,
          units:unit_id(unit_number),
          penghuni:penghuni_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Bill[];
    },
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBillInput) => {
      let unit_id = input.unit_id;

      // If unit_number provided, look up or skip unit_id
      if (!unit_id && input.unit_number) {
        const { data: unit } = await supabase
          .from("units")
          .select("id")
          .eq("unit_number", input.unit_number)
          .maybeSingle();
        unit_id = unit?.id || undefined;
      }

      // If we still don't have unit_id, try to find or create unit by unit_number
      if (!unit_id && input.unit_number) {
        // Try to create the unit if it doesn't exist
        const { data: newUnit } = await supabase
          .from("units")
          .upsert({ unit_number: input.unit_number }, { onConflict: "unit_number" })
          .select("id")
          .single();
        unit_id = newUnit?.id || undefined;
      }

      const { unit_number, ...rest } = input;
      const { data, error } = await supabase
        .from("bills")
        .insert({ ...rest, unit_id: unit_id || null, unit_number: input.unit_number || null })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Tagihan berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan tagihan: " + error.message);
    },
  });
}

export function useUpdateBillPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paid_amount }: { id: string; paid_amount: number }) => {
      const { data, error } = await supabase
        .from("bills")
        .update({ 
          payment_status: "paid" as PaymentStatus,
          paid_at: new Date().toISOString(),
          paid_amount 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      toast.success("Pembayaran berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat pembayaran: " + error.message);
    },
  });
}

export function useRevertBillPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("bills")
        .update({ 
          payment_status: "unpaid" as PaymentStatus,
          paid_at: null,
          paid_amount: null 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      toast.success("Status tagihan dikembalikan ke Belum Bayar");
    },
    onError: (error) => {
      toast.error("Gagal mengubah status: " + error.message);
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Tagihan berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus tagihan: " + error.message);
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; unit_number?: string; bill_type?: BillType; amount?: number; billing_period?: string; due_date?: string; notes?: string | null }) => {
      const { data, error } = await supabase
        .from("bills")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Tagihan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui tagihan: " + error.message);
    },
  });
}

export function useGenerateMonthlyBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing_period, due_date }: { billing_period: string; due_date: string }) => {
      // Call the edge function
      const { data, error } = await supabase.functions.invoke("generate-monthly-bills", {
        body: { billing_period, due_date },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(data?.message || "Tagihan berhasil digenerate");
    },
    onError: (error) => {
      toast.error("Gagal generate tagihan: " + error.message);
    },
  });
}
