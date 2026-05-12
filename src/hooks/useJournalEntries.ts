import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_number: string | null;
  total_debit: number;
  total_credit: number;
  is_posted: boolean;
  posted_at: string | null;
  posted_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
  created_at: string;
}

export function useJournalEntries() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries" as any)
        .select("*")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as JournalEntry[];
    },
    enabled: !!user,
  });

  const addEntry = useMutation({
    mutationFn: async (payload: { entry: Partial<JournalEntry>; lines: Partial<JournalEntryLine>[] }) => {
      const { data: newEntry, error: entryError } = await supabase
        .from("journal_entries" as any)
        .insert({ ...payload.entry, created_by: user?.id } as any)
        .select()
        .single();
      if (entryError) throw entryError;

      const entryId = (newEntry as any).id;
      const linesWithId = payload.lines.map((l) => ({ ...l, journal_entry_id: entryId }));
      const { error: linesError } = await supabase
        .from("journal_entry_lines" as any)
        .insert(linesWithId as any);
      if (linesError) throw linesError;

      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Jurnal berhasil ditambahkan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const postEntry = useMutation({
    mutationFn: async (id: string) => {
      // Get journal lines
      const { data: lines, error: linesErr } = await supabase
        .from("journal_entry_lines" as any)
        .select("*")
        .eq("journal_entry_id", id);
      if (linesErr) throw linesErr;

      // Update each account balance
      for (const line of (lines as any[] || [])) {
        const { data: account, error: accErr } = await supabase
          .from("chart_of_accounts" as any)
          .select("current_balance, normal_balance")
          .eq("id", line.account_id)
          .single();
        if (accErr) throw accErr;

        const acc = account as any;
        let newBalance = acc.current_balance;
        if (acc.normal_balance === "debit") {
          newBalance += line.debit_amount - line.credit_amount;
        } else {
          newBalance += line.credit_amount - line.debit_amount;
        }

        const { error: updateErr } = await supabase
          .from("chart_of_accounts" as any)
          .update({ current_balance: newBalance } as any)
          .eq("id", line.account_id);
        if (updateErr) throw updateErr;
      }

      // Mark as posted
      const { error } = await supabase
        .from("journal_entries" as any)
        .update({ is_posted: true, posted_at: new Date().toISOString(), posted_by: user?.id } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Jurnal berhasil diposting ke Buku Besar");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("journal_entries" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Jurnal berhasil dihapus");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Admin-only: hapus jurnal yang sudah diposting (reverse saldo akun terlebih dahulu)
  const forceDeleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { data: entry } = await supabase
        .from("journal_entries" as any)
        .select("is_posted")
        .eq("id", id)
        .single();
      const wasPosted = (entry as any)?.is_posted;

      if (wasPosted) {
        const { data: lines, error: linesErr } = await supabase
          .from("journal_entry_lines" as any)
          .select("*")
          .eq("journal_entry_id", id);
        if (linesErr) throw linesErr;

        for (const line of (lines as any[] || [])) {
          const { data: account, error: accErr } = await supabase
            .from("chart_of_accounts" as any)
            .select("current_balance, normal_balance")
            .eq("id", line.account_id)
            .single();
          if (accErr) throw accErr;
          const acc = account as any;
          let newBalance = acc.current_balance;
          // Reverse: kurangi efek posting
          if (acc.normal_balance === "debit") {
            newBalance -= (line.debit_amount - line.credit_amount);
          } else {
            newBalance -= (line.credit_amount - line.debit_amount);
          }
          await supabase
            .from("chart_of_accounts" as any)
            .update({ current_balance: newBalance } as any)
            .eq("id", line.account_id);
        }
      }

      const { error } = await supabase.from("journal_entries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Jurnal (terposting) berhasil dihapus & saldo dikembalikan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkInsert = useMutation({
    mutationFn: async (
      payload: { entry: Partial<JournalEntry>; lines: Partial<JournalEntryLine>[] }[]
    ) => {
      for (const p of payload) {
        const { data: newEntry, error: entryError } = await supabase
          .from("journal_entries" as any)
          .insert({ ...p.entry, created_by: user?.id } as any)
          .select()
          .single();
        if (entryError) throw entryError;
        const entryId = (newEntry as any).id;
        const linesWithId = p.lines.map((l) => ({ ...l, journal_entry_id: entryId }));
        const { error: linesError } = await supabase
          .from("journal_entry_lines" as any)
          .insert(linesWithId as any);
        if (linesError) throw linesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Import jurnal berhasil");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getEntryLines = async (entryId: string) => {
    const { data, error } = await supabase
      .from("journal_entry_lines" as any)
      .select("*")
      .eq("journal_entry_id", entryId);
    if (error) throw error;
    return (data || []) as unknown as JournalEntryLine[];
  };

  return { entries, isLoading, addEntry, postEntry, deleteEntry, forceDeleteEntry, bulkInsert, getEntryLines };
}
