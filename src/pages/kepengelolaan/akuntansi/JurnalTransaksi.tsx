import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useJournalEntries, JournalEntryLine } from "@/hooks/useJournalEntries";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Plus, Trash2, FileText, Loader2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { ExportExcelButton, ImportExcelButton } from "@/components/akuntansi/AccountingExcelTools";
import { toast } from "sonner";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function JurnalTransaksi() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { entries, isLoading, addEntry, deleteEntry, forceDeleteEntry, bulkInsert, getEntryLines } = useJournalEntries();
  const { accounts } = useChartOfAccounts();
  const canManage = isSuperAdmin || isAdmin;

  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLines, setDetailLines] = useState<JournalEntryLine[]>([]);
  const [detailEntry, setDetailEntry] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [form, setForm] = useState({ entry_number: "", entry_date: new Date().toISOString().split("T")[0], description: "", reference_number: "" });
  const [lines, setLines] = useState<{ account_id: string; debit_amount: number; credit_amount: number; description: string }[]>([
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
    { account_id: "", debit_amount: 0, credit_amount: 0, description: "" },
  ]);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit_amount) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit_amount) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => setLines([...lines, { account_id: "", debit_amount: 0, credit_amount: 0, description: "" }]);
  const removeLine = (i: number) => { if (lines.length > 2) setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i: number, field: string, value: any) => {
    const updated = [...lines];
    (updated[i] as any)[field] = value;
    setLines(updated);
  };

  const handleSubmit = () => {
    if (!form.entry_number || !form.description || !isBalanced) return;
    addEntry.mutate({
      entry: { ...form, total_debit: totalDebit, total_credit: totalCredit },
      lines: lines.filter((l) => l.account_id && (l.debit_amount > 0 || l.credit_amount > 0)),
    }, {
      onSuccess: () => {
        setOpen(false);
        setForm({ entry_number: "", entry_date: new Date().toISOString().split("T")[0], description: "", reference_number: "" });
        setLines([{ account_id: "", debit_amount: 0, credit_amount: 0, description: "" }, { account_id: "", debit_amount: 0, credit_amount: 0, description: "" }]);
      },
    });
  };

  const showDetail = async (entry: any) => {
    setDetailEntry(entry);
    const l = await getEntryLines(entry.id);
    setDetailLines(l);
    setDetailOpen(true);
  };

  const paginatedEntries = usePagination(entries, itemsPerPage, currentPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Jurnal Transaksi</h1>
              <p className="text-muted-foreground">Catat semua transaksi dengan debit & kredit</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 flex-wrap">
          <ExportExcelButton
            filename={`jurnal-transaksi-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Jurnal"
            data={entries.map((e) => ({
              entry_number: e.entry_number,
              entry_date: format(new Date(e.entry_date), "dd/MM/yyyy"),
              description: e.description,
              reference_number: e.reference_number || "",
              total_debit: e.total_debit,
              total_credit: e.total_credit,
              status: e.is_posted ? "Terposting" : "Draft",
            }))}
            columns={[
              { header: "No. Jurnal", key: "entry_number", width: 16 },
              { header: "Tanggal", key: "entry_date", width: 14 },
              { header: "Deskripsi", key: "description", width: 36 },
              { header: "Referensi", key: "reference_number", width: 18 },
              { header: "Debit", key: "total_debit", width: 16 },
              { header: "Kredit", key: "total_credit", width: 16 },
              { header: "Status", key: "status", width: 14 },
            ]}
          />
          {canManage && (
            <ImportExcelButton
              onParsed={(rows) => {
                // Format expected: entry_number, entry_date, description, account_code, debit, kredit
                // Group by entry_number
                const groups = new Map<string, { entry: any; lines: any[] }>();
                for (const r of rows) {
                  const num = String(r["No. Jurnal"] || r.entry_number || "").trim();
                  if (!num) continue;
                  const code = String(r["Kode Akun"] || r.account_code || "").trim();
                  const acc = accounts.find((a) => a.account_code === code);
                  if (!acc) continue;
                  const debit = Number(r["Debit"] || r.debit || 0);
                  const kredit = Number(r["Kredit"] || r.kredit || 0);
                  if (!groups.has(num)) {
                    const dateRaw = r["Tanggal"] || r.entry_date || new Date().toISOString();
                    let entryDate = new Date().toISOString().split("T")[0];
                    try {
                      const d = new Date(dateRaw);
                      if (!isNaN(d.getTime())) entryDate = d.toISOString().split("T")[0];
                    } catch {}
                    groups.set(num, {
                      entry: {
                        entry_number: num,
                        entry_date: entryDate,
                        description: String(r["Deskripsi"] || r.description || ""),
                        reference_number: String(r["Referensi"] || r.reference_number || ""),
                        total_debit: 0,
                        total_credit: 0,
                      },
                      lines: [],
                    });
                  }
                  const g = groups.get(num)!;
                  g.lines.push({ account_id: acc.id, debit_amount: debit, credit_amount: kredit, description: "" });
                  g.entry.total_debit += debit;
                  g.entry.total_credit += kredit;
                }
                const payload = [...groups.values()].filter((g) => g.lines.length > 0 && g.entry.total_debit === g.entry.total_credit && g.entry.total_debit > 0);
                if (payload.length === 0) {
                  toast.error("Tidak ada jurnal yang valid & seimbang. Format: kolom No. Jurnal, Tanggal, Deskripsi, Kode Akun, Debit, Kredit");
                  return;
                }
                bulkInsert.mutate(payload);
              }}
              disabled={bulkInsert.isPending}
            />
          )}
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Buat Jurnal</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Buat Jurnal Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>No. Jurnal</Label><Input value={form.entry_number} onChange={(e) => setForm({ ...form, entry_number: e.target.value })} placeholder="JRN-001" /></div>
                    <div><Label>Tanggal</Label><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></div>
                  </div>
                  <div><Label>Deskripsi</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pembayaran listrik bulan..." /></div>
                  <div><Label>No. Referensi (opsional)</Label><Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} /></div>

                  <div className="space-y-2">
                    <Label>Detail Transaksi</Label>
                    {lines.map((line, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Select value={line.account_id} onValueChange={(v) => updateLine(i, "account_id", v)}>
                            <SelectTrigger className="text-xs"><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3"><Input type="number" placeholder="Debit" value={line.debit_amount || ""} onChange={(e) => updateLine(i, "debit_amount", Number(e.target.value))} /></div>
                        <div className="col-span-3"><Input type="number" placeholder="Kredit" value={line.credit_amount || ""} onChange={(e) => updateLine(i, "credit_amount", Number(e.target.value))} /></div>
                        <div className="col-span-2 flex gap-1">
                          {lines.length > 2 && <Button variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addLine}><Plus className="w-3 h-3 mr-1" />Tambah Baris</Button>
                  </div>

                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <div>
                      <span className="text-sm">Total Debit: <strong>{formatRp(totalDebit)}</strong></span>
                      <span className="mx-4 text-sm">Total Kredit: <strong>{formatRp(totalCredit)}</strong></span>
                    </div>
                    <Badge variant={isBalanced ? "default" : "destructive"}>{isBalanced ? "Seimbang ✓" : "Belum Seimbang"}</Badge>
                  </div>

                  <Button onClick={handleSubmit} disabled={!isBalanced || addEntry.isPending} className="w-full">
                    {addEntry.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Jurnal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Jurnal</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada jurnal</TableCell></TableRow>
                  ) : paginatedEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono font-medium">{e.entry_number}</TableCell>
                      <TableCell>{format(new Date(e.entry_date), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(e.total_debit)}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(e.total_credit)}</TableCell>
                      <TableCell>
                        <Badge variant={e.is_posted ? "default" : "secondary"}>{e.is_posted ? "Terposting" : "Draft"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => showDetail(e)}><Eye className="w-4 h-4" /></Button>
                          {canManage && !e.is_posted && <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus jurnal ini?")) deleteEntry.mutate(e.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                          {canManage && e.is_posted && <Button variant="ghost" size="icon" title="Hapus paksa (reverse saldo)" onClick={() => { if (confirm("Hapus jurnal terposting? Saldo akun akan dikembalikan otomatis. Lanjutkan?")) forceDeleteEntry.mutate(e.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={entries.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Jurnal {detailEntry?.entry_number}</DialogTitle>
            </DialogHeader>
            {detailEntry && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{detailEntry.description}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Akun</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Kredit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailLines.map((l) => {
                      const acc = accounts.find((a) => a.id === l.account_id);
                      return (
                        <TableRow key={l.id}>
                          <TableCell>{acc ? `${acc.account_code} - ${acc.account_name}` : l.account_id}</TableCell>
                          <TableCell className="text-right font-mono">{l.debit_amount > 0 ? formatRp(l.debit_amount) : "-"}</TableCell>
                          <TableCell className="text-right font-mono">{l.credit_amount > 0 ? formatRp(l.credit_amount) : "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
