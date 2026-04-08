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
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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

  const addAccount = useMutation({
    mutationFn: async (account: Partial<ChartAccount>) => {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .insert({ ...account, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil ditambahkan");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ChartAccount> & { id: string }) => {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil diperbarui");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chart_of_accounts" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart_of_accounts"] });
      toast.success("Akun berhasil dihapus");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { accounts, isLoading, addAccount, updateAccount, deleteAccount };
}
