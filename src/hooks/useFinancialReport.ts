import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface FinancialReport {
  totalIncome: number;
  totalExpense: number;
  monthlyData: MonthlyData[];
}

export function useFinancialReport(year: number = new Date().getFullYear()) {
  return useQuery({
    queryKey: ["financial-report", year],
    queryFn: async (): Promise<FinancialReport> => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Get paid bills for income
      const { data: bills, error: billsError } = await supabase
        .from("bills")
        .select("paid_amount, paid_at")
        .eq("payment_status", "paid")
        .gte("paid_at", startDate)
        .lte("paid_at", endDate);

      if (billsError) throw billsError;

      // Get expenses
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, expense_date")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate);

      if (expensesError) throw expensesError;

      // Calculate totals
      const totalIncome = bills?.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0) || 0;
      const totalExpense = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

      // Group by month
      const monthlyData: MonthlyData[] = [];
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

      for (let i = 0; i < 12; i++) {
        const monthStr = String(i + 1).padStart(2, "0");
        const monthStart = `${year}-${monthStr}-01`;
        const monthEnd = `${year}-${monthStr}-31`;

        const monthIncome = bills
          ?.filter((b) => b.paid_at && b.paid_at >= monthStart && b.paid_at <= monthEnd)
          .reduce((sum, b) => sum + (b.paid_amount || 0), 0) || 0;

        const monthExpense = expenses
          ?.filter((e) => e.expense_date >= monthStart && e.expense_date <= monthEnd)
          .reduce((sum, e) => sum + e.amount, 0) || 0;

        monthlyData.push({
          month: months[i],
          income: monthIncome,
          expense: monthExpense,
        });
      }

      return {
        totalIncome,
        totalExpense,
        monthlyData,
      };
    },
  });
}
