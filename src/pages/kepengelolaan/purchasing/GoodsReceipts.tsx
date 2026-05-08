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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Truck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PhotoUpload } from "@/components/shared/PhotoUpload";

export default function GoodsReceipts() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ po_number: "", supplier_name: "", receipt_date: new Date().toISOString().slice(0,10), received_by_name: "", condition_notes: "", photo_url: "" });

  const { data = [] } = useQuery({
    queryKey: ["goods_receipts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("goods_receipts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.po_number?.trim()) throw new Error("No. PO wajib");
      const grn_number = `GRN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`;
      const payload = { ...form, grn_number, received_by: user?.id };
      const { error } = await (supabase as any).from("goods_receipts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Penerimaan barang dicatat");
      qc.invalidateQueries({ queryKey: ["goods_receipts"] });
      setOpen(false);
      setForm({ po_number: "", supplier_name: "", receipt_date: new Date().toISOString().slice(0,10), received_by_name: "", condition_notes: "", photo_url: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("goods_receipts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["goods_receipts"] }); },
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3 flex-1">
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Penerimaan Barang (GRN)</h1>
              <p className="text-muted-foreground">Catatan penerimaan barang dari PO</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Tambah GRN</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Daftar Penerimaan ({data.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>No. GRN</TableHead><TableHead>No. PO</TableHead><TableHead>Supplier</TableHead>
                  <TableHead>Tanggal</TableHead><TableHead>Penerima</TableHead><TableHead>Foto</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada data</TableCell></TableRow>
                  : data.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.grn_number}</TableCell>
                      <TableCell className="font-mono text-xs">{p.po_number || "-"}</TableCell>
                      <TableCell>{p.supplier_name || "-"}</TableCell>
                      <TableCell>{p.receipt_date}</TableCell>
                      <TableCell>{p.received_by_name || "-"}</TableCell>
                      <TableCell>{p.photo_url ? <a href={p.photo_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Lihat</a> : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus GRN?")) delMut.mutate(p.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>Tambah Penerimaan Barang</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>No. PO *</Label><Input value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Supplier</Label><Input value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tanggal Terima</Label><Input type="date" value={form.receipt_date} onChange={e => setForm({ ...form, receipt_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Diterima oleh</Label><Input value={form.received_by_name} onChange={e => setForm({ ...form, received_by_name: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Catatan Kondisi Barang</Label><Textarea rows={3} value={form.condition_notes} onChange={e => setForm({ ...form, condition_notes: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Foto Bukti Penerimaan</Label>
                <PhotoUpload bucket="kepenghunian-files" folder="purchasing-grn" value={form.photo_url} onChange={(url) => setForm({ ...form, photo_url: url })} />
              </div>
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
