import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Edit, Search, Bike, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBicycles } from "@/hooks/useBicycles";
import { useFileUpload } from "@/hooks/useFileUpload";
import { TablePagination } from "@/components/shared/TablePagination";
import { exportToExcel } from "@/lib/exportExcel";
import { cn } from "@/lib/utils";

export default function DataSepeda() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const { bicycles, isLoading, addBicycle, updateBicycle, deleteBicycle, getNextCode } = useBicycles();
  const { uploadFile, uploading } = useFileUpload();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    brand: "",
    photo_url: "",
    owner_name: "",
    unit_number: "",
    notes: "",
  });

  const canManage = isSuperAdmin || isAdmin;
  const pageSize = 10;

  const filtered = bicycles.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.brand.toLowerCase().includes(search.toLowerCase()) ||
      (b.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.unit_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAdd = () => {
    setEditId(null);
    setForm({ code: getNextCode(), brand: "", photo_url: "", owner_name: "", unit_number: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      code: b.code,
      brand: b.brand,
      photo_url: b.photo_url || "",
      owner_name: b.owner_name || "",
      unit_number: b.unit_number || "",
      notes: b.notes || "",
    });
    setDialogOpen(true);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "kepenghunian-files", "bicycles");
    if (url) setForm((f) => ({ ...f, photo_url: url }));
  };

  const handleSubmit = async () => {
    if (!form.brand) return;
    if (editId) {
      await updateBicycle.mutateAsync({ id: editId, ...form });
    } else {
      await addBicycle.mutateAsync({ ...form, created_by: user?.id || null, unit_id: null });
    }
    setDialogOpen(false);
  };

  const handleExport = () => {
    exportToExcel(
      bicycles.map((b, i) => ({
        No: i + 1,
        Kode: b.code,
        "Merek Sepeda": b.brand,
        "Nama Pemilik": b.owner_name || "-",
        "Unit Pemilik": b.unit_number || "-",
        Keterangan: b.notes || "-",
      })),
      "Data Kepemilikan Sepeda"
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/tro")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Kepemilikan Sepeda</h1>
            <p className="text-muted-foreground">Kelola data sepeda penghuni apartemen</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              Daftar Sepeda ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-9 w-60"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>Export Excel</Button>
              {canManage && (
                <Button size="sm" onClick={openAdd}>
                  <Plus className="w-4 h-4 mr-1" /> Tambah
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Merek</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Keterangan</TableHead>
                    {canManage && <TableHead className="w-20">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 8 : 7} className="text-center py-8 text-muted-foreground">
                        Belum ada data sepeda
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((b, i) => (
                      <TableRow key={b.id}>
                        <TableCell>{(currentPage - 1) * pageSize + i + 1}</TableCell>
                        <TableCell className="font-mono font-bold">{b.code}</TableCell>
                        <TableCell>{b.brand}</TableCell>
                        <TableCell>
                          {b.photo_url ? (
                            <img
                              src={b.photo_url}
                              alt={b.brand}
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border"
                              onClick={() => setPhotoPreview(b.photo_url)}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{b.owner_name || "-"}</TableCell>
                        <TableCell>{b.unit_number || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{b.notes || "-"}</TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Hapus data sepeda ini?")) deleteBicycle.mutate(b.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Data Sepeda" : "Tambah Data Sepeda"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kode</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
              <div>
                <Label>Merek Sepeda *</Label>
                <Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Contoh: Polygon, United" />
              </div>
              <div>
                <Label>Foto Sepeda</Label>
                <Input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} />
                {form.photo_url && (
                  <img src={form.photo_url} alt="preview" className="mt-2 w-full h-40 object-cover rounded-lg border" />
                )}
              </div>
              <div>
                <Label>Nama Pemilik</Label>
                <Input value={form.owner_name} onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))} />
              </div>
              <div>
                <Label>Nomor Unit</Label>
                <Input value={form.unit_number} onChange={(e) => setForm((f) => ({ ...f, unit_number: e.target.value }))} placeholder="Contoh: A-1201" />
              </div>
              <div>
                <Label>Keterangan</Label>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Catatan tambahan" />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={!form.brand || addBicycle.isPending || updateBicycle.isPending}>
                {editId ? "Simpan Perubahan" : "Tambah Sepeda"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Photo Preview Dialog */}
        <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
          <DialogContent className="max-w-2xl p-2">
            {photoPreview && (
              <img src={photoPreview} alt="Foto Sepeda" className="w-full h-auto rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
