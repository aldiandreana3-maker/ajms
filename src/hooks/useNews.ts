import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface News {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  scheduled_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateNewsInput {
  title: string;
  content: string;
  image_url?: string;
  status?: "draft" | "published";
  scheduled_at?: string;
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: async (): Promise<News[]> => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as News[];
    },
  });
}

export function usePublishedNews() {
  return useQuery({
    queryKey: ["published-news"],
    queryFn: async (): Promise<News[]> => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as News[];
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNewsInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("news")
        .insert({
          ...input,
          author_id: userData.user?.id,
          published_at: input.status === "published" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["published-news"] });
      toast.success("Berita berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan berita: " + error.message);
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: CreateNewsInput & { id: string }) => {
      const { data, error } = await supabase
        .from("news")
        .update({
          ...input,
          published_at: input.status === "published" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["published-news"] });
      toast.success("Berita berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui berita: " + error.message);
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["published-news"] });
      toast.success("Berita berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus berita: " + error.message);
    },
  });
}
