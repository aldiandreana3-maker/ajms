import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Edit, Search, ShieldAlert, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablePagination } from "@/components/shared/TablePagination";

interface CommercialTenant {
  id: string;
  business_name: string;
  business_type: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  lease_start: string | null;
  lease_end: string | null;
  is_active: boolean | null;
}

const emptyForm = {
  business_name: "",
  business_type: "",
  owner_name: "",
  phone: "",
  email: "",
  lease_start: "",
  lease_end: "",
  is_active: true,
};

export default function DataKomersil() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const queryClient = useQueryClient();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["commercial_tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commercial_tenants")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CommercialTenant[];
    },
    enabled: canAccess,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        business_name: form.business_name,
        business_type: form.business_type || null,
        owner_name: form.owner_name || null,
        phone: form.phone || null,
        email: form.email || null,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
        is_active: form.is_active,
      };
      if (editId) {
        const { error } = await supabase.from("commercial_tenants").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("commercial_tenants").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editId ? "Data berhasil diperbarui" : "Data berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: ["commercial_tenants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commercial_tenants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Data berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["commercial_tenants"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
        </div>
      </MainLayout>
    );
  }

  const filtered = tenants.filter((t) =>
    [t.business_name, t.business_type, t.owner_name, t.phone, t.email]
      .filter(Boolean)
      .some((v) => (v as string).toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: CommercialTenant) => {
    setEditId(t.id);
    setForm({
      business_name: t.business_name || "",
      business_type: t.business_type || "",
      owner_name: t.owner_name || "",
      phone: t.phone || "",
      email: t.email || "",
      lease_start: t.lease_start || "",
      lease_end: t.lease_end || "",
      is_active: t.is_active ?? true,
    });
    setDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Store className="w-7 h-7 text-info" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Data Komersil</h1>
              <p className="text-muted-foreground">Kelola data tenant komersil apartemen</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Daftar Tenant Komersil ({filtered.length})</CardTitle>
            <Button onClick={openAdd} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Tambah
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama bisnis, pemilik..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Bisnis</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sewa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center">Memuat...</TableCell></TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Belum ada data</TableCell></TableRow>
                  ) : (
                    paginated.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.business_name}</TableCell>
                        <TableCell>{t.business_type || "-"}</TableCell>
                        <TableCell>{t.owner_name || "-"}</TableCell>
                        <TableCell>{t.phone || "-"}</TableCell>
                        <TableCell>{t.email || "-"}</TableCell>
                        <TableCell className="text-xs">
                          {t.lease_start || "-"}<br />s/d {t.lease_end || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? "default" : "secondary"}>
                            {t.is_active ? "Aktif" : "Tidak Aktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {isSuperAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm(`Hapus ${t.business_name}?`)) deleteMutation.mutate(t.id);
                            }}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit" : "Tambah"} Tenant Komersil</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="md:col-span-2">
                <Label>Nama Bisnis *</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              </div>
              <div>
                <Label>Jenis Bisnis</Label>
                <Input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
              </div>
              <div>
                <Label>Nama Pemilik</Label>
                <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Mulai Sewa</Label>
                <Input type="date" value={form.lease_start} onChange={(e) => setForm({ ...form, lease_start: e.target.value })} />
              </div>
              <div>
                <Label>Akhir Sewa</Label>
                <Input type="date" value={form.lease_end} onChange={(e) => setForm({ ...form, lease_end: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!form.business_name || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
