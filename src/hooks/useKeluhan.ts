import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateKeluhanSchema } from "@/lib/validation";

interface Keluhan {
  id: string;
  penghuni_id: string | null;
  unit_id: string | null;
  subject: string;
  description: string;
  status: "pending" | "proses" | "selesai";
  photo_url: string | null;
  response: string | null;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
  penghuni_name: string | null;
  unit_number: string | null;
  phone: string | null;
  penghuni?: { full_name: string } | null;
  units?: { unit_number: string } | null;
}

interface CreateKeluhanInput {
  penghuni_id?: string;
  unit_id?: string;
  subject: string;
  description: string;
  photo_url?: string;
  penghuni_name?: string;
  unit_number?: string;
  phone?: string;
}

export function useKeluhan() {
  return useQuery({
    queryKey: ["keluhan"],
    queryFn: async (): Promise<Keluhan[]> => {
      const { data, error } = await supabase
        .from("keluhan")
        .select(`
          *,
          penghuni:penghuni_id(full_name),
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Keluhan[];
    },
  });
}

export function useCreateKeluhan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rawInput: CreateKeluhanInput) => {
      const input = CreateKeluhanSchema.parse(rawInput);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const { data, error } = await supabase
        .from("keluhan")
        .insert({
          subject: input.subject,
          description: input.description,
          photo_url: input.photo_url,
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
      queryClient.invalidateQueries({ queryKey: ["keluhan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Keluhan berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan keluhan: " + error.message);
    },
  });
}

export function useUpdateKeluhanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: "pending" | "proses" | "selesai"; response?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("keluhan")
        .update({ 
          status, 
          response,
          handled_by: userData.user?.id 
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keluhan"] });
      toast.success("Status keluhan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });
}

export function useDeleteKeluhan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("keluhan")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keluhan"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Data keluhan berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    },
  });
}
