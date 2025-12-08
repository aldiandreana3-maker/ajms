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
import { useParkingSubscriptions, useCreateParkingSubscription, useExtendParkingSubscription } from "@/hooks/useParkingSubscriptions";
import { useUnits } from "@/hooks/useUnits";
import { usePenghuni } from "@/hooks/usePenghuni";
import { Car, Plus, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AbonemenParkir() {
  const { data: subscriptions, isLoading } = useParkingSubscriptions();
  const { data: units } = useUnits();
  const { data: penghuni } = usePenghuni();
  const createMutation = useCreateParkingSubscription();
  const extendMutation = useExtendParkingSubscription();

  const [isOpen, setIsOpen] = useState(false);
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");

  const [form, setForm] = useState({
    penghuni_id: "",
    unit_id: "",
    vehicle_type: "",
    vehicle_number: "",
    vehicle_brand: "",
    vehicle_color: "",
    start_date: "",
    end_date: "",
    monthly_fee: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      penghuni_id: form.penghuni_id || undefined,
      unit_id: form.unit_id || undefined,
      monthly_fee: parseFloat(form.monthly_fee) || 0,
    });
    setIsOpen(false);
    setForm({
      penghuni_id: "",
      unit_id: "",
      vehicle_type: "",
      vehicle_number: "",
      vehicle_brand: "",
      vehicle_color: "",
      start_date: "",
      end_date: "",
      monthly_fee: "",
    });
  };

  const handleExtend = async () => {
    if (extendId && extendDate) {
      await extendMutation.mutateAsync({ id: extendId, end_date: extendDate });
      setExtendId(null);
      setExtendDate("");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Abonemen Parkir</h1>
              <p className="text-muted-foreground">Kelola langganan parkir penghuni</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Abonemen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Abonemen Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Penghuni</Label>
                  <Select value={form.penghuni_id} onValueChange={(v) => setForm({ ...form, penghuni_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih penghuni" />
                    </SelectTrigger>
                    <SelectContent>
                      {penghuni?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Jenis Kendaraan</Label>
                    <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="mobil">Mobil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>No. Polisi</Label>
                    <Input
                      value={form.vehicle_number}
                      onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                      placeholder="B 1234 ABC"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Merk</Label>
                    <Input
                      value={form.vehicle_brand}
                      onChange={(e) => setForm({ ...form, vehicle_brand: e.target.value })}
                      placeholder="Honda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Warna</Label>
                    <Input
                      value={form.vehicle_color}
                      onChange={(e) => setForm({ ...form, vehicle_color: e.target.value })}
                      placeholder="Hitam"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Berakhir</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Biaya Bulanan (Rp)</Label>
                  <Input
                    type="number"
                    value={form.monthly_fee}
                    onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
                    placeholder="150000"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Abonemen</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead>No. Polisi</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions?.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>{sub.units?.unit_number || "-"}</TableCell>
                      <TableCell className="capitalize">{sub.vehicle_type} {sub.vehicle_brand}</TableCell>
                      <TableCell className="font-mono">{sub.vehicle_number}</TableCell>
                      <TableCell>
                        {format(new Date(sub.start_date), "dd/MM/yyyy")} - {format(new Date(sub.end_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.is_active ? "default" : "secondary"}>
                          {sub.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={extendId === sub.id} onOpenChange={(open) => !open && setExtendId(null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setExtendId(sub.id)}>
                              <Calendar className="w-4 h-4 mr-1" />
                              Perpanjang
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Perpanjang Abonemen</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Tanggal Berakhir Baru</Label>
                                <Input
                                  type="date"
                                  value={extendDate}
                                  onChange={(e) => setExtendDate(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleExtend} disabled={extendMutation.isPending} className="w-full">
                                {extendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Simpan
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscriptions?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada data abonemen parkir
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
