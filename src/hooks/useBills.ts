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

      const { unit_number, ...rest } = input;
      const { data, error } = await supabase
        .from("bills")
        .insert({ ...rest, unit_id: unit_id || null })
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

export function useGenerateMonthlyBills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billing_period, due_date }: { billing_period: string; due_date: string }) => {
      // Get all active units
      const { data: units, error: unitsError } = await supabase
        .from("units")
        .select("id")
        .eq("status", "occupied");

      if (unitsError) throw unitsError;

      // Define auto-generated bill types with amounts
      const billTypes: { type: BillType; amount: number }[] = [
        { type: "ipl", amount: 500000 },
        { type: "kebersihan", amount: 100000 },
        { type: "keamanan", amount: 75000 },
        { type: "sinking_fund", amount: 150000 },
        { type: "listrik", amount: 0 }, // Will be filled manually later
      ];

      const bills: CreateBillInput[] = [];

      for (const unit of units || []) {
        for (const billType of billTypes) {
          if (billType.amount > 0) {
            bills.push({
              unit_id: unit.id,
              bill_type: billType.type,
              amount: billType.amount,
              billing_period,
              due_date,
              is_auto_generated: true,
            });
          }
        }
      }

      if (bills.length > 0) {
        const { error } = await supabase.from("bills").insert(bills);
        if (error) throw error;
      }

      return { count: bills.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(`${data.count} tagihan berhasil digenerate`);
    },
    onError: (error) => {
      toast.error("Gagal generate tagihan: " + error.message);
    },
  });
}
