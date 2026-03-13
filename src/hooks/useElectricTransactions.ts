import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ElectricTransaction {
  id: string;
  meter_id: string | null;
  unit_id: string | null;
  unit_number: string;
  penghuni_name: string | null;
  meter_number: string;
  nominal: number;
  price_per_kwh: number;
  kwh_amount: number;
  balance_before: number;
  balance_after: number;
  transaction_date: string;
  operator_id: string | null;
  operator_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useElectricTransactions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["electric-transactions"],
    queryFn: async (): Promise<ElectricTransaction[]> => {
      const { data, error } = await supabase
        .from("electric_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data as unknown as ElectricTransaction[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (tx: Partial<ElectricTransaction>) => {
      // Insert transaction
      const { data, error } = await supabase
        .from("electric_transactions")
        .insert(tx as any)
        .select()
        .single();
      if (error) throw error;

      // Update meter balance
      if (tx.meter_id && tx.balance_after !== undefined) {
        const { error: meterError } = await supabase
          .from("electric_meters")
          .update({ kwh_balance: tx.balance_after } as any)
          .eq("id", tx.meter_id);
        if (meterError) throw meterError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["electric-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["electric-meters"] });
      toast({ title: "Transaksi listrik berhasil disimpan" });
    },
    onError: (e: any) => {
      toast({ title: "Gagal menyimpan transaksi", description: e.message, variant: "destructive" });
    },
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createTransaction,
  };
}
