import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface HousekeepingTask {
  id: string;
  task_date: string;
  area_name: string;
  task_description: string;
  status: string;
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
  photo_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export function useHousekeeping() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tasks = useQuery({
    queryKey: ["housekeeping-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .select("*")
        .order("task_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as HousekeepingTask[];
    },
  });

  const addTask = useMutation({
    mutationFn: async (task: Partial<HousekeepingTask>) => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
      toast({ title: "Tugas kebersihan berhasil ditambahkan" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menambahkan tugas", description: e.message, variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HousekeepingTask> & { id: string }) => {
      const { data, error } = await supabase
        .from("housekeeping_tasks")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["housekeeping-tasks"] });
      toast({ title: "Tugas berhasil diperbarui" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal memperbarui tugas", description: e.message, variant: "destructive" });
    },
  });

  return { tasks, addTask, updateTask };
}
