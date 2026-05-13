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
import { useAuth } from "@/contexts/AuthContext";
import { useWaterMeters } from "@/hooks/useWaterMeters";
import { usePenghuni } from "@/hooks/usePenghuni";
import { useFileUpload } from "@/hooks/useFileUpload";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { Dialog as ViewDialog, DialogContent as ViewDialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { TablePagination } from "@/components/shared/TablePagination";
import { ArrowLeft, Droplets, Plus, ShieldAlert, Search, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";
import { WaterTariffCard } from "@/components/water/WaterTariffCard";
import { EditMeteranDialog } from "@/components/water/EditMeteranDialog";
import { useWaterTariff, calcWaterNominal } from "@/hooks/useWaterTariff";
import type { WaterMeter } from "@/hooks/useWaterMeters";

function PhotoThumb({ path, signedUrls, onView }: { path: string | null; signedUrls: Record<string, string>; onView: (url: string) => void }) {
  if (!path) return <span className="text-muted-foreground text-xs">-</span>;
  const url = signedUrls[path];
  if (!url) return <span className="text-muted-foreground text-xs">Memuat...</span>;
  return (
    <img src={url} alt="Foto meteran" className="w-14 h-14 object-cover rounded cursor-pointer border border-border" onClick={() => onView(url)} />
  );
}

export default function MeteranAir() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isStaff, isLimitedAccess, role, user } = useAuth();
  const isEngineering = role === "staff_engineering";
  const canAccess = (isSuperAdmin || isAdmin || isStaff) && !isLimitedAccess;
  const canEditMeter = isSuperAdmin || isAdmin || isEngineering;

  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const [unitNumber, setUnitNumber] = useState("");
  const [unitId, setUnitId] = useState<string | null>(null);
  const [penghuniName, setPenghuniName] = useState("");
  const [meterStart, setMeterStart] = useState("");
  const [meterEnd, setMeterEnd] = useState("");
  const [photoStartFile, setPhotoStartFile] = useState<File | null>(null);
  const [photoEndFile, setPhotoEndFile] = useState<File | null>(null);
  const [billingMonth, setBillingMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: waterMeters, isLoading, create, isCreating, remove, getPreviousMeter } = useWaterMeters({ search, month: filterMonth, year: filterYear });
  const { penghuni } = usePenghuni();
  const { uploadFile, uploading } = useFileUpload({ folder: "water-meters" });
  const { tariff } = useWaterTariff();
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [editTarget, setEditTarget] = useState<WaterMeter | null>(null);

  // Auto-load meter awal dari meter akhir bulan sebelumnya
  useEffect(() => {
    if (!unitNumber || !billingMonth) return;
    let cancelled = false;
    setLoadingPrev(true);
    getPreviousMeter(unitNumber, `${billingMonth}-01`).then((prev) => {
      if (cancelled) return;
      setMeterStart(prev !== null ? String(prev) : "0");
      setLoadingPrev(false);
    });
    return () => { cancelled = true; };
  }, [unitNumber, billingMonth]);

  useEffect(() => {
    const resolveUrls = async () => {
      const allPaths = new Set<string>();
      waterMeters.forEach((wm) => {
        if (wm.photo_start_url && !signedUrls[wm.photo_start_url]) allPaths.add(wm.photo_start_url);
        if (wm.photo_end_url && !signedUrls[wm.photo_end_url]) allPaths.add(wm.photo_end_url);
        if (wm.photo_url && !signedUrls[wm.photo_url]) allPaths.add(wm.photo_url);
      });
      if (allPaths.size === 0) return;
      const newUrls: Record<string, string> = {};
      for (const path of allPaths) {
        if (path.startsWith("http")) { newUrls[path] = path; } else {
          const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(path, 3600);
          if (data?.signedUrl) newUrls[path] = data.signedUrl;
        }
      }
      if (Object.keys(newUrls).length > 0) setSignedUrls((prev) => ({ ...prev, ...newUrls }));
    };
    resolveUrls();
  }, [waterMeters]);

  const unitOptionsMap = new Map<string, { name: string; unitId: string | null }>();
  const sortedPenghuni = [...(penghuni || [])].sort((a, b) => {
    if (a.is_owner && !b.is_owner) return -1;
    if (!a.is_owner && b.is_owner) return 1;
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
  sortedPenghuni.forEach((p) => {
    if (p.unit_number && !unitOptionsMap.has(p.unit_number)) {
      unitOptionsMap.set(p.unit_number, { name: p.full_name, unitId: p.unit_id || null });
    }
  });
  const unitOptions = Array.from(unitOptionsMap.keys()).sort();

  const handleUnitSelect = (value: string) => {
    setUnitNumber(value);
    const found = unitOptionsMap.get(value);
    if (found) { setPenghuniName(found.name); setUnitId(found.unitId); } else { setPenghuniName(""); setUnitId(null); }
  };

  const usage = meterEnd && meterStart ? Math.max(0, Number(meterEnd) - Number(meterStart)) : 0;
  const nominal = usage * 17000;

  const resetForm = () => {
    setUnitNumber(""); setUnitId(null); setPenghuniName(""); setMeterStart(""); setMeterEnd("");
    setPhotoStartFile(null); setPhotoEndFile(null); setBillingMonth(new Date().toISOString().slice(0, 7));
  };

  const handleSubmit = async () => {
    if (!unitNumber || !meterStart || !meterEnd) return;
    let photoStartUrl: string | null = null;
    let photoEndUrl: string | null = null;
    if (photoStartFile) photoStartUrl = await uploadFile(photoStartFile);
    if (photoEndFile) photoEndUrl = await uploadFile(photoEndFile);
    await create({
      unit_number: unitNumber, unit_id: unitId, penghuni_name: penghuniName || null,
      photo_start_url: photoStartUrl, photo_end_url: photoEndUrl,
      meter_start: Number(meterStart), meter_end: Number(meterEnd),
      billing_month: `${billingMonth}-01`, recorded_by: user?.id, recorded_by_name: user?.email || null,
    });
    resetForm(); setDialogOpen(false);
  };

  const paginatedData = waterMeters.slice((page - 1) * pageSize, page * pageSize);

  const months = [
    { value: "1", label: "Januari" }, { value: "2", label: "Februari" },
    { value: "3", label: "Maret" }, { value: "4", label: "April" },
    { value: "5", label: "Mei" }, { value: "6", label: "Juni" },
    { value: "7", label: "Juli" }, { value: "8", label: "Agustus" },
    { value: "9", label: "September" }, { value: "10", label: "Oktober" },
    { value: "11", label: "November" }, { value: "12", label: "Desember" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Meteran Air</h1>
              <p className="text-muted-foreground">Pencatatan meteran air unit</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label>Cari</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Cari no unit atau nama penghuni..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
                </div>
              </div>
              <div className="w-full md:w-40">
                <Label>Bulan</Label>
                <Select value={filterMonth} onValueChange={(v) => { setFilterMonth(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-32">
                <Label>Tahun</Label>
                <Select value={filterYear} onValueChange={(v) => { setFilterYear(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Semua" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="w-4 h-4" /> Input Meteran</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Input Meteran Air</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>No Unit *</Label>
                      <Combobox options={unitOptions} value={unitNumber} onChange={handleUnitSelect} placeholder="Pilih unit..." searchPlaceholder="Cari unit..." emptyText="Unit tidak ditemukan" />
                    </div>
                    {penghuniName && (<div><Label>Nama Penghuni</Label><Input value={penghuniName} disabled /></div>)}
                    <div>
                      <Label>Bulan Tagihan *</Label>
                      <Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} />
                    </div>
                    <Card className="border-dashed bg-muted/30">
                      <CardContent className="pt-4 space-y-2">
                        <Label className="text-base font-semibold">Meteran Awal (Otomatis)</Label>
                        <p className="text-xs text-muted-foreground">Diambil otomatis dari meteran akhir periode sebelumnya. Tidak perlu input ulang.</p>
                        <Input type="number" value={loadingPrev ? "Memuat..." : meterStart} disabled readOnly />
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-4 space-y-3">
                        <Label className="text-base font-semibold">Meteran Akhir *</Label>
                        <PhotoUpload label="Foto Meteran Akhir (real-time)" value={photoEndFile} onChange={setPhotoEndFile} />
                        <div><Label>Angka Meteran Akhir</Label><Input type="number" value={meterEnd} onChange={(e) => setMeterEnd(e.target.value)} placeholder="0" /></div>
                      </CardContent>
                    </Card>
                    {meterStart && meterEnd && (
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex justify-between text-sm"><span>Pemakaian</span><span className="font-semibold">{usage} m³</span></div>
                          <div className="flex justify-between text-sm"><span>Nominal</span><span className="font-semibold text-primary">Rp {nominal.toLocaleString("id-ID")}</span></div>
                        </CardContent>
                      </Card>
                    )}
                    <Button onClick={handleSubmit} disabled={!unitNumber || !meterEnd || Number(meterEnd) < Number(meterStart) || isCreating || uploading} className="w-full">
                      {isCreating || uploading ? "Menyimpan..." : "Simpan & Buat Tagihan"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data Meteran Air</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No Unit</TableHead>
                    <TableHead>Meteran Awal</TableHead>
                    <TableHead>Meteran Akhir</TableHead>
                    <TableHead>Pemakaian (m³)</TableHead>
                    <TableHead>Nominal (Rp)</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Tanggal Input</TableHead>
                    <TableHead>Petugas</TableHead>
                    {(isSuperAdmin || isAdmin) && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell></TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Belum ada data meteran air</TableCell></TableRow>
                  ) : (
                    paginatedData.map((wm) => (
                      <TableRow key={wm.id}>
                        <TableCell className="font-medium">{wm.unit_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <PhotoThumb path={wm.photo_start_url || wm.photo_url} signedUrls={signedUrls} onView={setViewPhoto} />
                            <span className="font-semibold text-sm">{wm.meter_start}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <PhotoThumb path={wm.photo_end_url} signedUrls={signedUrls} onView={setViewPhoto} />
                            <span className="font-semibold text-sm">{wm.meter_end}</span>
                          </div>
                        </TableCell>
                        <TableCell>{wm.usage_m3} m³</TableCell>
                        <TableCell>Rp {Number(wm.nominal).toLocaleString("id-ID")}</TableCell>
                        <TableCell>{format(new Date(wm.billing_month), "MMMM yyyy", { locale: localeId })}</TableCell>
                        <TableCell>{format(new Date(wm.created_at), "dd/MM/yyyy HH:mm", { locale: localeId })}</TableCell>
                        <TableCell>{wm.recorded_by_name || "-"}</TableCell>
                        {(isSuperAdmin || isAdmin) && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus data meteran ini?")) remove(wm.id); }} className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {waterMeters.length > 0 && (
              <TablePagination currentPage={page} totalItems={waterMeters.length} itemsPerPage={pageSize} onPageChange={setPage} onItemsPerPageChange={(size) => { setPageSize(size); setPage(1); }} />
            )}
          </CardContent>
        </Card>
      </div>
      <ViewDialog open={!!viewPhoto} onOpenChange={() => setViewPhoto(null)}>
        <ViewDialogContent className="max-w-2xl">
          {viewPhoto && <img src={viewPhoto} alt="Foto Meteran" className="w-full h-auto rounded-lg" />}
        </ViewDialogContent>
      </ViewDialog>
    </MainLayout>
  );
}
