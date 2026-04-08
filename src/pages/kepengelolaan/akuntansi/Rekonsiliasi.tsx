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
import { ArrowLeft, Plus, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function Rekonsiliasi() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { reconciliations, isLoading, addReconciliation, updateReconciliation } = useReconciliations();
  const { accounts } = useChartOfAccounts();
  const canManage = isSuperAdmin || isAdmin;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ account_id: "", period_label: "", period_date: new Date().toISOString().split("T")[0], system_balance: 0, actual_balance: 0, notes: "" });

  const handleSubmit = () => {
    if (!form.account_id || !form.period_label) return;
    addReconciliation.mutate(form, { onSuccess: () => { setOpen(false); setForm({ account_id: "", period_label: "", period_date: new Date().toISOString().split("T")[0], system_balance: 0, actual_balance: 0, notes: "" }); } });
  };

  const markDone = (id: string) => {
    updateReconciliation.mutate({ id, status: "selesai", reconciled_at: new Date().toISOString() });
  };

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

        <div className="flex justify-end">
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
                {reconciliations.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data rekonsiliasi</TableCell></TableRow>
                ) : reconciliations.map((r) => {
                  const acc = accounts.find((a) => a.id === r.account_id);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{acc ? `${acc.account_code} - ${acc.account_name}` : "-"}</TableCell>
                      <TableCell>{r.period_label}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(r.system_balance)}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(r.actual_balance)}</TableCell>
                      <TableCell className={`text-right font-mono ${r.difference !== 0 ? "text-destructive" : "text-green-600"}`}>{formatRp(r.difference)}</TableCell>
                      <TableCell><Badge variant={r.status === "selesai" ? "default" : "secondary"}>{r.status === "selesai" ? "Selesai" : "Belum"}</Badge></TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          {r.status !== "selesai" && <Button size="sm" variant="outline" onClick={() => markDone(r.id)}>Selesaikan</Button>}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
