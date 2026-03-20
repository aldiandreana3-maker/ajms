import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, BarChart3, Shield,
  Download, FileSpreadsheet, Presentation, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import * as XLSX from "xlsx";

const COLORS = [
  "hsl(142 76% 36%)",   // done - green
  "hsl(48 96% 53%)",    // in-progress - yellow
  "hsl(0 84% 60%)",     // pending - red
];

interface DivisionData {
  name: string;
  description: string;
  done: number;
  inProgress: number;
  pending: number;
  total: number;
  details: { label: string; value: string | number }[];
  rawData: Record<string, any>[];
  exportColumns: { header: string; key: string; width?: number }[];
}

// Table-to-order-column mapping for batch export
const TABLE_ORDER_MAP: Record<string, string> = {
  keluhan: "created_at",
  field_inspections: "created_at",
  housekeeping_tasks: "task_date",
  security_patrols: "patrol_time",
  packages: "created_at",
  work_permits: "created_at",
};

// Helper to fetch all rows from a table using batched pagination (bypasses 1000 row limit)
async function fetchAllRows(table: string, orderCol: string) {
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allData = allData.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    from += PAGE_SIZE;
  }
  return allData;
}

// Division name -> table name mapping for export
const DIVISION_TABLE_MAP: Record<string, string> = {
  "Tenant Relation Office": "keluhan",
  "Engineering": "field_inspections",
  "House Keeping": "housekeeping_tasks",
  "Security": "security_patrols",
  "Pelayanan Paket": "packages",
  "Izin Kerja": "work_permits",
};

