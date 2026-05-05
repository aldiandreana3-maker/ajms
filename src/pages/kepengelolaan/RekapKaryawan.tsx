import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, ArrowLeft, Loader2, MapPin, ExternalLink, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllAttendance } from "@/hooks/useEmployeeAttendance";
import { useEmployeeLeaves, useUpdateLeaveStatus } from "@/hooks/useEmployeeLeaves";
import { useEmployeeOvertimes, useUpdateOvertimeStatus } from "@/hooks/useEmployeeOvertimes";
import { useEmployeePermits, useUpdatePermitStatus } from "@/hooks/useEmployeePermits";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ExcelJS from "exceljs";
import { useToast } from "@/hooks/use-toast";

function useProfiles() {
  return useQuery({
    queryKey: ["all-profiles-for-hrd"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });
}

export default function RekapKaryawan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const now = new Date();
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const { data: profiles } = useProfiles();
  const { data: attendance, isLoading: attLoading } = useAllAttendance();
  const { data: leaves, isLoading: leaveLoading } = useEmployeeLeaves();
  const { data: overtimes, isLoading: otLoading } = useEmployeeOvertimes();
  const { data: permits, isLoading: permLoading } = useEmployeePermits();
  const updateLeave = useUpdateLeaveStatus();
  const updateOvertime = useUpdateOvertimeStatus();
  const updatePermit = useUpdatePermitStatus();

  const getName = (userId: string) => profiles?.find(p => p.id === userId)?.full_name || "Unknown";

  const fmtHHMM = (t: string | null) => t ? new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";

  const handleExportMonthly = async () => {
    if (!attendance || !profiles) return;
    setExporting(true);
    try {
      const daysInMonth = new Date(exportYear, exportMonth, 0).getDate();
      const monthStr = String(exportMonth).padStart(2, "0");
      const yearStr = String(exportYear);

      // Filter attendance for the selected month
      const monthAtt = attendance.filter(a => {
        const d = a.attendance_date; // YYYY-MM-DD
        return d.startsWith(`${yearStr}-${monthStr}`);
      });

      // Unique users that have attendance OR all profiles - use users with any attendance in month, fallback to all
      const userIds = Array.from(new Set(monthAtt.map(a => a.user_id)));
      // Sort by name
      const users = userIds
        .map(id => ({ id, name: getName(id) }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Map: userId -> day -> {in, out}
      const map: Record<string, Record<number, { in: string; out: string }>> = {};
      monthAtt.forEach(a => {
        const day = parseInt(a.attendance_date.split("-")[2], 10);
        if (!map[a.user_id]) map[a.user_id] = {};
        map[a.user_id][day] = {
          in: fmtHHMM(a.check_in_time),
          out: fmtHHMM(a.check_out_time),
        };
      });

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`Absensi ${monthStr}-${yearStr}`);

      // Header rows
      const headerRow = ["Nama"];
      for (let d = 1; d <= daysInMonth; d++) {
        headerRow.push(`${String(d).padStart(2, "0")}/${monthStr}`);
      }
      const hRow = ws.addRow(headerRow);
      hRow.eachCell(cell => {
        cell.font = { bold: true, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });

      // Data rows
      users.forEach(u => {
        const row: string[] = [u.name];
        for (let d = 1; d <= daysInMonth; d++) {
          const entry = map[u.id]?.[d];
          row.push(entry ? `${entry.in}\n${entry.out}` : "");
        }
        const r = ws.addRow(row);
        r.height = 30;
        r.eachCell((cell, col) => {
          cell.alignment = { horizontal: col === 1 ? "left" : "center", vertical: "middle", wrapText: true };
          cell.font = { size: 9 };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" },
          };
        });
      });

      // Column widths
      ws.getColumn(1).width = 25;
      for (let i = 2; i <= daysInMonth + 1; i++) {
        ws.getColumn(i).width = 9;
      }
      ws.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Rekap-Absensi-${yearStr}-${monthStr}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "Berhasil", description: "Rekap absensi bulanan berhasil di-export" });
    } catch (e: any) {
      toast({ title: "Gagal", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };


  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "hadir": return <Badge className="bg-success text-white">Hadir</Badge>;
      case "terlambat": return <Badge variant="destructive">Terlambat</Badge>;
      case "approved": return <Badge className="bg-success text-white">Disetujui</Badge>;
      case "rejected": return <Badge variant="destructive">Ditolak</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (t: string | null) => t ? new Date(t).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/hrd-ga")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rekap Karyawan</h1>
            <p className="text-muted-foreground">Rekap Absensi, Cuti, Lembur & Izin</p>
          </div>
        </div>

        <Tabs defaultValue="absensi">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="absensi">Absensi</TabsTrigger>
            <TabsTrigger value="cuti">Cuti</TabsTrigger>
            <TabsTrigger value="lembur">Lembur</TabsTrigger>
            <TabsTrigger value="izin">Izin</TabsTrigger>
          </TabsList>

          <TabsContent value="absensi">
            <Card>
              <CardHeader><CardTitle>Rekap Kehadiran</CardTitle></CardHeader>
              <CardContent>
                {attLoading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nama</TableHead><TableHead>Tanggal</TableHead><TableHead>Masuk</TableHead><TableHead>Pulang</TableHead><TableHead>Lokasi Masuk</TableHead><TableHead>Lokasi Pulang</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {attendance?.map(a => (
                          <TableRow key={a.id}>
                            <TableCell>{getName(a.user_id)}</TableCell>
                            <TableCell>{new Date(a.attendance_date).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>{formatTime(a.check_in_time)}</TableCell>
                            <TableCell>{formatTime(a.check_out_time)}</TableCell>
                            <TableCell>
                              {a.check_in_latitude && a.check_in_longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${a.check_in_latitude},${a.check_in_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>{Number(a.check_in_latitude).toFixed(4)}, {Number(a.check_in_longitude).toFixed(4)}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {a.check_out_latitude && a.check_out_longitude ? (
                                <a
                                  href={`https://www.google.com/maps?q=${a.check_out_latitude},${a.check_out_longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>{Number(a.check_out_latitude).toFixed(4)}, {Number(a.check_out_longitude).toFixed(4)}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>{statusBadge(a.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cuti">
            <Card>
              <CardHeader><CardTitle>Rekap Cuti</CardTitle></CardHeader>
              <CardContent>
                {leaveLoading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nama</TableHead><TableHead>Jenis</TableHead><TableHead>Mulai</TableHead><TableHead>Selesai</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {leaves?.map(l => (
                          <TableRow key={l.id}>
                            <TableCell>{getName(l.user_id)}</TableCell>
                            <TableCell>{l.leave_type}</TableCell>
                            <TableCell>{new Date(l.start_date).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>{new Date(l.end_date).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>{statusBadge(l.status)}</TableCell>
                            <TableCell>
                              {l.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="text-success" onClick={() => updateLeave.mutate({ id: l.id, status: "approved" })}>✓</Button>
                                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateLeave.mutate({ id: l.id, status: "rejected" })}>✗</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lembur">
            <Card>
              <CardHeader><CardTitle>Rekap Lembur</CardTitle></CardHeader>
              <CardContent>
                {otLoading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nama</TableHead><TableHead>Tanggal</TableHead><TableHead>Mulai</TableHead><TableHead>Selesai</TableHead><TableHead>Jam</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {overtimes?.map(o => (
                          <TableRow key={o.id}>
                            <TableCell>{getName(o.user_id)}</TableCell>
                            <TableCell>{new Date(o.overtime_date).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>{o.start_time}</TableCell>
                            <TableCell>{o.end_time}</TableCell>
                            <TableCell>{o.hours ? `${Number(o.hours).toFixed(1)}` : "-"}</TableCell>
                            <TableCell>{statusBadge(o.status)}</TableCell>
                            <TableCell>
                              {o.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="text-success" onClick={() => updateOvertime.mutate({ id: o.id, status: "approved" })}>✓</Button>
                                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateOvertime.mutate({ id: o.id, status: "rejected" })}>✗</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="izin">
            <Card>
              <CardHeader><CardTitle>Rekap Izin</CardTitle></CardHeader>
              <CardContent>
                {permLoading ? <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nama</TableHead><TableHead>Jenis</TableHead><TableHead>Tanggal</TableHead><TableHead>Alasan</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {permits?.map(p => (
                          <TableRow key={p.id}>
                            <TableCell>{getName(p.user_id)}</TableCell>
                            <TableCell>{p.permit_type}</TableCell>
                            <TableCell>{new Date(p.permit_date).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{p.reason}</TableCell>
                            <TableCell>{statusBadge(p.status)}</TableCell>
                            <TableCell>
                              {p.status === "pending" && (
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" className="text-success" onClick={() => updatePermit.mutate({ id: p.id, status: "approved" })}>✓</Button>
                                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updatePermit.mutate({ id: p.id, status: "rejected" })}>✗</Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
