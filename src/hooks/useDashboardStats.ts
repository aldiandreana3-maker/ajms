import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUnits: number;
  activePenghuni: number;
  commercialTenants: number;
  accessCards: number;
  totalKeluhan: number;
  totalWorkOrders: number;
  parkingSubscriptions: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        unitsResult,
        penghuniResult,
        commercialResult,
        cardsResult,
        keluhanResult,
        workOrdersResult,
        parkingResult,
      ] = await Promise.all([
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("penghuni").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("commercial_tenants").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("access_cards").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("keluhan").select("id", { count: "exact", head: true }),
        supabase.from("work_orders").select("id", { count: "exact", head: true }),
        supabase.from("parking_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      return {
        totalUnits: unitsResult.count || 0,
        activePenghuni: penghuniResult.count || 0,
        commercialTenants: commercialResult.count || 0,
        accessCards: cardsResult.count || 0,
        totalKeluhan: keluhanResult.count || 0,
        totalWorkOrders: workOrdersResult.count || 0,
        parkingSubscriptions: parkingResult.count || 0,
      };
    },
  });
}
