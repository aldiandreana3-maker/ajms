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
import { useEmployeePermits, useCreatePermit, useUpdatePermitStatus } from "@/hooks/useEmployeePermits";
import { ArrowLeft, FileText, Plus, Loader2 } from "lucide-react";

export default function Izin() {
  const navigate = useNavigate();
  const { isStaff, isSuperAdmin, isAdmin } = useAuth();
  const { data: permits, isLoading } = useEmployeePermits();
  const createPermit = useCreatePermit();
  const updateStatus = useUpdatePermitStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ permit_type: "sakit", permit_date: "", reason: "" });

  if (!isStaff && !isSuperAdmin && !isAdmin) {
    return <MainLayout><div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Akses ditolak</p></div></MainLayout>;
  }

  const handleSubmit = async () => {
    if (!form.permit_date || !form.reason) return;
    await createPermit.mutateAsync(form);
    setForm({ permit_type: "sakit", permit_date: "", reason: "" });
    setShowForm(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-success text-white">Disetujui</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const permitTypeLabel = (type: string) => {
    const map: Record<string, string> = { sakit: "Sakit", keperluan_pribadi: "Keperluan Pribadi", keluarga: "Keluarga", lainnya: "Lainnya" };
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
            <FileText className="w-8 h-8 text-info" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pengajuan Izin</h1>
              <p className="text-muted-foreground">Ajukan dan lihat riwayat izin</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" />Ajukan Izin</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Riwayat Izin</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Status</TableHead>
                      {(isSuperAdmin || isAdmin) && <TableHead>Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permits?.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada data izin</TableCell></TableRow>
                    )}
                    {permits?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{permitTypeLabel(p.permit_type)}</TableCell>
                        <TableCell>{new Date(p.permit_date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{p.reason}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                        {(isSuperAdmin || isAdmin) && (
                          <TableCell>
                            {p.status === "pending" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-success" onClick={() => updateStatus.mutate({ id: p.id, status: "approved" })}>Setujui</Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateStatus.mutate({ id: p.id, status: "rejected" })}>Tolak</Button>
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
            <DialogHeader><DialogTitle>Ajukan Izin</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Jenis Izin</Label>
                <Select value={form.permit_type} onValueChange={(v) => setForm({ ...form, permit_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sakit">Sakit</SelectItem>
                    <SelectItem value="keperluan_pribadi">Keperluan Pribadi</SelectItem>
                    <SelectItem value="keluarga">Keluarga</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tanggal Izin</Label><Input type="date" value={form.permit_date} onChange={(e) => setForm({ ...form, permit_date: e.target.value })} /></div>
              <div><Label>Alasan</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Jelaskan alasan izin..." /></div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                <Button onClick={handleSubmit} disabled={createPermit.isPending}>
                  {createPermit.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Kirim Pengajuan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
