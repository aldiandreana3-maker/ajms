import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoodsMovement {
  id: string;
  unit_id: string | null;
  penghuni_id: string | null;
  movement_type: "in" | "out";
  item_description: string;
  quantity: number;
  carrier_name: string | null;
  carrier_id: string | null;
  qr_code: string | null;
  photo_url: string | null;
  recorded_by: string | null;
  created_at: string;
  penghuni_name: string | null;
  unit_number: string | null;
  phone: string | null;
  rental_status: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateGoodsMovementInput {
  unit_id?: string;
  penghuni_id?: string;
  movement_type: "in" | "out";
  item_description: string;
  quantity?: number;
  carrier_name?: string;
  carrier_id?: string;
  photo_url?: string;
  penghuni_name?: string;
  unit_number?: string;
  phone?: string;
  rental_status?: string;
}

export function useGoodsMovement() {
  return useQuery({
    queryKey: ["goods-movement"],
    queryFn: async (): Promise<GoodsMovement[]> => {
      const { data, error } = await supabase
        .from("goods_movement")
        .select(`
          *,
          penghuni:penghuni_id(full_name),
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GoodsMovement[];
    },
  });
}

export function useCreateGoodsMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoodsMovementInput) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const qr_code = `GM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("goods_movement")
        .insert({
          movement_type: input.movement_type,
          item_description: input.item_description,
          quantity: input.quantity || 1,
          carrier_name: input.carrier_name,
          carrier_id: input.carrier_id,
          photo_url: input.photo_url,
          qr_code,
          recorded_by: sessionData.session.user.id,
          penghuni_name: input.penghuni_name,
          unit_number: input.unit_number,
          phone: input.phone,
          rental_status: input.rental_status,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-movement"] });
      toast.success("Data keluar/masuk barang berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan data: " + error.message);
    },
  });
}
