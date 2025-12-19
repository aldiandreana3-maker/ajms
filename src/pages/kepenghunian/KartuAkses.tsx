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
import { useAccessCards, useCreateAccessCard, useUpdateAccessCardStatus, useDeleteAccessCard } from "@/hooks/useAccessCards";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { usePermissions } from "@/hooks/usePermissions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Loader2, ArrowLeft, Download, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, accessCardExportColumns } from "@/lib/exportExcel";
import { PhotoCell } from "@/components/shared/PhotoActions";
import { PhotoUpload } from "@/components/shared/PhotoUpload";
import { useFileUpload } from "@/hooks/useFileUpload";

const statusColors = {
  active: "bg-success/20 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-muted",
  lost: "bg-warning/20 text-warning border-warning/30",
  damaged: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusLabels = {
  active: "Aktif",
  inactive: "Nonaktif",
  lost: "Hilang",
  damaged: "Rusak",
};

export default function KartuAkses() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("kartu-akses");
  const { data: cards, isLoading } = useAccessCards();
  const createMutation = useCreateAccessCard();
  const updateStatusMutation = useUpdateAccessCardStatus();
  const deleteMutation = useDeleteAccessCard();
  const { uploadFile, uploading } = useFileUpload({ folder: "kartu-akses" });
  const canExport = isAdmin || isSuperAdmin;
  const canDelete = isAdmin || isSuperAdmin;

  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

  const filteredData = useMemo(() => {
    if (!cards) return [];
    let filtered = filterByDate(cards, dateFilter);
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.card_number?.toLowerCase().includes(search) ||
          c.penghuni_name?.toLowerCase().includes(search) ||
          c.unit_number?.toLowerCase().includes(search) ||
          c.card_type?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [cards, searchValue, dateFilter]);

  const statusLabelsExport = { active: "Aktif", inactive: "Nonaktif", lost: "Hilang", damaged: "Rusak" };

  const handleExport = () => {
    if (!filteredData.length) return;
    const exportData = filteredData.map((c) => ({
      ...c,
      penghuni_name: c.penghuni_name || c.penghuni?.full_name || "-",
      unit_number: c.unit_number || c.units?.unit_number || "-",
      request_type: c.request_type?.replace(/_/g, " ") || c.card_type,
      quantity_requested: c.quantity_requested || 1,
      created_at: format(new Date(c.created_at), "dd/MM/yyyy HH:mm"),
    }));
    exportToExcel({
      filename: `Kartu_Akses_${format(new Date(), "yyyy-MM-dd")}`,
      sheetName: "Kartu Akses",
      data: exportData,
      columns: accessCardExportColumns,
      databaseUrl: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/access_cards`,
    });
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "lost" | "damaged">("active");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState({
    owner_name: "",
    unit_number: "",
    request_type: "",
    card_count: "1",
    ktp_photo: null as File | null,
    surat_kuasa: null as File | null,
    payment_proof: null as File | null,
  });

  const generateCardNumber = () => {
    const prefix = "AC";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload files to storage
    let ktpPhotoUrl: string | null = null;
    let suratKuasaUrl: string | null = null;
    let paymentProofUrl: string | null = null;
    
    if (form.ktp_photo) {
      ktpPhotoUrl = await uploadFile(form.ktp_photo);
    }
    if (form.surat_kuasa) {
      suratKuasaUrl = await uploadFile(form.surat_kuasa);
    }
    if (form.payment_proof) {
      paymentProofUrl = await uploadFile(form.payment_proof);
    }
    
    await createMutation.mutateAsync({
      card_number: generateCardNumber(),
      card_type: form.request_type || "resident",
      penghuni_name: form.owner_name,
      unit_number: form.unit_number,
      request_type: form.request_type,
      quantity_requested: parseInt(form.card_count) || 1,
      ktp_photo_url: ktpPhotoUrl,
      surat_kuasa_url: suratKuasaUrl,
      payment_proof_url: paymentProofUrl,
    });
    setIsOpen(false);
    setForm({
      owner_name: "",
      unit_number: "",
      request_type: "",
      card_count: "1",
      ktp_photo: null,
      surat_kuasa: null,
      payment_proof: null,
    });
  };

  const handleUpdateStatus = async () => {
    if (selectedCard) {
      await updateStatusMutation.mutateAsync({
        id: selectedCard,
        status: newStatus,
        notes: notes || undefined,
      });
      setSelectedCard(null);
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
            <div className="p-3 bg-primary/10 rounded-xl">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pembuatan Kartu Akses</h1>
              <p className="text-muted-foreground">Kelola kartu akses penghuni</p>
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
                  Buat Kartu Baru
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrasi Kartu Akses</DialogTitle>
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
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    placeholder="Masukkan nama penghuni"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Keterangan <span className="text-destructive">*</span></Label>
                  <Select value={form.request_type} onValueChange={(v) => setForm({ ...form, request_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih keterangan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tambah_baru">Tambah Baru</SelectItem>
                      <SelectItem value="hilang">Hilang</SelectItem>
                      <SelectItem value="rusak">Rusak (Ada Fisik)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jumlah Akses yang Diajukan <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.card_count}
                    onChange={(e) => setForm({ ...form, card_count: e.target.value })}
                    placeholder="Jumlah kartu yang diajukan"
                    required
                  />
                </div>

                <PhotoUpload
                  label="Upload KTP"
                  value={form.ktp_photo}
                  onChange={(file) => setForm({ ...form, ktp_photo: file })}
                  required
                />

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Jika penghuni dikuasakan</p>
                  <PhotoUpload
                    label="Foto Surat Kuasa (Opsional)"
                    value={form.surat_kuasa}
                    onChange={(file) => setForm({ ...form, surat_kuasa: file })}
                  />
                </div>

                <PhotoUpload
                  label="Upload Bukti Pembayaran (Opsional)"
                  value={form.payment_proof}
                  onChange={(file) => setForm({ ...form, payment_proof: file })}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending || uploading}>
                  {(createMutation.isPending || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Registrasi Kartu
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Kartu Akses</CardTitle>
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
              searchPlaceholder="Cari kartu, nama, unit..."
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
                      <TableHead>Nama Penghuni</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Foto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(c.created_at), "dd/MM/yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>{c.unit_number || c.units?.unit_number || "-"}</TableCell>
                        <TableCell>{c.penghuni_name || c.penghuni?.full_name || "-"}</TableCell>
                        <TableCell className="capitalize">{c.request_type?.replace(/_/g, " ") || c.card_type}</TableCell>
                        <TableCell>{c.quantity_requested || 1}</TableCell>
                        <TableCell>
                          <PhotoCell
                            photos={[
                              { url: c.ktp_photo_url, label: "KTP" },
                              { url: c.surat_kuasa_url, label: "Surat Kuasa" },
                              { url: c.payment_proof_url, label: "Bukti Bayar" },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {searchValue || dateFilter !== "all" ? "Tidak ada data yang sesuai filter" : "Belum ada kartu akses"}
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
