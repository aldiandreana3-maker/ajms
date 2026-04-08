import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForeignGuests, useCreateForeignGuest, useDeleteForeignGuest } from "@/hooks/useForeignGuests";
import { useFileUpload } from "@/hooks/useFileUpload";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Globe, Plus, Loader2, ArrowLeft, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, foreignGuestExportColumns } from "@/lib/exportExcel";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { PhotoUpload } from "@/components/shared/PhotoUpload";

export default function TamuAsing() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("tamu-asing");
  const { data: guests, isLoading } = useForeignGuests();
  const createMutation = useCreateForeignGuest();
  const deleteMutation = useDeleteForeignGuest();
  const { uploadFile, uploading } = useFileUpload({ folder: "foreign-guests" });
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
    if (!guests) return [];
    let filtered = filterByDate(guests, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (g) =>
          g.full_name?.toLowerCase().includes(search) ||
          g.nationality?.toLowerCase().includes(search) ||
          g.passport_number?.toLowerCase().includes(search) ||
          g.unit_number?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [guests, searchValue, dateFilter]);

  const paginatedData = usePagination(filteredData, itemsPerPage, currentPage);

  const handleExport = () => {
    if (!filteredData.length) return;
    const genderMap = { pria: "Pria", wanita: "Wanita" };
    const exportData = filteredData.map((g) => ({
      ...g,
      unit_number: g.unit_number || g.units?.unit_number || "-",
      gender: genderMap[g.gender] || g.gender,
      created_at: format(new Date(g.created_at), "dd/MM/yyyy HH:mm:ss"),
    }));
    exportToExcel({
      filename: `Tamu_Asing_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Tamu Asing",
      data: exportData,
      columns: foreignGuestExportColumns,
      
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    penghuni_name: "",
    full_name: "",
    unit_number: "",
    birth_place: "",
    birth_date: "",
    gender: "" as "pria" | "wanita" | "",
    nationality: "",
    passport_number: "",
    passport_expiry: "",
    passport_photo: null as File | null,
    check_in_date: "",
    check_out_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gender) return;

    let passportPhotoUrl: string | undefined;
    if (form.passport_photo) {
      const path = await uploadFile(form.passport_photo);
      if (path) passportPhotoUrl = path;
    }
    
    await createMutation.mutateAsync({
      full_name: form.full_name,
      birth_place: form.birth_place,
      birth_date: form.birth_date,
      gender: form.gender,
      nationality: form.nationality,
      passport_number: form.passport_number,
      passport_expiry: form.passport_expiry,
      passport_photo_url: passportPhotoUrl,
      check_in_date: form.check_in_date,
      check_out_date: form.check_out_date,
      unit_number: form.unit_number,
      penghuni_name: form.penghuni_name,
    });
    setIsOpen(false);
    setForm({
      penghuni_name: "",
      full_name: "",
      unit_number: "",
      birth_place: "",
      birth_date: "",
      gender: "",
      nationality: "",
      passport_number: "",
      passport_expiry: "",
      passport_photo: null,
      check_in_date: "",
      check_out_date: "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, passport_photo: file });
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
              <Globe className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pelaporan Tamu Asing (WNA)</h1>
              <p className="text-muted-foreground">Catat data tamu warga negara asing</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <LoginPromptButton />
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <PermissionButton
                  hasPermission={permission?.canCreate ?? true}
                  tooltip={permission?.tooltip}
                  category="blue"
                  className="ring-2 ring-user-blue"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lapor Tamu Asing
                </PermissionButton>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Pelaporan Tamu Asing (WNA)</DialogTitle>
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
                    <Label>Nama Penghuni (Pemilik/Penyewa) <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.penghuni_name}
                      onChange={(e) => setForm({ ...form, penghuni_name: e.target.value })}
                      placeholder="Nama pemilik/penyewa unit"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nama Lengkap Orang Asing <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Masukkan nama lengkap WNA"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tempat Lahir <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.birth_place}
                        onChange={(e) => setForm({ ...form, birth_place: e.target.value })}
                        placeholder="Kota/Negara"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.birth_date}
                        onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as "pria" | "wanita" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pria">Pria</SelectItem>
                        <SelectItem value="wanita">Wanita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Kewarganegaraan Orang Asing <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      placeholder="Contoh: Amerika Serikat"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nomor Paspor <span className="text-destructive">*</span></Label>
                      <Input
                        value={form.passport_number}
                        onChange={(e) => setForm({ ...form, passport_number: e.target.value })}
                        placeholder="Nomor paspor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Masa Berlaku Paspor <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.passport_expiry}
                        onChange={(e) => setForm({ ...form, passport_expiry: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <PhotoUpload
                    label="Foto Halaman Biodata Paspor"
                    value={form.passport_photo}
                    onChange={(file) => setForm({ ...form, passport_photo: file })}
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Check In <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.check_in_date}
                        onChange={(e) => setForm({ ...form, check_in_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Check Out <span className="text-destructive">*</span></Label>
                      <Input
                        type="date"
                        value={form.check_out_date}
                        onChange={(e) => setForm({ ...form, check_out_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading}>
                    {(createMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Simpan Laporan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Tamu Asing</CardTitle>
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
              searchPlaceholder="Cari nama, paspor, negara..."
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
                      <TableHead>Nama WNA</TableHead>
                      <TableHead>TTL</TableHead>
                      <TableHead>JK</TableHead>
                      <TableHead>Kewarganegaraan</TableHead>
                      <TableHead>No. Paspor</TableHead>
                      <TableHead>Masa Berlaku</TableHead>
                      <TableHead>Foto Paspor</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      {canDelete && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(g.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>{g.unit_number || g.units?.unit_number || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{g.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {g.birth_place}, {format(new Date(g.birth_date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="capitalize">{g.gender === "pria" ? "L" : "P"}</TableCell>
                        <TableCell>{g.nationality}</TableCell>
                        <TableCell className="font-mono text-sm">{g.passport_number}</TableCell>
                        <TableCell>{format(new Date(g.passport_expiry), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <PhotoCell
                            photos={[{ url: g.passport_photo_url, label: "Paspor" }]}
                          />
                        </TableCell>
                        <TableCell>{format(new Date(g.check_in_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(new Date(g.check_out_date), "dd/MM/yyyy")}</TableCell>
                        {canDelete && (
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Data Tamu Asing?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Data tamu asing ini akan dihapus permanen dan tidak dapat dikembalikan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(g.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
                        <TableCell colSpan={canDelete ? 12 : 11} className="text-center text-muted-foreground py-8">
                          {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada data tamu asing"}
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
      </div>
    </MainLayout>
  );
}
