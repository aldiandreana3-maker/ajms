import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Penghuni {
  id: string;
  user_id: string | null;
  unit_id: string | null;
  unit_number: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  ktp_number: string | null;
  is_owner: boolean | null;
  is_active: boolean | null;
  is_hidden: boolean | null;
  move_in_date: string | null;
  move_out_date: string | null;
  created_at: string | null;

  updated_at: string | null;
  units?: { unit_number: string; area_sqm: number | null; type: string | null } | null;
}

interface CreatePenghuniData {
  full_name: string;
  unit_id?: string;
  unit_number?: string;
  area_sqm?: string;
  email?: string;
  phone?: string;
  ktp_number?: string;
  is_owner?: boolean;
  is_active?: boolean;
}

interface UpdatePenghuniData extends Partial<CreatePenghuniData> {
  id: string;
}

export interface PaginatedPenghuniResult {
  data: Penghuni[];
  totalCount: number;
}

// Server-side paginated hook
export function usePenghuniPaginated(
  page: number,
  pageSize: number,
  search: string = "",
  includeHidden: boolean = false
) {
  return useQuery({
    queryKey: ["penghuni-paginated", page, pageSize, search, includeHidden],

    queryFn: async (): Promise<PaginatedPenghuniResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("penghuni")
        .select(`
          *,
          units:unit_id(unit_number, area_sqm, type)
        `, { count: "exact" });

      if (search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.or(
          `full_name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm},ktp_number.ilike.${searchTerm},unit_number.ilike.${searchTerm}`
        );
      }

      query = query
        .order("full_name", { ascending: true })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return {
        data: (data || []) as Penghuni[],
        totalCount: count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

// Legacy hook (limited to 1000)
export function usePenghuni() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["penghuni"],
    queryFn: async (): Promise<Penghuni[]> => {
      const { data, error } = await supabase
        .from("penghuni")
        .select(`
          *,
          units:unit_id(unit_number, area_sqm, type)
        `)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Penghuni[];
    },
  });

  const createPenghuni = useMutation({
    mutationFn: async (data: CreatePenghuniData) => {
      let unitId = data.unit_id;
      if (data.unit_number && !data.unit_id) {
        const areaSqm = data.area_sqm ? parseFloat(data.area_sqm) : null;
        const upsertData: any = { unit_number: data.unit_number };
        if (areaSqm) upsertData.area_sqm = areaSqm;
        
        const { data: unitData } = await supabase
          .from("units")
          .upsert(upsertData, { onConflict: "unit_number" })
          .select("id")
          .single();
        unitId = unitData?.id || undefined;
      }

      const { data: result, error } = await supabase
        .from("penghuni")
        .insert({ 
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          ktp_number: data.ktp_number,
          is_owner: data.is_owner,
          is_active: data.is_active,
          unit_id: unitId,
          unit_number: data.unit_number || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni-paginated"] });
    },
  });

  const updatePenghuni = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePenghuniData) => {
      let unitId = data.unit_id;
      if (data.unit_number && !data.unit_id) {
        const areaSqm = data.area_sqm ? parseFloat(data.area_sqm) : null;
        const upsertData: any = { unit_number: data.unit_number };
        if (areaSqm) upsertData.area_sqm = areaSqm;

        const { data: unitData } = await supabase
          .from("units")
          .upsert(upsertData, { onConflict: "unit_number" })
          .select("id")
          .single();
        unitId = unitData?.id || undefined;
      }

      const { data: result, error } = await supabase
        .from("penghuni")
        .update({ 
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          ktp_number: data.ktp_number,
          is_owner: data.is_owner,
          is_active: data.is_active,
          unit_id: unitId,
          unit_number: data.unit_number || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni-paginated"] });
    },
  });

  const deletePenghuni = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("penghuni")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni-paginated"] });
    },
  });

  return {
    penghuni: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPenghuni,
    updatePenghuni,
    deletePenghuni,
  };
}
