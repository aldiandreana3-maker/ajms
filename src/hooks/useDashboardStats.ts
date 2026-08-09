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
        commercialResult,
        cardsResult,
        keluhanResult,
        workOrdersResult,
        parkingResult,
        // unit numbers untuk hitung penghuni aktif (unik per unit)
        parkingUnits,
        cardUnits,
        workOrderUnits,
        keluhanUnits,
        commercialUnits,
      ] = await Promise.all([
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("commercial_tenants").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("access_cards").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("keluhan").select("id", { count: "exact", head: true }),
        supabase.from("work_orders").select("id", { count: "exact", head: true }),
        supabase.from("parking_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("parking_subscriptions").select("unit_number").eq("is_active", true).limit(10000),
        supabase.from("access_cards").select("unit_number").limit(10000),
        supabase.from("work_orders").select("unit_number").limit(10000),
        supabase.from("keluhan").select("unit_number").limit(10000),
        supabase.from("commercial_tenants").select("unit_number").eq("is_active", true).limit(10000),
      ]);

      const unitSet = new Set<string>();
      for (const res of [parkingUnits, cardUnits, workOrderUnits, keluhanUnits, commercialUnits]) {
        for (const row of (res.data as { unit_number: string | null }[] | null) || []) {
          const u = (row.unit_number || "").trim().toUpperCase();
          if (u) unitSet.add(u);
        }
      }

      return {
        totalUnits: unitsResult.count || 0,
        activePenghuni: unitSet.size,
        commercialTenants: commercialResult.count || 0,
        accessCards: cardsResult.count || 0,
        totalKeluhan: keluhanResult.count || 0,
        totalWorkOrders: workOrdersResult.count || 0,
        parkingSubscriptions: parkingResult.count || 0,
      };
    },
  });
}
