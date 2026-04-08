import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkPermits, useCreateWorkPermit, useUpdateWorkPermitStatus, useDeleteWorkPermit } from "@/hooks/useWorkPermits";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ClipboardCheck, Plus, Loader2, ArrowLeft, Building2, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { exportToExcel, workPermitExportColumns } from "@/lib/exportExcel";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { useFileUpload } from "@/hooks/useFileUpload";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function IzinKerja() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("izin-kerja");

  const { data: permits, isLoading } = useWorkPermits();
  const createMutation = useCreateWorkPermit();
  const updateStatusMutation = useUpdateWorkPermitStatus();
  const deleteMutation = useDeleteWorkPermit();
  const { uploadFile, uploading } = useFileUpload({ folder: "izin-kerja" });
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;

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

  const filteredData = useMemo(() => {
    if (!permits) return [];
    let filtered = filterByDate(permits, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.vendor_name?.toLowerCase().includes(search) ||
          p.work_description?.toLowerCase().includes(search) ||
          p.penghuni_name?.toLowerCase().includes(search) ||
          p.unit_number?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [permits, searchValue, dateFilter]);

  const paginatedData = usePagination(filteredData, itemsPerPage, currentPage);

  const handleExport = () => {
    if (!filteredData.length) return;
    const statusMap = { pending: "Pending", approved: "Disetujui", rejected: "Ditolak" };
    const exportData = filteredData.map((p) => ({
      ...p,
      penghuni_name: p.penghuni_name || p.penghuni?.full_name || "-",
      unit_number: p.unit_number || p.units?.unit_number || "-",
      status: statusMap[p.status] || p.status,
      created_at: format(new Date(p.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportToExcel({
      filename: `Izin_Kerja_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Izin Kerja",
      data: exportData,
      columns: workPermitExportColumns,
      
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState("");
  const [dateError, setDateError] = useState("");

  const [form, setForm] = useState({
    name: "",
    unit_number: "",
    vendor_name: "",
    phone: "",
    work_description: "",
    worker_count: "1",
    start_date: "",
    end_date: "",
    layout_file: null as File | null,
    payment_proof: null as File | null,
    payment_method: "",
  });

  const validateDates = (start: string, end: string) => {
    if (start && end) {
      const days = differenceInDays(new Date(end), new Date(start));
      if (days > 60) {
        setDateError("Lama pengerjaan maksimal 2 bulan (60 hari)");
        return false;
      }
      if (days < 0) {
        setDateError("Tanggal selesai harus setelah tanggal mulai");
        return false;
      }
    }
    setDateError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDates(form.start_date, form.end_date)) return;
    
    let documentUrl: string | undefined;
    if (form.layout_file) {
      const path = await uploadFile(form.layout_file);
      if (path) documentUrl = path;
    }
    
    await createMutation.mutateAsync({
      vendor_name: form.vendor_name,
      work_description: form.work_description,
      worker_count: parseInt(form.worker_count) || 1,
      start_date: form.start_date,
      end_date: form.end_date,
      penghuni_name: form.name,
      unit_number: form.unit_number,
      phone: form.phone,
      document_url: documentUrl,
    });
    setIsOpen(false);
    setForm({
      name: "",
      unit_number: "",
      vendor_name: "",
      phone: "",
      work_description: "",
      worker_count: "1",
      start_date: "",
      end_date: "",
      layout_file: null,
      payment_proof: null,
      payment_method: "",
    });
  };

  const handleUpdateStatus = async () => {
    if (selectedPermit) {
      await updateStatusMutation.mutateAsync({
        id: selectedPermit,
        status: newStatus,
        notes: notes || undefined,
      });
      setSelectedPermit(null);
      setNotes("");
    }
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
            <div className="p-3 bg-info/10 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengajuan Izin Kerja</h1>
              <p className="text-muted-foreground">Kelola izin kerja vendor dan teknisi</p>
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
                  Ajukan Izin Kerja
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pengajuan Izin Kerja Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nama penghuni"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lokasi Kerja <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.unit_number}
                    onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                    placeholder="Contoh: Tower A Lantai 5 Unit 20, Area Lobby"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Kantor / Penanggung Jawab <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.vendor_name}
                    onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                    placeholder="PT. Contoh Jaya / Nama Vendor"
                    required
                  />
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
                  <Label>Deskripsi Pekerjaan <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={form.work_description}
                    onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                    placeholder="Jelaskan pekerjaan yang akan dilakukan..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => {
                        setForm({ ...form, start_date: e.target.value });
                        validateDates(e.target.value, form.end_date);
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Selesai <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => {
                        setForm({ ...form, end_date: e.target.value });
                        validateDates(form.start_date, e.target.value);
                      }}
                      required
                    />
                  </div>
                </div>
                {dateError && <p className="text-sm text-destructive">{dateError}</p>}
                <p className="text-xs text-muted-foreground">* Lama pengerjaan maksimal 2 bulan</p>

                <div className="space-y-2">
                  <Label>Jumlah Pekerja <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.worker_count}
                    onChange={(e) => setForm({ ...form, worker_count: e.target.value })}
                    required
                  />
                </div>

                <PhotoUpload
                  label="Lampiran Layout Renovasi (Opsional)"
                  value={form.layout_file}
                  onChange={(file) => setForm({ ...form, layout_file: file })}
                  accept="image/*,.pdf"
                />

                <div className="space-y-2">
                  <Label>Metode Pembayaran (Opsional)</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kasir">Di Kasir</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <PhotoUpload
                  label="Upload Bukti Transfer (Opsional)"
                  value={form.payment_proof}
                  onChange={(file) => setForm({ ...form, payment_proof: file })}
                />

                <div className="p-3 bg-info/10 rounded-lg space-y-2">
                  <p className="font-medium text-info text-sm">Pembayaran ke rekening:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-info" />
                    <span className="font-medium">BCA</span>
                    <span className="font-mono">008 63 99789</span>
                    <span className="text-muted-foreground">PPPSRS THE JARRDIN</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-info" />
                    <span className="font-medium">BRI</span>
                    <span className="font-mono">777 80808 11</span>
                    <span className="text-muted-foreground">PPPSRS THE JARRDIN</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading || !!dateError}>
                  {(createMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Ajukan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Pengajuan</CardTitle>
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
              onSearchChange={handleSearchChange}
              dateFilter={dateFilter}
              onDateFilterChange={handleDateFilterChange}
              searchPlaceholder="Cari vendor, pekerjaan, unit..."
            />
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Pekerjaan</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Pekerja</TableHead>
                      <TableHead>Dokumen</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.unit_number || p.units?.unit_number || "-"}</TableCell>
                        <TableCell>{p.vendor_name}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="line-clamp-2">{p.work_description}</p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(p.start_date), "dd/MM")} - {format(new Date(p.end_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{p.worker_count} orang</TableCell>
                        <TableCell>
                          <PhotoCell
                            photos={[
                              { url: p.document_url, label: "Dokumen" },
                            ]}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[p.status]}>
                            {p.status === "pending" ? "Pending" : p.status === "approved" ? "Disetujui" : "Ditolak"}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2">
                          <Dialog open={selectedPermit === p.id} onOpenChange={(open) => !open && setSelectedPermit(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPermit(p.id);
                                  setNewStatus(p.status);
                                  setNotes(p.notes || "");
                                }}
                              >
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Izin Kerja</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Status</Label>
                                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as "pending" | "approved" | "rejected")}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="approved">Disetujui</SelectItem>
                                      <SelectItem value="rejected">Ditolak</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Catatan</Label>
                                  <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tambahkan catatan..."
                                    rows={3}
                                  />
                                </div>
                                <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending} className="w-full">
                                  {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Simpan
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
                                  <AlertDialogTitle>Hapus Data Izin Kerja?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Data izin kerja ini akan dihapus permanen dan tidak dapat dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(p.id)}
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
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada pengajuan izin kerja"}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
