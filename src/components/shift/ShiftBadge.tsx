import type { ShiftDefinition } from "@/hooks/useShifts";

export function ShiftBadge({ shift, compact = false }: { shift?: Pick<ShiftDefinition, "name" | "color" | "start_time" | "end_time"> | null; compact?: boolean }) {
  if (!shift) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-medium text-white ${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"}`}
      style={{ backgroundColor: shift.color }}
      title={`${shift.name} (${shift.start_time?.slice(0,5)}–${shift.end_time?.slice(0,5)})`}
    >
      {shift.name}
    </span>
  );
}
