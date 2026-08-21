import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useParkingSubscriptions, useCreateParkingSubscription, useExtendParkingSubscription, useDeleteParkingSubscription, useUpdateParkingVerification, useCancelExtensionParkingSubscription, useUpdateParkingMeta } from "@/hooks/useParkingSubscriptions";
import { Textarea } from "@/components/ui/textarea";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, Plus, Loader2, Info, ArrowLeft, Download, Trash2, Check, X, FileText, Printer, AlertTriangle, BellRing } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, parkingExportColumns } from "@/lib/exportExcel";
import * as XLSXMod from "xlsx";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { NotesCell, ReceiptPhotoCell } from "@/components/shared/ParkingInlineCells";
import { QuickRenewParkingDialog } from "@/components/shared/QuickRenewParkingDialog";
import { useParkingPaymentHistory } from "@/hooks/useParkingPaymentHistory";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ImportExcelDialog, ImportColumn } from "@/components/shared/ImportExcelDialog";
import { supabase } from "@/integrations/supabase/client";
import { parseImportTimestamp } from "@/lib/parseImportTimestamp";
import { toast } from "sonner";

// Normalisasi plat: uppercase + hilangkan semua spasi/strip agar "B 1234 ABC" == "b1234abc"
const normalizePlate = (plate: string) => (plate || "").toUpperCase().replace(/[\s-]/g, "").trim();

const parkingImportColumns: ImportColumn[] = [
  { header: "Timestamp", key: "created_at", example: "2024-05-15 10:30:00" },
  { header: "Unit", key: "unit_number", required: true, example: "TA0520" },
  { header: "Nama Penghuni", key: "penghuni_name", required: true, example: "Budi Santoso" },
  { header: "Telepon", key: "phone", example: "08123456789" },
  { header: "Status Sewa", key: "rental_status", example: "pemilik" },
  { header: "Jenis Kendaraan", key: "vehicle_type", required: true, example: "mobil" },
  { header: "Kartu Member", key: "member_card", example: "0000000000000000" },
  { header: "Nomor Plat", key: "vehicle_number", required: true, example: "B 1234 ABC" },
  { header: "Jenis Pengajuan", key: "request_type", example: "registrasi_baru" },
  { header: "Periode", key: "period_type", example: "bulanan" },
];

