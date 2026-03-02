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
  created_at: string;
  updated_at: string;
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
      const { error } = await supabase.from("employee_attendance").insert({
        user_id: user.id,
        attendance_date: today,
        check_in_time: new Date().toISOString(),
        check_in_photo_url: publicUrl,
        status: new Date().getHours() > 8 ? "terlambat" : "hadir",
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
