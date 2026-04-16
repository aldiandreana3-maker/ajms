import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PhotoCell } from "@/components/shared/PhotoActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Trash2, Printer, ChevronDown, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { usePackagesPaginated, useCreatePackage, useUpdatePackageStatus, useDeletePackage, useCleanupOldPackages, DateFilterType } from "@/hooks/usePackages";
import { useAuth } from "@/contexts/AuthContext";
import { DataFilterBar } from "@/components/shared/DataFilterBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { CameraCapture } from "@/components/shared/CameraCapture";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Combobox } from "@/components/ui/combobox";

const COURIER_OPTIONS = [
  "SPX Express",
  "GO-SEND",
  "J&T Express",
  "JNE",
  "SiCepat",
  "Anteraja",
  "Ninja Express",
  "Pos Indonesia",
  "TIKI",
  "Shopee Express",
  "Lazada Express",
  "Grab Express",
  "Lainnya",
];

const ITEM_TYPE_OPTIONS = [
  "Elektronik",
  "Fashion",
  "Makanan",
  "Dokumen",
  "Peralatan Rumah",
  "Kosmetik",
  "Obat-obatan",
  "Lain-lain",
];

export default function PelayananPaket() {
  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

  // Use server-side paginated hook
  const { data: packagesResult, isLoading } = usePackagesPaginated(
    currentPage,
    itemsPerPage,
    searchValue,
    dateFilter
  );

  const packages = packagesResult?.data || [];
  const totalCount = packagesResult?.totalCount || 0;

  const createPackage = useCreatePackage();
  const updateStatus = useUpdatePackageStatus();
  const deletePackage = useDeletePackage();
  const cleanupOldPackages = useCleanupOldPackages();
  const { isSuperAdmin, role } = useAuth();
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // File upload
  const { uploadFile, uploading } = useFileUpload({
    bucket: "kepenghunian-files",
    folder: "packages",
    compressImages: true,
  });

  // Form states
  const [formData, setFormData] = useState({
    owner_name: "",
    unit_number: "",
    item_type: "",
    courier: "",
    notes: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Note: Filtering and pagination are now handled server-side in usePackagesPaginated

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let photoUrl: string | undefined;
    
    // Upload photo if exists - save file path for signed URL access
    if (photoFile) {
      const filePath = await uploadFile(photoFile);
      if (filePath) {
        photoUrl = filePath;
      }
    }
    
    await createPackage.mutateAsync({
      owner_name: formData.owner_name,
      unit_number: formData.unit_number,
      item_name: formData.item_type, // Use item_type as item_name since we removed item_name field
      item_type: formData.item_type,
      courier: formData.courier,
      notes: formData.notes,
      photo_url: photoUrl,
    });
    setFormData({
      owner_name: "",
      unit_number: "",
      item_type: "",
      courier: "",
      notes: "",
    });
    setPhotoFile(null);
    setIsAddDialogOpen(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateStatus.mutateAsync({ id, status });
  };

  const handleDelete = async () => {
    if (selectedPackageId) {
      await deletePackage.mutateAsync(selectedPackageId);
      setDeleteDialogOpen(false);
      setSelectedPackageId(null);
    }
  };


  const handlePrintReceipt = (pkg: any) => {
    setSelectedPackage(pkg);
    setReceiptDialogOpen(true);
  };

  const printReceipt = () => {
    if (!selectedPackage) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Struk Pengambilan Paket</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; }
            .subtitle { font-size: 12px; color: #666; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .label { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; border-top: 2px dashed #000; padding-top: 10px; font-size: 12px; }
            .status { padding: 4px 8px; background: ${selectedPackage.status === 'diambil' ? '#22c55e' : '#ef4444'}; color: white; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">STRUK PENGAMBILAN PAKET</div>
            <div class="subtitle">AJMS Property Management</div>
          </div>
          <div class="row"><span class="label">No:</span><span>${selectedPackage.id.slice(0, 8).toUpperCase()}</span></div>
          <div class="row"><span class="label">Tanggal Masuk:</span><span>${format(new Date(selectedPackage.created_at), "dd MMM yyyy HH:mm", { locale: id })}</span></div>
          <div class="row"><span class="label">Nama Pemilik:</span><span>${selectedPackage.owner_name}</span></div>
          <div class="row"><span class="label">Unit:</span><span>${selectedPackage.unit_number || "-"}</span></div>
          <div class="row"><span class="label">Jenis Barang:</span><span>${selectedPackage.item_type}</span></div>
          <div class="row"><span class="label">Kurir:</span><span>${selectedPackage.courier}</span></div>
          <div class="row"><span class="label">Dicatat Oleh:</span><span>${selectedPackage.recorded_by_name || "-"}</span></div>
          <div class="row"><span class="label">Status:</span><span class="status">${selectedPackage.status === 'diambil' ? 'Sudah Diambil' : 'Belum Diambil'}</span></div>
          ${selectedPackage.status === 'diambil' && selectedPackage.picked_up_by_name ? `<div class="row"><span class="label">Diproses Oleh:</span><span>${selectedPackage.picked_up_by_name}</span></div>` : ''}
          ${selectedPackage.picked_up_at ? `<div class="row"><span class="label">Waktu Pengambilan:</span><span>${format(new Date(selectedPackage.picked_up_at), "dd MMM yyyy HH:mm", { locale: id })}</span></div>` : ''}
          <div class="footer">
            <p>Terima kasih</p>
            <p>Dicetak: ${format(new Date(), "dd MMM yyyy HH:mm", { locale: id })}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "diambil") {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600">Sudah Diambil</Badge>;
    }
    return <Badge variant="destructive">Belum Diambil</Badge>;
  };

  // Restrict access to admin, super_admin, and staff_tro only
  const canAccess = isSuperAdmin || ["admin", "staff_tro"].includes(role || "");
  const canManage = canAccess;
  const canDelete = isSuperAdmin || role === "admin";
  const canChangeStatusAfterPickup = isSuperAdmin || role === "admin"; // Only admin/super_admin can change status after pickup

  // Show access denied message for users without permission
  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Anda tidak memiliki izin untuk mengakses halaman ini. 
            Hanya Admin, Super Admin, dan Staff TRO yang dapat mengakses fitur Pelayanan Paket.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pelayanan Paket</h1>
              <p className="text-muted-foreground">Kelola paket masuk untuk penghuni</p>
            </div>
          </div>
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCleanupDialogOpen(true)}
              disabled={cleanupOldPackages.isPending}
              className="text-destructive border-destructive/50 hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {cleanupOldPackages.isPending ? "Membersihkan..." : "Hapus Paket Lama"}
            </Button>
          )}
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Paket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Tambah Paket Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Pemilik *</Label>
                      <Input
                        value={formData.owner_name}
                        onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nomor Unit *</Label>
                      <Input
                        value={formData.unit_number}
                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                        placeholder="Contoh: A.12.05"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Barang *</Label>
                    <Combobox
                      options={ITEM_TYPE_OPTIONS}
                      value={formData.item_type}
                      onChange={(value) => setFormData({ ...formData, item_type: value })}
                      placeholder="Pilih atau ketik jenis barang"
                      searchPlaceholder="Cari atau ketik jenis barang..."
                      emptyText="Tekan enter untuk menggunakan input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kurir *</Label>
                    <Combobox
                      options={COURIER_OPTIONS}
                      value={formData.courier}
                      onChange={(value) => setFormData({ ...formData, courier: value })}
                      placeholder="Pilih atau ketik kurir"
                      searchPlaceholder="Cari atau ketik kurir..."
                      emptyText="Tekan enter untuk menggunakan input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto Paket</Label>
                    <CameraCapture
                      label="Ambil foto paket dengan kamera"
                      value={photoFile}
                      onChange={setPhotoFile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Keterangan</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Keterangan tambahan..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={createPackage.isPending || !formData.item_type || !formData.courier}>
                      {createPackage.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataFilterBar
              searchValue={searchValue}
              onSearchChange={(value) => {
                setSearchValue(value);
                setCurrentPage(1);
              }}
              searchPlaceholder="Cari nama pemilik, barang, unit, kurir..."
              dateFilter={dateFilter}
              onDateFilterChange={(value) => {
                setDateFilter(value);
                setCurrentPage(1);
              }}
            />

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Tanggal Masuk</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Jenis Barang</TableHead>
                    <TableHead>Pemilik</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Kurir</TableHead>
                    <TableHead>Dicatat Oleh</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Tidak ada data paket
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg, index) => (
                      <TableRow key={pkg.id}>
                        <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(pkg.created_at), "yyyy-MM-dd HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <PhotoCell
                            photos={[{ url: pkg.photo_url, label: "Foto Paket" }]}
                            showThumbnail
                          />
                        </TableCell>
                        <TableCell>{pkg.item_type}</TableCell>
                        <TableCell>{pkg.owner_name}</TableCell>
                        <TableCell>{pkg.unit_number || "-"}</TableCell>
                        <TableCell>{pkg.courier}</TableCell>
                        <TableCell>{pkg.recorded_by_name || "-"}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {canManage && (
                              <>
                                {/* If package is picked up and user is staff_tro, only show print option */}
                                {pkg.status === "diambil" && !canChangeStatusAfterPickup ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrintReceipt(pkg)}
                                  >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Cetak Struk
                                  </Button>
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Pilih Aksi <ChevronDown className="w-4 h-4 ml-1" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(pkg.id, "diambil")}
                                        disabled={pkg.status === "diambil"}
                                      >
                                        Sudah Diambil
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleStatusChange(pkg.id, "belum_diambil")}
                                        disabled={pkg.status === "belum_diambil"}
                                      >
                                        Belum Diambil
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handlePrintReceipt(pkg)}>
                                        <Printer className="w-4 h-4 mr-2" />
                                        Cetak Struk
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedPackageId(pkg.id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
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

            <TablePagination
              currentPage={currentPage}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          </CardContent>
        </Card>


        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Struk Pengambilan Paket</DialogTitle>
            </DialogHeader>
            {selectedPackage && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">No:</span>
                    <span>{selectedPackage.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tanggal Masuk:</span>
                    <span>{format(new Date(selectedPackage.created_at), "dd MMM yyyy HH:mm", { locale: id })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Nama Pemilik:</span>
                    <span>{selectedPackage.owner_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Unit:</span>
                    <span>{selectedPackage.unit_number || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Jenis Barang:</span>
                    <span>{selectedPackage.item_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Kurir:</span>
                    <span>{selectedPackage.courier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Dicatat Oleh:</span>
                    <span>{selectedPackage.recorded_by_name || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    {getStatusBadge(selectedPackage.status)}
                  </div>
                  {selectedPackage.status === "diambil" && selectedPackage.picked_up_by_name && (
                    <div className="flex justify-between">
                      <span className="font-medium">Diproses Oleh:</span>
                      <span>{selectedPackage.picked_up_by_name}</span>
                    </div>
                  )}
                  {selectedPackage.picked_up_at && (
                    <div className="flex justify-between">
                      <span className="font-medium">Waktu Pengambilan:</span>
                      <span>{format(new Date(selectedPackage.picked_up_at), "dd MMM yyyy HH:mm", { locale: id })}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                    Tutup
                  </Button>
                  <Button onClick={printReceipt}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus data paket ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cleanup Old Packages Dialog */}
        <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Paket Lama</AlertDialogTitle>
              <AlertDialogDescription>
                Semua paket dengan status &quot;Sudah Diambil&quot; yang lebih dari 4 bulan akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  cleanupOldPackages.mutate();
                  setCleanupDialogOpen(false);
                }}
                className="bg-destructive text-destructive-foreground"
              >
                Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
