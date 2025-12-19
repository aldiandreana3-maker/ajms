import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccessCard {
  id: string;
  penghuni_id: string | null;
  unit_id: string | null;
  card_number: string;
  card_type: string;
  status: "active" | "inactive" | "lost" | "damaged";
  issued_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  penghuni_name: string | null;
  unit_number: string | null;
  request_type: string | null;
  quantity_requested: number | null;
  ktp_photo_url: string | null;
  surat_kuasa_url: string | null;
  payment_proof_url: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateAccessCardInput {
  penghuni_id?: string;
  unit_id?: string;
  card_number: string;
  card_type?: string;
  expires_at?: string;
  notes?: string;
  penghuni_name?: string;
  unit_number?: string;
  request_type?: string;
  quantity_requested?: number;
}

export function useAccessCards() {
  return useQuery({
    queryKey: ["access-cards"],
    queryFn: async (): Promise<AccessCard[]> => {
      const { data, error } = await supabase
        .from("access_cards")
        .select(`
          *,
          penghuni:penghuni_id(full_name),
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AccessCard[];
    },
  });
}

export function useCreateAccessCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAccessCardInput) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const { data, error } = await supabase
        .from("access_cards")
        .insert({
          card_number: input.card_number,
          card_type: input.card_type || "resident",
          expires_at: input.expires_at,
          notes: input.notes,
          penghuni_name: input.penghuni_name,
          unit_number: input.unit_number,
          request_type: input.request_type,
          quantity_requested: input.quantity_requested || 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Kartu akses berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan kartu akses: " + error.message);
    },
  });
}

export function useUpdateAccessCardStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "active" | "inactive" | "lost" | "damaged"; notes?: string }) => {
      const { data, error } = await supabase
        .from("access_cards")
        .update({ status, notes })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status kartu akses berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });
}

export function useDeleteAccessCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("access_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Data kartu akses berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    },
  });
}
