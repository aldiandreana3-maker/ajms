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
import { Textarea } from "@/components/ui/textarea";
import { useReconciliations } from "@/hooks/useReconciliations";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Plus, CheckCircle, Loader2, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { CoaMutationsDialog } from "@/components/akuntansi/CoaMutationsDialog";
import { ExportExcelButton, ImportExcelButton } from "@/components/akuntansi/AccountingExcelTools";
import { toast } from "sonner";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function Rekonsiliasi() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { reconciliations, isLoading, addReconciliation, updateReconciliation, deleteReconciliation, bulkInsert } = useReconciliations();
  const { accounts } = useChartOfAccounts();
  const canManage = isSuperAdmin || isAdmin;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ account_id: "", period_label: "", period_date: new Date().toISOString().split("T")[0], system_balance: 0, actual_balance: 0, notes: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mutationsAccountId, setMutationsAccountId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!form.account_id || !form.period_label) return;
    addReconciliation.mutate(form, { onSuccess: () => { setOpen(false); setForm({ account_id: "", period_label: "", period_date: new Date().toISOString().split("T")[0], system_balance: 0, actual_balance: 0, notes: "" }); } });
  };

  const markDone = (id: string) => {
    updateReconciliation.mutate({ id, status: "selesai", reconciled_at: new Date().toISOString() });
  };

  const paginatedData = usePagination(reconciliations, itemsPerPage, currentPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rekonsiliasi</h1>
              <p className="text-muted-foreground">Cocokkan data sistem dengan data aktual</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 flex-wrap">
          <ExportExcelButton
            filename={`rekonsiliasi-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Rekonsiliasi"
            data={reconciliations.map((r) => {
              const acc = accounts.find((a) => a.id === r.account_id);
              return {
                account_code: acc?.account_code || "",
                account_name: acc?.account_name || "",
                period_label: r.period_label,
                period_date: r.period_date,
                system_balance: r.system_balance,
                actual_balance: r.actual_balance,
                difference: r.difference,
                status: r.status,
                notes: r.notes || "",
              };
            })}
            columns={[
              { header: "Kode Akun", key: "account_code", width: 14 },
              { header: "Nama Akun", key: "account_name", width: 28 },
              { header: "Periode", key: "period_label", width: 16 },
              { header: "Tanggal", key: "period_date", width: 14 },
              { header: "Saldo Sistem", key: "system_balance", width: 18 },
              { header: "Saldo Aktual", key: "actual_balance", width: 18 },
              { header: "Selisih", key: "difference", width: 16 },
              { header: "Status", key: "status", width: 12 },
              { header: "Catatan", key: "notes", width: 28 },
            ]}
          />
          {canManage && (
            <ImportExcelButton
              onParsed={(rows) => {
                const payload: any[] = [];
                for (const r of rows) {
                  const code = String(r["Kode Akun"] || "").trim();
                  const acc = accounts.find((a) => a.account_code === code);
                  if (!acc) continue;
                  const dateRaw = r["Tanggal"];
                  let period_date = new Date().toISOString().split("T")[0];
                  try { const d = new Date(dateRaw); if (!isNaN(d.getTime())) period_date = d.toISOString().split("T")[0]; } catch {}
                  payload.push({
                    account_id: acc.id,
                    period_label: String(r["Periode"] || ""),
                    period_date,
                    system_balance: Number(r["Saldo Sistem"] || 0),
                    actual_balance: Number(r["Saldo Aktual"] || 0),
                    status: String(r["Status"] || "belum"),
                    notes: String(r["Catatan"] || ""),
                  });
                }
                if (payload.length === 0) { toast.error("Tidak ada data valid"); return; }
                bulkInsert.mutate(payload);
              }}
              disabled={bulkInsert.isPending}
            />
          )}
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Tambah Rekonsiliasi</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Rekonsiliasi Baru</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Akun</Label>
                    <Select value={form.account_id} onValueChange={(v) => {
                      const acc = accounts.find((a) => a.id === v);
                      setForm({ ...form, account_id: v, system_balance: acc?.current_balance || 0 });
                    }}>
                      <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.account_id && (
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-2 rounded-md text-xs">
                      <span className="text-muted-foreground">Saldo sistem diambil otomatis dari mutasi jurnal akun ini.</span>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setMutationsAccountId(form.account_id)}>
                        <Eye className="w-3 h-3 mr-1" /> Lihat Mutasi
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Periode</Label><Input value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })} placeholder="April 2026" /></div>
                    <div><Label>Tanggal</Label><Input type="date" value={form.period_date} onChange={(e) => setForm({ ...form, period_date: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Saldo Sistem</Label><Input type="number" value={form.system_balance} onChange={(e) => setForm({ ...form, system_balance: Number(e.target.value) })} /></div>
                    <div><Label>Saldo Aktual (Bank/Nyata)</Label><Input type="number" value={form.actual_balance} onChange={(e) => setForm({ ...form, actual_balance: Number(e.target.value) })} /></div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    Selisih: <strong className={Math.abs(form.actual_balance - form.system_balance) > 0 ? "text-destructive" : "text-green-600"}>
                      {formatRp(form.actual_balance - form.system_balance)}
                    </strong>
                  </div>
                  <div><Label>Catatan</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                  <Button onClick={handleSubmit} disabled={addReconciliation.isPending} className="w-full">
                    {addReconciliation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan
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
                    <TableHead>Akun</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Saldo Sistem</TableHead>
                    <TableHead className="text-right">Saldo Aktual</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data rekonsiliasi</TableCell></TableRow>
                  ) : paginatedData.map((r) => {
                    const acc = accounts.find((a) => a.id === r.account_id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          <button
                            type="button"
                            className="hover:underline text-left"
                            onClick={() => acc && setMutationsAccountId(acc.id)}
                          >
                            {acc ? `${acc.account_code} - ${acc.account_name}` : "-"}
                          </button>
                        </TableCell>
                        <TableCell>{r.period_label}</TableCell>
                        <TableCell className="text-right font-mono">{formatRp(r.system_balance)}</TableCell>
                        <TableCell className="text-right font-mono">{formatRp(r.actual_balance)}</TableCell>
                        <TableCell className={`text-right font-mono ${r.difference !== 0 ? "text-destructive" : "text-green-600"}`}>{formatRp(r.difference)}</TableCell>
                        <TableCell><Badge variant={r.status === "selesai" ? "default" : "secondary"}>{r.status === "selesai" ? "Selesai" : "Belum"}</Badge></TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => acc && setMutationsAccountId(acc.id)} title="Lihat mutasi jurnal">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {r.status !== "selesai" && <Button size="sm" variant="outline" onClick={() => markDone(r.id)}>Selesaikan</Button>}
                              <Button variant="ghost" size="icon" title="Hapus" onClick={() => { if (confirm("Hapus data rekonsiliasi ini?")) deleteReconciliation.mutate(r.id); }}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={reconciliations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
        <CoaMutationsDialog
          open={!!mutationsAccountId}
          onOpenChange={(v) => { if (!v) setMutationsAccountId(null); }}
          account={mutationsAccountId ? accounts.find((a) => a.id === mutationsAccountId) || null : null}
        />
      </div>
    </MainLayout>
  );
}
