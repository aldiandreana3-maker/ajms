import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { ExportExcelButton } from "@/components/akuntansi/AccountingExcelTools";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface LedgerLine {
  id: string;
  journal_entry_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string | null;
  entry_number: string;
  entry_date: string;
  journal_description: string;
}

export default function BukuBesar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, isLoading: accLoading } = useChartOfAccounts();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!selectedAccount) return;
    setLoading(true);
    setCurrentPage(1);
    (async () => {
      const { data: lines, error } = await supabase
        .from("journal_entry_lines" as any)
        .select("*")
        .eq("account_id", selectedAccount);
      if (error) { setLoading(false); return; }

      const entryIds = [...new Set((lines as any[]).map((l: any) => l.journal_entry_id))];
      const { data: entries } = await supabase
        .from("journal_entries" as any)
        .select("*")
        .in("id", entryIds)
        .eq("is_posted", true);

      const entryMap = new Map((entries as any[] || []).map((e: any) => [e.id, e]));
      const result: LedgerLine[] = (lines as any[])
        .filter((l: any) => entryMap.has(l.journal_entry_id))
        .map((l: any) => {
          const entry = entryMap.get(l.journal_entry_id)!;
          return { ...l, entry_number: entry.entry_number, entry_date: entry.entry_date, journal_description: entry.description };
        })
        .sort((a: any, b: any) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

      setLedgerLines(result);
      setLoading(false);
    })();
  }, [selectedAccount]);

  const account = accounts.find((a) => a.id === selectedAccount);

  // Compute running balances for ALL lines, then paginate
  const linesWithBalance = useMemo(() => {
    let balance = account?.opening_balance || 0;
    return ledgerLines.map((l) => {
      if (account?.normal_balance === "debit") {
        balance += l.debit_amount - l.credit_amount;
      } else {
        balance += l.credit_amount - l.debit_amount;
      }
      return { ...l, runningBalance: balance };
    });
  }, [ledgerLines, account]);

  const paginatedLines = usePagination(linesWithBalance, itemsPerPage, currentPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Buku Besar</h1>
              <p className="text-muted-foreground">General Ledger per akun</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-full sm:w-[350px]"><SelectValue placeholder="Pilih akun untuk dilihat" /></SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAccount && account && (
            <ExportExcelButton
              filename={`buku-besar-${account.account_code}-${new Date().toISOString().slice(0, 10)}`}
              sheetName="Buku Besar"
              data={[
                { date: "", entry_number: "", desc: "Saldo Awal", debit: 0, kredit: 0, balance: account.opening_balance || 0 },
                ...linesWithBalance.map((l) => ({
                  date: format(new Date(l.entry_date), "dd/MM/yyyy"),
                  entry_number: l.entry_number,
                  desc: l.journal_description,
                  debit: l.debit_amount,
                  kredit: l.credit_amount,
                  balance: l.runningBalance,
                })),
              ]}
              columns={[
                { header: "Tanggal", key: "date", width: 14 },
                { header: "No. Jurnal", key: "entry_number", width: 16 },
                { header: "Keterangan", key: "desc", width: 36 },
                { header: "Debit", key: "debit", width: 16 },
                { header: "Kredit", key: "kredit", width: 16 },
                { header: "Saldo", key: "balance", width: 18 },
              ]}
            />
          )}
        </div>

        {selectedAccount && account && (
          <div className="bg-muted/50 rounded-xl p-4 flex flex-wrap gap-6">
            <div><span className="text-sm text-muted-foreground">Akun:</span> <strong>{account.account_code} - {account.account_name}</strong></div>
            <div><span className="text-sm text-muted-foreground">Tipe:</span> <strong className="capitalize">{account.account_type}</strong></div>
            <div><span className="text-sm text-muted-foreground">Saldo Normal:</span> <strong className="capitalize">{account.normal_balance}</strong></div>
            <div><span className="text-sm text-muted-foreground">Saldo Saat Ini:</span> <strong>{formatRp(account.current_balance)}</strong></div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : selectedAccount ? (
          <>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Jurnal</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPage === 1 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="font-medium">Saldo Awal</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatRp(account?.opening_balance || 0)}</TableCell>
                    </TableRow>
                  )}
                  {paginatedLines.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada transaksi terposting</TableCell></TableRow>
                  ) : paginatedLines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{format(new Date(l.entry_date), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                      <TableCell className="font-mono">{l.entry_number}</TableCell>
                      <TableCell>{l.journal_description}</TableCell>
                      <TableCell className="text-right font-mono">{l.debit_amount > 0 ? formatRp(l.debit_amount) : "-"}</TableCell>
                      <TableCell className="text-right font-mono">{l.credit_amount > 0 ? formatRp(l.credit_amount) : "-"}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{formatRp(l.runningBalance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {ledgerLines.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalItems={ledgerLines.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Pilih akun untuk melihat buku besar</div>
        )}
      </div>
    </MainLayout>
  );
}
