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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Building2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

type Supplier = {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  category: string | null;
  npwp: string | null;
  notes: string | null;
  is_active: boolean;
};

const empty: Partial<Supplier> = { name: "", contact_person: "", phone: "", email: "", address: "", category: "", npwp: "", notes: "", is_active: true };

export default function PurchasingSuppliers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Supplier>>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("suppliers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Supplier[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!form.name?.trim()) throw new Error("Nama wajib diisi");
      if (editId) {
        const { error } = await (supabase as any).from("suppliers").update(form).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("suppliers").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Supplier diperbarui" : "Supplier ditambahkan");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false); setForm(empty); setEditId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Dihapus"); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3 flex-1">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Data Supplier / Vendor</h1>
              <p className="text-muted-foreground">Master data supplier purchasing</p>
            </div>
          </div>
          <Button onClick={() => { setForm(empty); setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Supplier
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Daftar Supplier ({data.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">Memuat...</TableCell></TableRow>
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada supplier</TableCell></TableRow>
                  ) : data.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact_person || "-"}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>{s.category || "-"}</TableCell>
                      <TableCell><Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => { setForm(s); setEditId(s.id); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus supplier ini?")) delMut.mutate(s.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit Supplier" : "Tambah Supplier"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2"><Label>Nama Supplier *</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contact_person || ""} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telepon</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Kategori</Label><Input placeholder="e.g. ATK, MEP, Cleaning" value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div className="space-y-2"><Label>NPWP</Label><Input value={form.npwp || ""} onChange={e => setForm({ ...form, npwp: e.target.value })} /></div>
              <div className="space-y-2 flex items-end gap-3"><Switch checked={!!form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Aktif</Label></div>
              <div className="space-y-2 md:col-span-2"><Label>Alamat</Label><Textarea value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Catatan</Label><Textarea value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
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
