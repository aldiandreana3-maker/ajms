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
import { useParkingSubscriptions, useCreateParkingSubscription, useExtendParkingSubscription, useDeleteParkingSubscription, useUpdateParkingVerification } from "@/hooks/useParkingSubscriptions";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, Plus, Loader2, Info, ArrowLeft, Download, Trash2, Check, X, FileText, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, parkingExportColumns } from "@/lib/exportExcel";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ImportExcelDialog, ImportColumn } from "@/components/shared/ImportExcelDialog";

const parkingImportColumns: ImportColumn[] = [
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
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const { role } = useAuth();
  const permission = getFeaturePermission("abonemen-parkir");
  const { data: subscriptions, isLoading } = useParkingSubscriptions();
  const createMutation = useCreateParkingSubscription();
  const extendMutation = useExtendParkingSubscription();
  const deleteMutation = useDeleteParkingSubscription();
  const updateVerificationMutation = useUpdateParkingVerification();
  const { uploadFile, uploading } = useFileUpload({ folder: "parking" });
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;
  // Akses verifikasi untuk staff_tro, staff_finance, admin, dan super_admin
  const canVerify = isAdmin || isSuperAdmin || role === "staff_tro" || role === "staff_finance";

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const paginatedData = usePagination(filteredData, itemsPerPage, currentPage);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const endDate = form.period_type === "harian" 
      ? new Date(today.getTime() + 24 * 60 * 60 * 1000)
      : new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

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
      end_date: endDate.toISOString().split("T")[0],
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
                  />
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

                {isNewRegistration && (
                  <>
                    <PhotoUpload
                      label="Foto STNK"
                      value={form.stnk_photo}
                      onChange={(file) => setForm({ ...form, stnk_photo: file })}
                      required
                    />
                    <PhotoUpload
                      label="Perjanjian Sewa"
                      value={form.rental_agreement}
                      onChange={(file) => setForm({ ...form, rental_agreement: file })}
                      required
                    />
                  </>
                )}

                <PhotoUpload
                  label="Bukti Pembayaran"
                  value={form.payment_proof}
                  onChange={(file) => setForm({ ...form, payment_proof: file })}
                />

                <div className="p-3 bg-info/10 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-info mt-0.5" />
                  <div className="text-sm text-info">
                    <p className="font-medium">Pembayaran ke rekening:</p>
                    <p className="font-mono">200001000338306 (BRI)</p>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan
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
                    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                    for (const [i, r] of rows.entries()) {
                      try {
                        await createMutation.mutateAsync({
                          vehicle_type: r.vehicle_type || "mobil",
                          vehicle_number: r.vehicle_number || "",
                          start_date: today.toISOString().split("T")[0],
                          end_date: endDate.toISOString().split("T")[0],
                          monthly_fee: 0,
                          penghuni_name: r.penghuni_name,
                          unit_number: r.unit_number,
                          phone: r.phone,
                          member_card: r.member_card,
                          request_type: r.request_type,
                          period_type: r.period_type,
                          rental_status: r.rental_status,
                        });
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
                      <TableHead>Verifikasi</TableHead>
                      <TableHead>Kwitansi</TableHead>
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
                        <TableCell>
                          {canVerify ? (
                            <button
                              onClick={() => {
                                const newStatus = sub.verification_status === "terverifikasi" ? "proses" : "terverifikasi";
                                updateVerificationMutation.mutate({ id: sub.id, verification_status: newStatus });
                              }}
                              disabled={updateVerificationMutation.isPending}
                              className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                sub.verification_status === "terverifikasi"
                                  ? "bg-success border-success text-white"
                                  : "border-muted-foreground hover:border-success"
                              }`}
                              title={sub.verification_status === "terverifikasi" ? "Sudah diperpanjang" : "Klik untuk tandai sudah diperpanjang"}
                            >
                              {sub.verification_status === "terverifikasi" && (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                          ) : (
                            sub.verification_status === "terverifikasi" ? (
                              <div className="w-5 h-5 border-2 rounded bg-success border-success text-white flex items-center justify-center">
                                <Check className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 rounded border-muted-foreground" />
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceiptDialog({ open: true, data: sub })}
                            title="Lihat Kwitansi"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
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
                        <TableCell colSpan={isSuperAdmin ? 14 : 13} className="text-center text-muted-foreground py-8">
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
      </div>
    </MainLayout>
  );
}
