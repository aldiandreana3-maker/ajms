import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Facility {
  id: string;
  name: string;
  description: string | null;
  icon_name: string | null;
  floor_location: string | null;
  status: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFacilities() {
  return useQuery({
    queryKey: ["facilities"],
    queryFn: async (): Promise<Facility[]> => {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Facility[];
    },
  });
}

export function useCreateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Facility, "id" | "created_at" | "updated_at" | "is_active">) => {
      const { data, error } = await supabase
        .from("facilities")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("Fasilitas berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan fasilitas: " + error.message);
    },
  });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Facility> & { id: string }) => {
      const { data, error } = await supabase
        .from("facilities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("Fasilitas berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui fasilitas: " + error.message);
    },
  });
}

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("facilities")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
      toast.success("Fasilitas berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus fasilitas: " + error.message);
    },
  });
}
