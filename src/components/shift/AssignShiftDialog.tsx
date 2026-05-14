import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useShifts, useAssignSchedules, type AssignInput } from "@/hooks/useShifts";
import { useEmployeeBiodataList } from "@/hooks/useEmployeeBiodata";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type Pattern = "harian" | "mingguan_rotasi" | "bulanan";

export function AssignShiftDialog({ open, onOpenChange, defaultDate }: { open: boolean; onOpenChange: (v: boolean) => void; defaultDate?: string }) {
  const { data: shifts = [] } = useShifts();
  const { data: employees = [] } = useEmployeeBiodataList();
  const assign = useAssignSchedules();

  const today = defaultDate ?? new Date().toISOString().split("T")[0];
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [pattern, setPattern] = useState<Pattern>("harian");
  const [shiftId, setShiftId] = useState<string>("");
  const [rotationShiftIds, setRotationShiftIds] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const expandDates = (s: string, e: string): string[] => {
    const out: string[] = [];
    const cur = new Date(s);
    const last = new Date(e);
    while (cur <= last) {
      out.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const toggleEmp = (id: string) => setSelectedEmployees((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  const toggleRotShift = (id: string) => setRotationShiftIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  const handleSubmit = async () => {
    if (!selectedEmployees.length) return;
    const dates = expandDates(start, end);
    if (!dates.length) return;

    const inputs: AssignInput[] = [];
    if (pattern === "mingguan_rotasi" && rotationShiftIds.length) {
      // Rotasi: tiap karyawan dapat shift berputar per minggu
      selectedEmployees.forEach((empId, empIdx) => {
        const emp = employees.find((e) => e.user_id === empId);
        const dateGroups = new Map<string, string[]>();
        dates.forEach((d) => {
          const week = Math.floor((new Date(d).getTime() - new Date(start).getTime()) / (7 * 86400000));
          const sIdx = (empIdx + week) % rotationShiftIds.length;
          const sid = rotationShiftIds[sIdx];
          if (!dateGroups.has(sid)) dateGroups.set(sid, []);
          dateGroups.get(sid)!.push(d);
        });
        dateGroups.forEach((ds, sid) => {
          inputs.push({ user_id: empId, employee_name: emp?.full_name ?? null, shift_id: sid, dates: ds, notes });
        });
      });
    } else {
      if (!shiftId) return;
      selectedEmployees.forEach((empId) => {
        const emp = employees.find((e) => e.user_id === empId);
        let appliedDates = dates;
        if (pattern === "bulanan") {
          // ambil tanggal yang sama di tiap bulan dalam rentang
          const dayOfMonth = new Date(start).getDate();
          appliedDates = dates.filter((d) => new Date(d).getDate() === dayOfMonth);
        }
        inputs.push({ user_id: empId, employee_name: emp?.full_name ?? null, shift_id: shiftId, dates: appliedDates, notes });
      });
    }

    await assign.mutateAsync(inputs);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tetapkan Jadwal Shift</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Pola Penjadwalan</Label>
            <Select value={pattern} onValueChange={(v) => setPattern(v as Pattern)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="harian">Harian (semua hari)</SelectItem>
                <SelectItem value="mingguan_rotasi">Rotasi Mingguan</SelectItem>
                <SelectItem value="bulanan">Bulanan (tanggal sama tiap bulan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pattern === "mingguan_rotasi" ? (
            <div>
              <Label>Pilih Shift untuk Rotasi (urutan)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {shifts.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 px-2 py-1 border rounded-md cursor-pointer" style={{ borderColor: rotationShiftIds.includes(s.id) ? s.color : undefined }}>
                    <Checkbox checked={rotationShiftIds.includes(s.id)} onCheckedChange={() => toggleRotShift(s.id)} />
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label>Shift</Label>
              <Select value={shiftId} onValueChange={setShiftId}>
                <SelectTrigger><SelectValue placeholder="Pilih shift" /></SelectTrigger>
                <SelectContent>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Karyawan ({selectedEmployees.length} dipilih)</Label>
            <ScrollArea className="h-48 border rounded-md p-2 mt-1">
              <div className="space-y-1">
                {employees.map((e) => (
                  <label key={e.user_id} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded cursor-pointer">
                    <Checkbox checked={selectedEmployees.includes(e.user_id)} onCheckedChange={() => toggleEmp(e.user_id)} />
                    <span className="text-sm">{e.full_name}</span>
                  </label>
                ))}
                {!employees.length && <p className="text-sm text-muted-foreground p-2">Belum ada data karyawan.</p>}
              </div>
            </ScrollArea>
          </div>

          <div>
            <Label>Catatan (opsional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={assign.isPending || !selectedEmployees.length}>Terapkan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
