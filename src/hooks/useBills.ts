import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BillPayment {
  id: string;
  bill_id: string;
  month_number: number;
  month_label: string;
  month_date: string;
  sc_amount: number;
  sf_amount: number;
  total_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  paid_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuarterlyBill {
  id: string;
  unit_id: string | null;
  unit_number: string | null;
  penghuni_id: string | null;
  quarter_start: string;
  quarter_end: string;
  quarter_label: string;
  sc_monthly: number;
  sf_monthly: number;
  sc_total: number;
  sf_total: number;
  total_amount: number;
  amount: number;
  due_date: string;
  payment_status: "unpaid" | "paid" | "partial";
  paid_amount: number | null;
  paid_at: string | null;
  is_auto_generated: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  units?: { unit_number: string } | null;
  penghuni?: { full_name: string; phone: string | null; address: string | null } | null;
  bill_payments?: BillPayment[];
}

export function useBills() {
  return useQuery({
    queryKey: ["bills"],
    queryFn: async (): Promise<QuarterlyBill[]> => {
      const allBills: QuarterlyBill[] = [];
      const pageSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("bills")
          .select(`
            *,
            units:unit_id(unit_number),
            penghuni:penghuni_id(full_name, phone, address)
          `)
          .not("quarter_label", "is", null)
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (data) {
          allBills.push(...(data as unknown as QuarterlyBill[]));
          hasMore = data.length === pageSize;
          from += pageSize;
        } else {
          hasMore = false;
        }
      }

      // Fetch bill_payments for all bills
      if (allBills.length > 0) {
        const billIds = allBills.map((b) => b.id);
        const { data: payments, error: pError } = await supabase
          .from("bill_payments")
          .select("*")
          .in("bill_id", billIds)
          .order("month_number", { ascending: true });

        if (!pError && payments) {
          const paymentsByBill = new Map<string, BillPayment[]>();
          for (const p of payments as BillPayment[]) {
            if (!paymentsByBill.has(p.bill_id)) paymentsByBill.set(p.bill_id, []);
            paymentsByBill.get(p.bill_id)!.push(p);
          }
          for (const bill of allBills) {
            bill.bill_payments = paymentsByBill.get(bill.id) || [];
          }
        }
      }

      return allBills;
    },
  });
}

export function useCreateQuarterlyBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      unit_number: string;
      penghuni_id?: string | null;
      quarter_start: string;
      quarter_end: string;
      quarter_label: string;
      sc_monthly: number;
      sf_monthly: number;
      due_date: string;
      notes?: string;
      is_auto_generated?: boolean;
    }) => {
      const sc_total = input.sc_monthly * 3;
      const sf_total = input.sf_monthly * 3;
      const total_amount = sc_total + sf_total;

      // Create the quarterly bill
      const { data: bill, error } = await supabase
        .from("bills")
        .insert({
          unit_id: input.unit_id,
          unit_number: input.unit_number,
          penghuni_id: input.penghuni_id || null,
          bill_type: "ipl",
          amount: total_amount,
          billing_period: input.quarter_start,
          due_date: input.due_date,
          quarter_start: input.quarter_start,
          quarter_end: input.quarter_end,
          quarter_label: input.quarter_label,
          sc_monthly: input.sc_monthly,
          sf_monthly: input.sf_monthly,
          sc_total,
          sf_total,
          total_amount,
          is_auto_generated: input.is_auto_generated ?? false,
          notes: input.notes || null,
          payment_status: "unpaid",
        })
        .select()
        .single();

      if (error) throw error;

      // Create 3 monthly payment records
      const startDate = new Date(input.quarter_start);
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

      const payments = [];
      for (let i = 0; i < 3; i++) {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`;
        const monthDateStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`;

        payments.push({
          bill_id: bill.id,
          month_number: i + 1,
          month_label: monthLabel,
          month_date: monthDateStr,
          sc_amount: input.sc_monthly,
          sf_amount: input.sf_monthly,
          total_amount: input.sc_monthly + input.sf_monthly,
        });
      }

      const { error: pError } = await supabase.from("bill_payments").insert(payments);
      if (pError) throw pError;

      return bill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success("Tagihan kuartalan berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal membuat tagihan: " + error.message);
    },
  });
}

export function usePayBillMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, paid_amount }: { paymentId: string; paid_amount: number }) => {
      // Mark the monthly payment as paid
      const { data: payment, error } = await supabase
        .from("bill_payments")
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          paid_amount,
        })
        .eq("id", paymentId)
        .select("*, bill_id")
        .single();

      if (error) throw error;

      // Check how many months are paid for this bill
      const { data: allPayments, error: pError } = await supabase
        .from("bill_payments")
        .select("is_paid")
        .eq("bill_id", payment.bill_id);

      if (pError) throw pError;

      const paidCount = allPayments?.filter((p: any) => p.is_paid).length || 0;
      const totalPaid = paidCount === 3 ? "paid" : paidCount > 0 ? "partial" : "unpaid";

      // Compute total paid amount
      const { data: paidPayments } = await supabase
        .from("bill_payments")
        .select("paid_amount")
        .eq("bill_id", payment.bill_id)
        .eq("is_paid", true);

      const totalPaidAmount = paidPayments?.reduce((s: number, p: any) => s + (p.paid_amount || 0), 0) || 0;

      // Update bill status
      await supabase
        .from("bills")
        .update({
          payment_status: totalPaid as any,
          paid_amount: totalPaidAmount,
          paid_at: paidCount === 3 ? new Date().toISOString() : null,
        })
        .eq("id", payment.bill_id);

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      toast.success("Pembayaran bulan berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat pembayaran: " + error.message);
    },
  });
}

export function useRevertBillMonthPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data: payment, error } = await supabase
        .from("bill_payments")
        .update({
          is_paid: false,
          paid_at: null,
          paid_amount: null,
        })
        .eq("id", paymentId)
        .select("*, bill_id")
        .single();

      if (error) throw error;

      // Recompute bill status
      const { data: allPayments } = await supabase
        .from("bill_payments")
        .select("is_paid, paid_amount")
        .eq("bill_id", payment.bill_id);

      const paidCount = allPayments?.filter((p: any) => p.is_paid).length || 0;
      const totalPaid = paidCount === 3 ? "paid" : paidCount > 0 ? "partial" : "unpaid";
      const totalPaidAmount = allPayments?.filter((p: any) => p.is_paid).reduce((s: number, p: any) => s + (p.paid_amount || 0), 0) || 0;

      await supabase
        .from("bills")
        .update({
          payment_status: totalPaid as any,
          paid_amount: totalPaidAmount > 0 ? totalPaidAmount : null,
          paid_at: null,
        })
        .eq("id", payment.bill_id);

      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      toast.success("Pembayaran bulan dibatalkan");
    },
    onError: (error) => {
      toast.error("Gagal membatalkan pembayaran: " + error.message);
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

// Keep backward compat exports
export const useCreateBill = useCreateQuarterlyBill;
export const useUpdateBillPayment = usePayBillMonth;
export const useRevertBillPayment = useRevertBillMonthPayment;
