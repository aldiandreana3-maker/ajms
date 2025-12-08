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
import { useAccessCards, useCreateAccessCard, useUpdateAccessCardStatus } from "@/hooks/useAccessCards";
import { useUnits } from "@/hooks/useUnits";
import { usePenghuni } from "@/hooks/usePenghuni";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
  const { data: cards, isLoading } = useAccessCards();
  const { data: units } = useUnits();
  const { data: penghuni } = usePenghuni();
  const createMutation = useCreateAccessCard();
  const updateStatusMutation = useUpdateAccessCardStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "lost" | "damaged">("active");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState({
    penghuni_id: "",
    unit_id: "",
    card_number: "",
    card_type: "resident",
    expires_at: "",
    notes: "",
  });

  const generateCardNumber = () => {
    const prefix = "AC";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      penghuni_id: form.penghuni_id || undefined,
      unit_id: form.unit_id || undefined,
      card_number: form.card_number || generateCardNumber(),
      expires_at: form.expires_at || undefined,
      notes: form.notes || undefined,
    });
    setIsOpen(false);
    setForm({
      penghuni_id: "",
      unit_id: "",
      card_number: "",
      card_type: "resident",
      expires_at: "",
      notes: "",
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
            <div className="p-3 bg-primary/10 rounded-xl">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pembuatan Kartu Akses</h1>
              <p className="text-muted-foreground">Kelola kartu akses penghuni</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Buat Kartu Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrasi Kartu Akses</DialogTitle>
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
                <div className="space-y-2">
                  <Label>Nomor Kartu (opsional, akan digenerate otomatis)</Label>
                  <Input
                    value={form.card_number}
                    onChange={(e) => setForm({ ...form, card_number: e.target.value })}
                    placeholder="AC-XXXXXX-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Kartu</Label>
                  <Select value={form.card_type} onValueChange={(v) => setForm({ ...form, card_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resident">Penghuni</SelectItem>
                      <SelectItem value="owner">Pemilik</SelectItem>
                      <SelectItem value="tenant">Penyewa</SelectItem>
                      <SelectItem value="guest">Tamu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Kadaluarsa (opsional)</Label>
                  <Input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Catatan tambahan..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Registrasi Kartu
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Kartu Akses</CardTitle>
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
                    <TableHead>No. Kartu</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Diterbitkan</TableHead>
                    <TableHead>Kadaluarsa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono">{c.card_number}</TableCell>
                      <TableCell>{c.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>{c.units?.unit_number || "-"}</TableCell>
                      <TableCell className="capitalize">{c.card_type}</TableCell>
                      <TableCell>{format(new Date(c.issued_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{c.expires_at ? format(new Date(c.expires_at), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[c.status]}>
                          {statusLabels[c.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={selectedCard === c.id} onOpenChange={(open) => !open && setSelectedCard(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCard(c.id);
                                setNewStatus(c.status);
                                setNotes(c.notes || "");
                              }}
                            >
                              Update
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update Status Kartu</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as "active" | "inactive" | "lost" | "damaged")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Aktif</SelectItem>
                                    <SelectItem value="inactive">Nonaktif</SelectItem>
                                    <SelectItem value="lost">Hilang</SelectItem>
                                    <SelectItem value="damaged">Rusak</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Catatan</Label>
                                <Textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Alasan perubahan status..."
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {cards?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Belum ada kartu akses terdaftar
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
