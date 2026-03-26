import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Edit, Search, Bike, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBicycles } from "@/hooks/useBicycles";
import { useFileUpload } from "@/hooks/useFileUpload";
import { TablePagination } from "@/components/shared/TablePagination";
import { exportBicyclesToExcel } from "@/lib/exportBicyclesExcel";
import { CameraCapture } from "@/components/shared/CameraCapture";

export default function DataSepeda() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, user } = useAuth();
  const { bicycles, isLoading, addBicycle, updateBicycle, deleteBicycle, getNextCode } = useBicycles();
  const { uploadFile, uploading } = useFileUpload({ bucket: "kepenghunian-files", folder: "bicycles" });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  const filtered = bicycles.filter(
    (b) =>
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.brand.toLowerCase().includes(search.toLowerCase()) ||
      (b.owner_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.unit_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setEditId(null);
    setForm({ code: getNextCode(), brand: "", photo_url: "", owner_name: "", unit_number: "", notes: "" });
    setPhotoFile(null);
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
    setPhotoFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.brand) return;

    let photoUrl = form.photo_url;
    if (photoFile) {
      const filePath = await uploadFile(photoFile);
      if (filePath) {
        photoUrl = filePath;
      }
    }

    const payload = { ...form, photo_url: photoUrl };
    if (editId) {
      await updateBicycle.mutateAsync({ id: editId, ...payload });
    } else {
      await addBicycle.mutateAsync({ ...payload, created_by: user?.id || null, unit_id: null });
    }
    setDialogOpen(false);
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBicyclesToExcel(bicycles);
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/tro")} className="rounded-lg shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Data Kepemilikan Sepeda</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Kelola data sepeda penghuni apartemen</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bike className="w-5 h-5 shrink-0" />
                Daftar Sepeda ({filtered.length})
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px] sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9 sm:w-48"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">Export</Button>
                {canManage && (
                  <Button size="sm" onClick={openAdd} className="text-xs">
                    <Plus className="w-4 h-4 mr-1" /> Tambah
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">No</TableHead>
                    <TableHead className="w-16">Kode</TableHead>
                    <TableHead>Merek</TableHead>
                    <TableHead className="w-14">Foto</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead className="hidden md:table-cell">Keterangan</TableHead>
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
                        <TableCell className="text-xs">{(currentPage - 1) * itemsPerPage + i + 1}</TableCell>
                        <TableCell className="font-mono font-bold text-xs">{b.code}</TableCell>
                        <TableCell className="text-xs">{b.brand}</TableCell>
                        <TableCell>
                          {b.photo_display_url ? (
                            <img
                              src={b.photo_display_url}
                              alt={b.brand}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border"
                              onClick={() => setPhotoPreview(b.photo_display_url || null)}
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{b.owner_name || "-"}</div>
                          <div className="text-muted-foreground sm:hidden">{b.unit_number || ""}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">{b.unit_number || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs">{b.notes || "-"}</TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex gap-0.5">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (confirm("Hapus data sepeda ini?")) deleteBicycle.mutate(b.id);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                <Label>Foto Sepeda (Live Kamera)</Label>
                <CameraCapture label="Ambil foto sepeda dengan kamera" value={photoFile} onChange={setPhotoFile} />
                {!photoFile && editId && bicycles.find((item) => item.id === editId)?.photo_display_url && (
                  <img
                    src={bicycles.find((item) => item.id === editId)?.photo_display_url || ""}
                    alt="preview"
                    className="mt-2 w-full h-40 object-cover rounded-lg border"
                  />
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
              <Button className="w-full" onClick={handleSubmit} disabled={!form.brand || addBicycle.isPending || updateBicycle.isPending || uploading}>
                {uploading ? "Mengupload..." : editId ? "Simpan Perubahan" : "Tambah Sepeda"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!photoPreview} onOpenChange={() => setPhotoPreview(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl p-2">
            {photoPreview && <img src={photoPreview} alt="Foto Sepeda" className="w-full h-auto rounded-lg" />}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
