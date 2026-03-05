import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmployeeBiodata {
  id: string;
  user_id: string;
  full_name: string;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployeeBiodataList() {
  return useQuery({
    queryKey: ["employee-biodata"],
    queryFn: async (): Promise<EmployeeBiodata[]> => {
      const { data, error } = await supabase
        .from("employee_biodata")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data as EmployeeBiodata[];
    },
  });
}

export function useCreateEmployeeBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<EmployeeBiodata, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("employee_biodata").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-biodata"] });
      toast.success("Data karyawan berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan data: " + error.message);
    },
  });
}

export function useUpdateEmployeeBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmployeeBiodata> & { id: string }) => {
      const { error } = await supabase
        .from("employee_biodata")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-biodata"] });
      toast.success("Data karyawan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui data: " + error.message);
    },
  });
}

export function useDeleteEmployeeBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employee_biodata").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-biodata"] });
      toast.success("Data karyawan berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    },
  });
}
