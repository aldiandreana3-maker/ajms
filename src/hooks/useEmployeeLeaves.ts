import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeLeave {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployeeLeaves() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employee-leaves", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_leaves")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployeeLeave[];
    },
    enabled: !!user,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { leave_type: string; start_date: string; end_date: string; reason: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("employee_leaves").insert({
        user_id: user.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-leaves"] });
      toast({ title: "Berhasil", description: "Pengajuan cuti berhasil dikirim" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("employee_leaves")
        .update({ status, approved_by: user.id, approved_at: new Date().toISOString(), notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-leaves"] });
      toast({ title: "Berhasil", description: "Status cuti diperbarui" });
    },
    onError: (error: any) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });
}
