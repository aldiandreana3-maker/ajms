import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type UpdateStatus = "belum_diperbarui" | "sudah_diperbarui" | "perlu_diperbarui";

export interface PenghuniUpdate {
  id: string;
  unit_number: string;
  full_name: string;
  tower: string | null;
  penghuni_status: string | null;
  owner_agent_name: string | null;
  lama_tinggal: string | null;
  phone: string | null;
  email: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  special_conditions: string[];
  lansia_name: string | null;
  balita_name: string | null;
  ibu_hamil_name: string | null;
  health_name: string | null;
  health_note: string | null;
  other_condition_note: string | null;
  declaration_accepted: boolean;
  status: string;
  last_updated_at: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export type PenghuniUpdateInput = Omit<
  PenghuniUpdate,
  "id" | "created_at" | "updated_at" | "status" | "last_updated_at" | "updated_by" | "updated_by_name" | "tower"
> & { tower?: string | null };

export const towerFromUnit = (unit: string): string | null => {
  const m = unit.trim().toUpperCase().match(/^(?:T|K-?)?([A-D])/);
  return m ? m[1] : null;
};

/** Data pemutakhiran milik user yang sedang login */
export function useMyPenghuniUpdate() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-penghuni-update", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penghuni_updates")
        .select("*")
        .eq("updated_by", user!.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return (data?.[0] as PenghuniUpdate | undefined) ?? null;
    },
  });
}

/** Data penghuni dasar (unit + nama) untuk prefill form */
export function useMyPenghuniProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-penghuni-profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penghuni")
        .select("unit_number, full_name, phone, email, is_owner")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("is_owner", { ascending: false })
        .limit(1);
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export function useSavePenghuniUpdate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PenghuniUpdateInput & { id?: string }) => {
      const unit = input.unit_number.trim().toUpperCase();
      const payload = {
        ...input,
        unit_number: unit,
        full_name: input.full_name.trim(),
        tower: towerFromUnit(unit),
        status: "sudah_diperbarui",
        last_updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
        updated_by_name: user?.email ?? null,
      };

      // cari record existing untuk kombinasi unit + nama
      const { data: existing } = await supabase
        .from("penghuni_updates")
        .select("id")
        .eq("unit_number", unit)
        .ilike("full_name", payload.full_name)
        .limit(1);

      const id = input.id || existing?.[0]?.id;
      if (id) {
        const { data, error } = await supabase
          .from("penghuni_updates")
          .update(payload)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("penghuni_updates")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-penghuni-update"] });
      qc.invalidateQueries({ queryKey: ["penghuni-updates"] });
    },
  });
}

export interface PenghuniUpdateFilters {
  search?: string;
  status?: string;
  penghuniStatus?: string;
  tower?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Monitoring TRO */
export function usePenghuniUpdates(filters: PenghuniUpdateFilters = {}) {
  return useQuery({
    queryKey: ["penghuni-updates", filters],
    queryFn: async () => {
      let q = supabase.from("penghuni_updates").select("*").order("updated_at", { ascending: false });
      if (filters.search) {
        const s = filters.search.trim();
        q = q.or(`unit_number.ilike.%${s}%,full_name.ilike.%${s}%`);
      }
      if (filters.status && filters.status !== "all") q = q.eq("status", filters.status);
      if (filters.penghuniStatus && filters.penghuniStatus !== "all")
        q = q.eq("penghuni_status", filters.penghuniStatus);
      if (filters.tower && filters.tower !== "all") q = q.eq("tower", filters.tower);
      if (filters.dateFrom) q = q.gte("last_updated_at", filters.dateFrom);
      if (filters.dateTo) q = q.lte("last_updated_at", `${filters.dateTo}T23:59:59`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PenghuniUpdate[];
    },
  });
}

/** Statistik untuk dashboard TRO */
export function usePenghuniUpdateStats() {
  return useQuery({
    queryKey: ["penghuni-update-stats"],
    queryFn: async () => {
      const [units, rows] = await Promise.all([
        supabase.from("units").select("id", { count: "exact", head: true }),
        supabase.from("penghuni_updates").select("status"),
      ]);
      const list = (rows.data || []) as { status: string }[];
      const sudah = list.filter((r) => r.status === "sudah_diperbarui").length;
      const perlu = list.filter((r) => r.status === "perlu_diperbarui").length;
      const totalUnit = units.count || 0;
      return {
        totalUnit,
        sudah,
        perlu,
        belum: Math.max(totalUnit - sudah, 0),
        progress: totalUnit > 0 ? Math.round((sudah / totalUnit) * 100) : 0,
      };
    },
  });
}

export function useUpdatePenghuniUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UpdateStatus }) => {
      const { error } = await supabase.from("penghuni_updates").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["penghuni-updates"] });
      qc.invalidateQueries({ queryKey: ["penghuni-update-stats"] });
    },
  });
}
