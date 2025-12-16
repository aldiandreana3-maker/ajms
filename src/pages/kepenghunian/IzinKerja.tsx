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
import { useWorkPermits, useCreateWorkPermit, useUpdateWorkPermitStatus } from "@/hooks/useWorkPermits";
import { useUnits } from "@/hooks/useUnits";
import { usePenghuni } from "@/hooks/usePenghuni";
import { PermissionButton } from "@/components/ui/permission-button";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { usePermissions } from "@/hooks/usePermissions";
import { ClipboardCheck, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function IzinKerja() {
  const { getFeaturePermission, isAuthenticated } = usePermissions();
  const permission = getFeaturePermission("izin-kerja");

  const { data: permits, isLoading } = useWorkPermits();
  const { data: units } = useUnits();
  const { data: penghuni } = usePenghuni();
  const createMutation = useCreateWorkPermit();
  const updateStatusMutation = useUpdateWorkPermitStatus();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState({
    unit_id: "",
    penghuni_id: "",
    vendor_name: "",
    work_description: "",
    worker_count: "1",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      unit_id: form.unit_id || undefined,
      penghuni_id: form.penghuni_id || undefined,
      worker_count: parseInt(form.worker_count) || 1,
    });
    setIsOpen(false);
    setForm({
      unit_id: "",
      penghuni_id: "",
      vendor_name: "",
      work_description: "",
      worker_count: "1",
      start_date: "",
      end_date: "",
    });
  };

  const handleUpdateStatus = async () => {
    if (selectedPermit) {
      await updateStatusMutation.mutateAsync({
        id: selectedPermit,
        status: newStatus,
        notes: notes || undefined,
      });
      setSelectedPermit(null);
      setNotes("");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-info/10 rounded-xl">
              <ClipboardCheck className="w-6 h-6 text-info" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengajuan Izin Kerja</h1>
              <p className="text-muted-foreground">Kelola izin kerja vendor dan teknisi</p>
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
                  Ajukan Izin Kerja
                </PermissionButton>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Pengajuan Izin Kerja Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label>Nama Vendor/Teknisi</Label>
                  <Input
                    value={form.vendor_name}
                    onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                    placeholder="PT. Contoh Jaya"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi Pekerjaan</Label>
                  <Textarea
                    value={form.work_description}
                    onChange={(e) => setForm({ ...form, work_description: e.target.value })}
                    placeholder="Jelaskan pekerjaan yang akan dilakukan..."
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Pekerja</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.worker_count}
                    onChange={(e) => setForm({ ...form, worker_count: e.target.value })}
                  />
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
                    <Label>Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Ajukan
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengajuan</CardTitle>
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
                    <TableHead>Unit</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Pekerjaan</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Pekerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.units?.unit_number || "-"}</TableCell>
                      <TableCell>{p.vendor_name}</TableCell>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2">{p.work_description}</p>
                      </TableCell>
                      <TableCell>
                        {format(new Date(p.start_date), "dd/MM")} - {format(new Date(p.end_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{p.worker_count} orang</TableCell>
                      <TableCell>
                        <Badge className={statusColors[p.status]}>
                          {p.status === "pending" ? "Pending" : p.status === "approved" ? "Disetujui" : "Ditolak"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog open={selectedPermit === p.id} onOpenChange={(open) => !open && setSelectedPermit(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPermit(p.id);
                                setNewStatus(p.status);
                                setNotes(p.notes || "");
                              }}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Izin Kerja</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as "pending" | "approved" | "rejected")}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Catatan</Label>
                                <Textarea
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  placeholder="Tambahkan catatan..."
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
                  {permits?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada pengajuan izin kerja
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
