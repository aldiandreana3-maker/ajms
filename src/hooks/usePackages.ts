import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";

export type DateFilterType = "all" | "today" | "week" | "month" | "year";

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

export interface PaginatedPackagesResult {
  data: Package[];
  totalCount: number;
}

// Helper function to get date range based on filter
function getDateRange(dateFilter: DateFilterType): { start: Date; end: Date } | null {
  if (dateFilter === "all") return null;

  const now = new Date();
  switch (dateFilter) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "year":
      return { start: startOfYear(now), end: endOfYear(now) };
    default:
      return null;
  }
}

// New hook for server-side paginated packages
export function usePackagesPaginated(
  page: number,
  pageSize: number,
  search: string = "",
  dateFilter: DateFilterType = "all"
) {
  return useQuery({
    queryKey: ["packages-paginated", page, pageSize, search, dateFilter],
    queryFn: async (): Promise<PaginatedPackagesResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build base query
      let query = supabase
        .from("packages")
        .select(`
          *,
          recorded_by_profile:profiles!packages_recorded_by_fkey(full_name),
          picked_up_by_profile:profiles!packages_picked_up_by_fkey(full_name)
        `, { count: "exact" });

      // Apply date filter
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query = query
          .gte("created_at", dateRange.start.toISOString())
          .lte("created_at", dateRange.end.toISOString());
      }

      // Apply search filter (using or for multiple columns)
      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(
          `owner_name.ilike.${searchTerm},unit_number.ilike.${searchTerm},courier.ilike.${searchTerm},item_type.ilike.${searchTerm}`
        );
      }

      // Apply ordering and pagination
      query = query
        .order("created_at", { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform the data to flatten profile names
      const transformedData = (data || []).map((pkg: any) => ({
        ...pkg,
        recorded_by_name: pkg.recorded_by_name || pkg.recorded_by_profile?.full_name || null,
        picked_up_by_name: pkg.picked_up_by_name || pkg.picked_up_by_profile?.full_name || null,
      })) as Package[];

      return {
        data: transformedData,
        totalCount: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// Keep old hook for backward compatibility (limited to 1000)
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
      
      return (data || []).map((pkg: any) => ({
        ...pkg,
        recorded_by_name: pkg.recorded_by_name || pkg.recorded_by_profile?.full_name || null,
        picked_up_by_name: pkg.picked_up_by_name || pkg.picked_up_by_profile?.full_name || null,
      })) as Package[];
    },
  });
}

export function useCreatePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePackageInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user's full name from profile
      let recordedByName: string | null = null;
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        recordedByName = profile?.full_name || null;
      }
      
      const { data, error } = await supabase
        .from("packages")
        .insert({
          ...input,
          recorded_by: user?.id,
          recorded_by_name: recordedByName, // Store name directly
          status: "belum_diambil",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["packages-paginated"] });
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
        
        // Get user's full name and store it directly
        if (user?.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();
          updateData.picked_up_by_name = profile?.full_name || null;
        }
      } else {
        updateData.picked_up_at = null;
        updateData.picked_up_by = null;
        updateData.picked_up_by_name = null;
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
      queryClient.invalidateQueries({ queryKey: ["packages-paginated"] });
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
      queryClient.invalidateQueries({ queryKey: ["packages-paginated"] });
      toast.success("Paket berhasil dihapus");
    },
    onError: (error) => {
      console.error("Error deleting package:", error);
      toast.error("Gagal menghapus paket");
    },
  });
}
