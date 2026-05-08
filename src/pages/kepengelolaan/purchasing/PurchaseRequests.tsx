import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type PR = {
  id: string;
  pr_number: string;
  requester_division: string;
  requester_name: string | null;
  needed_date: string | null;
  priority: string;
  status: string;
  description: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning text-white",
  disetujui: "bg-success text-white",
  ditolak: "bg-destructive text-destructive-foreground",
  diproses: "bg-blue-600 text-white",
  selesai: "bg-muted text-muted-foreground",
};

export default function PurchaseRequests() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ requester_division: "", requester_name: "", priority: "normal", status: "pending", description: "", needed_date: "" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["purchase_requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("purchase_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as PR[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.requester_division?.trim()) throw new Error("Divisi pemohon wajib");
      if (!form.description?.trim()) throw new Error("Deskripsi wajib");
      const pr_number = `PR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`;
      const payload = { ...form, pr_number, requester_id: user?.id, needed_date: form.needed_date || null };
      const { error } = await (supabase as any).from("purchase_requests").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Permintaan pembelian dibuat");
      qc.invalidateQueries({ queryKey: ["purchase_requests"] });
      setOpen(false); setForm({ requester_division: "", requester_name: "", priority: "normal", status: "pending", description: "", needed_date: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("purchase_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status diperbarui"); qc.invalidateQueries({ queryKey: ["purchase_requests"] }); },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("purchase_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["purchase_requests"] }); },
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3 flex-1">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Permintaan Pembelian (PR)</h1>
              <p className="text-muted-foreground">Daftar Purchase Request dari divisi</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Buat PR</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Daftar PR ({data.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>No. PR</TableHead><TableHead>Divisi</TableHead><TableHead>Pemohon</TableHead>
                  <TableHead>Deskripsi</TableHead><TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Memuat...</TableCell></TableRow>
                  : data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada permintaan</TableCell></TableRow>
                  : data.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.pr_number}</TableCell>
                      <TableCell>{p.requester_division}</TableCell>
                      <TableCell>{p.requester_name || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{p.description}</TableCell>
                      <TableCell><Badge variant="outline">{p.priority}</Badge></TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={v => updateStatus.mutate({ id: p.id, status: v })}>
                          <SelectTrigger className={`h-8 w-32 ${STATUS_COLORS[p.status] || ""}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="disetujui">Disetujui</SelectItem>
                            <SelectItem value="ditolak">Ditolak</SelectItem>
                            <SelectItem value="diproses">Diproses</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus PR ini?")) delMut.mutate(p.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Buat Purchase Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Divisi Pemohon *</Label><Input placeholder="e.g. Engineering" value={form.requester_division} onChange={e => setForm({ ...form, requester_division: e.target.value })} /></div>
                <div className="space-y-2"><Label>Nama Pemohon</Label><Input value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tanggal Dibutuhkan</Label><Input type="date" value={form.needed_date} onChange={e => setForm({ ...form, needed_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prioritas</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rendah">Rendah</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="tinggi">Tinggi</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Deskripsi Kebutuhan *</Label><Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Catatan</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
