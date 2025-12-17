import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AboutUs {
  id: string;
  section_key: string;
  title: string;
  content: string;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAboutUs() {
  return useQuery({
    queryKey: ["about-us"],
    queryFn: async (): Promise<AboutUs[]> => {
      const { data, error } = await supabase
        .from("about_us")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as AboutUs[];
    },
  });
}

export function useUpdateAboutUs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AboutUs> & { id: string }) => {
      const { data, error } = await supabase
        .from("about_us")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-us"] });
      toast.success("Data berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui data: " + error.message);
    },
  });
}
