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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoodsMovement, useCreateGoodsMovement, useDeleteGoodsMovement } from "@/hooks/useGoodsMovement";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PackageOpen, Plus, Loader2, ArrowDownLeft, ArrowUpRight, ArrowLeft, Download, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, goodsMovementExportColumns } from "@/lib/exportExcel";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ImportExcelDialog, ImportColumn } from "@/components/shared/ImportExcelDialog";
import { supabase } from "@/integrations/supabase/client";
import { parseImportTimestamp } from "@/lib/parseImportTimestamp";

const goodsImportColumns: ImportColumn[] = [
  { header: "Timestamp", key: "created_at", example: "2024-05-15 10:30:00" },
  { header: "Unit", key: "unit_number", required: true, example: "TA0520" },
  { header: "Nama Penghuni", key: "penghuni_name", required: true, example: "Budi Santoso" },
  { header: "Telepon", key: "phone", example: "08123456789" },
  { header: "Tipe (in/out)", key: "movement_type", required: true, example: "in" },
  { header: "Deskripsi Barang", key: "item_description", required: true, example: "Sofa baru" },
  { header: "Jumlah", key: "quantity", example: "1" },
  { header: "Nama Pembawa", key: "carrier_name", example: "Kurir JNE" },
  { header: "ID Pembawa", key: "carrier_id", example: "KTP-1234567890" },
];

