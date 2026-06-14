import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, Plus, Edit2, Trash2, History, Search, Sparkles, ShieldAlert } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useDataTokens, useDataTokenHistory, DataToken, generateAllUnits } from "@/hooks/useDataTokens";
import { TablePagination } from "@/components/shared/TablePagination";
import { format } from "date-fns";

const TOWERS = ["A", "B", "C", "D"];
const FLOORS = Array.from({ length: 23 }, (_, i) => i + 1).filter((f) => ![4, 13, 14].includes(f));

export default function DataTokenPage() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isMasterDev, profile } = useAuth() as any;
  const canManage = isAdmin || isSuperAdmin || isMasterDev;
  const { tokens, isLoading, generateUnits, createOne, updateOne, deleteOne } = useDataTokens();

  const [search, setSearch] = useState("");
  const [filterTower, setFilterTower] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterBypassDate, setFilterBypassDate] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [dlgOpen, setDlgOpen] = useState(false);
  const [editRow, setEditRow] = useState<DataToken | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<DataToken | null>(null);
  const { data: history = [] } = useDataTokenHistory(historyRow?.id);

  // form
  const [fUnit, setFUnit] = useState("");
  const [fKwhId, setFKwhId] = useState("");
  const [fSisa, setFSisa] = useState("0");
  const [fBypass, setFBypass] = useState("");
  const [fNormalisasi, setFNormalisasi] = useState("");
  const [fStatus, setFStatus] = useState("normalisasi");
  const [fCatatan, setFCatatan] = useState("");

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      if (filterTower !== "all" && t.tower !== filterTower) return false;
      if (filterFloor !== "all" && String(t.floor) !== filterFloor) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "kosong") {
          if (t.status) return false;
        } else if (t.status !== filterStatus) return false;
      }
      if (filterBypassDate && t.tanggal_bypass !== filterBypassDate) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.unit_number.toLowerCase().includes(q) && !(t.kwh_id || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tokens, filterTower, filterFloor, filterStatus, filterBypassDate, search]);

  const stats = useMemo(() => {
    const total = tokens.length;
    let bypass = 0, normalisasi = 0, kosong = 0;
    for (const t of tokens) {
      if (t.status === "bypass") bypass++;
      else if (t.status === "normalisasi") normalisasi++;
      else kosong++;
    }
    const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
    return {
      total, bypass, normalisasi, kosong,
      bypassPct: pct(bypass), normalisasiPct: pct(normalisasi), kosongPct: pct(kosong),
      chartData: [
        { name: "Bypass", value: bypass, color: "hsl(var(--destructive))" },
        { name: "Normalisasi", value: normalisasi, color: "hsl(142 71% 45%)" },
        { name: "Belum Ternormalisasi", value: kosong, color: "hsl(var(--muted-foreground))" },
      ],
    };
  }, [tokens]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => {
    setFUnit("");
    setFKwhId("");
    setFSisa("0");
    setFBypass("");
    setFNormalisasi("");
    setFStatus("normalisasi");
    setFCatatan("");
    setEditRow(null);
  };

  const openAdd = () => {
    resetForm();
    setDlgOpen(true);
  };

  const openEdit = (row: DataToken) => {
    setEditRow(row);
    setFUnit(row.unit_number);
    setFKwhId(row.kwh_id || "");
    setFSisa(String(row.sisa_kwh ?? 0));
    setFBypass(row.tanggal_bypass || "");
    setFNormalisasi(row.tanggal_normalisasi || "");
    setFStatus(row.status);
    setFCatatan(row.catatan || "");
    setDlgOpen(true);
  };

  const handleSave = async () => {
    const unitTrim = fUnit.trim().toUpperCase();
    const tower = unitTrim[0];
    const floor = parseInt(unitTrim.slice(1, 3), 10);
    const unit_no = parseInt(unitTrim.slice(3, 5), 10);
    const payload: Partial<DataToken> = {
      unit_number: unitTrim,
      tower,
      floor,
      unit_no,
      kwh_id: fKwhId || null,
      sisa_kwh: parseFloat(fSisa) || 0,
      tanggal_bypass: fBypass || null,
      tanggal_normalisasi: fNormalisasi || null,
      status: fStatus,
      catatan: fCatatan || null,
    };
    if (editRow) {
      await updateOne.mutateAsync({
        id: editRow.id,
        old: editRow,
        updates: payload,
        userName: profile?.full_name || user?.email,
      });
    } else {
      await createOne.mutateAsync({ ...payload, created_by: user?.id } as any);
    }
    setDlgOpen(false);
    resetForm();
  };

  if (!user || !canManage) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        </div>
      </MainLayout>
    );
  }

  const totalPossible = generateAllUnits().length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/it")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Data Token</h1>
                <p className="text-muted-foreground">
                  {tokens.length} / {totalPossible} unit terdaftar
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tokens.length < totalPossible && (
              <Button
                variant="outline"
                onClick={() => generateUnits.mutate()}
                disabled={generateUnits.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Unit
              </Button>
            )}
            <Button onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Statistik Status */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(e: any) => `${e.name}: ${((e.value / (stats.total || 1)) * 100).toFixed(1)}%`}
                    >
                      {stats.chartData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ringkasan Status kWh</h3>
                <p className="text-sm text-muted-foreground">
                  Total {stats.total} unit kartu kWh
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div>
                      <p className="text-sm font-medium">Bypass / Jumper</p>
                      <p className="text-xs text-muted-foreground">{stats.bypass} unit</p>
                    </div>
                    <span className="text-2xl font-bold text-destructive">{stats.bypassPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div>
                      <p className="text-sm font-medium">Normalisasi</p>
                      <p className="text-xs text-muted-foreground">{stats.normalisasi} unit</p>
                    </div>
                    <span className="text-2xl font-bold text-green-600">{stats.normalisasiPct.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div>
                      <p className="text-sm font-medium">Kartu Belum Ternormalisasi</p>
                      <p className="text-xs text-muted-foreground">{stats.kosong} unit (belum di-bypass &amp; belum dinormalisasi)</p>
                    </div>
                    <span className="text-2xl font-bold text-muted-foreground">{stats.kosongPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari unit / ID kWh..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={filterTower} onValueChange={(v) => { setFilterTower(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Tower" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tower</SelectItem>
                {TOWERS.map((t) => <SelectItem key={t} value={t}>Tower {t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterFloor} onValueChange={(v) => { setFilterFloor(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Lantai" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lantai</SelectItem>
                {FLOORS.map((f) => <SelectItem key={f} value={String(f)}>Lantai {f}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="bypass">Bypass</SelectItem>
                <SelectItem value="normalisasi">Normalisasi</SelectItem>
                <SelectItem value="kosong">Belum Ternormalisasi</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Input
                type="date"
                placeholder="Tgl Jumper"
                value={filterBypassDate}
                onChange={(e) => { setFilterBypassDate(e.target.value); setPage(1); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit</TableHead>
                  <TableHead>ID kWh</TableHead>
                  <TableHead className="text-right">Sisa kWh</TableHead>
                  <TableHead>Tgl Bypass</TableHead>
                  <TableHead>Tgl Normalisasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Tidak ada data</TableCell></TableRow>
                ) : (
                  paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-medium">{t.unit_number}</TableCell>
                      <TableCell>{t.kwh_id || "-"}</TableCell>
                      <TableCell className="text-right">{Number(t.sisa_kwh).toFixed(2)}</TableCell>
                      <TableCell>{t.tanggal_bypass ? format(new Date(t.tanggal_bypass), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>{t.tanggal_normalisasi ? format(new Date(t.tanggal_normalisasi), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "bypass" ? "destructive" : t.status === "normalisasi" ? "default" : "outline"}>
                          {t.status || "Belum"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={t.catatan || ""}>{t.catatan || "-"}</TableCell>
                      <TableCell className="text-right space-x-1 whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => { setHistoryRow(t); setHistoryOpen(true); }}>
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (confirm(`Hapus data unit ${t.unit_number}?`)) deleteOne.mutate(t.id);
                        }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filtered.length > perPage && (
          <TablePagination
            currentPage={page}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={() => {}}
          />
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dlgOpen} onOpenChange={setDlgOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editRow ? "Edit Data Token" : "Tambah Data Token"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Nomor Unit (cth: A0101)</Label>
                <Input value={fUnit} onChange={(e) => setFUnit(e.target.value.toUpperCase())} maxLength={5} disabled={!!editRow} />
              </div>
              <div className="space-y-2">
                <Label>ID kWh</Label>
                <Input value={fKwhId} onChange={(e) => setFKwhId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Sisa kWh</Label>
                <Input type="number" step="0.01" value={fSisa} onChange={(e) => setFSisa(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tanggal Bypass</Label>
                  <Input type="date" value={fBypass} onChange={(e) => setFBypass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Normalisasi</Label>
                  <Input type="date" value={fNormalisasi} onChange={(e) => setFNormalisasi(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={fStatus} onValueChange={setFStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bypass">Bypass</SelectItem>
                    <SelectItem value="normalisasi">Normalisasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea
                  rows={3}
                  placeholder="cth: Token dapat diambil di kasir..."
                  value={fCatatan}
                  onChange={(e) => setFCatatan(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleSave} disabled={!fUnit || fUnit.length !== 5}>
                {editRow ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Riwayat Perubahan - {historyRow?.unit_number}</DialogTitle>
            </DialogHeader>
            {history.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">Belum ada riwayat</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{h.changed_by_name || "Sistem"}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.created_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    {h.old_status !== h.new_status && (
                      <p>Status: <Badge variant="outline">{h.old_status}</Badge> → <Badge>{h.new_status}</Badge></p>
                    )}
                    {(h.old_catatan || "") !== (h.new_catatan || "") && (
                      <p className="text-muted-foreground mt-1">
                        Catatan: "{h.old_catatan || "-"}" → "{h.new_catatan || "-"}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
