import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShiftDefinition {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  late_tolerance_minutes: number;
  working_days: number[];
  color: string;
  is_default: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShiftSchedule {
  id: string;
  user_id: string;
  employee_name: string | null;
  shift_id: string | null;
  schedule_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  shift?: ShiftDefinition | null;
}

export function useShifts() {
  return useQuery({
    queryKey: ["shift-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_definitions")
        .select("*")
        .order("start_time");
      if (error) throw error;
      return data as ShiftDefinition[];
    },
  });
}

export function useUpsertShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ShiftDefinition> & { name: string; start_time: string; end_time: string }) => {
      if (input.id) {
        const { error } = await supabase.from("shift_definitions").update(input).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shift_definitions").insert(input as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-definitions"] });
      toast.success("Shift tersimpan");
    },
    onError: (e: any) => toast.error("Gagal menyimpan shift: " + e.message),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-definitions"] });
      toast.success("Shift dihapus");
    },
    onError: (e: any) => toast.error("Gagal menghapus: " + e.message),
  });
}

export function useShiftSchedules(startDate: string, endDate: string, userId?: string) {
  return useQuery({
    queryKey: ["shift-schedules", startDate, endDate, userId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("employee_shift_schedules")
        .select("*, shift:shift_definitions(*)")
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date");
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ShiftSchedule[];
    },
  });
}

export interface AssignInput {
  user_id: string;
  employee_name?: string | null;
  shift_id: string;
  dates: string[]; // YYYY-MM-DD
  notes?: string | null;
}

export function useAssignSchedules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: AssignInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = inputs.flatMap((i) =>
        i.dates.map((d) => ({
          user_id: i.user_id,
          employee_name: i.employee_name ?? null,
          shift_id: i.shift_id,
          schedule_date: d,
          notes: i.notes ?? null,
          created_by: user?.id ?? null,
        }))
      );
      if (!rows.length) return;
      const { error } = await supabase
        .from("employee_shift_schedules")
        .upsert(rows, { onConflict: "user_id,schedule_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-schedules"] });
      toast.success("Jadwal berhasil diterapkan");
    },
    onError: (e: any) => toast.error("Gagal menyimpan jadwal: " + e.message),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_shift_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-schedules"] });
      toast.success("Jadwal dihapus");
    },
    onError: (e: any) => toast.error("Gagal menghapus: " + e.message),
  });
}
