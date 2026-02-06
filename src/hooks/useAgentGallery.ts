import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgentGalleryImage {
  id: string;
  agent_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useAgentGallery(agentId: string | null) {
  return useQuery({
    queryKey: ["agent-gallery", agentId],
    queryFn: async (): Promise<AgentGalleryImage[]> => {
      if (!agentId) return [];
      
      const { data, error } = await supabase
        .from("agent_gallery")
        .select("*")
        .eq("agent_id", agentId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as AgentGalleryImage[];
    },
    enabled: !!agentId,
  });
}

export function useAddGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agent_id, image_url, caption }: { 
      agent_id: string; 
      image_url: string; 
      caption?: string;
    }) => {
      const { data, error } = await supabase
        .from("agent_gallery")
        .insert({ agent_id, image_url, caption })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent-gallery", variables.agent_id] });
      toast.success("Foto berhasil ditambahkan ke galeri");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan foto: " + error.message);
    },
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id, caption }: { 
      id: string; 
      agent_id: string;
      caption?: string;
    }) => {
      const { data, error } = await supabase
        .from("agent_gallery")
        .update({ caption })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent-gallery", variables.agent_id] });
      toast.success("Caption foto berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui caption: " + error.message);
    },
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, agent_id }: { id: string; agent_id: string }) => {
      const { error } = await supabase
        .from("agent_gallery")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agent-gallery", variables.agent_id] });
      toast.success("Foto berhasil dihapus dari galeri");
    },
    onError: (error) => {
      toast.error("Gagal menghapus foto: " + error.message);
    },
  });
}

export function useUploadGalleryImage() {
  return useMutation({
    mutationFn: async ({ file, agentId }: { file: File; agentId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agent-gallery')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agent-gallery')
        .getPublicUrl(fileName);

      return publicUrl;
    },
    onError: (error) => {
      toast.error("Gagal mengupload foto: " + error.message);
    },
  });
}
