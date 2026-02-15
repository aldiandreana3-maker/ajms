import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const QUARTER_MONTHS = [
  { start: 1, end: 3, label: (y: number) => `Jan-Mar ${y}` },
  { start: 4, end: 6, label: (y: number) => `Apr-Jun ${y}` },
  { start: 7, end: 9, label: (y: number) => `Jul-Sep ${y}` },
  { start: 10, end: 12, label: (y: number) => `Okt-Des ${y}` },
];

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Determine current quarter
    const quarter = QUARTER_MONTHS.find((q) => currentMonth >= q.start && currentMonth <= q.end)!;
    const quarterStart = `${currentYear}-${String(quarter.start).padStart(2, "0")}-01`;
    const quarterEnd = `${currentYear}-${String(quarter.end).padStart(2, "0")}-28`; // approximate end
    const quarterLabel = quarter.label(currentYear);
    const dueDate = `${currentYear}-${String(quarter.start).padStart(2, "0")}-05`;

    // Check if bills already exist for this quarter
    const { data: existingBills } = await supabase
      .from("bills")
      .select("id")
      .eq("quarter_label", quarterLabel)
      .eq("is_auto_generated", true)
      .limit(1);

    if (existingBills && existingBills.length > 0) {
      return new Response(
        JSON.stringify({ message: "Bills already generated for this quarter", quarter: quarterLabel }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active bill rates
    const { data: rates, error: ratesError } = await supabase
      .from("bill_rates")
      .select("*")
      .eq("is_active", true);

    if (ratesError) throw ratesError;
    if (!rates || rates.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active bill rates found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all units
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("id, unit_number, area_sqm");
    if (unitsError) throw unitsError;

    // Get active penghuni
    const { data: penghuniList } = await supabase
      .from("penghuni")
      .select("id, full_name, unit_id")
      .eq("is_active", true);

    const penghuniByUnit = new Map<string, { id: string; full_name: string }>();
    penghuniList?.forEach((p: any) => {
      if (p.unit_id) penghuniByUnit.set(p.unit_id, { id: p.id, full_name: p.full_name });
    });

    let billsCreated = 0;

    for (const unit of units || []) {
      if (!unit.area_sqm) continue;

      const matchedRate = rates.find((r: any) => Number(r.area_sqm) === Number(unit.area_sqm));
      if (!matchedRate) continue;

      const penghuni = penghuniByUnit.get(unit.id);
      const scMonthly = Number(matchedRate.monthly_sc);
      const sfMonthly = Number(matchedRate.monthly_sf);
      const scTotal = scMonthly * 3;
      const sfTotal = sfMonthly * 3;
      const totalAmount = scTotal + sfTotal;

      // Create quarterly bill
      const { data: bill, error: billError } = await supabase
        .from("bills")
        .insert({
          unit_id: unit.id,
          unit_number: unit.unit_number,
          penghuni_id: penghuni?.id || null,
          bill_type: "ipl",
          amount: totalAmount,
          billing_period: quarterStart,
          due_date: dueDate,
          quarter_start: quarterStart,
          quarter_end: quarterEnd,
          quarter_label: quarterLabel,
          sc_monthly: scMonthly,
          sf_monthly: sfMonthly,
          sc_total: scTotal,
          sf_total: sfTotal,
          total_amount: totalAmount,
          is_auto_generated: true,
          payment_status: "unpaid",
          notes: `${matchedRate.area_label} - ${penghuni?.full_name || "N/A"}`,
        })
        .select("id")
        .single();

      if (billError) {
        console.error(`Error creating bill for unit ${unit.unit_number}:`, billError);
        continue;
      }

      // Create 3 monthly payment records
      const payments = [];
      for (let i = 0; i < 3; i++) {
        const monthIdx = quarter.start - 1 + i; // 0-indexed
        const monthDate = `${currentYear}-${String(monthIdx + 1).padStart(2, "0")}-01`;
        const monthLabel = `${MONTH_NAMES[monthIdx]} ${currentYear}`;

        payments.push({
          bill_id: bill.id,
          month_number: i + 1,
          month_label: monthLabel,
          month_date: monthDate,
          sc_amount: scMonthly,
          sf_amount: sfMonthly,
          total_amount: scMonthly + sfMonthly,
        });
      }

      const { error: pError } = await supabase.from("bill_payments").insert(payments);
      if (pError) {
        console.error(`Error creating payments for bill ${bill.id}:`, pError);
        continue;
      }

      billsCreated++;
    }

    return new Response(
      JSON.stringify({
        message: `Successfully generated ${billsCreated} quarterly bills`,
        quarter: quarterLabel,
        due_date: dueDate,
        bills_count: billsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
