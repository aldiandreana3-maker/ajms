import { useState } from "react";
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
import { useGoodsMovement, useCreateGoodsMovement } from "@/hooks/useGoodsMovement";
import { UnitSelector } from "@/components/shared/UnitSelector";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { usePermissions } from "@/hooks/usePermissions";
import { PackageOpen, Plus, Loader2, ArrowDownLeft, ArrowUpRight, QrCode, Upload, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { exportToExcel, goodsMovementExportColumns } from "@/lib/exportExcel";

export default function KeluarMasukBarang() {
  const navigate = useNavigate();
  const { getFeaturePermission, isAuthenticated, isAdmin, isSuperAdmin } = usePermissions();
  const permission = getFeaturePermission("keluar-masuk-barang");

  const { data: movements, isLoading } = useGoodsMovement();
  const createMutation = useCreateGoodsMovement();
  const canExport = isAdmin || isSuperAdmin;

  const handleExport = () => {
    if (!movements) return;
    const exportData = movements.map((m) => ({
      ...m,
      penghuni_name: m.penghuni?.full_name || "-",
      unit_number: m.units?.unit_number || "-",
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
    phone: "",
    rental_status: "",
    movement_type: "in" as "in" | "out",
    item_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      movement_type: form.movement_type,
      item_description: form.item_description,
      carrier_name: form.carrier_name || undefined,
    });
    setIsOpen(false);
    setForm({
      penghuni_name: "",
      unit_number: "",
      carrier_name: "",
      ktp_photo: null,
      phone: "",
      rental_status: "",
      movement_type: "in",
      item_description: "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, ktp_photo: file });
    }
  };

  const inMovements = movements?.filter((m) => m.movement_type === "in") || [];
  const outMovements = movements?.filter((m) => m.movement_type === "out") || [];

  const MovementTable = ({ data }: { data: typeof movements }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Penghuni</TableHead>
          <TableHead>Deskripsi Barang</TableHead>
          <TableHead>Penanggung Jawab</TableHead>
          <TableHead>QR Code</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
            <TableCell>{m.units?.unit_number || "-"}</TableCell>
            <TableCell>{m.penghuni?.full_name || "-"}</TableCell>
            <TableCell>{m.item_description}</TableCell>
            <TableCell>{m.carrier_name || "-"}</TableCell>
            <TableCell>
              {m.qr_code && (
                <Badge variant="outline" className="font-mono text-xs">
                  <QrCode className="w-3 h-3 mr-1" />
                  {m.qr_code.substring(0, 10)}...
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
        {data?.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Belum ada data
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
              onClick={() => navigate("/")}
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

                <UnitSelector
                  value={form.unit_number}
                  onChange={(v) => setForm({ ...form, unit_number: v })}
                  label="Alamat Tower & Unit *"
                />

                <div className="space-y-2">
                  <Label>Nama Penanggung Jawab <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.carrier_name}
                    onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
                    placeholder="Nama penanggung jawab/pembawa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Foto KTP <span className="text-destructive">*</span></Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="ktp-upload"
                      required
                    />
                    <label htmlFor="ktp-upload" className="cursor-pointer">
                      {form.ktp_photo ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                          <Upload className="w-5 h-5" />
                          {form.ktp_photo.name}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Upload className="w-8 h-8" />
                          <span className="text-sm">Klik untuk upload foto KTP</span>
                        </div>
                      )}
                    </label>
                  </div>
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

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
            {canExport && movements && movements.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">Semua ({movements?.length || 0})</TabsTrigger>
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
                  <MovementTable data={movements} />
                </TabsContent>
                <TabsContent value="in" className="mt-4">
                  <MovementTable data={inMovements} />
                </TabsContent>
                <TabsContent value="out" className="mt-4">
                  <MovementTable data={outMovements} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
