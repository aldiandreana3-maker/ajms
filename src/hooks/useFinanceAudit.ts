import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FinanceAuditRow {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_data: any;
  new_data: any;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_by_role: string | null;
  reason: string | null;
  created_at: string;
}

export function useFinanceAudit(filters?: { table?: string; days?: number }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["finance_audit", filters],
    queryFn: async () => {
      let q = supabase.from("finance_audit_log" as any).select("*").order("created_at", { ascending: false }).limit(500);
      if (filters?.table && filters.table !== "all") q = q.eq("table_name", filters.table);
      if (filters?.days) {
        const from = new Date(Date.now() - filters.days * 86400000).toISOString();
        q = q.gte("created_at", from);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as FinanceAuditRow[];
    },
    enabled: !!user,
  });
}

export function useUnitBillingStatus(unitId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unit_billing_status", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const { data } = await supabase.from("unit_billing_status" as any).select("*").eq("unit_id", unitId).maybeSingle();
      return data as any;
    },
    enabled: !!user && !!unitId,
  });
}