function useAllDivisionsData() {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["laporan-kerja-full", today],
    queryFn: async () => {
      // First, get accurate counts using HEAD count queries (no row limit)
      const [
        keluhanTotal, keluhanSelesai, keluhanProses, keluhanPending,
        inspTotal, inspSelesai, inspDalam, inspBelum,
        hkTotal, hkSelesai, hkBelum, hkToday,
        secTotal, secAman, secMencurigakan, secBahaya, secToday,
        pkgTotal, pkgDiambil, pkgBelum,
        wpTotal, wpApproved, wpPending, wpRejected,
      ] = await Promise.all([
        supabase.from("keluhan").select("id", { count: "exact", head: true }),
        supabase.from("keluhan").select("id", { count: "exact", head: true }).eq("status", "selesai"),
        supabase.from("keluhan").select("id", { count: "exact", head: true }).eq("status", "proses"),
        supabase.from("keluhan").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }).eq("work_status", "selesai"),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }).eq("work_status", "dalam_pengerjaan"),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }).eq("work_status", "belum_dikerjakan"),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }).eq("status", "selesai"),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }).eq("status", "belum"),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }).eq("task_date", today),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }).eq("status", "aman"),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }).eq("status", "mencurigakan"),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }).eq("status", "bahaya"),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }).eq("patrol_date", today),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("status", "diambil"),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("status", "belum_diambil"),
        supabase.from("work_permits").select("id", { count: "exact", head: true }),
        supabase.from("work_permits").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("work_permits").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("work_permits").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);

      const divisions: DivisionData[] = [
        {
          name: "Tenant Relation Office",
          description: "Pengelolaan keluhan penghuni dan layanan pelanggan",
          done: keluhanSelesai.count || 0,
          inProgress: keluhanProses.count || 0,
          pending: keluhanPending.count || 0,
          total: keluhanTotal.count || 0,
          details: [
            { label: "Total Keluhan", value: keluhanTotal.count || 0 },
            { label: "Selesai", value: keluhanSelesai.count || 0 },
            { label: "Dalam Proses", value: keluhanProses.count || 0 },
            { label: "Pending", value: keluhanPending.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Tanggal", key: "created_at", width: 20 },
            { header: "Penghuni", key: "penghuni_name", width: 20 },
            { header: "Unit", key: "unit_number", width: 10 },
            { header: "Subjek", key: "subject", width: 25 },
            { header: "Status", key: "status", width: 12 },
          ],
        },
        {
          name: "Engineering",
          description: "Inspeksi lapangan dan pemeliharaan teknis gedung",
          done: inspSelesai.count || 0,
          inProgress: inspDalam.count || 0,
          pending: inspBelum.count || 0,
          total: inspTotal.count || 0,
          details: [
            { label: "Total Inspeksi", value: inspTotal.count || 0 },
            { label: "Selesai", value: inspSelesai.count || 0 },
            { label: "Dalam Pengerjaan", value: inspDalam.count || 0 },
            { label: "Belum Dikerjakan", value: inspBelum.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Tanggal", key: "created_at", width: 20 },
            { header: "Unit", key: "unit_number", width: 10 },
            { header: "Temuan", key: "finding_description", width: 35 },
            { header: "Status", key: "work_status", width: 15 },
            { header: "Pelapor", key: "created_by_name", width: 20 },
          ],
        },
        {
          name: "House Keeping",
          description: "Pengelolaan kebersihan dan pemeliharaan area gedung",
          done: hkSelesai.count || 0,
          inProgress: 0,
          pending: hkBelum.count || 0,
          total: hkTotal.count || 0,
          details: [
            { label: "Total Tugas", value: hkTotal.count || 0 },
            { label: "Selesai", value: hkSelesai.count || 0 },
            { label: "Belum", value: hkBelum.count || 0 },
            { label: "Hari Ini", value: hkToday.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Tanggal", key: "task_date", width: 15 },
            { header: "Area", key: "area_name", width: 20 },
            { header: "Deskripsi", key: "task_description", width: 30 },
            { header: "Status", key: "status", width: 12 },
            { header: "Petugas", key: "completed_by_name", width: 20 },
          ],
        },
        {
          name: "Security",
          description: "Sistem patroli keamanan dan penjagaan gedung",
          done: secAman.count || 0,
          inProgress: secMencurigakan.count || 0,
          pending: secBahaya.count || 0,
          total: secTotal.count || 0,
          details: [
            { label: "Total Patroli", value: secTotal.count || 0 },
            { label: "Aman", value: secAman.count || 0 },
            { label: "Mencurigakan", value: secMencurigakan.count || 0 },
            { label: "Bahaya", value: secBahaya.count || 0 },
            { label: "Hari Ini", value: secToday.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Waktu", key: "patrol_time", width: 20 },
            { header: "Lokasi", key: "location", width: 25 },
            { header: "Status", key: "status", width: 15 },
            { header: "Petugas", key: "officer_name", width: 20 },
            { header: "Catatan", key: "notes", width: 30 },
          ],
        },
        {
          name: "Pelayanan Paket",
          description: "Pengelolaan penerimaan dan distribusi paket penghuni",
          done: pkgDiambil.count || 0,
          inProgress: 0,
          pending: pkgBelum.count || 0,
          total: pkgTotal.count || 0,
          details: [
            { label: "Total Paket", value: pkgTotal.count || 0 },
            { label: "Sudah Diambil", value: pkgDiambil.count || 0 },
            { label: "Belum Diambil", value: pkgBelum.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Tanggal", key: "created_at", width: 20 },
            { header: "Pemilik", key: "owner_name", width: 20 },
            { header: "Unit", key: "unit_number", width: 10 },
            { header: "Nama Barang", key: "item_name", width: 25 },
            { header: "Kurir", key: "courier", width: 15 },
            { header: "Status", key: "status", width: 15 },
          ],
        },
        {
          name: "Izin Kerja",
          description: "Pengelolaan perizinan kerja vendor dan kontraktor",
          done: wpApproved.count || 0,
          inProgress: wpPending.count || 0,
          pending: wpRejected.count || 0,
          total: wpTotal.count || 0,
          details: [
            { label: "Total Pengajuan", value: wpTotal.count || 0 },
            { label: "Disetujui", value: wpApproved.count || 0 },
            { label: "Pending", value: wpPending.count || 0 },
            { label: "Ditolak", value: wpRejected.count || 0 },
          ],
          rawData: [],
          exportColumns: [
            { header: "Tanggal", key: "created_at", width: 20 },
            { header: "Vendor", key: "vendor_name", width: 20 },
            { header: "Unit", key: "unit_number", width: 10 },
            { header: "Pekerjaan", key: "work_description", width: 30 },
            { header: "Status", key: "status", width: 12 },
          ],
        },
      ];

      return divisions;
    },
  });
}

function DivisionSlide({ division, index, total }: { division: DivisionData; index: number; total: number }) {
  const pct = division.total > 0 ? Math.round((division.done / division.total) * 100) : 0;

  const pieData = [
    { name: "Selesai", value: division.done },
    { name: "Dalam Proses", value: division.inProgress },
    { name: "Pending/Belum", value: division.pending },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-muted-foreground">{payload[0].value} item</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-w-full snap-center px-1">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">{division.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{division.description}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {index + 1}/{total}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pie Chart */}
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length > 0 ? pieData : [{ name: "Kosong", value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {(pieData.length > 0 ? pieData : [{ name: "Kosong", value: 1 }]).map((_, i) => (
                      <Cell key={i} fill={pieData.length > 0 ? COLORS[i % COLORS.length] : "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="text-3xl font-bold text-foreground">{pct}%</div>
              <p className="text-xs text-muted-foreground">Tingkat Penyelesaian</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "Selesai", color: COLORS[0] },
                  { label: "Proses", color: COLORS[1] },
                  { label: "Pending", color: COLORS[2] },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Stats */}
          <div className="grid grid-cols-2 gap-2">
            {division.details.map(d => (
              <div key={d.label} className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-lg font-bold text-foreground">{d.value}</p>
                <p className="text-xs text-muted-foreground">{d.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function exportDivisionExcel(division: DivisionData) {
  const table = DIVISION_TABLE_MAP[division.name];
  if (!table) return;
  const orderCol = TABLE_ORDER_MAP[table] || "created_at";
  const rawData = await fetchAllRows(table, orderCol);
  
  const transformed = rawData.map(row => {
    const newRow: Record<string, any> = {};
    division.exportColumns.forEach(col => {
      let val = row[col.key] ?? "-";
      if (col.key.includes("created_at") || col.key.includes("patrol_time")) {
        try { val = format(new Date(val), "dd/MM/yyyy HH:mm", { locale: localeId }); } catch {}
      }
      newRow[col.header] = val;
    });
    return newRow;
  });
  const ws = XLSX.utils.json_to_sheet(transformed);
  ws["!cols"] = division.exportColumns.map(c => ({ wch: c.width || 15 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, division.name.substring(0, 31));
  XLSX.writeFile(wb, `Laporan_${division.name.replace(/\s+/g, "_")}.xlsx`);
}

async function exportAllExcel(divisions: DivisionData[]) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = divisions.map(d => ({
    Divisi: d.name,
    Total: d.total,
    Selesai: d.done,
    "Dalam Proses": d.inProgress,
    Pending: d.pending,
    "Persentase (%)": d.total > 0 ? Math.round((d.done / d.total) * 100) : 0,
  }));
  const summaryWs = XLSX.utils.json_to_sheet(summary);
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Ringkasan");

  // Per-division sheets - fetch all data in parallel
  const allRawData = await Promise.all(
    divisions.map(div => {
      const table = DIVISION_TABLE_MAP[div.name];
      if (!table) return Promise.resolve([]);
      return fetchAllRows(table, TABLE_ORDER_MAP[table] || "created_at");
    })
  );

  divisions.forEach((div, idx) => {
    const data = allRawData[idx].map(row => {
      const newRow: Record<string, any> = {};
      div.exportColumns.forEach(col => {
        let val = row[col.key] ?? "-";
        if (col.key.includes("created_at") || col.key.includes("patrol_time")) {
          try { val = format(new Date(val), "dd/MM/yyyy HH:mm", { locale: localeId }); } catch {}
        }
        newRow[col.header] = val;
      });
      return newRow;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = div.exportColumns.map(c => ({ wch: c.width || 15 }));
    XLSX.utils.book_append_sheet(wb, ws, div.name.substring(0, 31));
  });

  XLSX.writeFile(wb, `Laporan_Kerja_Semua_Divisi_${format(new Date(), "yyyyMMdd")}.xlsx`);
}

  // Detail per division
  divisions.forEach(div => {
    const detailRows = div.details.map(d => ({ Kategori: d.label, Jumlah: d.value }));
    const ws = XLSX.utils.json_to_sheet(detailRows);
    ws["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, div.name.substring(0, 31));
  });

  XLSX.writeFile(wb, `Presentasi_Laporan_Kerja_${format(new Date(), "yyyyMMdd")}.xlsx`);
}

export default function LaporanKerja() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, role } = useAuth();
  const isStaff = isSuperAdmin || isAdmin || (role && role.startsWith("staff"));
  const { data: divisions, isLoading } = useAllDivisionsData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isStaff) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Shield className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground">Halaman ini hanya untuk Super Admin, Admin, dan Staff</p>
        </div>
      </MainLayout>
    );
  }

  const scrollToSlide = (idx: number) => {
    if (!scrollRef.current || !divisions) return;
    const clamped = Math.max(0, Math.min(idx, divisions.length - 1));
    setCurrentSlide(clamped);
    const container = scrollRef.current;
    container.scrollTo({ left: clamped * container.offsetWidth, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const c = scrollRef.current;
    const idx = Math.round(c.scrollLeft / c.offsetWidth);
    setCurrentSlide(idx);
  };

  return (
    <MainLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Laporan Kerja</h1>
              <p className="text-xs text-muted-foreground">Laporan seluruh divisi kepengelolaan</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : divisions && divisions.length > 0 ? (
          <>
            {/* Summary Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Ringkasan</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-foreground">
                      {divisions.reduce((a, d) => a + d.total, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total Pekerjaan</p>
                  </div>
                  <div className="text-center bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold" style={{ color: COLORS[0] }}>
                      {divisions.reduce((a, d) => a + d.done, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Selesai</p>
                  </div>
                  <div className="text-center bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold" style={{ color: COLORS[2] }}>
                      {divisions.reduce((a, d) => a + d.pending, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Dots & Arrows */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentSlide === 0}
                onClick={() => scrollToSlide(currentSlide - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex gap-1.5">
                {divisions.map((d, i) => (
                  <button
                    key={d.name}
                    onClick={() => scrollToSlide(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentSlide
                        ? "w-6 bg-primary"
                        : "w-2 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentSlide === divisions.length - 1}
                onClick={() => scrollToSlide(currentSlide + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Slides Container */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {divisions.map((div, i) => (
                <DivisionSlide key={div.name} division={div} index={i} total={divisions.length} />
              ))}
            </div>

            {/* Export Buttons */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Export Laporan
                </p>

                {/* Export current division */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => divisions[currentSlide] && exportDivisionExcel(divisions[currentSlide])}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    Excel ({divisions[currentSlide]?.name})
                  </Button>
                </div>

                {/* Export all */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => exportAllExcel(divisions)}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                    Excel Semua Divisi
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={() => exportPowerPoint(divisions)}
                  >
                    <Presentation className="w-3.5 h-3.5 mr-1.5" />
                    PowerPoint
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada data laporan kerja</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
