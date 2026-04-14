import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChartAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id: string | null;
  normal_balance: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  is_detail: boolean;
  up_level: string;
  map_to_neraca: string;
  map_to_cash_flow: string;
  pos_budget: string;
  sumber_dana: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoaAuditLog {
  id: string;
  account_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  changed_by: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export function useChartOfAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["chart_of_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts" as any)
        .select("*")
        .order("account_code");
      if (error) throw error;
      return (data || []) as unknown as ChartAccount[];
    },
    enabled: !!user,
  });

  const logAudit = async (action: string, accountId: string | null, oldData: any, newData: any) => {
    await supabase.from("coa_audit_log" as any).insert({
      account_id: accountId,
      action,
      old_data: oldData,
      new_data: newData,
      changed_by: user?.id,
      changed_by_name: user?.email || "",
    } as any);
  };

  const addAccount = useMutation({
    mutationFn: async (account: Partial<ChartAccount>) => {
      const { data, error } = await supabase
        .from("chart_of_accounts" as any)
        .insert({ ...account, created_by: user?.id } as any)
        .select()
        .single();
      if (error) throw error;
      await logAudit("create", (data as any).id, null, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil ditambahkan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChartAccount> & { id: string }) => {
      const oldAccount = accounts.find((a) => a.id === id);
      const { data, error } = await supabase
        .from("chart_of_accounts" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAudit("update", id, oldAccount, data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil diperbarui");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const oldAccount = accounts.find((a) => a.id === id);
      
      // Delete related records first to avoid foreign key constraints
      await supabase.from("coa_audit_log" as any).delete().eq("account_id", id);
      await supabase.from("reconciliations" as any).delete().eq("account_id", id);
      await supabase.from("journal_entry_lines" as any).delete().eq("account_id", id);
      
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      await logAudit("delete", null, oldAccount, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil dihapus");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkInsert = useMutation({
    mutationFn: async (accountsList: Partial<ChartAccount>[]) => {
      const withCreator = accountsList.map((a) => ({ ...a, created_by: user?.id }));
      const { data, error } = await supabase
        .from("chart_of_accounts" as any)
        .insert(withCreator as any)
        .select();
      if (error) throw error;
      await logAudit("bulk_import", null, null, { count: accountsList.length });
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success(`${vars.length} akun berhasil diimpor`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { accounts, isLoading, addAccount, updateAccount, deleteAccount, bulkInsert };
}

export function useCoaAuditLog() {
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["coa_audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coa_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as unknown as CoaAuditLog[];
    },
    enabled: !!user,
  });

  return { logs, isLoading };
}
