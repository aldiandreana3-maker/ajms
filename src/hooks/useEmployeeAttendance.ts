import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeAttendance {
  id: string;
  user_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  attendance_date: string;
  status: string;
  notes: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  check_in_location_name: string | null;
  check_out_location_name: string | null;
  created_at: string;
  updated_at: string;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung browser ini"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

export function useEmployeeAttendance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employee-attendance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_attendance")
        .select("*")
        .order("attendance_date", { ascending: false });
      if (error) throw error;
      return data as EmployeeAttendance[];
    },
    enabled: !!user,
  });
}

export function useTodayAttendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["employee-attendance-today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_attendance")
        .select("*")
        .eq("user_id", user!.id)
        .eq("attendance_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeAttendance | null;
    },
    enabled: !!user,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (photoFile: File) => {
      if (!user) throw new Error("Not authenticated");

      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const pos = await getCurrentPosition();
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (e) {
        console.warn("Gagal mendapatkan lokasi:", e);
      }

      // Upload photo
      const fileName = `attendance/${user.id}/${Date.now()}-checkin.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("kepenghunian-files")
        .upload(fileName, photoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("kepenghunian-files")
        .getPublicUrl(fileName);

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();

      // Cek jadwal shift hari ini
      let shiftId: string | null = null;
      let status = now.getHours() > 8 ? "terlambat" : "hadir";
      const { data: schedule } = await supabase
        .from("employee_shift_schedules")
        .select("shift_id, shift:shift_definitions(start_time, late_tolerance_minutes)")
        .eq("user_id", user.id)
        .eq("schedule_date", today)
        .maybeSingle();
      if (schedule?.shift_id && (schedule as any).shift) {
        shiftId = schedule.shift_id;
        const sh: any = (schedule as any).shift;
        const [h, m] = String(sh.start_time).split(":").map(Number);
        const limit = new Date(now);
        limit.setHours(h, m + (sh.late_tolerance_minutes ?? 0), 0, 0);
        status = now > limit ? "terlambat" : "hadir";
      }

      const { error } = await supabase.from("employee_attendance").insert({
        user_id: user.id,
        attendance_date: today,
        check_in_time: now.toISOString(),
        check_in_photo_url: publicUrl,
        status,
        shift_id: shiftId,
        check_in_latitude: latitude,
        check_in_longitude: longitude,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["employee-attendance-today"] });
      toast({ title: "Berhasil", description: "Absen masuk berhasil dicatat" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ attendanceId, photoFile }: { attendanceId: string; photoFile: File }) => {
      if (!user) throw new Error("Not authenticated");

      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const pos = await getCurrentPosition();
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch (e) {
        console.warn("Gagal mendapatkan lokasi:", e);
      }

      const fileName = `attendance/${user.id}/${Date.now()}-checkout.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("kepenghunian-files")
        .upload(fileName, photoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("kepenghunian-files")
        .getPublicUrl(fileName);

      const { error } = await supabase
        .from("employee_attendance")
        .update({
          check_out_time: new Date().toISOString(),
          check_out_photo_url: publicUrl,
          check_out_latitude: latitude,
          check_out_longitude: longitude,
        })
        .eq("id", attendanceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["employee-attendance-today"] });
      toast({ title: "Berhasil", description: "Absen pulang berhasil dicatat" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useAllAttendance() {
  return useQuery({
    queryKey: ["all-employee-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_attendance")
        .select("*")
        .order("attendance_date", { ascending: false });
      if (error) throw error;
      return data as EmployeeAttendance[];
    },
  });
}
