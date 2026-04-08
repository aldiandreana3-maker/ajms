import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Reconciliation {
  id: string;
  account_id: string;
  period_label: string;
  period_date: string;
  system_balance: number;
  actual_balance: number;
  difference: number;
  status: string;
  notes: string | null;
  reconciled_by: string | null;
  reconciled_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useReconciliations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reconciliations = [], isLoading } = useQuery({
    queryKey: ["reconciliations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reconciliations" as any)
        .select("*")
        .order("period_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Reconciliation[];
    },
    enabled: !!user,
  });

  const addReconciliation = useMutation({
    mutationFn: async (rec: Partial<Reconciliation>) => {
      const diff = (rec.actual_balance || 0) - (rec.system_balance || 0);
      const { error } = await supabase
        .from("reconciliations" as any)
        .insert({ ...rec, difference: diff, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      toast.success("Rekonsiliasi berhasil ditambahkan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateReconciliation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reconciliation> & { id: string }) => {
      const { error } = await supabase
        .from("reconciliations" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      toast.success("Rekonsiliasi berhasil diperbarui");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { reconciliations, isLoading, addReconciliation, updateReconciliation };
}
