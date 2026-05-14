import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CalendarClock, Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShifts, useDeleteShift, type ShiftDefinition } from "@/hooks/useShifts";
import { ShiftFormDialog } from "@/components/shift/ShiftFormDialog";
import { AssignShiftDialog } from "@/components/shift/AssignShiftDialog";
import { ShiftCalendarView } from "@/components/shift/ShiftCalendarView";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function JadwalKerja() {
  const navigate = useNavigate();
  const { isAdmin, role, isLimitedAccess } = useAuth();
  const canManage = (isAdmin || role === "staff_hrd_ga") && !isLimitedAccess;

  const { data: shifts = [] } = useShifts();
  const delShift = useDeleteShift();
  const [shiftDialog, setShiftDialog] = useState<{ open: boolean; shift?: ShiftDefinition | null }>({ open: false });
  const [assignOpen, setAssignOpen] = useState(false);

  if (!canManage) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground">Hanya Admin/HRD yang dapat mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <CalendarClock className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Jadwal Kerja Karyawan</h1>
              <p className="text-muted-foreground">Pengaturan shift, rotasi, dan kalender jadwal</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="kalender">
          <TabsList>
            <TabsTrigger value="kalender">Kalender</TabsTrigger>
            <TabsTrigger value="shift">Pengaturan Shift</TabsTrigger>
            <TabsTrigger value="assign">Tetapkan Jadwal</TabsTrigger>
          </TabsList>

          <TabsContent value="kalender" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kalender Jadwal</CardTitle>
                <Button onClick={() => setAssignOpen(true)}><Plus className="w-4 h-4 mr-1" /> Tetapkan</Button>
              </CardHeader>
              <CardContent>
                <ShiftCalendarView canManage />
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  {shifts.map((s) => (
                    <div key={s.id} className="flex items-center gap-1.5 text-sm">
                      <span className="w-3 h-3 rounded" style={{ background: s.color }} />
                      {s.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shift" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Daftar Shift</CardTitle>
                <Button onClick={() => setShiftDialog({ open: true, shift: null })}><Plus className="w-4 h-4 mr-1" /> Tambah Shift</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shifts.map((s) => (
                    <Card key={s.id} className="overflow-hidden">
                      <div className="h-2" style={{ background: s.color }} />
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{s.name}</h3>
                            <p className="text-sm text-muted-foreground">{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setShiftDialog({ open: true, shift: s })}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm(`Hapus shift "${s.name}"?`)) delShift.mutate(s.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Toleransi: {s.late_tolerance_minutes} menit</p>
                        <div className="flex flex-wrap gap-1">
                          {s.working_days?.map((d) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{DAY_LABELS[d]}</span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!shifts.length && <p className="text-sm text-muted-foreground col-span-full">Belum ada shift.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Tetapkan / Rotasi Jadwal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Tetapkan shift untuk satu atau banyak karyawan dengan pola harian, rotasi mingguan, atau bulanan. Karyawan akan otomatis menerima notifikasi.</p>
                <Button onClick={() => setAssignOpen(true)}><Plus className="w-4 h-4 mr-1" /> Buka Form Penetapan</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ShiftFormDialog open={shiftDialog.open} onOpenChange={(v) => setShiftDialog({ open: v, shift: shiftDialog.shift })} shift={shiftDialog.shift} />
        <AssignShiftDialog open={assignOpen} onOpenChange={setAssignOpen} />
      </div>
    </MainLayout>
  );
}
