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
import { useKeluhan, useCreateKeluhan, useUpdateKeluhanStatus } from "@/hooks/useKeluhan";
import { useUnits } from "@/hooks/useUnits";
import { usePenghuni } from "@/hooks/usePenghuni";
import { MessageSquareWarning, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  proses: "bg-info/20 text-info border-info/30",
  selesai: "bg-success/20 text-success border-success/30",
};

export default function KeluhanPenghuni() {
  const { data: keluhan, isLoading } = useKeluhan();
  const { data: units } = useUnits();
  const { data: penghuni } = usePenghuni();
  const createMutation = useCreateKeluhan();
  const updateStatusMutation = useUpdateKeluhanStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedKeluhan, setSelectedKeluhan] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "proses" | "selesai">("pending");
  const [response, setResponse] = useState("");

  const [form, setForm] = useState({
    penghuni_id: "",
    unit_id: "",
    subject: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      penghuni_id: form.penghuni_id || undefined,
      unit_id: form.unit_id || undefined,
    });
    setIsOpen(false);
    setForm({ penghuni_id: "", unit_id: "", subject: "", description: "" });
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
            <div className="p-3 bg-warning/10 rounded-xl">
              <MessageSquareWarning className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Keluhan Penghuni</h1>
              <p className="text-muted-foreground">Kelola keluhan dan tanggapi penghuni</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Input Keluhan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Input Keluhan Baru</DialogTitle>
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
                  <Label>Subjek Keluhan</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Contoh: AC tidak dingin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Jelaskan detail keluhan..."
                    rows={4}
                    required
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
            <CardTitle>Daftar Keluhan</CardTitle>
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
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keluhan?.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{format(new Date(k.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{k.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>{k.units?.unit_number || "-"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{k.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{k.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[k.status]}>
                          {k.status === "pending" ? "Pending" : k.status === "proses" ? "Proses" : "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {keluhan?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada keluhan
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
