import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpsertShift, type ShiftDefinition } from "@/hooks/useShifts";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function ShiftFormDialog({ open, onOpenChange, shift }: { open: boolean; onOpenChange: (v: boolean) => void; shift?: ShiftDefinition | null }) {
  const upsert = useUpsertShift();
  const [form, setForm] = useState({
    name: "",
    start_time: "08:00",
    end_time: "17:00",
    late_tolerance_minutes: 15,
    working_days: [1, 2, 3, 4, 5] as number[],
    color: "#3b82f6",
  });

  useEffect(() => {
    if (shift) {
      setForm({
        name: shift.name,
        start_time: shift.start_time?.slice(0, 5) ?? "08:00",
        end_time: shift.end_time?.slice(0, 5) ?? "17:00",
        late_tolerance_minutes: shift.late_tolerance_minutes ?? 15,
        working_days: shift.working_days ?? [1, 2, 3, 4, 5],
        color: shift.color ?? "#3b82f6",
      });
    } else {
      setForm({ name: "", start_time: "08:00", end_time: "17:00", late_tolerance_minutes: 15, working_days: [1, 2, 3, 4, 5], color: "#3b82f6" });
    }
  }, [shift, open]);

  const toggleDay = (d: number) => {
    setForm((f) => ({ ...f, working_days: f.working_days.includes(d) ? f.working_days.filter((x) => x !== d) : [...f.working_days, d].sort() }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await upsert.mutateAsync({ id: shift?.id, ...form } as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{shift ? "Edit Shift" : "Tambah Shift"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nama Shift</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shift Pagi" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jam Masuk</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label>Jam Pulang</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Toleransi Keterlambatan (menit)</Label>
            <Input type="number" min={0} value={form.late_tolerance_minutes} onChange={(e) => setForm({ ...form, late_tolerance_minutes: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Hari Kerja</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {DAYS.map((d, i) => (
                <label key={i} className="flex items-center gap-1.5 px-2 py-1 border rounded-md cursor-pointer">
                  <Checkbox checked={form.working_days.includes(i)} onCheckedChange={() => toggleDay(i)} />
                  <span className="text-sm">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Warna</Label>
            <div className="flex items-center gap-2">
              <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-16 h-10 p-1" />
              <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={upsert.isPending}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
