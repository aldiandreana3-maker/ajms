import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Unit {
  id: string;
  unit_number: string;
  floor: number | null;
  building: string | null;
  type: string | null;
  area_sqm: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useUnits() {
  return useQuery({
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
}
