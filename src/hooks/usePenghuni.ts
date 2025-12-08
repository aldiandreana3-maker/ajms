import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Penghuni {
  id: string;
  user_id: string | null;
  unit_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  ktp_number: string | null;
  is_owner: boolean;
  is_active: boolean;
  move_in_date: string | null;
  move_out_date: string | null;
  created_at: string;
  updated_at: string;
  units?: { unit_number: string } | null;
}

export function usePenghuni() {
  return useQuery({
    queryKey: ["penghuni"],
    queryFn: async (): Promise<Penghuni[]> => {
      const { data, error } = await supabase
        .from("penghuni")
        .select(`
          *,
          units:unit_id(unit_number)
        `)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Penghuni[];
    },
  });
}
