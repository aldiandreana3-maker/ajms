import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ForeignGuest {
  id: string;
  unit_id: string | null;
  full_name: string;
  birth_place: string;
  birth_date: string;
  gender: "pria" | "wanita";
  nationality: string;
  passport_number: string;
  passport_expiry: string;
  passport_photo_url: string | null;
  check_in_date: string;
  check_out_date: string;
  recorded_by: string | null;
  created_at: string;
  units?: { unit_number: string } | null;
}

interface CreateForeignGuestInput {
  unit_id?: string;
  full_name: string;
  birth_place: string;
  birth_date: string;
  gender: "pria" | "wanita";
  nationality: string;
  passport_number: string;
  passport_expiry: string;
  passport_photo_url?: string;
  check_in_date: string;
  check_out_date: string;
}

export function useForeignGuests() {
  return useQuery({
    queryKey: ["foreign-guests"],
    queryFn: async (): Promise<ForeignGuest[]> => {
      const { data, error } = await (supabase as any)
        .from("foreign_guest_reports")
        .select(`
          *,
          units:unit_id(unit_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ForeignGuest[];
    },
  });
}

export function useCreateForeignGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateForeignGuestInput) => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Silakan login terlebih dahulu");
      }
      
      await supabase.auth.refreshSession();
      
      const { data, error } = await (supabase as any)
        .from("foreign_guest_reports")
        .insert({
          ...input,
          recorded_by: sessionData.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foreign-guests"] });
      toast.success("Data tamu asing berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan data: " + error.message);
    },
  });
}
