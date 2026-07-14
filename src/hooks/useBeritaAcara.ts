import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BeritaAcara {
  id: string;
  ba_number: string;
  target_table: string;
  target_record_id: string;
  action_type: "update" | "reverse" | "delete";
  reason: string;
  old_data: any;
  proposed_new_data: any;
  attachment_url: string | null;
  signature_url: string | null;
  status: "pending" | "approved" | "rejected";
  requested_by: string | null;
  requested_by_name: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  applied: boolean;
  created_at: string;
}

export function useBeritaAcara(statusFilter?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["berita_acara", statusFilter],
    queryFn: async () => {
      let q = supabase.from("berita_acara_koreksi" as any).select("*").order("created_at", { ascending: false });
      if (statusFilter && statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as BeritaAcara[];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (payload: {
      target_table: string;
      target_record_id: string;
      action_type: "update" | "reverse" | "delete";
      reason: string;
      old_data?: any;
      proposed_new_data?: any;
      attachment_url?: string;
      signature_url?: string;
    }) => {
      const { data: profile } = await supabase.from("profiles").select("full_name,email").eq("id", user!.id).maybeSingle();
      const { error } = await supabase.from("berita_acara_koreksi" as any).insert({
        ...payload,
        requested_by: user!.id,
        requested_by_name: profile?.full_name || profile?.email || "",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["berita_acara"] });
      toast.success("Berita Acara diajukan. Menunggu persetujuan Super Admin.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "approved" | "rejected"; notes?: string }) => {
      const { data: profile } = await supabase.from("profiles").select("full_name,email").eq("id", user!.id).maybeSingle();
      const { error } = await supabase.from("berita_acara_koreksi" as any).update({
        status,
        review_notes: notes || null,
        reviewed_by: user!.id,
        reviewed_by_name: profile?.full_name || profile?.email || "",
        reviewed_at: new Date().toISOString(),
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["berita_acara"] });
      toast.success(v.status === "approved" ? "Berita Acara disetujui & perubahan diterapkan." : "Berita Acara ditolak.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { items, isLoading, create, review };
}
