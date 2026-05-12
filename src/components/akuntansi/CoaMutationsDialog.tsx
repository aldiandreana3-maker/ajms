import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChartAccount } from "@/hooks/useChartOfAccounts";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface MutationRow {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string;
  reference_number: string | null;
  debit_amount: number;
  credit_amount: number;
  is_posted: boolean;
}

export function CoaMutationsDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  account: ChartAccount | null;
}) {
  const [rows, setRows] = useState<MutationRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !account) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("journal_entry_lines" as any)
        .select("id, debit_amount, credit_amount, journal_entries(id, entry_date, entry_number, description, reference_number, is_posted)")
        .eq("account_id", account.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (!error && data) {
        const flat: MutationRow[] = (data as any[]).map((l) => ({
          id: l.id,
          entry_date: l.journal_entries?.entry_date,
          entry_number: l.journal_entries?.entry_number,
          description: l.journal_entries?.description,
          reference_number: l.journal_entries?.reference_number,
          debit_amount: Number(l.debit_amount),
          credit_amount: Number(l.credit_amount),
          is_posted: l.journal_entries?.is_posted,
        }));
        setRows(flat);
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
  }, [open, account]);

  const totalDebit = rows.reduce((s, r) => s + r.debit_amount, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit_amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Mutasi Akun: {account?.account_code} — {account?.account_name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-muted-foreground text-xs">Saldo Berjalan</p>
            <p className="font-bold">{formatRp(Number(account?.current_balance || 0))}</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <p className="text-muted-foreground text-xs">Total Debit</p>
            <p className="font-bold text-blue-700 dark:text-blue-300">{formatRp(totalDebit)}</p>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <p className="text-muted-foreground text-xs">Total Kredit</p>
            <p className="font-bold text-green-700 dark:text-green-300">{formatRp(totalCredit)}</p>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>No. Jurnal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada mutasi untuk akun ini
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.entry_date ? format(new Date(r.entry_date), "dd/MM/yyyy") : "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.entry_number}</TableCell>
                  <TableCell className="text-sm">{r.description}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.reference_number || "-"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.debit_amount > 0 ? formatRp(r.debit_amount) : "-"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{r.credit_amount > 0 ? formatRp(r.credit_amount) : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
