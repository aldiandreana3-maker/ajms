import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DataToken {
  id: string;
  unit_number: string;
  tower: string;
  floor: number;
  unit_no: number;
  kwh_id: string | null;
  sisa_kwh: number;
  tanggal_bypass: string | null;
  tanggal_normalisasi: string | null;
  status: string;
  catatan: string | null;
  no_wa: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DataTokenHistory {
  id: string;
  data_token_id: string | null;
  unit_number: string;
  old_status: string | null;
  new_status: string | null;
  old_catatan: string | null;
  new_catatan: string | null;
  changed_by: string | null;
  changed_by_name: string | null;
  created_at: string;
}

// Generate all valid units per spec
export function generateAllUnits() {
  const towers = ["A", "B", "C", "D"];
  const skipFloors = new Set([4, 13, 14]);
  const list: { unit_number: string; tower: string; floor: number; unit_no: number }[] = [];
  for (const t of towers) {
    for (let f = 1; f <= 23; f++) {
      if (skipFloors.has(f)) continue;
      const maxUnit = f <= 20 ? 34 : 31;
      for (let u = 1; u <= maxUnit; u++) {
        const unit_number = `${t}${String(f).padStart(2, "0")}${String(u).padStart(2, "0")}`;
        list.push({ unit_number, tower: t, floor: f, unit_no: u });
      }
    }
  }
  return list;
}

export function useDataTokens() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["data-tokens"],
    queryFn: async (): Promise<DataToken[]> => {
      const all: DataToken[] = [];
      let from = 0;
      const size = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("data_tokens" as any)
          .select("*")
          .order("unit_number", { ascending: true })
          .range(from, from + size - 1);
        if (error) throw error;
        const rows = (data || []) as unknown as DataToken[];
        all.push(...rows);
        if (rows.length < size) break;
        from += size;
      }
      return all;
    },
  });

  const generateUnits = useMutation({
    mutationFn: async () => {
      const all = generateAllUnits();
      const { data: existing } = await supabase
        .from("data_tokens" as any)
        .select("unit_number");
      const existSet = new Set((existing || []).map((r: any) => r.unit_number));
      const toInsert = all.filter((u) => !existSet.has(u.unit_number));
      if (toInsert.length === 0) return 0;
      const batchSize = 500;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("data_tokens" as any).insert(batch as any);
        if (error) throw error;
      }
      return toInsert.length;
    },
    onSuccess: (n) => {
      qc.invalidateQueries({ queryKey: ["data-tokens"] });
      toast({ title: n > 0 ? `${n} unit berhasil di-generate` : "Semua unit sudah ada" });
    },
    onError: (e: any) =>
      toast({ title: "Gagal generate unit", description: e.message, variant: "destructive" }),
  });

  const createOne = useMutation({
    mutationFn: async (row: Partial<DataToken>) => {
      const { error } = await supabase.from("data_tokens" as any).insert(row as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-tokens"] });
      toast({ title: "Data token ditambahkan" });
    },
    onError: (e: any) =>
      toast({ title: "Gagal menambahkan", description: e.message, variant: "destructive" }),
  });

  const updateOne = useMutation({
    mutationFn: async ({
      id,
      old,
      updates,
      userName,
    }: {
      id: string;
      old: DataToken;
      updates: Partial<DataToken>;
      userName?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("data_tokens" as any)
        .update({ ...updates, updated_by: user?.id } as any)
        .eq("id", id);
      if (error) throw error;
      // log history if status or catatan changed
      const statusChanged = updates.status !== undefined && updates.status !== old.status;
      const catatanChanged = updates.catatan !== undefined && (updates.catatan ?? "") !== (old.catatan ?? "");
      if (statusChanged || catatanChanged) {
        await supabase.from("data_token_history" as any).insert({
          data_token_id: id,
          unit_number: old.unit_number,
          old_status: old.status,
          new_status: updates.status ?? old.status,
          old_catatan: old.catatan,
          new_catatan: updates.catatan ?? old.catatan,
          changed_by: user?.id,
          changed_by_name: userName || user?.email,
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-tokens"] });
      qc.invalidateQueries({ queryKey: ["data-token-history"] });
      toast({ title: "Data token diperbarui" });
    },
    onError: (e: any) =>
      toast({ title: "Gagal memperbarui", description: e.message, variant: "destructive" }),
  });

  const deleteOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("data_tokens" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-tokens"] });
      toast({ title: "Data token dihapus" });
    },
    onError: (e: any) =>
      toast({ title: "Gagal menghapus", description: e.message, variant: "destructive" }),
  });

  return {
    tokens: query.data ?? [],
    isLoading: query.isLoading,
    generateUnits,
    createOne,
    updateOne,
    deleteOne,
  };
}

export function useDataTokenHistory(tokenId?: string) {
  return useQuery({
    queryKey: ["data-token-history", tokenId],
    queryFn: async (): Promise<DataTokenHistory[]> => {
      let q = supabase.from("data_token_history" as any).select("*").order("created_at", { ascending: false }).limit(200);
      if (tokenId) q = q.eq("data_token_id", tokenId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as DataTokenHistory[];
    },
  });
}
