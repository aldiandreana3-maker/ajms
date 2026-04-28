import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParkingSubscription {
  id: string;
  unit_id: string | null;
  penghuni_id: string | null;
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
  penghuni_name: string | null;
  unit_number: string | null;
  phone: string | null;
  agent_name: string | null;
  member_card: string | null;
  request_type: string | null;
  period_type: string | null;
  verification_status: string | null;
  rental_status: string | null;
  ktp_photo_url: string | null;
  stnk_photo_url: string | null;
  rental_agreement_url: string | null;
  payment_proof_url: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateParkingInput {
  vehicle_type: string;
  vehicle_number: string;
  vehicle_brand?: string;
  vehicle_color?: string;
  start_date: string;
  end_date: string;
  monthly_fee?: number;
  penghuni_name?: string;
  unit_number?: string;
  phone?: string;
  agent_name?: string;
  member_card?: string;
  request_type?: string;
  period_type?: string;
  rental_status?: string;
  ktp_photo_url?: string;
  stnk_photo_url?: string;
  rental_agreement_url?: string;
  payment_proof_url?: string;
}

interface UpdateParkingInput {
  id: string;
  verification_status: string;
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .insert({
          vehicle_type: input.vehicle_type,
          vehicle_number: input.vehicle_number,
          vehicle_brand: input.vehicle_brand,
          vehicle_color: input.vehicle_color,
          start_date: input.start_date,
          end_date: input.end_date,
          monthly_fee: input.monthly_fee || 0,
          penghuni_name: input.penghuni_name,
          unit_number: input.unit_number,
          phone: input.phone,
          agent_name: input.agent_name,
          member_card: input.member_card,
          request_type: input.request_type,
          period_type: input.period_type,
          rental_status: input.rental_status,
          ktp_photo_url: input.ktp_photo_url,
          stnk_photo_url: input.stnk_photo_url,
          rental_agreement_url: input.rental_agreement_url,
          payment_proof_url: input.payment_proof_url,
          created_by: sessionData.session.user.id,
        })
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
    mutationFn: async ({ id, months, currentEndDate }: { id: string; months: number; currentEndDate?: string | null }) => {
      // Hitung tanggal akhir baru: dari end_date saat ini (jika masih aktif) atau dari hari ini (jika sudah lewat)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const baseDate = currentEndDate ? new Date(currentEndDate) : today;
      const startFrom = baseDate >= today ? baseDate : today;
      const newEnd = new Date(startFrom);
      newEnd.setMonth(newEnd.getMonth() + months);
      const newEndStr = newEnd.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ end_date: newEndStr, is_active: true, verification_status: "terverifikasi" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success(`Abonemen berhasil diperpanjang ${variables.months} bulan`);
    },
    onError: (error) => {
      toast.error("Gagal memperpanjang abonemen: " + error.message);
    },
  });
}

export function useCancelExtensionParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, months, currentEndDate }: { id: string; months: number; currentEndDate: string }) => {
      // Kurangi masa aktif sesuai jumlah bulan perpanjangan yang dibatalkan
      const base = new Date(currentEndDate);
      base.setMonth(base.getMonth() - months);
      const newEndStr = base.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ end_date: newEndStr })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success(`Perpanjangan ${variables.months} bulan berhasil dibatalkan`);
    },
    onError: (error) => {
      toast.error("Gagal membatalkan perpanjangan: " + error.message);
    },
  });
}

export function useUpdateParkingVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, verification_status }: UpdateParkingInput) => {
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ verification_status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success("Status verifikasi berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });
}

export function useDeleteParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("parking_subscriptions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Data abonemen berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    },
  });
}
