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

export interface UnitBill {
  id: string;
  unit_number: string | null;
  bill_type: string;
  billing_period: string;
  amount: number;
  total_amount: number | null;
  payment_status: string | null;
  quarter_label: string | null;
  sc_total: number | null;
  sf_total: number | null;
  notes: string | null;
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

  // Fetch today's transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["cashier-transactions", today()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cashier_transactions")
        .select("*")
        .eq("transaction_date", today())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CashierTransaction[];
    },
  });

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

  // Fetch bills for a unit number
  const fetchUnitBills = async (unitNumber: string): Promise<UnitBill[]> => {
    const { data, error } = await supabase
      .from("bills")
      .select("id, unit_number, bill_type, billing_period, amount, total_amount, payment_status, quarter_label, sc_total, sf_total, notes")
      .eq("unit_number", unitNumber)
      .in("payment_status", ["unpaid", "partial"])
      .order("billing_period", { ascending: false });
    if (error) throw error;
    return (data || []) as UnitBill[];
  };

  // Complete transaction with selected bills
  const completeTransaction = useMutation({
    mutationFn: async ({
      queueId,
      queueNumber,
      unitNumber,
      selectedBills,
      paymentMethod,
    }: {
      queueId: string;
      queueNumber: string;
      unitNumber: string;
      selectedBills: UnitBill[];
      paymentMethod: string;
    }) => {
      const totalAmount = selectedBills.reduce((s, b) => s + Number(b.total_amount || b.amount), 0);
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

      // Insert items from bills
      const itemsToInsert = selectedBills.map((bill) => ({
        transaction_id: tx.id,
        item_name: `${bill.bill_type.toUpperCase()} - ${bill.quarter_label || bill.billing_period}`,
        quantity: 1,
        price: Number(bill.total_amount || bill.amount),
        total: Number(bill.total_amount || bill.amount),
      }));

      const { error: itemsError } = await supabase
        .from("cashier_transaction_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Mark bills as paid
      for (const bill of selectedBills) {
        await supabase
          .from("bills")
          .update({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
            paid_amount: Number(bill.total_amount || bill.amount),
          })
          .eq("id", bill.id);
      }

      // Mark queue as completed
      await supabase
        .from("cashier_queues")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", queueId);

      return {
        ...tx,
        items: itemsToInsert.map((i) => ({ item_name: i.item_name, quantity: i.quantity, price: i.price, total: i.total })),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-queues"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-transactions"] });
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