export default function AbonemenParkir() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin, isMasterDev, userId } = usePermissions();
  const { role } = useAuth();
  const permission = getFeaturePermission("abonemen-parkir");
  const { data: subscriptions, isLoading } = useParkingSubscriptions();
  const { data: paymentHistory } = useParkingPaymentHistory();
  const createMutation = useCreateParkingSubscription();
  const extendMutation = useExtendParkingSubscription();
  const cancelExtendMutation = useCancelExtensionParkingSubscription();
  const deleteMutation = useDeleteParkingSubscription();
  const updateVerificationMutation = useUpdateParkingVerification();
  const updateMetaMutation = useUpdateParkingMeta();
  const { uploadFile, uploading } = useFileUpload({ folder: "parking" });
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;
  // Akses verifikasi untuk staff_tro, staff_finance, admin, dan super_admin
  const canVerify = isAdmin || isSuperAdmin || role === "staff_tro" || role === "staff_finance";
  // Hak membatalkan perpanjangan: Master Dev, Super Admin, Admin, Staff Finance
  const canCancelExtension = isAdmin || isSuperAdmin || isMasterDev || role === "staff_finance";
  // Lihat semua data notifikasi: Master Dev, Super Admin, Admin
  const canSeeAllNotifications = isAdmin || isSuperAdmin || isMasterDev;

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Pagination untuk tabel Belum Diperpanjang
  const [notRenewedPage, setNotRenewedPage] = useState(1);
  const [notRenewedPerPage, setNotRenewedPerPage] = useState(5);

  // State khusus untuk panel notifikasi
  const [notifSearch, setNotifSearch] = useState("");
  const [notifFilter, setNotifFilter] = useState<"all" | "expired" | "soon">("all");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
  };

  const handleDateFilterChange = (value: DateFilterType) => {
    setDateFilter(value);
    setCurrentPage(1);
  };
  const [receiptDialog, setReceiptDialog] = useState<{ open: boolean; data: typeof subscriptions extends (infer T)[] ? T : never | null }>({ open: false, data: null });

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptDialog.data) return;
    
    const sub = receiptDialog.data;
    const verifiedDate = sub.updated_at ? format(new Date(sub.updated_at), "dd/MM/yyyy") : "-";
    const verifiedTime = sub.updated_at ? format(new Date(sub.updated_at), "HH:mm:ss") : "-";
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi Perpanjangan Abonemen Parkir</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin: 0; }
          .header p { margin: 5px 0 0; font-size: 12px; color: #666; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ccc; }
          .label { font-weight: bold; color: #333; }
          .value { text-align: right; }
          .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #666; }
          .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .status.verified { background: #22c55e; color: white; }
          .status.pending { background: #f59e0b; color: white; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KWITANSI PERPANJANGAN</h1>
          <p>Abonemen Parkir</p>
        </div>
        <div class="row"><span class="label">Tanggal Verifikasi:</span><span class="value">${verifiedDate}</span></div>
        <div class="row"><span class="label">Jam Verifikasi:</span><span class="value">${verifiedTime}</span></div>
        <div class="row"><span class="label">Nama Penghuni:</span><span class="value">${sub.penghuni_name || "-"}</span></div>
        <div class="row"><span class="label">Unit:</span><span class="value">${sub.unit_number || sub.units?.unit_number || "-"}</span></div>
        <div class="row"><span class="label">Nomor Plat:</span><span class="value">${sub.vehicle_number}</span></div>
        <div class="row"><span class="label">Kartu Member:</span><span class="value">${sub.member_card || "-"}</span></div>
        <div class="row"><span class="label">Jenis Kendaraan:</span><span class="value" style="text-transform:capitalize;">${sub.vehicle_type}</span></div>
        <div class="row"><span class="label">Nomor Telepon:</span><span class="value">${sub.phone || "-"}</span></div>
        <div class="row"><span class="label">Status:</span><span class="value" style="text-transform:capitalize;">${sub.rental_status === "sewa" ? "Sewa" : "Pemilik"}</span></div>
        <div class="row"><span class="label">Periode:</span><span class="value" style="text-transform:capitalize;">${sub.period_type || "-"}</span></div>
        <div class="row"><span class="label">Jenis Pengajuan:</span><span class="value" style="text-transform:capitalize;">${sub.request_type?.replace(/_/g, " ") || "-"}</span></div>
        <div class="row"><span class="label">Status Verifikasi:</span><span class="value"><span class="status ${sub.verification_status === "terverifikasi" ? "verified" : "pending"}">${sub.verification_status === "terverifikasi" ? "Terverifikasi" : "Proses"}</span></span></div>
        <div class="footer">
          <p>Dicetak pada: ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}</p>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredData = useMemo(() => {
    if (!subscriptions) return [];
    let filtered = filterByDate(subscriptions, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.vehicle_number?.toLowerCase().includes(search) ||
          sub.vehicle_type?.toLowerCase().includes(search) ||
          sub.penghuni_name?.toLowerCase().includes(search) ||
          sub.unit_number?.toLowerCase().includes(search) ||
          sub.member_card?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [subscriptions, searchValue, dateFilter]);

  // ===== Pengelompokan per Bulan =====
  // - Bulan berjalan = tabel utama / aktif (di bawah)
  // - Bulan-bulan sebelumnya (riwayat) = di atas, accordion
  // - Data tanpa end_date → masuk ke bulan berjalan supaya bisa diperpanjang
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };
  const getMonthKey = (sub: any) => {
    if (!sub.end_date) return "0000-00"; // belum diperpanjang → masuk grup lalu
    const d = new Date(sub.end_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  // Semua data ditampilkan dalam satu tabel (tempat penyimpanan data)
  const paginatedData = usePagination(filteredData, itemsPerPage, currentPage);

  // 1-klik Perpanjang (penghuni): buka dialog kecil untuk upload bukti transfer
  const [renewDialog, setRenewDialog] = useState<{ id: string; vehicle: string | null; fee: number | null } | null>(null);
  const handleQuickRenew = (id: string, vehicle: string | null, fee: number | null) => {
    setRenewDialog({ id, vehicle, fee });
  };

  const [notRenewedDialog, setNotRenewedDialog] = useState<{ id: string; vehicle: string | null; fee: number | null } | null>(null);


  const handleExport = () => {
    if (!filteredData.length) return;
    const exportData = filteredData.map((sub) => ({
      ...sub,
      unit_number: sub.unit_number || sub.units?.unit_number || "-",
      penghuni_name: sub.penghuni_name || "-",
      is_active: sub.is_active ? "Aktif" : "Tidak Aktif",
      verification_status: sub.verification_status === "terverifikasi" ? "Terverifikasi" : "Proses",
      rental_status: sub.rental_status === "sewa" ? "Sewa" : "Pemilik",
      request_type: sub.request_type?.replace(/_/g, " ") || "-",
      created_at: format(new Date(sub.created_at), "dd/MM/yyyy HH:mm:ss"),
    }));
    exportToExcel({
      filename: `Abonemen_Parkir_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Abonemen Parkir",
      data: exportData,
      columns: parkingExportColumns,
      
    });
  };

  const handleExportMonth = (key: string, items: any[]) => {
    if (!items?.length) return;
    const [y, m] = key.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    const data = items.map((h: any) => ({
      "Unit": h.unit_number || "-",
      "Pemilik": h.owner_name || "-",
      "Plat": h.vehicle_number || "-",
      "Periode": h.period_label || label,
      "Nominal": Number(h.nominal || 0),
      "Metode": h.payment_method || "-",
      "Status": h.verification_status || "-",
      "Tgl Bayar": h.payment_date ? format(new Date(h.payment_date), "dd/MM/yyyy") : "-",
      "Bukti URL": h.payment_proof_url || "-",
      "Catatan": h.notes || "-",
    }));
    const ws = XLSXMod.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 40 }, { wch: 30 }];
    const wb = XLSXMod.utils.book_new();
    XLSXMod.utils.book_append_sheet(wb, ws, label.substring(0, 31));
    XLSXMod.writeFile(wb, `Abonemen_Parkir_${key}.xlsx`);
  };

  const handleUnverify = async (id: string) => {
    await updateVerificationMutation.mutateAsync({ id, verification_status: "proses" });
  };

  const [isOpen, setIsOpen] = useState(false);

  const [form, setForm] = useState({
    unit_number: "",
    penghuni_name: "",
    rental_status: "",
    phone: "",
    vehicle_type: "",
    member_card: "",
    vehicle_number: "",
    request_type: "",
    period_type: "",
    ktp_photo: null as File | null,
    stnk_photo: null as File | null,
    rental_agreement: null as File | null,
    payment_proof: null as File | null,
  });

  const isNewRegistration = form.request_type === "registrasi_baru";

  // Set plat yang sudah terdaftar (untuk validasi duplikasi & feedback realtime di form)
  const registeredPlates = useMemo(() => {
    const set = new Set<string>();
    (subscriptions || []).forEach((s: any) => {
      if (s.vehicle_number) set.add(normalizePlate(s.vehicle_number));
    });
    return set;
  }, [subscriptions]);

  const plateAlreadyExists =
    !!form.vehicle_number && registeredPlates.has(normalizePlate(form.vehicle_number));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi: plat tidak boleh dobel
    if (plateAlreadyExists) {
      toast.error(`Nomor plat "${form.vehicle_number}" sudah terdaftar. Gunakan menu Perpanjangan untuk plat ini.`);
      return;
    }
    const today = new Date();

    // Upload photos
    let ktpUrl: string | undefined;
    let stnkUrl: string | undefined;
    let rentalUrl: string | undefined;
    let paymentUrl: string | undefined;

    if (form.ktp_photo) {
      const path = await uploadFile(form.ktp_photo);
      if (path) ktpUrl = path;
    }
    if (form.stnk_photo) {
      const path = await uploadFile(form.stnk_photo);
      if (path) stnkUrl = path;
    }
    if (form.rental_agreement) {
      const path = await uploadFile(form.rental_agreement);
      if (path) rentalUrl = path;
    }
    if (form.payment_proof) {
      const path = await uploadFile(form.payment_proof);
      if (path) paymentUrl = path;
    }

    await createMutation.mutateAsync({
      vehicle_type: form.vehicle_type,
      vehicle_number: form.vehicle_number,
      start_date: today.toISOString().split("T")[0],
      // Tanggal berakhir kosong saat pendaftaran pertama;
      // baru terisi setelah admin memperpanjang (harian / bulanan s/d tgl 5).
      end_date: null,
      monthly_fee: 0,
      penghuni_name: form.penghuni_name,
      unit_number: form.unit_number,
      phone: form.phone,
      member_card: form.member_card,
      request_type: form.request_type,
      period_type: form.period_type,
      rental_status: form.rental_status,
      ktp_photo_url: ktpUrl,
      stnk_photo_url: stnkUrl,
      rental_agreement_url: rentalUrl,
      payment_proof_url: paymentUrl,
    });
    setIsOpen(false);
    setForm({
      unit_number: "",
      penghuni_name: "",
      rental_status: "",
      phone: "",
      vehicle_type: "",
      member_card: "",
      vehicle_number: "",
      request_type: "",
      period_type: "",
      ktp_photo: null,
      stnk_photo: null,
      rental_agreement: null,
      payment_proof: null,
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/?section=kepenghunian")}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Abonemen Parkir</h1>
              <p className="text-muted-foreground">Kelola langganan parkir penghuni</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <LoginPromptButton />
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <PermissionButton
                  hasPermission={permission.canCreate}
                  tooltip={permission.tooltip}
                  category="blue"
                  className="ring-2 ring-user-blue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Abonemen
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Abonemen Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tower Lantai Unit <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.unit_number}
                    onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                    placeholder="Contoh: A0520, B1205"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Penghuni <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.penghuni_name}
                    onChange={(e) => setForm({ ...form, penghuni_name: e.target.value })}
                    placeholder="Masukkan nama penghuni"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keterangan Sewa / Pemilik <span className="text-destructive">*</span></Label>
                  <Select value={form.rental_status} onValueChange={(v) => setForm({ ...form, rental_status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemilik">Pemilik</SelectItem>
                      <SelectItem value="sewa">Sewa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nomor Telepon <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kendaraan <span className="text-destructive">*</span></Label>
                  <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kendaraan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobil">Mobil</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="mobil_motor">Mobil & Motor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>16 Digit Kartu Member <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.member_card}
                    onChange={(e) => setForm({ ...form, member_card: e.target.value })}
                    placeholder="Ketik 0 untuk registrasi baru"
                    maxLength={16}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Khusus perpanjangan. Untuk registrasi baru, ketik 0</p>
                </div>

                <div className="space-y-2">
                  <Label>Nomor Plat Kendaraan <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.vehicle_number}
                    onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                    placeholder="B 1234 ABC"
                    required
                    className={plateAlreadyExists ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {plateAlreadyExists && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Plat ini sudah terdaftar. Silakan gunakan tombol "Perpanjang" pada daftar.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Jenis Pengajuan <span className="text-destructive">*</span></Label>
                  <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis pengajuan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registrasi_baru">Registrasi Baru</SelectItem>
                      <SelectItem value="perpanjangan">Perpanjangan</SelectItem>
                      <SelectItem value="kartu_hilang_rusak">Kartu Hilang / Rusak</SelectItem>
                      <SelectItem value="ganti_plat">Ganti Plat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Harian / Bulanan <span className="text-destructive">*</span></Label>
                  <Select value={form.period_type} onValueChange={(v) => setForm({ ...form, period_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harian">Harian</SelectItem>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                      <SelectItem value="0">Hilang / Rusak (ketik 0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <PhotoUpload
                  label={`Upload KTP${isNewRegistration ? " *" : ""}`}
                  value={form.ktp_photo}
                  onChange={(file) => setForm({ ...form, ktp_photo: file })}
                  required={isNewRegistration}
                />

                <PhotoUpload
                  label={`Foto STNK${isNewRegistration ? " *" : ""}`}
                  value={form.stnk_photo}
                  onChange={(file) => setForm({ ...form, stnk_photo: file })}
                  required={isNewRegistration}
                />
                <PhotoUpload
                  label={`Perjanjian Sewa${isNewRegistration ? " *" : ""}`}
                  value={form.rental_agreement}
                  onChange={(file) => setForm({ ...form, rental_agreement: file })}
                  required={isNewRegistration}
                />

                <PhotoUpload
                  label="Bukti Pembayaran"
                  value={form.payment_proof}
                  onChange={(file) => setForm({ ...form, payment_proof: file })}
                />

                <div className="p-3 bg-info/10 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-info mt-0.5" />
                  <div className="text-sm text-info">
                    <p className="font-medium">Pembayaran ke rekening:</p>
                    <p className="font-mono">200001000338306 (BRI) a.n. PPPSRS THE JARRDIN</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || plateAlreadyExists}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {plateAlreadyExists ? "Plat Sudah Terdaftar" : "Simpan"}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Abonemen</CardTitle>
             <div className="flex gap-2">
              {canExport && (
                <ImportExcelDialog
                  title="Abonemen Parkir"
                  templateFilename="Abonemen_Parkir"
                  columns={parkingImportColumns}
                  onImport={async (rows) => {
                    let success = 0, failed = 0;
                    const errors: string[] = [];
                    const today = new Date();
                    const seenInBatch = new Set<string>();
                    for (const [i, r] of rows.entries()) {
                      try {
                        const plateKey = normalizePlate(r.vehicle_number || "");
                        if (!plateKey) throw new Error("Nomor plat kosong");
                        if (registeredPlates.has(plateKey) || seenInBatch.has(plateKey)) {
                          throw new Error(`Plat "${r.vehicle_number}" sudah terdaftar (dilewati)`);
                        }
                        seenInBatch.add(plateKey);
                        const created = await createMutation.mutateAsync({
                          vehicle_type: r.vehicle_type || "mobil",
                          vehicle_number: r.vehicle_number || "",
                          start_date: today.toISOString().split("T")[0],
                          // Berakhir kosong saat pendaftaran; akan diisi oleh admin
                          end_date: null,
                          monthly_fee: 0,
                          penghuni_name: r.penghuni_name,
                          unit_number: r.unit_number,
                          phone: r.phone,
                          member_card: r.member_card,
                          request_type: r.request_type,
                          period_type: r.period_type,
                          rental_status: r.rental_status,
                        });
                        const ts = parseImportTimestamp(r.created_at);
                        if (ts && created?.id) {
                          await supabase.from("parking_subscriptions").update({ created_at: ts }).eq("id", created.id);
                        }
                        success++;
                      } catch (e: any) {
                        failed++;
                        errors.push(`Baris ${i + 2}: ${e.message}`);
                      }
                    }
                    return { success, failed, errors };
                  }}
                />
              )}
              {canExport && filteredData.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <DataFilterBar
              searchValue={searchValue}
              onSearchChange={handleSearchChange}
              dateFilter={dateFilter}
              onDateFilterChange={handleDateFilterChange}
              searchPlaceholder="Cari plat, unit, nama, kartu member..."
            />




            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Total {filteredData.length}</Badge>
              <span className="text-sm font-medium">Semua Data Abonemen Parkir</span>
            </div>


            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Kendaraan</TableHead>
                      <TableHead>Kartu Member</TableHead>
                      <TableHead>Plat</TableHead>
                      <TableHead>Pengajuan</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Foto</TableHead>
                      <TableHead>Berakhir</TableHead>
                      <TableHead>Perpanjang</TableHead>
                      <TableHead className="min-w-[200px]">Catatan</TableHead>
                      <TableHead>Foto Kwitansi</TableHead>
                      <TableHead>Kwitansi Bulanan</TableHead>
                      {isSuperAdmin && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(sub.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>{sub.unit_number || sub.units?.unit_number || "-"}</TableCell>
                        <TableCell>{sub.penghuni_name || "-"}</TableCell>
                        <TableCell className="capitalize">
                          <Badge variant={sub.rental_status === "sewa" ? "secondary" : "outline"}>
                            {sub.rental_status === "sewa" ? "Sewa" : "Pemilik"}
                          </Badge>
                        </TableCell>
                        <TableCell>{sub.phone || "-"}</TableCell>
                        <TableCell className="capitalize">{sub.vehicle_type}</TableCell>
                        <TableCell className="font-mono text-xs">{sub.member_card || "-"}</TableCell>
                        <TableCell className="font-mono">{sub.vehicle_number}</TableCell>
                        <TableCell className="capitalize text-sm">
                          {sub.request_type?.replace(/_/g, " ") || "-"}
                        </TableCell>
                        <TableCell className="capitalize">{sub.period_type || "-"}</TableCell>
                        <TableCell>
                          <PhotoCell
                            photos={[
                              { url: sub.ktp_photo_url, label: "KTP" },
                              { url: sub.stnk_photo_url, label: "STNK" },
                              { url: sub.rental_agreement_url, label: "Sewa" },
                              { url: sub.payment_proof_url, label: "Bukti" },
                            ]}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {(() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const end = sub.end_date ? new Date(sub.end_date) : null;
                            const diff = end
                              ? Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                              : 0;
                            const expired = end ? diff < 0 : false;
                            const soon = end ? diff >= 0 && diff <= 7 : false;
                            const handleEditDays = () => {
                              if (!canVerify) return;
                              const promptMsg = end
                                ? `Masa berakhir saat ini: ${format(end, "dd/MM/yyyy")} (${diff} hari lagi)\n\nMasukkan jumlah HARI dari hari ini.\nJatuh tempo akan otomatis disesuaikan ke tanggal 5 berikutnya.`
                                : `Belum ada tanggal berakhir.\n\nMasukkan jumlah HARI dari hari ini.\nJatuh tempo akan otomatis disesuaikan ke tanggal 5 berikutnya.`;
                              const input = prompt(promptMsg, String(end && diff > 0 ? diff : 30));
                              if (!input) return;
                              const days = parseInt(input, 10);
                              if (!Number.isFinite(days) || days <= 0) {
                                alert("Jumlah hari tidak valid");
                                return;
                              }
                              // Hitung tanggal target: hari ini + days, lalu snap ke tanggal 5 berikutnya
                              const target = new Date();
                              target.setHours(0, 0, 0, 0);
                              target.setDate(target.getDate() + days);
                              if (target.getDate() > 5) {
                                target.setMonth(target.getMonth() + 1);
                              }
                              target.setDate(5);
                              const newEndStr = target.toISOString().split("T")[0];
                              extendMutation.mutate({ id: sub.id, customEndDate: newEndStr });
                            };
                            return (
                              <div
                                className={`flex flex-col ${canVerify ? "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1" : ""}`}
                                onClick={handleEditDays}
                                title={canVerify ? "Klik untuk set/ubah jumlah hari (otomatis jatuh tempo tgl 5)" : ""}
                              >
                                <span className={canVerify ? "underline decoration-dotted underline-offset-2" : ""}>
                                  {end ? format(end, "dd/MM/yyyy") : "-"}
                                </span>
                                {end && (
                                  <span className={`text-xs ${expired ? "text-destructive" : soon ? "text-warning" : "text-muted-foreground"}`}>
                                    {expired ? `Habis ${Math.abs(diff)} hari lalu` : diff === 0 ? "Habis hari ini" : `${diff} hari lagi`}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          {canVerify ? (() => {
                            // Sudah diperpanjang jika end_date sudah terisi (admin telah set tanggal berakhir)
                            const isExtended = !!sub.end_date;
                            return (
                            <Select
                              disabled={extendMutation.isPending || cancelExtendMutation.isPending}
                              onValueChange={(v) => {
                                if (v === "cancel") {
                                  if (!canCancelExtension) return;
                                  if (!confirm("Batalkan perpanjangan untuk abonemen ini? Masa aktif akan kembali ke periode awal.")) return;
                                  cancelExtendMutation.mutate({ id: sub.id, startDate: sub.start_date });
                                } else if (v === "manual_days") {
                                  const input = prompt("Masukkan jumlah HARI perpanjangan (parkir harian):", "1");
                                  if (!input) return;
                                  const days = parseInt(input, 10);
                                  if (!Number.isFinite(days) || days <= 0) {
                                    alert("Jumlah hari tidak valid");
                                    return;
                                  }
                                  extendMutation.mutate({ id: sub.id, days, currentEndDate: sub.end_date });
                                } else {
                                  const months = parseInt(v, 10);
                                  extendMutation.mutate({ id: sub.id, months, currentEndDate: sub.end_date });
                                }
                              }}
                            >
                              <SelectTrigger
                                className={`w-[160px] h-8 text-xs font-medium border-2 ${
                                  isExtended
                                    ? "bg-success/10 border-success text-success hover:bg-success/20"
                                    : "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20"
                                }`}
                              >
                                <SelectValue placeholder={isExtended ? "Sudah Diperpanjang" : "Belum Diperpanjang"} />
                              </SelectTrigger>
                              <SelectContent>
                                {canCancelExtension && (
                                  <SelectItem value="cancel" className="text-destructive font-medium">
                                    Batalkan Perpanjangan
                                  </SelectItem>
                                )}
                                <SelectItem value="manual_days" className="font-medium text-primary">
                                  Perpanjang Manual (Hari)…
                                </SelectItem>
                                <SelectItem value="1">Perpanjang 1 Bulan (s/d tgl 5)</SelectItem>
                                <SelectItem value="2">Perpanjang 2 Bulan (s/d tgl 5)</SelectItem>
                                <SelectItem value="3">Perpanjang 3 Bulan (s/d tgl 5)</SelectItem>
                              </SelectContent>
                            </Select>
                            );
                          })() : isAuthenticated ? (
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-success hover:bg-success/90 text-success-foreground"
                                onClick={() => handleQuickRenew(sub.id, sub.vehicle_number, sub.monthly_fee)}
                                title={`Perpanjang ke bulan ${monthLabel(currentMonthKey)}`}
                              >
                                Perpanjang
                              </Button>
                              {sub.verification_status && sub.verification_status !== "terverifikasi" && (
                                <Badge variant="secondary" className="text-[10px] justify-center">Menunggu</Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant={sub.verification_status === "terverifikasi" ? "default" : "secondary"}
                              className={sub.verification_status === "terverifikasi" ? "bg-success" : ""}>
                              {sub.verification_status === "terverifikasi" ? "Aktif" : "Menunggu"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <NotesCell
                            id={sub.id}
                            value={sub.admin_notes}
                            canEdit={canVerify}
                            onSave={(notes) => updateMetaMutation.mutate({ id: sub.id, admin_notes: notes })}
                          />
                        </TableCell>
                        <TableCell>
                          <ReceiptPhotoCell
                            id={sub.id}
                            url={sub.receipt_photo_url}
                            canEdit={canVerify}
                            onUpload={async (file) => {
                              const path = await uploadFile(file);
                              if (path) updateMetaMutation.mutate({ id: sub.id, receipt_photo_url: path });
                            }}
                            onClear={() => updateMetaMutation.mutate({ id: sub.id, receipt_photo_url: null })}
                          />
                        </TableCell>
                        <TableCell>
                          <ParkingReceiptHistoryDialog
                            history={paymentHistory || []}
                            subscriptionId={sub.id}
                            vehicleNumber={sub.vehicle_number}
                            unitNumber={sub.unit_number || sub.units?.unit_number || null}
                            ownerName={sub.penghuni_name}
                          />
                        </TableCell>
                        {isSuperAdmin && (
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Abonemen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus data abonemen parkir untuk plat {sub.vehicle_number}? Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(sub.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={isSuperAdmin ? 16 : 15} className="text-center text-muted-foreground py-8">
                          {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada abonemen parkir"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={currentPage}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Dialog */}
        <Dialog open={receiptDialog.open} onOpenChange={(open) => setReceiptDialog({ open, data: open ? receiptDialog.data : null })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Kwitansi Perpanjangan
              </DialogTitle>
            </DialogHeader>
            {receiptDialog.data && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Tanggal Verifikasi</span>
                    <span className="font-medium">{receiptDialog.data.updated_at ? format(new Date(receiptDialog.data.updated_at), "dd/MM/yyyy") : "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Jam Verifikasi</span>
                    <span className="font-medium">{receiptDialog.data.updated_at ? format(new Date(receiptDialog.data.updated_at), "HH:mm:ss") : "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Nama Penghuni</span>
                    <span className="font-medium">{receiptDialog.data.penghuni_name || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="font-medium">{receiptDialog.data.unit_number || receiptDialog.data.units?.unit_number || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Nomor Plat</span>
                    <span className="font-medium font-mono">{receiptDialog.data.vehicle_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Kartu Member</span>
                    <span className="font-medium font-mono">{receiptDialog.data.member_card || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Jenis Kendaraan</span>
                    <span className="font-medium capitalize">{receiptDialog.data.vehicle_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Nomor Telepon</span>
                    <span className="font-medium">{receiptDialog.data.phone || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={receiptDialog.data.rental_status === "sewa" ? "secondary" : "outline"}>
                      {receiptDialog.data.rental_status === "sewa" ? "Sewa" : "Pemilik"}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Periode Perpanjangan</span>
                    <span className="font-medium capitalize">{receiptDialog.data.period_type || "-"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-muted-foreground">Jenis Pengajuan</span>
                    <span className="font-medium capitalize">{receiptDialog.data.request_type?.replace(/_/g, " ") || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Verifikasi</span>
                    <Badge variant={receiptDialog.data.verification_status === "terverifikasi" ? "default" : "secondary"} 
                      className={receiptDialog.data.verification_status === "terverifikasi" ? "bg-success" : ""}>
                      {receiptDialog.data.verification_status === "terverifikasi" ? "Terverifikasi" : "Proses"}
                    </Badge>
                  </div>
                </div>
                <Button onClick={handlePrintReceipt} className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak / Download Kwitansi
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {renewDialog && (
          <QuickRenewParkingDialog
            open={!!renewDialog}
            onOpenChange={(o) => { if (!o) setRenewDialog(null); }}
            subscriptionId={renewDialog.id}
            vehicleNumber={renewDialog.vehicle}
            monthlyFee={renewDialog.fee}
          />
        )}
        {notRenewedDialog && (
          <QuickRenewParkingDialog
            open={!!notRenewedDialog}
            onOpenChange={(o) => { if (!o) setNotRenewedDialog(null); }}
            subscriptionId={notRenewedDialog.id}
            vehicleNumber={notRenewedDialog.vehicle}
            monthlyFee={notRenewedDialog.fee}
            enableMonthSelection={true}
          />
        )}
      </div>
    </MainLayout>
  );
}
