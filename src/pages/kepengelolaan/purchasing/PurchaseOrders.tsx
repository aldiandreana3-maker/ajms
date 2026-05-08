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
import { ArrowLeft, Plus, FileSignature, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const fmtIDR = (v: number) => "Rp " + (v || 0).toLocaleString("id-ID");

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ supplier_name: "", supplier_id: "", pr_number: "", order_date: new Date().toISOString().slice(0,10), expected_date: "", status: "draft", subtotal: 0, tax: 0, total_amount: 0, notes: "" });

  const { data = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("purchase_orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-for-po"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("suppliers").select("id,name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.supplier_name?.trim()) throw new Error("Supplier wajib");
      const po_number = `PO-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*9000+1000)}`;
      const total_amount = Number(form.subtotal || 0) + Number(form.tax || 0);
      const payload = { ...form, po_number, total_amount, created_by: user?.id, supplier_id: form.supplier_id || null, expected_date: form.expected_date || null };
      const { error } = await (supabase as any).from("purchase_orders").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase Order dibuat");
      qc.invalidateQueries({ queryKey: ["purchase_orders"] });
      setOpen(false);
      setForm({ supplier_name: "", supplier_id: "", pr_number: "", order_date: new Date().toISOString().slice(0,10), expected_date: "", status: "draft", subtotal: 0, tax: 0, total_amount: 0, notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any).from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase_orders"] }); toast.success("Status diperbarui"); },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("purchase_orders").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["purchase_orders"] }); },
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3 flex-1">
            <FileSignature className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Purchase Order (PO)</h1>
              <p className="text-muted-foreground">Order pembelian ke supplier</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Buat PO</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Daftar PO ({data.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>No. PO</TableHead><TableHead>Supplier</TableHead>
                  <TableHead>No. PR</TableHead><TableHead>Tgl Order</TableHead>
                  <TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada PO</TableCell></TableRow>
                  : data.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.po_number}</TableCell>
                      <TableCell>{p.supplier_name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.pr_number || "-"}</TableCell>
                      <TableCell>{p.order_date}</TableCell>
                      <TableCell>{fmtIDR(Number(p.total_amount))}</TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={v => updateStatus.mutate({ id: p.id, status: v })}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="dikirim">Dikirim</SelectItem>
                            <SelectItem value="diterima">Diterima</SelectItem>
                            <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus PO ini?")) delMut.mutate(p.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
            <DialogHeader><DialogTitle>Buat Purchase Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={form.supplier_id} onValueChange={v => {
                  const s = suppliers.find((x: any) => x.id === v);
                  setForm({ ...form, supplier_id: v, supplier_name: s?.name || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Atau ketik nama supplier baru" value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value, supplier_id: "" })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>No. PR Terkait</Label><Input value={form.pr_number} onChange={e => setForm({ ...form, pr_number: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tanggal Order</Label><Input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Tgl Diharapkan</Label><Input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Subtotal (Rp)</Label><Input type="number" value={form.subtotal} onChange={e => setForm({ ...form, subtotal: e.target.value })} /></div>
                <div className="space-y-2"><Label>Pajak (Rp)</Label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} /></div>
                <div className="space-y-2"><Label>Total</Label><Input disabled value={fmtIDR(Number(form.subtotal || 0) + Number(form.tax || 0))} /></div>
              </div>
              <div className="space-y-2"><Label>Catatan / Detail Item</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
