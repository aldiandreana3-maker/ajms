import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Package {
  id: string;
  unit_id: string | null;
  unit_number: string | null;
  owner_name: string;
  item_name: string;
  item_type: string;
  courier: string;
  photo_url: string | null;
  notes: string | null;
  status: string;
  picked_up_at: string | null;
  picked_up_by: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined profile names
  recorded_by_name?: string | null;
  picked_up_by_name?: string | null;
}

export interface CreatePackageInput {
  unit_id?: string;
  unit_number?: string;
  owner_name: string;
  item_name: string;
  item_type: string;
  courier: string;
  photo_url?: string;
  notes?: string;
}

export function usePackages() {
  return useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select(`
          *,
          recorded_by_profile:profiles!packages_recorded_by_fkey(full_name),
          picked_up_by_profile:profiles!packages_picked_up_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to flatten profile names
      return (data || []).map((pkg: any) => ({
        ...pkg,
        recorded_by_name: pkg.recorded_by_profile?.full_name || null,
        picked_up_by_name: pkg.picked_up_by_profile?.full_name || null,
      })) as Package[];
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("packages")
        .insert({
          ...input,
          recorded_by: user?.id,
          status: "belum_diambil",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Paket berhasil ditambahkan");
    },
    onError: (error) => {
      console.error("Error creating package:", error);
      toast.error("Gagal menambahkan paket");
    },
  });
}

export function useUpdatePackageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = { status };
      if (status === "diambil") {
        updateData.picked_up_at = new Date().toISOString();
        updateData.picked_up_by = user?.id;
      } else {
        updateData.picked_up_at = null;
        updateData.picked_up_by = null;
      }

      const { data, error } = await supabase
        .from("packages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Status paket berhasil diubah");
    },
    onError: (error) => {
      console.error("Error updating package status:", error);
      toast.error("Gagal mengubah status paket");
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Paket berhasil dihapus");
    },
    onError: (error) => {
      console.error("Error deleting package:", error);
      toast.error("Gagal menghapus paket");
    },
  });
}
