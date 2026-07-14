import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useBeritaAcara, BeritaAcara as BA } from "@/hooks/useBeritaAcara";
import { ArrowLeft, FileWarning, Plus, Check, X, Eye, Printer } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const TABLES = [
  { value: "bills", label: "Tagihan (bills)" },
  { value: "bill_payments", label: "Pembayaran (bill_payments)" },
  { value: "cashier_transactions", label: "Kasir" },
  { value: "expenses", label: "Pengeluaran" },
  { value: "journal_entries", label: "Jurnal" },
];

export default function BeritaAcara() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { items, isLoading, create, review } = useBeritaAcara(statusFilter);
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState<BA | null>(null);
  const [form, setForm] = useState({
    target_table: "bills",
    target_record_id: "",
    action_type: "update" as "update" | "reverse" | "delete",
    reason: "",
    proposed_new_data: "",
    attachment_url: "",
    signature_url: "",
  });

  if (!user) return <MainLayout><div className="p-8">Silakan login.</div></MainLayout>;

  const submit = async () => {
    if (!form.target_record_id || !form.reason) return;
    let proposed: any = null;
    if (form.action_type !== "delete" && form.proposed_new_data) {
      try { proposed = JSON.parse(form.proposed_new_data); }
      catch { alert("Data perubahan harus JSON valid, contoh: {\"amount\": 100000}"); return; }
    }
    await create.mutateAsync({
      target_table: form.target_table,
      target_record_id: form.target_record_id,
      action_type: form.action_type,
      reason: form.reason,
      proposed_new_data: proposed,
      attachment_url: form.attachment_url || undefined,
      signature_url: form.signature_url || undefined,
    });
    setOpenCreate(false);
    setForm({ target_table: "bills", target_record_id: "", action_type: "update", reason: "", proposed_new_data: "", attachment_url: "", signature_url: "" });
  };

  const statusBadge = (s: string) => {
    const v: any = { pending: "secondary", approved: "default", rejected: "destructive" };
    const t: any = { pending: "Menunggu", approved: "Disetujui", rejected: "Ditolak" };
    return <Badge variant={v[s]}>{t[s]}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
            <div className="flex items-center gap-3">
              <FileWarning className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Berita Acara Koreksi</h1>
                <p className="text-muted-foreground">Pengajuan koreksi & pembatalan transaksi finance</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setOpenCreate(true)}><Plus className="w-4 h-4 mr-2" />Buat BA</Button>
        </div>

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="pending">Menunggu</TabsTrigger>
            <TabsTrigger value="approved">Disetujui</TabsTrigger>
            <TabsTrigger value="rejected">Ditolak</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. BA</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-6">Memuat...</TableCell></TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Belum ada BA</TableCell></TableRow>
                ) : items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.ba_number}</TableCell>
                    <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yy HH:mm", { locale: idLocale })}</TableCell>
                    <TableCell className="text-xs">{r.target_table}</TableCell>
                    <TableCell><Badge variant="outline">{r.action_type}</Badge></TableCell>
                    <TableCell className="text-xs">{r.requested_by_name || "-"}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{r.reason}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => setOpenView(r)}><Eye className="w-4 h-4" /></Button>
                      {isSuperAdmin && r.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => review.mutate({ id: r.id, status: "approved" })}><Check className="w-4 h-4 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => review.mutate({ id: r.id, status: "rejected" })}><X className="w-4 h-4 text-destructive" /></Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Buat Berita Acara Koreksi</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tabel Target</Label>
                <Select value={form.target_table} onValueChange={(v) => setForm({ ...form, target_table: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TABLES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Jenis Aksi</Label>
                <Select value={form.action_type} onValueChange={(v: any) => setForm({ ...form, action_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Ubah</SelectItem>
                    <SelectItem value="reverse">Reversal</SelectItem>
                    <SelectItem value="delete">Hapus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>ID Record Target *</Label>
              <Input value={form.target_record_id} onChange={(e) => setForm({ ...form, target_record_id: e.target.value })} placeholder="UUID transaksi" /></div>
            <div><Label>Alasan Koreksi *</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan koreksi" rows={3} /></div>
            {form.action_type !== "delete" && (
              <div><Label>Data Perubahan (JSON)</Label>
                <Textarea value={form.proposed_new_data} onChange={(e) => setForm({ ...form, proposed_new_data: e.target.value })} placeholder='{"amount": 1500000, "notes": "koreksi tarif"}' rows={4} className="font-mono text-xs" /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>URL Lampiran Foto</Label>
                <Input value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>URL Tanda Tangan</Label>
                <Input value={form.signature_url} onChange={(e) => setForm({ ...form, signature_url: e.target.value })} placeholder="https://..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Batal</Button>
            <Button onClick={submit} disabled={create.isPending}>Ajukan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!openView} onOpenChange={(v) => !v && setOpenView(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {openView && (
            <>
              <DialogHeader><DialogTitle className="flex items-center gap-2">
                <span>BA {openView.ba_number}</span>{statusBadge(openView.status)}
              </DialogTitle></DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Pemohon</Label><p>{openView.requested_by_name}</p></div>
                  <div><Label className="text-xs">Tanggal</Label><p>{format(new Date(openView.created_at), "dd MMM yyyy HH:mm", { locale: idLocale })}</p></div>
                  <div><Label className="text-xs">Tabel</Label><p className="font-mono">{openView.target_table}</p></div>
                  <div><Label className="text-xs">Record ID</Label><p className="font-mono text-xs break-all">{openView.target_record_id}</p></div>
                </div>
                <div><Label className="text-xs">Alasan</Label><p className="p-2 bg-muted rounded">{openView.reason}</p></div>
                {openView.proposed_new_data && (
                  <div><Label className="text-xs">Data Perubahan</Label>
                    <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(openView.proposed_new_data, null, 2)}</pre></div>
                )}
                {openView.old_data && (
                  <div><Label className="text-xs">Data Lama</Label>
                    <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(openView.old_data, null, 2)}</pre></div>
                )}
                {openView.reviewed_by_name && (
                  <div className="p-3 border rounded space-y-1">
                    <p className="text-xs font-medium">Reviewer: {openView.reviewed_by_name}</p>
                    <p className="text-xs">{openView.reviewed_at && format(new Date(openView.reviewed_at), "dd MMM yyyy HH:mm", { locale: idLocale })}</p>
                    {openView.review_notes && <p className="text-xs italic">"{openView.review_notes}"</p>}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Cetak</Button>
                {isSuperAdmin && openView.status === "pending" && (
                  <>
                    <Button variant="destructive" onClick={() => { review.mutate({ id: openView.id, status: "rejected" }); setOpenView(null); }}>Tolak</Button>
                    <Button onClick={() => { review.mutate({ id: openView.id, status: "approved" }); setOpenView(null); }}>Setujui</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
