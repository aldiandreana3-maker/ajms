import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WorkOrder {
  id: string;
  keluhan_id: string | null;
  unit_id: string | null;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  units?: {
    unit_number: string;
  } | null;
  keluhan?: {
    subject: string;
    penghuni_name: string | null;
  } | null;
}

export interface CreateWorkOrderInput {
  unit_id?: string | null;
  keluhan_id?: string | null;
  title: string;
  description?: string;
  priority?: string;
}

export function useWorkOrders() {
  return useQuery({
    queryKey: ["work-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          units (unit_number),
          keluhan (subject, penghuni_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkOrder[];
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkOrderInput) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("work_orders")
        .insert({
          ...input,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Work order berhasil dibuat");
    },
    onError: (error) => {
      console.error("Error creating work order:", error);
      toast.error("Gagal membuat work order");
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      assigned_to,
    }: {
      id: string;
      status: "pending" | "in_progress" | "completed";
      assigned_to?: string | null;
    }) => {
      const updateData: Record<string, unknown> = { status };
      
      if (assigned_to !== undefined) {
        updateData.assigned_to = assigned_to;
      }
      
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("work_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Status work order berhasil diperbarui");
    },
    onError: (error) => {
      console.error("Error updating work order status:", error);
      toast.error("Gagal memperbarui status work order");
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Work order berhasil dihapus");
    },
    onError: (error) => {
      console.error("Error deleting work order:", error);
      toast.error("Gagal menghapus work order");
    },
  });
}
