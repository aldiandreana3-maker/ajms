import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, Clock, Eye, Loader2, RefreshCw, ShieldAlert, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  PenghuniUpdate,
  usePenghuniUpdateStats,
  usePenghuniUpdates,
  useUpdatePenghuniUpdateStatus,
} from "@/hooks/usePenghuniUpdates";

const statusBadge = (status: string) => {
  if (status === "sudah_diperbarui")
    return <Badge className="bg-success text-success-foreground">🟢 Sudah Diperbarui</Badge>;
  if (status === "perlu_diperbarui")
    return <Badge className="bg-destructive text-destructive-foreground">🔴 Perlu Diperbarui</Badge>;
  return <Badge className="bg-warning text-white">🟠 Belum Diperbarui</Badge>;
};

export default function PemutakhiranDataTRO() {
  const navigate = useNavigate();
  const { isAdmin, role, isLimitedAccess } = useAuth();
  const canAccess = (isAdmin || role === "staff_tro") && !isLimitedAccess;

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [penghuniStatus, setPenghuniStatus] = useState("all");
  const [tower, setTower] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState<PenghuniUpdate | null>(null);

  const { data: stats } = usePenghuniUpdateStats();
  const { data: rows = [], isLoading } = usePenghuniUpdates({
    search,
    status,
    penghuniStatus,
    tower,
    dateFrom,
    dateTo,
  });
  const updateStatus = useUpdatePenghuniUpdateStatus();

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  const statCards = [
    { title: "Total Unit", value: stats?.totalUnit ?? 0, icon: Building2, cls: "bg-primary text-primary-foreground" },
    { title: "Sudah Diperbarui", value: stats?.sudah ?? 0, icon: CheckCircle2, cls: "bg-success text-success-foreground" },
    { title: "Belum Diperbarui", value: stats?.belum ?? 0, icon: Clock, cls: "bg-warning text-white" },
    { title: "Perlu Diperbarui", value: stats?.perlu ?? 0, icon: RefreshCw, cls: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pemutakhiran Data Penghuni</h1>
            <p className="text-muted-foreground">Monitoring pemutakhiran data penghuni per unit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Card key={s.title}>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.cls}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progress Pemutakhiran Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={stats?.progress ?? 0} />
            <p className="text-sm text-muted-foreground">
              {stats?.progress ?? 0}% Unit Sudah Memperbarui Data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-2 lg:col-span-2">
              <Label>Cari</Label>
              <Input
                placeholder="Nomor unit / nama penghuni"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status Pemutakhiran</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="sudah_diperbarui">Sudah Diperbarui</SelectItem>
                  <SelectItem value="belum_diperbarui">Belum Diperbarui</SelectItem>
                  <SelectItem value="perlu_diperbarui">Perlu Diperbarui</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status Kepenghunian</Label>
              <Select value={penghuniStatus} onValueChange={setPenghuniStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="Pemilik">Pemilik</SelectItem>
                  <SelectItem value="Penyewa/Penghuni">Penyewa/Penghuni</SelectItem>
                  <SelectItem value="Kerabat Pemilik">Kerabat Pemilik</SelectItem>
                  <SelectItem value="Agen">Agen</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tower</Label>
              <Select value={tower} onValueChange={setTower}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {["A", "B", "C", "D"].map((t) => (
                    <SelectItem key={t} value={t}>Tower {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dari Tanggal</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sampai Tanggal</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Nama Penghuni</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Diperbarui</TableHead>
                    <TableHead>Status Kepenghunian</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Belum ada data pemutakhiran.
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{r.unit_number}</TableCell>
                      <TableCell>{r.full_name}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>
                        {r.last_updated_at ? new Date(r.last_updated_at).toLocaleString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>{r.penghuni_status || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setDetail(r)}>
                            <Eye className="w-4 h-4 mr-1" /> Lihat Detail
                          </Button>
                          {isAdmin && r.status !== "perlu_diperbarui" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateStatus.mutate({ id: r.id, status: "perlu_diperbarui" })}
                            >
                              Tandai Perlu Diperbarui
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Data Penghuni</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <Section title="Data Unit">
                <Row label="Nomor Unit" value={detail.unit_number} />
                <Row label="Tower" value={detail.tower} />
              </Section>
              <Section title="Data Penghuni">
                <Row label="Nama" value={detail.full_name} />
                <Row label="Status Kepenghunian" value={detail.penghuni_status} />
                <Row label="Nama Pemilik/Agen" value={detail.owner_agent_name} />
                <Row label="Lama Tinggal" value={detail.lama_tinggal} />
              </Section>
              <Section title="Data Kontak">
                <Row label="Nomor Telepon" value={detail.phone} />
                <Row label="Email" value={detail.email} />
                <Row
                  label="Kontak Darurat"
                  value={[detail.emergency_name, detail.emergency_phone, detail.emergency_relation]
                    .filter(Boolean)
                    .join(" • ")}
                />
              </Section>
              <Section title="Data Khusus">
                <Row label="Kondisi" value={(detail.special_conditions || []).join(", ")} />
                <Row label="Lansia" value={detail.lansia_name} />
                <Row label="Balita" value={detail.balita_name} />
                <Row label="Ibu Hamil" value={detail.ibu_hamil_name} />
                <Row
                  label="Kondisi Kesehatan"
                  value={[detail.health_name, detail.health_note].filter(Boolean).join(" - ")}
                />
                <Row label="Lainnya" value={detail.other_condition_note} />
              </Section>
              <Section title="Riwayat Pemutakhiran">
                <Row
                  label="Terakhir Diperbarui"
                  value={detail.last_updated_at ? new Date(detail.last_updated_at).toLocaleString("id-ID") : "-"}
                />
                <Row label="Diperbarui Oleh" value={detail.updated_by_name} />
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <p className="font-semibold text-foreground mb-2">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value || "-"}</span>
    </div>
  );
}
