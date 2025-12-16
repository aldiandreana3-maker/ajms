import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDashboardSettings() {
  return useQuery({
    queryKey: ["dashboard-settings"],
    queryFn: async (): Promise<DashboardSetting[]> => {
      const { data, error } = await (supabase
        .from("dashboard_settings" as any)
        .select("*") as any);

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateDashboardSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      settingKey,
      value,
    }: {
      settingKey: string;
      value: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase
        .from("dashboard_settings" as any)
        .update({ 
          setting_value: value,
          updated_by: user?.id 
        })
        .eq("setting_key", settingKey) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-settings"] });
      toast.success("Data berhasil diupdate");
    },
    onError: (error) => {
      console.error("Error updating setting:", error);
      toast.error("Gagal mengupdate data. Pastikan Anda memiliki akses Super Admin.");
    },
  });
}
