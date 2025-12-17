import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Agent {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  office_location: string | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentUnit {
  id: string;
  agent_id: string;
  unit_id: string;
  created_at: string;
  units?: { unit_number: string } | null;
}

interface AgentWithUnits extends Agent {
  agent_units?: AgentUnit[];
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: async (): Promise<AgentWithUnits[]> => {
      const { data, error } = await supabase
        .from("agents")
        .select(`
          *,
          agent_units(
            id,
            unit_id,
            units:unit_id(unit_number)
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AgentWithUnits[];
    },
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Agent, "id" | "created_at" | "updated_at" | "is_active">) => {
      const { data, error } = await supabase
        .from("agents")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan agent: " + error.message);
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Agent> & { id: string }) => {
      const { data, error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui agent: " + error.message);
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agents")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus agent: " + error.message);
    },
  });
}

export function useAddAgentUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agent_id, unit_id }: { agent_id: string; unit_id: string }) => {
      const { data, error } = await supabase
        .from("agent_units")
        .insert({ agent_id, unit_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Unit berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan unit: " + error.message);
    },
  });
}

export function useRemoveAgentUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_units")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Unit berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus unit: " + error.message);
    },
  });
}
