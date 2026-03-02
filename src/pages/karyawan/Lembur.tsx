import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeOvertimes, useCreateOvertime, useUpdateOvertimeStatus } from "@/hooks/useEmployeeOvertimes";
import { ArrowLeft, Clock, Plus, Loader2 } from "lucide-react";

export default function Lembur() {
  const navigate = useNavigate();
  const { isStaff, isSuperAdmin, isAdmin } = useAuth();
  const { data: overtimes, isLoading } = useEmployeeOvertimes();
  const createOvertime = useCreateOvertime();
  const updateStatus = useUpdateOvertimeStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ overtime_date: "", start_time: "", end_time: "", reason: "" });

  if (!isStaff && !isSuperAdmin && !isAdmin) {
    return <MainLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Akses ditolak</p></div></MainLayout>;
  }

  const handleSubmit = async () => {
    if (!form.overtime_date || !form.start_time || !form.end_time || !form.reason) return;
    await createOvertime.mutateAsync(form);
    setForm({ overtime_date: "", start_time: "", end_time: "", reason: "" });
    setShowForm(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-success text-white">Disetujui</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengajuan Lembur</h1>
              <p className="text-muted-foreground">Ajukan dan lihat riwayat lembur</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Ajukan Lembur</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Riwayat Lembur</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Mulai</TableHead>
                      <TableHead>Selesai</TableHead>
                      <TableHead>Jam</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      {(isSuperAdmin || isAdmin) && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overtimes?.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada data lembur</TableCell></TableRow>
                    )}
                    {overtimes?.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>{new Date(o.overtime_date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>{o.start_time}</TableCell>
                        <TableCell>{o.end_time}</TableCell>
                        <TableCell>{o.hours ? `${Number(o.hours).toFixed(1)} jam` : "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{o.reason || "-"}</TableCell>
                        <TableCell>{statusBadge(o.status)}</TableCell>
                        {(isSuperAdmin || isAdmin) && (
                          <TableCell>
                            {o.status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-success" onClick={() => updateStatus.mutate({ id: o.id, status: "approved" })}>Setujui</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus.mutate({ id: o.id, status: "rejected" })}>Tolak</Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajukan Lembur</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Tanggal Lembur</Label><Input type="date" value={form.overtime_date} onChange={(e) => setForm({ ...form, overtime_date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Jam Mulai</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>Jam Selesai</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div><Label>Alasan</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan lembur..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={createOvertime.isPending}>
                  {createOvertime.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Kirim Pengajuan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
