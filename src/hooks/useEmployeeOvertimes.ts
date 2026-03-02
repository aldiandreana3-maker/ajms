import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeOvertime {
  id: string;
  user_id: string;
  overtime_date: string;
  start_time: string;
  end_time: string;
  hours: number | null;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployeeOvertimes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-overtimes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_overtimes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeeOvertime[];
    },
    enabled: !!user,
  });
}

export function useCreateOvertime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { overtime_date: string; start_time: string; end_time: string; reason: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("employee_overtimes").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-overtimes"] });
      toast({ title: "Berhasil", description: "Pengajuan lembur berhasil dikirim" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateOvertimeStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("employee_overtimes")
        .update({ status, approved_by: user.id, approved_at: new Date().toISOString(), notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-overtimes"] });
      toast({ title: "Berhasil", description: "Status lembur diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}
