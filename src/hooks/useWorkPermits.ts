import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkPermit {
  id: string;
  unit_id: string | null;
  penghuni_id: string | null;
  vendor_name: string;
  work_description: string;
  worker_count: number;
  start_date: string;
  end_date: string;
  document_url: string | null;
  payment_proof_url: string | null;
  payment_method: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  penghuni_name: string | null;
  unit_number: string | null;
  phone: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateWorkPermitInput {
  unit_id?: string;
  penghuni_id?: string;
  vendor_name: string;
  work_description: string;
  worker_count?: number;
  start_date: string;
  end_date: string;
  document_url?: string;
  payment_proof_url?: string;
  payment_method?: string;
  penghuni_name?: string;
  unit_number?: string;
  phone?: string;
}


export function useWorkPermits() {
  return useQuery({
    queryKey: ["work-permits"],
    queryFn: async (): Promise<WorkPermit[]> => {
      const { data, error } = await supabase
        .from("work_permits")
        .select(`
          *,
          penghuni:penghuni_id(full_name),
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkPermit[];
    },
  });
}

export function useCreateWorkPermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkPermitInput) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const { data, error } = await supabase
        .from("work_permits")
        .insert({
          vendor_name: input.vendor_name,
          work_description: input.work_description,
          worker_count: input.worker_count || 1,
          start_date: input.start_date,
          end_date: input.end_date,
          document_url: input.document_url,
          payment_proof_url: input.payment_proof_url,
          payment_method: input.payment_method,
          penghuni_name: input.penghuni_name,
          unit_number: input.unit_number,
          phone: input.phone,
          created_by: sessionData.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-permits"] });
      toast.success("Pengajuan izin kerja berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal mengajukan izin kerja: " + error.message);
    },
  });
}

export function useUpdateWorkPermitStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: "pending" | "approved" | "rejected"; notes?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("work_permits")
        .update({ 
          status, 
          notes,
          approved_by: userData.user?.id 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-permits"] });
      toast.success("Status izin kerja berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });
}

export function useDeleteWorkPermit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("work_permits")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-permits"] });
      toast.success("Data izin kerja berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    },
  });
}
