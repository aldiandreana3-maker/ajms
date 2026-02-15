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
import { Plus, Search, Pencil, Trash2, Users, Download, Upload } from "lucide-react";
import { usePenghuni } from "@/hooks/usePenghuni";
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

const penghuniExportColumns = [
  { header: "No. Unit", key: "unit_number", width: 12 },
  { header: "Tipe (m²)", key: "area_sqm", width: 12 },
  { header: "Nama Lengkap", key: "full_name", width: 25 },
  { header: "No. Telepon", key: "phone", width: 15 },
  { header: "Email", key: "email", width: 25 },
  { header: "No. KTP", key: "ktp_number", width: 20 },
  { header: "Status", key: "status", width: 12 },
];

export default function DataPenghuni() {
  const { penghuni, isLoading, createPenghuni, updatePenghuni, deletePenghuni } = usePenghuni();
  const { isSuperAdmin, isAdmin } = useAuth();
  const canManage = isSuperAdmin || isAdmin;

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPenghuni, setEditingPenghuni] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleExport = () => {
    if (!penghuni || penghuni.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }
    const exportData = penghuni.map((p) => ({
      unit_number: p.unit_number || p.units?.unit_number || "-",
      area_sqm: p.units?.area_sqm ? `${p.units.area_sqm}` : "-",
      full_name: p.full_name,
      phone: p.phone || "-",
      email: p.email || "-",
      ktp_number: p.ktp_number || "-",
      status: p.is_owner ? "Pemilik" : "Penyewa",
    }));
    exportToExcel({
      filename: "Data_Penghuni",
      sheetName: "Data Penghuni",
      data: exportData,
      columns: penghuniExportColumns,
    });
    toast.success("Data berhasil diekspor");
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
              phone: row["No. Telepon"] || row["phone"] || "",
              email: row["Email"] || row["email"] || "",
              ktp_number: row["No. KTP"] || row["ktp_number"] || "",
              unit_number: row["No. Unit"] || row["unit_number"] || "",
              is_owner: (row["Status"] || row["status"])?.toLowerCase() === "pemilik",
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

  const filteredPenghuni = penghuni?.filter((p) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.phone?.toLowerCase().includes(searchLower) ||
      p.email?.toLowerCase().includes(searchLower) ||
      p.ktp_number?.toLowerCase().includes(searchLower) ||
      p.units?.unit_number?.toLowerCase().includes(searchLower) ||
      p.unit_number?.toLowerCase().includes(searchLower)
    );
  });

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
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx,.xls"
                className="hidden"
              />
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
                    <Label htmlFor="ktp_number">No. KTP</Label>
                    <Input
                      id="ktp_number"
                      value={formData.ktp_number}
                      onChange={(e) =>
                        setFormData({ ...formData, ktp_number: e.target.value })
                      }
                      placeholder="Masukkan no. KTP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_owner">Status Kepemilikan</Label>
                    <Select
                      value={formData.is_owner ? "owner" : "tenant"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, is_owner: value === "owner" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Pemilik</SelectItem>
                        <SelectItem value="tenant">Penyewa</SelectItem>
                      </SelectContent>
                    </Select>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
              Daftar Penghuni ({filteredPenghuni?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : filteredPenghuni && filteredPenghuni.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Unit</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>No. Telepon</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>No. KTP</TableHead>
                      <TableHead>Status</TableHead>
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
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              p.is_owner
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {p.is_owner ? "Pemilik" : "Penyewa"}
                          </span>
                        </TableCell>
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
