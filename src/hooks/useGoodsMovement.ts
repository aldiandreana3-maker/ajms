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
      const { data: userData } = await supabase.auth.getUser();
      
      // Generate QR code (simple UUID-based code)
      const qr_code = `GM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("goods_movement")
        .insert({
          ...input,
          qr_code,
          recorded_by: userData.user?.id,
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
