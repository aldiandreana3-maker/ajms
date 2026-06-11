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
  end_date: string | null;
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
  receipt_photo_url: string | null;
  admin_notes: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateParkingInput {
  vehicle_type: string;
  vehicle_number: string;
  vehicle_brand?: string;
  vehicle_color?: string;
  start_date: string;
  end_date?: string | null;
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
    onError: (error: any) => {
      const msg = error?.message || "";
      if (msg.toLowerCase().includes("sudah terdaftar") || error?.code === "23505") {
        toast.error("Nomor plat sudah terdaftar dan masih aktif. Gunakan menu Perpanjangan.");
      } else {
        toast.error("Gagal menambahkan abonemen: " + msg);
      }
    },
  });
}

export function useExtendParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      months,
      days,
      currentEndDate,
      customEndDate,
    }: {
      id: string;
      months?: number;
      days?: number;
      currentEndDate?: string | null;
      customEndDate?: string;
    }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Basis perpanjangan = end_date saat ini jika masih berlaku; jika tidak, ambil tgl 5 siklus berjalan.
      const baseDate = (() => {
        if (currentEndDate) {
          const d = new Date(currentEndDate);
          d.setHours(0, 0, 0, 0);
          if (d >= today) return d;
        }
        const fb = new Date(today);
        if (fb.getDate() > 5) fb.setMonth(fb.getMonth() + 1);
        fb.setDate(5);
        return fb;
      })();

      // Hitung tanggal akhir baru
      let newEndStr: string;
      let monthsAdded = 0;
      if (customEndDate) {
        newEndStr = customEndDate;
      } else if (days && days > 0) {
        const newEnd = new Date(baseDate);
        newEnd.setDate(newEnd.getDate() + days);
        newEndStr = newEnd.toISOString().split("T")[0];
      } else if (months && months > 0) {
        const newEnd = new Date(baseDate);
        newEnd.setMonth(newEnd.getMonth() + months);
        newEnd.setDate(5);
        newEndStr = newEnd.toISOString().split("T")[0];
        monthsAdded = months;
      } else {
        throw new Error("Masukkan jumlah hari atau bulan perpanjangan");
      }

      // Update subscription
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ end_date: newEndStr, is_active: true, verification_status: "terverifikasi" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // Buat baris history per BULAN periode (mengikuti masa berlaku, bukan tanggal transaksi).
      // Periode bulan ke-i = bulan dari (baseDate + i bulan).
      if (monthsAdded > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const fee = Number(data?.monthly_fee || 0);
        const rows = Array.from({ length: monthsAdded }, (_, i) => {
          const d = new Date(baseDate);
          d.setDate(1);
          d.setMonth(d.getMonth() + i);
          const y = d.getFullYear();
          const m = d.getMonth() + 1;
          return {
            subscription_id: id,
            vehicle_number: data?.vehicle_number ?? null,
            unit_number: data?.unit_number ?? null,
            unit_id: data?.unit_id ?? null,
            owner_name: data?.penghuni_name ?? null,
            period_month: m,
            period_year: y,
            period_label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
            period_date: `${y}-${String(m).padStart(2, "0")}-01`,
            nominal: fee,
            payment_method: "admin_extend",
            payment_proof_url: null,
            payment_date: new Date().toISOString(),
            verification_status: "terverifikasi",
            created_by: user?.id ?? null,
            notes: `Perpanjangan oleh admin (${monthsAdded} bln, s/d ${newEndStr})`,
          };
        });
        const { error: hErr } = await (supabase as any)
          .from("parking_payment_history")
          .upsert(rows, { onConflict: "subscription_id,period_year,period_month" });
        if (hErr) console.warn("Gagal menulis history perpanjangan:", hErr.message);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      const label = variables.customEndDate
        ? `s/d ${variables.customEndDate} (jatuh tempo tgl 5)`
        : variables.days
        ? `${variables.days} hari`
        : `${variables.months} bulan (jatuh tempo tgl 5)`;
      toast.success(`Abonemen berhasil diperpanjang ${label}`);
    },
    onError: (error) => {
      toast.error("Gagal memperpanjang abonemen: " + error.message);
    },
  });
}

export function useCancelExtensionParkingSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; startDate?: string }) => {
      // Reset masa berakhir ke kosong (null), membatalkan semua perpanjangan.
      // Kolom 'Berakhir' akan kembali tampil kosong sampai admin memperpanjang lagi.
      const { data, error } = await supabase
        .from("parking_subscriptions")
        .update({ end_date: null })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success("Perpanjangan berhasil dibatalkan");
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

export function useUpdateParkingMeta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, admin_notes, receipt_photo_url }: { id: string; admin_notes?: string | null; receipt_photo_url?: string | null }) => {
      const payload: Record<string, unknown> = {};
      if (admin_notes !== undefined) payload.admin_notes = admin_notes;
      if (receipt_photo_url !== undefined) payload.receipt_photo_url = receipt_photo_url;
      const { error } = await supabase.from("parking_subscriptions").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      toast.success("Data berhasil diperbarui");
    },
    onError: (error) => toast.error("Gagal memperbarui: " + error.message),
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
