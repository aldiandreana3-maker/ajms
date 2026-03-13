import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Gauge, Plus, Edit2, Trash2 } from "lucide-react";
import { useElectricMeters, ElectricMeter } from "@/hooks/useElectricMeters";
import { useUnits } from "@/hooks/useUnits";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/TablePagination";

export default function DataMeterListrik() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { meters, isLoading, createMeter, updateMeter, deleteMeter } = useElectricMeters();
  const { units } = useUnits();
  const canManage = isSuperAdmin || isAdmin;

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMeter, setEditMeter] = useState<ElectricMeter | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  // Form state
  const [formUnitId, setFormUnitId] = useState("");
  const [formUnitNumber, setFormUnitNumber] = useState("");
  const [formMeterNumber, setFormMeterNumber] = useState("");
  const [formMeterType, setFormMeterType] = useState("prabayar");
  const [formPenghuni, setFormPenghuni] = useState("");
  const [formInstallDate, setFormInstallDate] = useState("");
  const [formStatus, setFormStatus] = useState("aktif");
  const [formBalance, setFormBalance] = useState("0");
  const [formPrice, setFormPrice] = useState("1444.70");

  const filtered = meters.filter((m) => {
    const q = search.toLowerCase();
    return m.unit_number.toLowerCase().includes(q) || m.meter_number.toLowerCase().includes(q) || (m.penghuni_name || "").toLowerCase().includes(q);
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => {
    setFormUnitId("");
    setFormUnitNumber("");
    setFormMeterNumber("");
    setFormMeterType("prabayar");
    setFormPenghuni("");
    setFormInstallDate("");
    setFormStatus("aktif");
    setFormBalance("0");
    setFormPrice("1444.70");
    setEditMeter(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (m: ElectricMeter) => {
    setEditMeter(m);
    setFormUnitId(m.unit_id || "");
    setFormUnitNumber(m.unit_number);
    setFormMeterNumber(m.meter_number);
    setFormMeterType(m.meter_type);
    setFormPenghuni(m.penghuni_name || "");
    setFormInstallDate(m.install_date || "");
    setFormStatus(m.meter_status);
    setFormBalance(String(m.kwh_balance));
    setFormPrice(String(m.price_per_kwh));
    setDialogOpen(true);
  };

  const handleUnitChange = (unitId: string) => {
    setFormUnitId(unitId);
    const unit = units?.find((u) => u.id === unitId);
    if (unit) setFormUnitNumber(unit.unit_number);
  };

  const handleSave = async () => {
    const data: any = {
      unit_id: formUnitId || null,
      unit_number: formUnitNumber,
      meter_number: formMeterNumber,
      meter_type: formMeterType,
      penghuni_name: formPenghuni || null,
      install_date: formInstallDate || null,
      meter_status: formStatus,
      kwh_balance: parseFloat(formBalance) || 0,
      price_per_kwh: parseFloat(formPrice) || 1444.70,
    };

    if (editMeter) {
      await updateMeter.mutateAsync({ id: editMeter.id, ...data });
    } else {
      data.created_by = user?.id;
      await createMeter.mutateAsync(data);
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Gauge className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Data Meter Listrik</h1>
                <p className="text-muted-foreground">Kelola meter listrik per unit</p>
              </div>
            </div>
          </div>
          {canManage && (
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Meter
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Input placeholder="Cari unit, meter, penghuni..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Gauge className="w-4 h-4" /></span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>No. Meter</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Penghuni</TableHead>
                  <TableHead className="text-right">Saldo kWh</TableHead>
                  <TableHead className="text-right">Harga/kWh</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Belum ada data meter</TableCell></TableRow>
                ) : (
                  paginated.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.unit_number}</TableCell>
                      <TableCell>{m.meter_number}</TableCell>
                      <TableCell>{m.meter_type}</TableCell>
                      <TableCell>{m.penghuni_name || "-"}</TableCell>
                      <TableCell className="text-right">{m.kwh_balance.toFixed(2)}</TableCell>
                      <TableCell className="text-right">Rp {m.price_per_kwh.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge variant={m.meter_status === "aktif" ? "default" : "secondary"}>
                          {m.meter_status}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMeter.mutate(m.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMeter ? "Edit Meter" : "Tambah Meter Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={formUnitId} onValueChange={handleUnitChange}>
                  <SelectTrigger><SelectValue placeholder="Pilih unit..." /></SelectTrigger>
                  <SelectContent>
                    {units?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nomor Meter</Label>
                <Input value={formMeterNumber} onChange={(e) => setFormMeterNumber(e.target.value)} placeholder="Masukkan nomor meter..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipe Meter</Label>
                  <Select value={formMeterType} onValueChange={setFormMeterType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prabayar">Prabayar</SelectItem>
                      <SelectItem value="pascabayar">Pascabayar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nama Penghuni</Label>
                <Input value={formPenghuni} onChange={(e) => setFormPenghuni(e.target.value)} placeholder="Nama penghuni..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Saldo kWh</Label>
                  <Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Harga per kWh (Rp)</Label>
                  <Input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Install</Label>
                <Input type="date" value={formInstallDate} onChange={(e) => setFormInstallDate(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!formUnitNumber || !formMeterNumber}>
                {editMeter ? "Simpan Perubahan" : "Tambah Meter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
