import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Unit {
  id: string;
  unit_number: string;
  floor: number | null;
  building: string | null;
  type: string | null;
  area_sqm: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useUnits() {
  const query = useQuery({
    queryKey: ["units"],
    queryFn: async (): Promise<Unit[]> => {
      // Fetch all units in batches to overcome the 1000-row default limit
      const allUnits: Unit[] = [];
      const batchSize = 1000;
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("units")
          .select("*")
          .order("unit_number", { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (data) {
          allUnits.push(...(data as Unit[]));
          hasMore = data.length === batchSize;
          from += batchSize;
        } else {
          hasMore = false;
        }
      }

      return allUnits;
    },
  });

  return {
    units: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
