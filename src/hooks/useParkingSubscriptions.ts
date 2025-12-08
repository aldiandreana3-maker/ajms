import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParkingSubscription {
  id: string;
  penghuni_id: string | null;
  unit_id: string | null;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_brand: string | null;
  vehicle_color: string | null;
  start_date: string;
  end_date: string;
  monthly_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateParkingInput {
  penghuni_id?: string;
  unit_id?: string;
  vehicle_type: string;
  vehicle_number: string;
  vehicle_brand?: string;
  vehicle_color?: string;
  start_date: string;
  end_date: string;
  monthly_fee?: number;
}

export function useParkingSubscriptions() {
  return useQuery({
    queryKey: ["parking-subscriptions"],
    queryFn: async (): Promise<ParkingSubscription[]> => {
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .select(`
          *,
          penghuni:penghuni_id(full_name),
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ParkingSubscription[];
    },
  });
}

export function useCreateParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateParkingInput) => {
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Abonemen parkir berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan abonemen: " + error.message);
    },
  });
}

export function useExtendParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, end_date }: { id: string; end_date: string }) => {
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ end_date, is_active: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success("Abonemen berhasil diperpanjang");
    },
    onError: (error) => {
      toast.error("Gagal memperpanjang abonemen: " + error.message);
    },
  });
}
