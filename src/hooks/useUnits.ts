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
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("unit_number", { ascending: true });

      if (error) throw error;
      return data as Unit[];
    },
  });

  return {
    units: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
