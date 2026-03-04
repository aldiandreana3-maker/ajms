import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function usePayrollList(month?: number, year?: number) {
  return useQuery({
    queryKey: ["employee-payroll", month, year],
    queryFn: async () => {
      let query = supabase
        .from("employee_payroll")
        .select("*")
        .order("created_at", { ascending: false });
      if (month) query = query.eq("period_month", month);
      if (year) query = query.eq("period_year", year);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployeeSummary(userId: string, month: number, year: number) {
  return useQuery({
    queryKey: ["employee-summary", userId, month, year],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const [attRes, leaveRes, otRes, permitRes] = await Promise.all([
        supabase
          .from("employee_attendance")
          .select("id")
          .eq("user_id", userId)
          .gte("attendance_date", startDate)
          .lte("attendance_date", endDate),
        supabase
          .from("employee_leaves")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "approved")
          .gte("start_date", startDate)
          .lte("start_date", endDate),
        supabase
          .from("employee_overtimes")
          .select("id, hours")
          .eq("user_id", userId)
          .eq("status", "approved")
          .gte("overtime_date", startDate)
          .lte("overtime_date", endDate),
        supabase
          .from("employee_permits")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "approved")
          .gte("permit_date", startDate)
          .lte("permit_date", endDate),
      ]);

      return {
        totalAttendance: attRes.data?.length || 0,
        totalLeaves: leaveRes.data?.length || 0,
        totalOvertimes: otRes.data?.length || 0,
        totalOvertimeHours: otRes.data?.reduce((sum, o) => sum + (Number(o.hours) || 0), 0) || 0,
        totalPermits: permitRes.data?.length || 0,
      };
    },
    enabled: !!userId && !!month && !!year,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      employee_name: string;
      period_month: number;
      period_year: number;
      total_attendance: number;
      total_leaves: number;
      total_overtimes: number;
      total_permits: number;
      base_salary: number;
      allowance: number;
      deductions: number;
      total_salary: number;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("employee_payroll").insert({
        ...data,
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-payroll"] });
      toast({ title: "Berhasil", description: "Slip gaji berhasil disimpan" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}
