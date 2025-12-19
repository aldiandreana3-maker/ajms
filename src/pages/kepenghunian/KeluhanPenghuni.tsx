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
import { useKeluhan, useCreateKeluhan, useUpdateKeluhanStatus, useDeleteKeluhan } from "@/hooks/useKeluhan";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquareWarning, Plus, Loader2, ArrowLeft, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, keluhanExportColumns } from "@/lib/exportExcel";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { useFileUpload } from "@/hooks/useFileUpload";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  proses: "bg-info/20 text-info border-info/30",
  selesai: "bg-success/20 text-success border-success/30",
};

export default function KeluhanPenghuni() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("keluhan");
  const { data: keluhan, isLoading } = useKeluhan();
  const createMutation = useCreateKeluhan();
  const updateStatusMutation = useUpdateKeluhanStatus();
  const deleteMutation = useDeleteKeluhan();
  const { uploadFile, uploading } = useFileUpload({ folder: "keluhan" });
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

  const filteredData = useMemo(() => {
    if (!keluhan) return [];
    let filtered = filterByDate(keluhan, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.subject?.toLowerCase().includes(search) ||
          k.description?.toLowerCase().includes(search) ||
          k.penghuni_name?.toLowerCase().includes(search) ||
          k.unit_number?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [keluhan, searchValue, dateFilter]);

  const handleExport = () => {
    if (!filteredData.length) return;
    const statusMap = { pending: "Pending", proses: "Proses", selesai: "Selesai" };
    const exportData = filteredData.map((k) => ({
      ...k,
      penghuni_name: k.penghuni_name || k.penghuni?.full_name || "-",
      unit_number: k.unit_number || k.units?.unit_number || "-",
      status: statusMap[k.status] || k.status,
      created_at: format(new Date(k.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportToExcel({
      filename: `Keluhan_Penghuni_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Keluhan Penghuni",
      data: exportData,
      columns: keluhanExportColumns,
      databaseUrl: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/keluhan`,
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeluhan, setSelectedKeluhan] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "proses" | "selesai">("pending");
  const [response, setResponse] = useState("");

  const [form, setForm] = useState({
    penghuni_name: "",
    unit_number: "",
    phone: "",
    keluhan: "",
    media_file: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let photoUrl: string | undefined;
    if (form.media_file) {
      const path = await uploadFile(form.media_file);
      if (path) photoUrl = path;
    }
    
    await createMutation.mutateAsync({
      subject: `Keluhan dari ${form.penghuni_name}`,
      description: form.keluhan,
      penghuni_name: form.penghuni_name,
      unit_number: form.unit_number,
      phone: form.phone,
      photo_url: photoUrl,
    });
    setIsOpen(false);
    setForm({ penghuni_name: "", unit_number: "", phone: "", keluhan: "", media_file: null });
  };

  const handleUpdateStatus = async () => {
    if (selectedKeluhan) {
      await updateStatusMutation.mutateAsync({
        id: selectedKeluhan,
        status: newStatus,
        response: response || undefined,
      });
      setSelectedKeluhan(null);
      setResponse("");
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
            <div className="p-3 bg-warning/10 rounded-xl">
              <MessageSquareWarning className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Keluhan Penghuni</h1>
              <p className="text-muted-foreground">Kelola keluhan dan tanggapi penghuni</p>
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
                  Input Keluhan
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Input Keluhan Baru</DialogTitle>
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
                  <Label>Nomor Telepon <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keluhan <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={form.keluhan}
                    onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
                    placeholder="Jelaskan detail keluhan..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lampiran Foto/Video (Opsional)</Label>
                  <PhotoUpload
                    label="Upload Foto/Video"
                    value={form.media_file}
                    onChange={(file) => setForm({ ...form, media_file: file })}
                    accept="image/*,video/*"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading}>
                  {(createMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Keluhan</CardTitle>
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
              searchPlaceholder="Cari keluhan, nama, unit..."
            />
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{format(new Date(k.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{k.penghuni_name || k.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>{k.unit_number || k.units?.unit_number || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{k.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{k.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PhotoCell
                          photos={[
                            { url: k.photo_url, label: "Foto" },
                          ]}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[k.status]}>
                          {k.status === "pending" ? "Pending" : k.status === "proses" ? "Proses" : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Dialog open={selectedKeluhan === k.id} onOpenChange={(open) => !open && setSelectedKeluhan(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedKeluhan(k.id);
                                setNewStatus(k.status);
                                setResponse(k.response || "");
                              }}
                            >
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Status Keluhan</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as "pending" | "proses" | "selesai")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="proses">Proses</SelectItem>
                                    <SelectItem value="selesai">Selesai</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Respons/Catatan</Label>
                                <Textarea
                                  value={response}
                                  onChange={(e) => setResponse(e.target.value)}
                                  placeholder="Tambahkan respons atau catatan..."
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
                                <AlertDialogTitle>Hapus Data Keluhan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Data keluhan ini akan dihapus permanen dan tidak dapat dikembalikan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(k.id)}
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
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada keluhan"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
