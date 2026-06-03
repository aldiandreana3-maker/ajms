import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParkingPaymentHistory {
  id: string;
  subscription_id: string | null;
  vehicle_number: string | null;
  unit_number: string | null;
  unit_id: string | null;
  owner_name: string | null;
  period_month: number;
  period_year: number;
  period_label: string;
  period_date: string;
  nominal: number;
  payment_method: string | null;
  payment_proof_url: string | null;
  payment_date: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useParkingPaymentHistory() {
  return useQuery({
    queryKey: ["parking-payment-history"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("parking_payment_history")
        .select("*")
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ParkingPaymentHistory[];
    },
  });
}
