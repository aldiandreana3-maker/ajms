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
  coa_account_id: string | null;
  journal_entry_id: string | null;
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
      coaAccountId,
    }: {
      queueId?: string | null;
      queueNumber?: string | null;
      unitNumber: string;
      selectedPayments: BillPaymentItem[];
      paymentMethod: string;
      coaAccountId?: string | null;
    }) => {
      const totalAmount = selectedPayments.reduce((s, p) => s + Number(p.total_amount), 0);
      const txId = `TXN-${format(new Date(), "yyyyMMdd-HHmmss")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const { data: { user } } = await supabase.auth.getUser();

      const effectiveQueueNumber = queueNumber || `WALKIN-${format(new Date(), "HHmmss")}`;

      const { data: tx, error: txError } = await supabase
        .from("cashier_transactions")
        .insert({
          queue_id: queueId || null,
          transaction_id: txId,
          queue_number: effectiveQueueNumber,
          customer_name: unitNumber,
          payment_method: paymentMethod,
          subtotal: totalAmount,
          total_amount: totalAmount,
          cashier_id: user?.id || null,
          transaction_date: today(),
          coa_account_id: coaAccountId || null,
        } as any)
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
        bill_payment_id: p.id,
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

      // Mark queue as completed (only if there's a queue)
      if (queueId) {
        await supabase
          .from("cashier_queues")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", queueId);
      }

      // Auto-create journal entry (DRAFT - belum diposting) sesuai metode pembayaran
      let journalEntryId: string | null = null;
      if (coaAccountId && totalAmount > 0) {
        try {
          // Find a default income/revenue account (PENDAPATAN)
          const { data: incomeAccounts } = await supabase
            .from("chart_of_accounts" as any)
            .select("id, account_type, account_code, normal_balance")
            .eq("account_type", "PENDAPATAN")
            .eq("is_active", true)
            .order("account_code")
            .limit(1);
          const incomeAccount: any = (incomeAccounts || [])[0];

          // Get the chosen (cash/bank) account
          const { data: cashAccount } = await supabase
            .from("chart_of_accounts" as any)
            .select("id, account_name, current_balance, normal_balance, account_type")
            .eq("id", coaAccountId)
            .single();

          if (incomeAccount && cashAccount) {
            // Prefix nomor jurnal sesuai metode pembayaran
            const methodPrefix: Record<string, string> = {
              cash: "KAS",
              transfer: "TRF",
              qris: "QRIS",
              debit: "DEBIT",
            };
            const methodLabel: Record<string, string> = {
              cash: "Tunai (Cash)",
              transfer: "Transfer Bank",
              qris: "QRIS",
              debit: "Kartu Debit",
            };
            const prefix = methodPrefix[paymentMethod] || "TRX";
            const label = methodLabel[paymentMethod] || paymentMethod.toUpperCase();
            const entryNumber = `${prefix}-${format(new Date(), "yyyyMMdd-HHmmss")}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            const { data: entry, error: entryErr } = await supabase
              .from("journal_entries" as any)
              .insert({
                entry_number: entryNumber,
                entry_date: today(),
                description: `Penerimaan ${label} - Unit ${unitNumber} (${txId})`,
                reference_number: txId,
                total_debit: totalAmount,
                total_credit: totalAmount,
                is_posted: false,
                posted_at: null,
                posted_by: null,
                created_by: user?.id || null,
              } as any)
              .select()
              .single();

            if (!entryErr && entry) {
              journalEntryId = (entry as any).id;
              await supabase.from("journal_entry_lines" as any).insert([
                {
                  journal_entry_id: journalEntryId,
                  account_id: coaAccountId,
                  debit_amount: totalAmount,
                  credit_amount: 0,
                  description: `Penerimaan ${label} dari unit ${unitNumber}`,
                },
                {
                  journal_entry_id: journalEntryId,
                  account_id: incomeAccount.id,
                  debit_amount: 0,
                  credit_amount: totalAmount,
                  description: `Pendapatan IPL unit ${unitNumber}`,
                },
              ] as any);

              // Link journal to transaction (saldo akun TIDAK diupdate sampai diposting manual)
              await supabase
                .from("cashier_transactions")
                .update({ journal_entry_id: journalEntryId } as any)
                .eq("id", tx.id);
            }
          }
        } catch (e) {
          console.error("Failed to create journal entry:", e);
        }
      }

      return {
        ...tx,
        items: itemsToInsert.map((i) => ({ item_name: i.item_name, quantity: i.quantity, price: i.price, total: i.total })),
        selectedPayments,
        journalEntryId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-queues"] });
      queryClient.invalidateQueries({ queryKey: ["cashier-transactions-all"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      toast({ title: "Transaksi berhasil disimpan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan transaksi", description: error.message, variant: "destructive" });
    },
  });

  // Delete a transaction (admin) – reverses bill payments and journal entry
  const deleteTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      // Fetch transaction
      const { data: tx, error: txErr } = await supabase
        .from("cashier_transactions")
        .select("*")
        .eq("id", transactionId)
        .single();
      if (txErr || !tx) throw txErr || new Error("Transaksi tidak ditemukan");

      // Fetch items
      const { data: items } = await supabase
        .from("cashier_transaction_items")
        .select("*")
        .eq("transaction_id", transactionId);

      // Reverse bill_payments using bill_payment_id when available
      const billIdsToRecompute = new Set<string>();
      for (const item of (items || []) as any[]) {
        if (!item.bill_payment_id) continue;
        const { data: bp } = await supabase
          .from("bill_payments")
          .select("bill_id")
          .eq("id", item.bill_payment_id)
          .single();
        if (bp?.bill_id) billIdsToRecompute.add(bp.bill_id);
        await supabase
          .from("bill_payments")
          .update({ is_paid: false, paid_at: null, paid_amount: null })
          .eq("id", item.bill_payment_id);
      }

      // Recompute parent bills
      for (const billId of billIdsToRecompute) {
        const { data: allPayments } = await supabase
          .from("bill_payments")
          .select("is_paid, paid_amount")
          .eq("bill_id", billId);
        const paidCount = allPayments?.filter((p: any) => p.is_paid).length || 0;
        const totalCount = allPayments?.length || 0;
        const newStatus = paidCount === 0 ? "unpaid" : paidCount === totalCount ? "paid" : "partial";
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

      // Reverse journal entry if exists
      const journalId = (tx as any).journal_entry_id;
      if (journalId) {
        const { data: lines } = await supabase
          .from("journal_entry_lines" as any)
          .select("*")
          .eq("journal_entry_id", journalId);
        for (const line of ((lines as any[]) || [])) {
          const { data: acc } = await supabase
            .from("chart_of_accounts" as any)
            .select("current_balance, normal_balance")
            .eq("id", line.account_id)
            .single();
          if (!acc) continue;
          const a: any = acc;
          let newBal = Number(a.current_balance);
          if (a.normal_balance === "debit") newBal -= (Number(line.debit_amount) - Number(line.credit_amount));
          else newBal -= (Number(line.credit_amount) - Number(line.debit_amount));
          await supabase
            .from("chart_of_accounts" as any)
            .update({ current_balance: newBal } as any)
            .eq("id", line.account_id);
        }
        await supabase.from("journal_entry_lines" as any).delete().eq("journal_entry_id", journalId);
        await supabase.from("journal_entries" as any).delete().eq("id", journalId);
      }

      // Delete items + transaction
      await supabase.from("cashier_transaction_items").delete().eq("transaction_id", transactionId);
      const { error: delErr } = await supabase.from("cashier_transactions").delete().eq("id", transactionId);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashier-transactions-all"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["financial-report"] });
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      toast({ title: "Transaksi dihapus & saldo dikembalikan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menghapus transaksi", description: error.message, variant: "destructive" });
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
    deleteTransaction,
    fetchUnitBills,
  };
}
