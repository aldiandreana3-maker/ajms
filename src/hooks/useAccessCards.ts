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
      const { data, error } = await supabase
        .from("access_cards")
        .insert(input)
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
