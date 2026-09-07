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

const EMPTY_STATS: DashboardStats = {
  totalUnits: 0,
  activePenghuni: 0,
  commercialTenants: 0,
  accessCards: 0,
  totalKeluhan: 0,
  totalWorkOrders: 0,
  parkingSubscriptions: 0,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    retry: 1,
    staleTime: 60_000,
    placeholderData: EMPTY_STATS,
    queryFn: async (): Promise<DashboardStats> => {
      // setiap query dibungkus agar 1 kegagalan tidak menggagalkan semuanya
      const safe = async <T,>(p: PromiseLike<T>, fallback: T): Promise<T> => {
        try {
          return await p;
        } catch (e) {
          console.warn("dashboard query failed", e);
          return fallback;
        }
      };
      const emptyCount = { count: 0 } as { count: number | null };
      const emptyRows = { data: [] as { unit_number: string | null }[] };
      try {

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
        safe(supabase.from("units").select("id", { count: "exact", head: true }), emptyCount as any),
        safe(supabase.from("commercial_tenants").select("id", { count: "exact", head: true }).eq("is_active", true), emptyCount as any),
        safe(supabase.from("access_cards").select("id", { count: "exact", head: true }).eq("status", "active"), emptyCount as any),
        safe(supabase.from("keluhan").select("id", { count: "exact", head: true }), emptyCount as any),
        safe(supabase.from("work_orders").select("id", { count: "exact", head: true }), emptyCount as any),
        safe(supabase.from("parking_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true), emptyCount as any),
        safe(supabase.from("parking_subscriptions").select("unit_number").eq("is_active", true).limit(10000), emptyRows as any),
        safe(supabase.from("access_cards").select("unit_number").limit(10000), emptyRows as any),
        safe(supabase.from("work_orders").select("unit_number").limit(10000), emptyRows as any),
        safe(supabase.from("keluhan").select("unit_number").limit(10000), emptyRows as any),
        safe(supabase.from("commercial_tenants").select("unit_number").eq("is_active", true).limit(10000), emptyRows as any),
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
      } catch (e) {
        console.warn("dashboard stats failed", e);
        return EMPTY_STATS;
      }
    },

  });
}
