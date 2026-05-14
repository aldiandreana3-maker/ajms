import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShiftSchedules, useDeleteSchedule, type ShiftSchedule } from "@/hooks/useShifts";
import { ShiftBadge } from "./ShiftBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

export function ShiftCalendarView({ userIdFilter, canManage }: { userIdFilter?: string; canManage: boolean }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const { startStr, endStr, weeks } = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const last = new Date(cursor.y, cursor.m + 1, 0);
    const startStr = first.toISOString().split("T")[0];
    const endStr = last.toISOString().split("T")[0];
    const startWeekday = first.getDay();
    const totalDays = last.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(cursor.y, cursor.m, d));
    while (cells.length % 7) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return { startStr, endStr, weeks };
  }, [cursor]);

  const { data: schedules = [] } = useShiftSchedules(startStr, endStr, userIdFilter);
  const del = useDeleteSchedule();

  const byDate = useMemo(() => {
    const map = new Map<string, ShiftSchedule[]>();
    schedules.forEach((s) => {
      const arr = map.get(s.schedule_date) ?? [];
      arr.push(s);
      map.set(s.schedule_date, arr);
    });
    return map;
  }, [schedules]);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{MONTHS[cursor.m]} {cursor.y}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => ({ y: c.m === 0 ? c.y - 1 : c.y, m: c.m === 0 ? 11 : c.m - 1 }))}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }}>Hari ini</Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => ({ y: c.m === 11 ? c.y + 1 : c.y, m: c.m === 11 ? 0 : c.m + 1 }))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground">
        {DAYS.map((d) => <div key={d} className="px-2 py-1 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.flat().map((date, i) => {
          if (!date) return <div key={i} className="min-h-[80px] bg-muted/30 rounded" />;
          const items = byDate.get(fmt(date)) ?? [];
          const isToday = fmt(date) === fmt(new Date());
          return (
            <div key={i} className={`min-h-[80px] border rounded p-1 flex flex-col gap-1 ${isToday ? "border-primary bg-primary/5" : ""}`}>
              <div className="text-xs font-medium">{date.getDate()}</div>
              <div className="flex flex-col gap-0.5">
                {items.slice(0, 3).map((it) => (
                  <Popover key={it.id}>
                    <PopoverTrigger asChild>
                      <button className="text-left">
                        <ShiftBadge shift={it.shift} compact />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 text-sm">
                      <div className="font-medium">{it.employee_name ?? "Karyawan"}</div>
                      <div className="text-muted-foreground">
                        {it.shift?.name} · {it.shift?.start_time?.slice(0,5)}–{it.shift?.end_time?.slice(0,5)}
                      </div>
                      {it.notes && <div className="text-xs mt-1">{it.notes}</div>}
                      {canManage && (
                        <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => del.mutate(it.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Hapus
                        </Button>
                      )}
                    </PopoverContent>
                  </Popover>
                ))}
                {items.length > 3 && <span className="text-[10px] text-muted-foreground">+{items.length - 3} lainnya</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
