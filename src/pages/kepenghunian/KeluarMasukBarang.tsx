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
import { useUnits } from "@/hooks/useUnits";
import { usePenghuni } from "@/hooks/usePenghuni";
import { PackageOpen, Plus, Loader2, ArrowDownLeft, ArrowUpRight, QrCode } from "lucide-react";
import { format } from "date-fns";

export default function KeluarMasukBarang() {
  const { data: movements, isLoading } = useGoodsMovement();
  const { data: units } = useUnits();
  const { data: penghuni } = usePenghuni();
  const createMutation = useCreateGoodsMovement();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    unit_id: "",
    penghuni_id: "",
    movement_type: "in" as "in" | "out",
    item_description: "",
    quantity: "1",
    carrier_name: "",
    carrier_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      unit_id: form.unit_id || undefined,
      penghuni_id: form.penghuni_id || undefined,
      quantity: parseInt(form.quantity) || 1,
    });
    setIsOpen(false);
    setForm({
      unit_id: "",
      penghuni_id: "",
      movement_type: "in",
      item_description: "",
      quantity: "1",
      carrier_name: "",
      carrier_id: "",
    });
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
          <TableHead>Qty</TableHead>
          <TableHead>Pembawa</TableHead>
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
            <TableCell>{m.quantity}</TableCell>
            <TableCell>
              {m.carrier_name && (
                <div>
                  <p>{m.carrier_name}</p>
                  {m.carrier_id && <p className="text-xs text-muted-foreground">{m.carrier_id}</p>}
                </div>
              )}
            </TableCell>
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
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
            <div className="p-3 bg-accent/10 rounded-xl">
              <PackageOpen className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Keluar & Masuk Barang</h1>
              <p className="text-muted-foreground">Catat pergerakan barang penghuni</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Catat Barang
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Catat Keluar/Masuk Barang</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Jenis</Label>
                  <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v as "in" | "out" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-success" />
                          Barang Masuk
                        </div>
                      </SelectItem>
                      <SelectItem value="out">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-warning" />
                          Barang Keluar
                        </div>
                      </SelectItem>
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
                  <Label>Deskripsi Barang</Label>
                  <Textarea
                    value={form.item_description}
                    onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                    placeholder="Contoh: 1 unit kulkas Samsung"
                    rows={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Pembawa</Label>
                    <Input
                      value={form.carrier_name}
                      onChange={(e) => setForm({ ...form, carrier_name: e.target.value })}
                      placeholder="Nama kurir/pembawa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID/KTP Pembawa</Label>
                    <Input
                      value={form.carrier_id}
                      onChange={(e) => setForm({ ...form, carrier_id: e.target.value })}
                      placeholder="No. KTP"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Simpan & Generate QR
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
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
