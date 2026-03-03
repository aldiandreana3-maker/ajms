import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useFieldInspections } from "@/hooks/useFieldInspections";
import { useFileUpload } from "@/hooks/useFileUpload";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { TablePagination } from "@/components/shared/TablePagination";
import { Combobox } from "@/components/ui/combobox";
import { usePenghuni } from "@/hooks/usePenghuni";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ClipboardCheck, Plus, Search, ShieldAlert, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusOptions = [
  { value: "belum_dikerjakan", label: "Belum Dikerjakan", color: "bg-destructive text-destructive-foreground" },
  { value: "dalam_proses", label: "Dalam Proses", color: "bg-warning text-warning-foreground" },
  { value: "selesai", label: "Selesai", color: "bg-success text-success-foreground" },
];

function PhotoThumb({ path, signedUrls, onView }: { path: string | null; signedUrls: Record<string, string>; onView: (url: string) => void }) {
  if (!path) return <span className="text-muted-foreground text-xs">-</span>;
  const url = signedUrls[path];
  if (!url) return <span className="text-muted-foreground text-xs">Memuat...</span>;
  return (
    <img src={url} alt="Foto" className="w-14 h-14 object-cover rounded cursor-pointer border border-border" onClick={() => onView(url)} />
  );
}

export default function LaporanInspeksi() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isStaff, isLimitedAccess, user, role } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin || isStaff) && !isLimitedAccess;
  const isTRO = isSuperAdmin || isAdmin || role === "staff_tro";
  const isEngineering = role === "staff_engineering";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Form state (create)
  const [unitNumber, setUnitNumber] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [findingDesc, setFindingDesc] = useState("");
  const [photoBeforeFile, setPhotoBeforeFile] = useState<File | null>(null);

  // Edit state (engineering)
  const [editStatus, setEditStatus] = useState("");
  const [photoAfterFile, setPhotoAfterFile] = useState<File | null>(null);

  const { data: inspections, isLoading, create, isCreating, update, isUpdating, remove } = useFieldInspections(search);
  const { penghuni } = usePenghuni();
  const { uploadFile, uploading } = useFileUpload({ folder: "field-inspections" });

  // Resolve signed URLs
  useEffect(() => {
    const resolveUrls = async () => {
      const allPaths = new Set<string>();
      inspections.forEach((i) => {
        if (i.photo_before_url && !signedUrls[i.photo_before_url]) allPaths.add(i.photo_before_url);
        if (i.photo_after_url && !signedUrls[i.photo_after_url]) allPaths.add(i.photo_after_url);
      });
      if (allPaths.size === 0) return;
      const newUrls: Record<string, string> = {};
      for (const path of allPaths) {
        if (path.startsWith("http")) {
          newUrls[path] = path;
        } else {
          const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(path, 3600);
          if (data?.signedUrl) newUrls[path] = data.signedUrl;
        }
      }
      if (Object.keys(newUrls).length > 0) setSignedUrls((prev) => ({ ...prev, ...newUrls }));
    };
    resolveUrls();
  }, [inspections]);

  // Unit options from penghuni
  const unitOptions = Array.from(new Set((penghuni || []).filter(p => p.unit_number).map(p => p.unit_number!))).sort();
  const unitMap = new Map<string, string | null>();
  (penghuni || []).forEach(p => { if (p.unit_number && !unitMap.has(p.unit_number)) unitMap.set(p.unit_number, p.unit_id || null); });

  const handleUnitSelect = (value: string) => {
    setUnitNumber(value);
    setUnitId(unitMap.get(value) || null);
  };

  const resetForm = () => {
    setUnitNumber(""); setUnitId(null); setFindingDesc(""); setPhotoBeforeFile(null);
  };

  const handleCreate = async () => {
    if (!unitNumber || !findingDesc) return;
    let photoBeforeUrl: string | null = null;
    if (photoBeforeFile) photoBeforeUrl = await uploadFile(photoBeforeFile);
    await create({
      unit_number: unitNumber,
      unit_id: unitId,
      finding_description: findingDesc,
      photo_before_url: photoBeforeUrl,
      created_by: user?.id,
      created_by_name: user?.email || null,
    });
    resetForm();
    setDialogOpen(false);
  };

  const handleUpdate = async (id: string) => {
    let photoAfterUrl: string | null = null;
    if (photoAfterFile) photoAfterUrl = await uploadFile(photoAfterFile);
    const updates: any = { id, work_status: editStatus };
    if (photoAfterUrl) updates.photo_after_url = photoAfterUrl;
    if (editStatus === "selesai") {
      updates.completed_by = user?.id;
      updates.completed_by_name = user?.email || null;
    }
    await update(updates);
    setEditDialog(null);
    setPhotoAfterFile(null);
  };

  const openEditDialog = (inspection: any) => {
    setEditDialog(inspection.id);
    setEditStatus(inspection.work_status);
    setPhotoAfterFile(null);
  };

  const paginatedData = inspections.slice((page - 1) * pageSize, page * pageSize);

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(s => s.value === status);
    return <Badge className={opt?.color || ""}>{opt?.label || status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Laporan Inspeksi Lapangan</h1>
              <p className="text-muted-foreground">Data inspeksi dan perbaikan unit</p>
            </div>
          </div>
        </div>

        {/* Filters & Add */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label>Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Cari no unit atau temuan..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
                </div>
              </div>
              {isTRO && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2"><Plus className="w-4 h-4" /> Tambah Laporan</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Tambah Laporan Inspeksi</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <Label>No Unit *</Label>
                        <Combobox options={unitOptions} value={unitNumber} onChange={handleUnitSelect} placeholder="Pilih unit..." searchPlaceholder="Cari unit..." emptyText="Unit tidak ditemukan" />
                      </div>
                      <div>
                        <Label>Keterangan Temuan *</Label>
                        <Textarea value={findingDesc} onChange={(e) => setFindingDesc(e.target.value)} placeholder="Deskripsi hasil inspeksi..." rows={3} />
                      </div>
                      <div>
                        <Label>Dokumentasi (Before)</Label>
                        <PhotoUpload label="Foto sebelum pengerjaan" value={photoBeforeFile} onChange={setPhotoBeforeFile} />
                      </div>
                      <Button onClick={handleCreate} disabled={!unitNumber || !findingDesc || isCreating || uploading} className="w-full">
                        {isCreating || uploading ? "Menyimpan..." : "Simpan Laporan"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Data Inspeksi Lapangan</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No Unit</TableHead>
                    <TableHead>Keterangan Temuan</TableHead>
                    <TableHead>Before</TableHead>
                    <TableHead>After</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diselesaikan Oleh</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data inspeksi</TableCell></TableRow>
                  ) : (
                    paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.unit_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.finding_description}</TableCell>
                        <TableCell><PhotoThumb path={item.photo_before_url} signedUrls={signedUrls} onView={setViewPhoto} /></TableCell>
                        <TableCell><PhotoThumb path={item.photo_after_url} signedUrls={signedUrls} onView={setViewPhoto} /></TableCell>
                        <TableCell>{getStatusBadge(item.work_status)}</TableCell>
                        <TableCell>{item.completed_by_name || "-"}</TableCell>
                        <TableCell>{format(new Date(item.created_at), "dd/MM/yyyy", { locale: localeId })}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(isEngineering || isTRO) && item.work_status !== "selesai" && (
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>Update</Button>
                            )}
                            {isTRO && (
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Hapus laporan ini?")) remove(item.id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {inspections.length > 0 && (
              <TablePagination currentPage={page} totalItems={inspections.length} itemsPerPage={pageSize} onPageChange={setPage} onItemsPerPageChange={(size) => { setPageSize(size); setPage(1); }} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog (Engineering updates) */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Update Status Inspeksi</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Status Pekerjaan</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dokumentasi (After)</Label>
              <PhotoUpload label="Foto setelah pengerjaan" value={photoAfterFile} onChange={setPhotoAfterFile} />
            </div>
            <Button onClick={() => editDialog && handleUpdate(editDialog)} disabled={isUpdating || uploading} className="w-full">
              {isUpdating || uploading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo View */}
      <Dialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <DialogContent className="max-w-2xl">
          {viewPhoto && <img src={viewPhoto} alt="Foto Inspeksi" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
