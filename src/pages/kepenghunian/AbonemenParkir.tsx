import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParkingSubscriptions, useCreateParkingSubscription, useExtendParkingSubscription } from "@/hooks/useParkingSubscriptions";
import { UnitSelector } from "@/components/shared/UnitSelector";
import { Car, Plus, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function AbonemenParkir() {
  const { data: subscriptions, isLoading } = useParkingSubscriptions();
  const createMutation = useCreateParkingSubscription();
  const extendMutation = useExtendParkingSubscription();

  const [isOpen, setIsOpen] = useState(false);
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");

  const [form, setForm] = useState({
    penghuni_name: "",
    penghuni_type: "",
    agent_name: "",
    unit_number: "",
    parking_type: "",
    vehicle_type: "",
    vehicle_number: "",
    monthly_fee: "",
    payment_method: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const endDate = form.parking_type === "harian" 
      ? new Date(today.getTime() + 24 * 60 * 60 * 1000)
      : new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    await createMutation.mutateAsync({
      vehicle_type: form.vehicle_type,
      vehicle_number: form.vehicle_number,
      vehicle_brand: form.penghuni_name,
      vehicle_color: form.penghuni_type,
      start_date: today.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      monthly_fee: parseFloat(form.monthly_fee) || 0,
    });
    setIsOpen(false);
    setForm({
      penghuni_name: "",
      penghuni_type: "",
      agent_name: "",
      unit_number: "",
      parking_type: "",
      vehicle_type: "",
      vehicle_number: "",
      monthly_fee: "",
      payment_method: "",
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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Abonemen Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Penghuni</Label>
                  <Input
                    value={form.penghuni_name}
                    onChange={(e) => setForm({ ...form, penghuni_name: e.target.value })}
                    placeholder="Masukkan nama penghuni"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status Penghuni</Label>
                  <Select value={form.penghuni_type} onValueChange={(v) => setForm({ ...form, penghuni_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pemilik">Pemilik</SelectItem>
                      <SelectItem value="penyewa">Penyewa</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(form.penghuni_type === "penyewa" || form.penghuni_type === "agent") && (
                  <div className="space-y-2">
                    <Label>{form.penghuni_type === "penyewa" ? "Sewa dari siapa" : "Nama Agent"}</Label>
                    <Input
                      value={form.agent_name}
                      onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
                      placeholder={form.penghuni_type === "penyewa" ? "Nama pemilik/agent" : "Nama agent"}
                    />
                  </div>
                )}

                <UnitSelector
                  value={form.unit_number}
                  onChange={(v) => setForm({ ...form, unit_number: v })}
                />

                <div className="space-y-2">
                  <Label>Jenis Parkir</Label>
                  <Select value={form.parking_type} onValueChange={(v) => setForm({ ...form, parking_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis parkir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harian">Harian</SelectItem>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Jenis Kendaraan</Label>
                  <Select value={form.vehicle_type} onValueChange={(v) => setForm({ ...form, vehicle_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis kendaraan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobil">Mobil</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
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

                <div className="space-y-2">
                  <Label>Nominal (Rp)</Label>
                  <Input
                    type="number"
                    value={form.monthly_fee}
                    onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
                    placeholder="150000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cas">Cas di Kasir</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <TableCell>{sub.vehicle_brand || "-"}</TableCell>
                      <TableCell>{sub.units?.unit_number || "-"}</TableCell>
                      <TableCell className="capitalize">{sub.vehicle_type}</TableCell>
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
