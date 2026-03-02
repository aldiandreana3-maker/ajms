import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeLeaves, useCreateLeave, useUpdateLeaveStatus } from "@/hooks/useEmployeeLeaves";
import { ArrowLeft, Palmtree, Plus, Loader2 } from "lucide-react";

export default function Cuti() {
  const navigate = useNavigate();
  const { isStaff, isSuperAdmin, isAdmin } = useAuth();
  const { data: leaves, isLoading } = useEmployeeLeaves();
  const createLeave = useCreateLeave();
  const updateStatus = useUpdateLeaveStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: "cuti_tahunan", start_date: "", end_date: "", reason: "" });

  if (!isStaff && !isSuperAdmin && !isAdmin) {
    return <MainLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Akses ditolak</p></div></MainLayout>;
  }

  const handleSubmit = async () => {
    if (!form.start_date || !form.end_date || !form.reason) return;
    await createLeave.mutateAsync(form);
    setForm({ leave_type: "cuti_tahunan", start_date: "", end_date: "", reason: "" });
    setShowForm(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-success text-white">Disetujui</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const leaveTypeLabel = (type: string) => {
    const map: Record<string, string> = { cuti_tahunan: "Cuti Tahunan", cuti_sakit: "Cuti Sakit", cuti_melahirkan: "Cuti Melahirkan", cuti_lainnya: "Cuti Lainnya" };
    return map[type] || type;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Palmtree className="w-8 h-8 text-success" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengajuan Cuti</h1>
              <p className="text-muted-foreground">Ajukan dan lihat riwayat cuti</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Ajukan Cuti</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Riwayat Cuti</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Mulai</TableHead>
                      <TableHead>Selesai</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      {(isSuperAdmin || isAdmin) && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves?.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada data cuti</TableCell></TableRow>
                    )}
                    {leaves?.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{leaveTypeLabel(l.leave_type)}</TableCell>
                        <TableCell>{new Date(l.start_date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>{new Date(l.end_date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{l.reason || "-"}</TableCell>
                        <TableCell>{statusBadge(l.status)}</TableCell>
                        {(isSuperAdmin || isAdmin) && (
                          <TableCell>
                            {l.status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-success" onClick={() => updateStatus.mutate({ id: l.id, status: "approved" })}>Setujui</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus.mutate({ id: l.id, status: "rejected" })}>Tolak</Button>
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
            <DialogHeader><DialogTitle>Ajukan Cuti</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Jenis Cuti</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cuti_tahunan">Cuti Tahunan</SelectItem>
                    <SelectItem value="cuti_sakit">Cuti Sakit</SelectItem>
                    <SelectItem value="cuti_melahirkan">Cuti Melahirkan</SelectItem>
                    <SelectItem value="cuti_lainnya">Cuti Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tanggal Mulai</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Tanggal Selesai</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><Label>Alasan</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan cuti..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={createLeave.isPending}>
                  {createLeave.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Kirim Pengajuan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
