import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Pencil, Trash2, Users, Download, Upload, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { usePenghuniPaginated, usePenghuni } from "@/hooks/usePenghuni";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { exportToExcel } from "@/lib/exportExcel";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

const penghuniExportColumns = [
  { header: "No. Unit", key: "unit_number", width: 12 },
  { header: "Tipe (m²)", key: "area_sqm", width: 12 },
  { header: "Nama Lengkap", key: "full_name", width: 25 },
  { header: "No. Telepon", key: "phone", width: 15 },
  { header: "Email", key: "email", width: 25 },
  { header: "Balik Nama", key: "ktp_number", width: 20 },
];

export default function DataPenghuni() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const canManage = isSuperAdmin || isAdmin;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPenghuni, setEditingPenghuni] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Debounce search
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // Server-side paginated query
  const { data: paginatedResult, isLoading } = usePenghuniPaginated(currentPage, pageSize, debouncedSearch);
  const penghuniList = paginatedResult?.data || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Legacy hook for mutations only
  const { createPenghuni, updatePenghuni, deletePenghuni } = usePenghuni();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    ktp_number: "",
    unit_number: "",
    area_sqm: "",
    is_owner: false,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      ktp_number: "",
      unit_number: "",
      area_sqm: "",
      is_owner: false,
      is_active: true,
    });
    setEditingPenghuni(null);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "No. Unit": "",
        "Tipe (m²)": "",
        "Nama Lengkap": "",
        "No. Telepon": "",
        "Email": "",
        "Balik Nama": "",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    ws["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Data_Penghuni.xlsx");
    toast.success("Template berhasil diunduh");
  };

  const handleExport = async () => {
    // Fetch ALL data for export (bypass pagination)
    let allData: any[] = [];
    let page = 0;
    const batchSize = 1000;
    while (true) {
      let query = supabase
        .from("penghuni")
        .select(`*, units:unit_id(unit_number, area_sqm, type)`)
        .order("full_name", { ascending: true })
        .range(page * batchSize, (page + 1) * batchSize - 1);
      
      if (debouncedSearch.trim()) {
        const searchTerm = `%${debouncedSearch.trim()}%`;
        query = query.or(
          `full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},ktp_number.ilike.${searchTerm},unit_number.ilike.${searchTerm}`
        );
      }

      const { data, error } = await query;
      if (error) { toast.error("Gagal mengambil data export"); return; }
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < batchSize) break;
      page++;
    }

    if (allData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const exportData = allData.map((p: any) => ({
      unit_number: p.unit_number || p.units?.unit_number || "-",
      area_sqm: p.units?.area_sqm ? `${p.units.area_sqm}` : "-",
      full_name: p.full_name,
      phone: p.phone || "-",
      email: p.email || "-",
      ktp_number: p.ktp_number || "-",
    }));
    exportToExcel({
      filename: "Data_Penghuni",
      sheetName: "Data Penghuni",
      data: exportData,
      columns: penghuniExportColumns,
    });
    toast.success(`${allData.length} data berhasil diekspor`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData as any[]) {
          try {
            await createPenghuni.mutateAsync({
              full_name: row["Nama Lengkap"] || row["full_name"] || "",
              phone: String(row["No. Telepon"] || row["phone"] || ""),
              email: row["Email"] || row["email"] || "",
              ktp_number: String(row["Balik Nama"] || row["No. KTP"] || row["ktp_number"] || ""),
              unit_number: row["No. Unit"] || row["unit_number"] || "",
              area_sqm: String(row["Tipe (m²)"] || row["area_sqm"] || ""),
              is_owner: false,
              is_active: true,
            });
            successCount++;
          } catch {
            errorCount++;
          }
        }

        toast.success(`Import selesai: ${successCount} berhasil, ${errorCount} gagal`);
      } catch {
        toast.error("Gagal membaca file Excel");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleOpenDialog = (penghuniData?: any) => {
    if (penghuniData) {
      setEditingPenghuni(penghuniData);
      setFormData({
        full_name: penghuniData.full_name || "",
        phone: penghuniData.phone || "",
        email: penghuniData.email || "",
        ktp_number: penghuniData.ktp_number || "",
        unit_number: penghuniData.unit_number || penghuniData.units?.unit_number || "",
        area_sqm: penghuniData.units?.area_sqm?.toString() || "",
        is_owner: penghuniData.is_owner || false,
        is_active: penghuniData.is_active ?? true,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.unit_number) {
      toast.error("Nama dan Unit wajib diisi");
      return;
    }

    try {
      if (editingPenghuni) {
        await updatePenghuni.mutateAsync({
          id: editingPenghuni.id,
          ...formData,
        });
        toast.success("Data penghuni berhasil diperbarui");
      } else {
        await createPenghuni.mutateAsync(formData);
        toast.success("Data penghuni berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deletePenghuni.mutateAsync(deleteId);
      toast.success("Data penghuni berhasil dihapus");
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus data");
    }
  };

  const filteredPenghuni = penghuniList;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Data Penghuni</h1>
            <p className="text-muted-foreground">
              Kelola data penghuni apartemen
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Penghuni
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPenghuni ? "Edit Penghuni" : "Tambah Penghuni Baru"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_number">Unit *</Label>
                      <Input
                        id="unit_number"
                        value={formData.unit_number}
                        onChange={(e) =>
                          setFormData({ ...formData, unit_number: e.target.value })
                        }
                        placeholder="Contoh: A0520, B1205"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="area_sqm">Tipe Unit (m²)</Label>
                      <Input
                        id="area_sqm"
                        type="number"
                        value={formData.area_sqm}
                        onChange={(e) =>
                          setFormData({ ...formData, area_sqm: e.target.value })
                        }
                        placeholder="Contoh: 18.5, 24, 33, 40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">No. Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Masukkan no. telepon"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Masukkan email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ktp_number">Balik Nama</Label>
                    <Input
                      id="ktp_number"
                      value={formData.ktp_number}
                      onChange={(e) =>
                        setFormData({ ...formData, ktp_number: e.target.value })
                      }
                      placeholder="Masukkan balik nama"
                    />
                  </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={createPenghuni.isPending || updatePenghuni.isPending}>
                        {editingPenghuni ? "Simpan Perubahan" : "Tambah"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, telepon, email, atau KTP..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Daftar Penghuni ({totalCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : filteredPenghuni && filteredPenghuni.length > 0 ? (
              <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Unit</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>No. Telepon</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balik Nama</TableHead>
                      <TableHead>Tipe (m²)</TableHead>
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPenghuni.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.unit_number || p.units?.unit_number || "-"}
                        </TableCell>
                        <TableCell>{p.full_name}</TableCell>
                        <TableCell>{p.phone || "-"}</TableCell>
                        <TableCell>{p.email || "-"}</TableCell>
                        <TableCell>{p.ktp_number || "-"}</TableCell>
                        <TableCell>
                          {p.units?.area_sqm ? `${p.units.area_sqm} m²` : "-"}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDialog(p)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Tampilkan</span>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">
                    dari {totalCount} data
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Hal {currentPage} / {totalPages || 1}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "Tidak ada penghuni yang sesuai dengan pencarian"
                  : "Belum ada data penghuni"}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Penghuni?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini tidak dapat dibatalkan. Data penghuni akan dihapus
                secara permanen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
