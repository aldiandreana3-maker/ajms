import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface QueueItem {
  id: string;
  queue_number: string;
  queue_date: string;
  status: string;
  called_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BillPaymentItem {
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
}

export interface UnitBillWithPayments {
  id: string;
  unit_number: string | null;
  bill_type: string;
  billing_period: string;
  amount: number;
  total_amount: number | null;
  payment_status: string | null;
  quarter_label: string | null;
  quarter_start: string | null;
  quarter_end: string | null;
  sc_total: number | null;
  sf_total: number | null;
  sc_monthly: number | null;
  sf_monthly: number | null;
  notes: string | null;
  due_date: string;
  paid_amount: number | null;
  bill_payments: BillPaymentItem[];
}

export interface CashierTransaction {
  id: string;
  queue_id: string | null;
  transaction_id: string;
  queue_number: string;
  customer_name: string;
  payment_method: string;
  subtotal: number;
  total_amount: number;
  cashier_id: string | null;
  transaction_date: string;
  created_at: string;
}

const today = () => format(new Date(), "yyyy-MM-dd");

export function useCashier() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's queues
  const { data: queues = [], isLoading: queuesLoading } = useQuery({
    queryKey: ["cashier-queues", today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashier_queues")
        .select("*")
        .eq("queue_date", today())
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as QueueItem[];
    },
  });

  // Fetch all transactions
  const { data: allTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["cashier-transactions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashier_transactions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CashierTransaction[];
    },
  });

  const transactions = allTransactions.filter((t) => t.transaction_date === today());

  // Take a queue number
  const takeQueue = useMutation({
    mutationFn: async () => {
      const todayDate = today();
      const { data: lastQueue } = await supabase
        .from("cashier_queues")
        .select("queue_number")
        .eq("queue_date", todayDate)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let nextNum = 1;
      if (lastQueue?.queue_number) {
        const num = parseInt(lastQueue.queue_number.replace("A", ""), 10);
        nextNum = num + 1;
      }
      const queueNumber = `A${String(nextNum).padStart(3, "0")}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("cashier_queues")
        .insert({
          queue_number: queueNumber,
          queue_date: todayDate,
          status: "waiting",
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as QueueItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-queues"] });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal mengambil nomor antrian", description: error.message, variant: "destructive" });
    },
  });

  // Call next queue
  const callNext = useMutation({
    mutationFn: async () => {
      const { data: nextQueue, error: fetchError } = await supabase
        .from("cashier_queues")
        .select("*")
        .eq("queue_date", today())
        .eq("status", "waiting")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (fetchError || !nextQueue) throw new Error("Tidak ada antrian yang menunggu");

      const { data, error } = await supabase
        .from("cashier_queues")
        .update({ status: "called", called_at: new Date().toISOString() })
        .eq("id", nextQueue.id)
        .select()
        .single();

      if (error) throw error;
      return data as QueueItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-queues"] });
    },
    onError: (error: Error) => {
      toast({ title: "Info", description: error.message, variant: "destructive" });
    },
  });

  // Fetch bills with monthly payments for a unit
  const fetchUnitBills = async (unitNumber: string): Promise<UnitBillWithPayments[]> => {
    const { data, error } = await supabase
      .from("bills")
      .select("id, unit_number, bill_type, billing_period, amount, total_amount, payment_status, quarter_label, quarter_start, quarter_end, sc_total, sf_total, sc_monthly, sf_monthly, notes, due_date, paid_amount")
      .eq("unit_number", unitNumber)
      .in("payment_status", ["unpaid", "partial"])
      .order("billing_period", { ascending: false });
    if (error) throw error;

    const bills = (data || []) as UnitBillWithPayments[];

    // Fetch bill_payments for these bills
    if (bills.length > 0) {
      const billIds = bills.map((b) => b.id);
      const { data: payments, error: pError } = await supabase
        .from("bill_payments")
        .select("*")
        .in("bill_id", billIds)
        .order("month_number", { ascending: true });

      if (!pError && payments) {
        const paymentsByBill = new Map<string, BillPaymentItem[]>();
        for (const p of payments as BillPaymentItem[]) {
          if (!paymentsByBill.has(p.bill_id)) paymentsByBill.set(p.bill_id, []);
          paymentsByBill.get(p.bill_id)!.push(p);
        }
        for (const bill of bills) {
          bill.bill_payments = paymentsByBill.get(bill.id) || [];
        }
      } else {
        for (const bill of bills) {
          bill.bill_payments = [];
        }
      }
    }

    return bills;
  };

  // Complete transaction with selected monthly payments
  const completeTransaction = useMutation({
    mutationFn: async ({
      queueId,
      queueNumber,
      unitNumber,
      selectedPayments,
      paymentMethod,
    }: {
      queueId: string;
      queueNumber: string;
      unitNumber: string;
      selectedPayments: BillPaymentItem[];
      paymentMethod: string;
    }) => {
      const totalAmount = selectedPayments.reduce((s, p) => s + Number(p.total_amount), 0);
      const txId = `TXN-${format(new Date(), "yyyyMMdd-HHmmss")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: { user } } = await supabase.auth.getUser();

      const { data: tx, error: txError } = await supabase
        .from("cashier_transactions")
        .insert({
          queue_id: queueId,
          transaction_id: txId,
          queue_number: queueNumber,
          customer_name: unitNumber,
          payment_method: paymentMethod,
          subtotal: totalAmount,
          total_amount: totalAmount,
          cashier_id: user?.id || null,
          transaction_date: today(),
        })
        .select()
        .single();

      if (txError) throw txError;

      // Insert transaction items
      const itemsToInsert = selectedPayments.map((p) => ({
        transaction_id: tx.id,
        item_name: p.month_label,
        quantity: 1,
        price: Number(p.total_amount),
        total: Number(p.total_amount),
      }));

      const { error: itemsError } = await supabase
        .from("cashier_transaction_items")
        .insert(itemsToInsert);
      if (itemsError) throw itemsError;

      // Mark each monthly payment as paid and update parent bill status
      const billIdsToUpdate = new Set<string>();
      for (const payment of selectedPayments) {
        await supabase
          .from("bill_payments")
          .update({
            is_paid: true,
            paid_at: new Date().toISOString(),
            paid_amount: Number(payment.total_amount),
          })
          .eq("id", payment.id);
        billIdsToUpdate.add(payment.bill_id);
      }

      // Recompute each parent bill status
      for (const billId of billIdsToUpdate) {
        const { data: allPayments } = await supabase
          .from("bill_payments")
          .select("is_paid, paid_amount")
          .eq("bill_id", billId);

        const paidCount = allPayments?.filter((p: any) => p.is_paid).length || 0;
        const totalCount = allPayments?.length || 0;
        const newStatus = paidCount === totalCount ? "paid" : paidCount > 0 ? "partial" : "unpaid";
        const totalPaidAmount = allPayments?.filter((p: any) => p.is_paid).reduce((s: number, p: any) => s + (p.paid_amount || 0), 0) || 0;

        await supabase
          .from("bills")
          .update({
            payment_status: newStatus as any,
            paid_amount: totalPaidAmount > 0 ? totalPaidAmount : null,
            paid_at: newStatus === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", billId);
      }

      // Mark queue as completed
      await supabase
        .from("cashier_queues")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", queueId);

      return {
        ...tx,
        items: itemsToInsert.map((i) => ({ item_name: i.item_name, quantity: i.quantity, price: i.price, total: i.total })),
        selectedPayments,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-queues"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-transactions-all"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      toast({ title: "Transaksi berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan transaksi", description: error.message, variant: "destructive" });
    },
  });

  // Derived data
  const waitingQueues = queues.filter((q) => q.status === "waiting");
  const calledQueue = queues.find((q) => q.status === "called");
  const completedQueues = queues.filter((q) => q.status === "completed");
  const todayTotal = transactions.reduce((s, t) => s + Number(t.total_amount), 0);

  return {
    queues,
    queuesLoading,
    transactions,
    allTransactions,
    transactionsLoading,
    waitingQueues,
    calledQueue,
    completedQueues,
    todayTotal,
    takeQueue,
    callNext,
    completeTransaction,
    fetchUnitBills,
  };
}