export default function KeluarMasukBarang() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("keluar-masuk-barang");

  const { data: movements, isLoading } = useGoodsMovement();
  const createMutation = useCreateGoodsMovement();
  const deleteMutation = useDeleteGoodsMovement();
  const { uploadFile, uploading } = useFileUpload({ folder: "keluar-masuk-barang" });
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
    if (!movements) return [];
    let filtered = filterByDate(movements, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.item_description?.toLowerCase().includes(search) ||
          m.carrier_name?.toLowerCase().includes(search) ||
          m.penghuni_name?.toLowerCase().includes(search) ||
          m.unit_number?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [movements, searchValue, dateFilter]);

  const paginatedData = usePagination(filteredData, itemsPerPage, currentPage);

  const handleExport = () => {
    if (!filteredData.length) return;
    const exportData = filteredData.map((m) => ({
      ...m,
      penghuni_name: m.penghuni_name || m.penghuni?.full_name || "-",
      unit_number: m.unit_number || m.units?.unit_number || "-",
      movement_type: m.movement_type === "in" ? "Masuk" : "Keluar",
      created_at: format(new Date(m.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportToExcel({
      filename: `Keluar_Masuk_Barang_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Keluar Masuk Barang",
      data: exportData,
      columns: goodsMovementExportColumns,
      
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    penghuni_name: "",
    unit_number: "",
    carrier_name: "",
    ktp_photo: null as File | null,
    item_photo: null as File | null,
    phone: "",
    rental_status: "",
    movement_type: "in" as "in" | "out",
    item_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload files to storage
    let ktpPhotoUrl: string | null = null;
    let itemPhotoUrl: string | null = null;
    
    if (form.ktp_photo) {
      ktpPhotoUrl = await uploadFile(form.ktp_photo);
    }
    if (form.item_photo) {
      itemPhotoUrl = await uploadFile(form.item_photo);
    }
    
    await createMutation.mutateAsync({
      movement_type: form.movement_type,
      item_description: form.item_description,
      carrier_name: form.carrier_name || undefined,
      penghuni_name: form.penghuni_name,
      unit_number: form.unit_number,
      phone: form.phone,
      rental_status: form.rental_status,
      ktp_photo_url: ktpPhotoUrl,
      photo_url: itemPhotoUrl,
    });
    setIsOpen(false);
    setForm({
      penghuni_name: "",
      unit_number: "",
      carrier_name: "",
      ktp_photo: null,
      item_photo: null,
      phone: "",
      rental_status: "",
      movement_type: "in",
      item_description: "",
    });
  };


  const paginatedAll = usePagination(filteredData, itemsPerPage, currentPage);
  const inMovements = filteredData.filter((m) => m.movement_type === "in");
  const outMovements = filteredData.filter((m) => m.movement_type === "out");
  const paginatedIn = usePagination(inMovements, itemsPerPage, currentPage);
  const paginatedOut = usePagination(outMovements, itemsPerPage, currentPage);

  const MovementTable = ({ data }: { data: typeof movements }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Penghuni</TableHead>
          <TableHead>Deskripsi Barang</TableHead>
          <TableHead>Penanggung Jawab</TableHead>
          <TableHead>Foto</TableHead>
          {canDelete && <TableHead>Aksi</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
            <TableCell>{m.unit_number || m.units?.unit_number || "-"}</TableCell>
            <TableCell>{m.penghuni_name || m.penghuni?.full_name || "-"}</TableCell>
            <TableCell>{m.item_description}</TableCell>
            <TableCell>{m.carrier_name || "-"}</TableCell>
            <TableCell>
              <PhotoCell
                photos={[
                  { url: m.ktp_photo_url, label: "KTP" },
                  { url: m.photo_url, label: "Barang" },
                ]}
              />
            </TableCell>
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
                      <AlertDialogTitle>Hapus Data Barang?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Data keluar/masuk barang ini akan dihapus permanen dan tidak dapat dikembalikan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(m.id)}
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
        {data?.length === 0 && (
          <TableRow>
            <TableCell colSpan={canDelete ? 7 : 6} className="text-center text-muted-foreground py-8">
              {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada data"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

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
            <div className="p-3 bg-accent/10 rounded-xl">
              <PackageOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Keluar & Masuk Barang</h1>
              <p className="text-muted-foreground">Catat pergerakan barang penghuni</p>
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
                  Catat Barang
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Catat Keluar/Masuk Barang</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label>Alamat Tower & Unit <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.unit_number}
                    onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
                    placeholder="Contoh: A0520, B1205"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nama Penanggung Jawab <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.carrier_name}
                    onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
                    placeholder="Nama penanggung jawab/pembawa"
                    required
                  />
                </div>

                <PhotoUpload
                  label="Upload Foto KTP"
                  value={form.ktp_photo}
                  onChange={(file) => setForm({ ...form, ktp_photo: file })}
                  required
                />

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
                  <Label>Status Sewa <span className="text-destructive">*</span></Label>
                  <Select value={form.rental_status} onValueChange={(v) => setForm({ ...form, rental_status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemilik">Pemilik</SelectItem>
                      <SelectItem value="penyewa">Penyewa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Ijin <span className="text-destructive">*</span></Label>
                  <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v as "in" | "out" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="out">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-warning" />
                          Ijin Keluar Barang
                        </div>
                      </SelectItem>
                      <SelectItem value="in">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-success" />
                          Ijin Masuk Barang
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Jenis Barang <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={form.item_description}
                    onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                    placeholder="Contoh: 1 unit kulkas Samsung, 2 kardus pakaian"
                    rows={3}
                    required
                  />
                </div>

                <PhotoUpload
                  label="Foto Barang (Opsional)"
                  value={form.item_photo}
                  onChange={(file) => setForm({ ...form, item_photo: file })}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading}>
                  {(createMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan & Generate QR
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Riwayat Keluar Masuk Barang</CardTitle>
            <div className="flex gap-2">
              {canExport && (
                <ImportExcelDialog
                  title="Keluar Masuk Barang"
                  templateFilename="Keluar_Masuk_Barang"
                  columns={goodsImportColumns}
                  onImport={async (rows) => {
                    let success = 0, failed = 0;
                    const errors: string[] = [];
                    for (const [i, r] of rows.entries()) {
                      try {
                        const mt = (r.movement_type || "").toLowerCase();
                        const created = await createMutation.mutateAsync({
                          movement_type: mt === "out" || mt === "keluar" ? "out" : "in",
                          item_description: r.item_description,
                          quantity: parseInt(r.quantity) || 1,
                          carrier_name: r.carrier_name,
                          carrier_id: r.carrier_id,
                          penghuni_name: r.penghuni_name,
                          unit_number: r.unit_number,
                          phone: r.phone,
                        });
                        const ts = parseImportTimestamp(r.created_at);
                        if (ts && created?.id) {
                          await supabase.from("goods_movement").update({ created_at: ts }).eq("id", created.id);
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
              searchPlaceholder="Cari barang, nama, unit..."
            />
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Tabs defaultValue="all" onValueChange={() => setCurrentPage(1)}>
                  <TabsList>
                    <TabsTrigger value="all">Semua ({filteredData.length})</TabsTrigger>
                    <TabsTrigger value="in" className="text-success">
                      <ArrowDownLeft className="w-4 h-4 mr-1" />
                      Masuk ({inMovements.length})
                    </TabsTrigger>
                    <TabsTrigger value="out" className="text-warning">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      Keluar ({outMovements.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4">
                    <MovementTable data={paginatedAll} />
                    <TablePagination
                      currentPage={currentPage}
                      totalItems={filteredData.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </TabsContent>
                  <TabsContent value="in" className="mt-4">
                    <MovementTable data={paginatedIn} />
                    <TablePagination
                      currentPage={currentPage}
                      totalItems={inMovements.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </TabsContent>
                  <TabsContent value="out" className="mt-4">
                    <MovementTable data={paginatedOut} />
                    <TablePagination
                      currentPage={currentPage}
                      totalItems={outMovements.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onItemsPerPageChange={setItemsPerPage}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
