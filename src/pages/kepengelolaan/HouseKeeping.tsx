import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { useProfile } from "@/hooks/useProfile";
import { ArrowLeft, Plus, Sparkles, CheckCircle2, Clock, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const AREA_OPTIONS = [
  "Lobby Utama", "Lobby Lift Lt. 1", "Koridor Lt. 2", "Koridor Lt. 3", "Koridor Lt. 4", "Koridor Lt. 5",
  "Koridor Lt. 6", "Koridor Lt. 7", "Koridor Lt. 8", "Tangga Darurat", "Area Parkir B1", "Area Parkir B2",
  "Kolam Renang", "Gym / Fitness", "Taman", "Mushola", "Toilet Umum Lt. 1", "Toilet Umum Lt. 2",
  "Ruang Serbaguna", "Area Loading Dock",
];

export default function HouseKeeping() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const { tasks, addTask, updateTask } = useHousekeeping();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ area_name: "", task_description: "", assigned_to: "" });
  const [loading, setLoading] = useState(false);

  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;
  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Sparkles className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async () => {
    if (!form.area_name || !form.task_description) return;
    setLoading(true);
    try {
      await addTask.mutateAsync({
        area_name: form.area_name,
        task_description: form.task_description,
        assigned_to: form.assigned_to || null,
        created_by: user?.id,
        created_by_name: profile?.full_name || user?.email || "",
      });
      setForm({ area_name: "", task_description: "", assigned_to: "" });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (task: any) => {
    const isCompleting = task.status === "belum";
    await updateTask.mutateAsync({
      id: task.id,
      status: isCompleting ? "selesai" : "belum",
      completed_at: isCompleting ? new Date().toISOString() : null,
      completed_by: isCompleting ? user?.id : null,
      completed_by_name: isCompleting ? (profile?.full_name || user?.email || "") : null,
    });
  };

  const todayTasks = tasks.data?.filter(t => t.task_date === format(new Date(), "yyyy-MM-dd")) || [];
  const completedToday = todayTasks.filter(t => t.status === "selesai").length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">House Keeping</h1>
              <p className="text-muted-foreground">Daftar aktivitas kebersihan harian</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Tambah Tugas</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Tambah Tugas Kebersihan</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Area <span className="text-destructive">*</span></label>
                  <Select value={form.area_name} onValueChange={v => setForm(f => ({ ...f, area_name: v }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih area" /></SelectTrigger>
                    <SelectContent>
                      {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Deskripsi Tugas <span className="text-destructive">*</span></label>
                  <Textarea placeholder="Contoh: Sapu & pel lantai, bersihkan kaca..." value={form.task_description} onChange={e => setForm(f => ({ ...f, task_description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium">Ditugaskan Kepada</label>
                  <Input placeholder="Nama petugas" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} />
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={loading || !form.area_name || !form.task_description}>
                  {loading ? "Menyimpan..." : "Simpan Tugas"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Tugas Hari Ini", value: todayTasks.length, icon: ListChecks, color: "text-primary" },
            { label: "Selesai", value: completedToday, icon: CheckCircle2, color: "text-green-600" },
            { label: "Belum Dikerjakan", value: todayTasks.length - completedToday, icon: Clock, color: "text-warning" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress */}
        {todayTasks.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress Hari Ini</span>
                <span className="text-sm text-muted-foreground">{completedToday}/{todayTasks.length}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${todayTasks.length ? (completedToday / todayTasks.length) * 100 : 0}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader><CardTitle>Daftar Tugas Kebersihan</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">✓</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Ditugaskan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diselesaikan Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.data?.map(t => (
                    <TableRow key={t.id} className={t.status === "selesai" ? "opacity-60" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={t.status === "selesai"}
                          onCheckedChange={() => handleToggleComplete(t)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(t.task_date), "dd MMM yyyy", { locale: localeId })}</TableCell>
                      <TableCell>{t.area_name}</TableCell>
                      <TableCell className="max-w-[250px]">{t.task_description}</TableCell>
                      <TableCell>{t.assigned_to || "-"}</TableCell>
                      <TableCell>
                        <Badge className={t.status === "selesai" ? "bg-green-500/10 text-green-700 border-green-300" : "bg-yellow-500/10 text-yellow-700 border-yellow-300"}>
                          {t.status === "selesai" ? "Selesai" : "Belum"}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.completed_by_name || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {!tasks.data?.length && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada tugas kebersihan</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
