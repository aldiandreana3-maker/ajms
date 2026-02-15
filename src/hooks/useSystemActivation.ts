import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["system-activation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_activation")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleSystemStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newStatus: "aktif" | "tidak_aktif") => {
      const { data: current } = await supabase
        .from("system_activation")
        .select("id")
        .limit(1)
        .single();

      if (!current) throw new Error("System activation record not found");

      const updateData: Record<string, unknown> = {
        system_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "aktif") {
        updateData.activated_at = new Date().toISOString();
      } else {
        updateData.deactivated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("system_activation")
        .update(updateData)
        .eq("id", current.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-activation"] });
      toast({ title: "Status sistem berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    },
  });
}

export function useSystemPayments() {
  return useQuery({
    queryKey: ["system-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddSystemPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: {
      jenis_pembayaran: "aktivasi" | "bulanan";
      nominal: number;
      tanggal_bayar: string;
      due_date?: string;
      status: "pending" | "berhasil" | "gagal";
      notes?: string;
    }) => {
      const { error } = await supabase.from("system_payments").insert(payment);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-payments"] });
      queryClient.invalidateQueries({ queryKey: ["system-activation"] });
      toast({ title: "Pembayaran berhasil ditambahkan" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menambahkan pembayaran", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "berhasil" | "gagal" }) => {
      const { error } = await supabase
        .from("system_payments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-payments"] });
      queryClient.invalidateQueries({ queryKey: ["system-activation"] });
      toast({ title: "Status pembayaran berhasil diperbarui" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal memperbarui status", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("system_payments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-payments"] });
      toast({ title: "Pembayaran berhasil dihapus" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menghapus pembayaran", description: error.message, variant: "destructive" });
    },
  });
}
