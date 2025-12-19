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
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Car, Plus, Calendar, Loader2, Upload, Info, ArrowLeft, Download, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, parkingExportColumns } from "@/lib/exportExcel";
import { PhotoCell } from "@/components/shared/PhotoActions";

export default function AbonemenParkir() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("abonemen-parkir");
  const { data: subscriptions, isLoading } = useParkingSubscriptions();
  const createMutation = useCreateParkingSubscription();
  const extendMutation = useExtendParkingSubscription();
  const deleteMutation = useDeleteParkingSubscription();
  const updateVerificationMutation = useUpdateParkingVerification();
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;
  const canVerify = isAdmin || isSuperAdmin;

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

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

  const handleExport = () => {
    if (!filteredData.length) return;
    const exportData = filteredData.map((sub) => ({
      ...sub,
      unit_number: sub.unit_number || sub.units?.unit_number || "-",
      penghuni_name: sub.penghuni_name || "-",
      is_active: sub.is_active ? "Aktif" : "Tidak Aktif",
      verification_status: sub.verification_status === "terverifikasi" ? "Terverifikasi" : "Proses",
      rental_status: sub.rental_status === "sewa" ? "Sewa" : "Pemilik",
      created_at: format(new Date(sub.created_at), "dd/MM/yyyy HH:mm:ss"),
    }));
    exportToExcel({
      filename: `Abonemen_Parkir_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Abonemen Parkir",
      data: exportData,
      columns: parkingExportColumns,
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");

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

  const handleExtend = async () => {
    if (extendId && extendDate) {
      await extendMutation.mutateAsync({ id: extendId, end_date: extendDate });
      setExtendId(null);
      setExtendDate("");
    }
  };

  const handleVerify = async (id: string) => {
    await updateVerificationMutation.mutateAsync({ id, verification_status: "terverifikasi" });
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

                <div className="space-y-2">
                  <Label>Upload KTP {isNewRegistration && <span className="text-destructive">*</span>}</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setForm({ ...form, ktp_photo: file });
                      }}
                      className="hidden"
                      id="ktp-upload"
                    />
                    <label htmlFor="ktp-upload" className="cursor-pointer">
                      {form.ktp_photo ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                          <Upload className="w-5 h-5" />
                          {form.ktp_photo.name}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Upload KTP</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {isNewRegistration && (
                  <>
                    <div className="space-y-2">
                      <Label>Foto Surat Kendaraan (STNK) <span className="text-destructive">*</span></Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setForm({ ...form, stnk_photo: file });
                          }}
                          className="hidden"
                          id="stnk-upload"
                        />
                        <label htmlFor="stnk-upload" className="cursor-pointer">
                          {form.stnk_photo ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                              <Upload className="w-5 h-5" />
                              {form.stnk_photo.name}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="w-6 h-6" />
                              <span className="text-sm">Upload STNK</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Upload Perjanjian Sewa <span className="text-destructive">*</span></Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setForm({ ...form, rental_agreement: file });
                          }}
                          className="hidden"
                          id="rental-upload"
                        />
                        <label htmlFor="rental-upload" className="cursor-pointer">
                          {form.rental_agreement ? (
                            <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                              <Upload className="w-5 h-5" />
                              {form.rental_agreement.name}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="w-6 h-6" />
                              <span className="text-sm">Upload perjanjian sewa</span>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Upload Bukti Bayar</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setForm({ ...form, payment_proof: file });
                      }}
                      className="hidden"
                      id="payment-upload"
                    />
                    <label htmlFor="payment-upload" className="cursor-pointer">
                      {form.payment_proof ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                          <Upload className="w-5 h-5" />
                          {form.payment_proof.name}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Upload bukti bayar</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

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
            {canExport && filteredData.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <DataFilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
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
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((sub) => (
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
                          {sub.verification_status === "terverifikasi" ? (
                            <Badge className="bg-success/20 text-success border-success/30">
                              Terverifikasi
                            </Badge>
                          ) : (
                            <Badge className="bg-warning/20 text-warning border-warning/30">
                              Proses
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="space-x-1">
                          {canVerify && sub.verification_status !== "terverifikasi" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-success border-success/30 hover:bg-success/10"
                              onClick={() => handleVerify(sub.id)}
                              disabled={updateVerificationMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Dialog open={extendId === sub.id} onOpenChange={(open) => !open && setExtendId(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExtendId(sub.id)}
                              >
                                <Calendar className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Perpanjang Abonemen</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Tanggal Berakhir Baru</Label>
                                  <Input
                                    type="date"
                                    value={extendDate}
                                    onChange={(e) => setExtendDate(e.target.value)}
                                  />
                                </div>
                                <Button onClick={handleExtend} disabled={extendMutation.isPending} className="w-full">
                                  {extendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Perpanjang
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Data Abonemen?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Data abonemen parkir ini akan dihapus permanen dan tidak dapat dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(sub.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                          {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada abonemen parkir"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
