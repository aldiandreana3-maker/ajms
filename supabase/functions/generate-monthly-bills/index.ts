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
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const quarter = QUARTER_MONTHS.find((q) => currentMonth >= q.start && currentMonth <= q.end)!;
    const quarterStart = `${currentYear}-${String(quarter.start).padStart(2, "0")}-01`;
    const quarterEnd = `${currentYear}-${String(quarter.end).padStart(2, "0")}-28`;
    const quarterLabel = quarter.label(currentYear);
    const dueDate = `${currentYear}-${String(quarter.start).padStart(2, "0")}-05`;

    // Check if bills already exist for this quarter
    const { data: existingBills } = await supabase
      .from("bills")
      .select("id")
      .eq("quarter_label", quarterLabel)
      .eq("bill_type", "ipl")
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

    // Build rate map by area_sqm
    const rateMap = new Map<number, any>();
    rates.forEach((r: any) => rateMap.set(Number(r.area_sqm), r));

    // Get all units (paginated to avoid 1000 row limit)
    const allUnits: any[] = [];
    let unitFrom = 0;
    const unitPageSize = 1000;
    while (true) {
      const { data: unitBatch, error: ubError } = await supabase
        .from("units")
        .select("id, unit_number, area_sqm")
        .range(unitFrom, unitFrom + unitPageSize - 1);
      if (ubError) throw ubError;
      if (unitBatch) allUnits.push(...unitBatch);
      if (!unitBatch || unitBatch.length < unitPageSize) break;
      unitFrom += unitPageSize;
    }

    // Get active penghuni (paginated)
    const allPenghuni: any[] = [];
    let pFrom = 0;
    while (true) {
      const { data: pBatch } = await supabase
        .from("penghuni")
        .select("id, full_name, unit_id")
        .eq("is_active", true)
        .range(pFrom, pFrom + unitPageSize - 1);
      if (pBatch) allPenghuni.push(...pBatch);
      if (!pBatch || pBatch.length < unitPageSize) break;
      pFrom += unitPageSize;
    }

    const penghuniByUnit = new Map<string, { id: string; full_name: string }>();
    allPenghuni.forEach((p: any) => {
      if (p.unit_id) penghuniByUnit.set(p.unit_id, { id: p.id, full_name: p.full_name });
    });

    // Prepare all bill records in memory
    const billRecords: any[] = [];
    for (const unit of allUnits) {
      if (!unit.area_sqm) continue;
      const matchedRate = rateMap.get(Number(unit.area_sqm));
      if (!matchedRate) continue;

      const penghuni = penghuniByUnit.get(unit.id);
      // bill_rates stores quarterly (3-month) totals, divide by 3 for monthly
      const scMonthly = Math.round(Number(matchedRate.monthly_sc) / 3);
      const sfMonthly = Math.round(Number(matchedRate.monthly_sf) / 3);
      const scTotal = scMonthly * 3;
      const sfTotal = sfMonthly * 3;
      const totalAmount = scTotal + sfTotal;

      billRecords.push({
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
      });
    }

    // Batch insert bills in chunks of 500
    const BATCH_SIZE = 500;
    let billsCreated = 0;
    const allCreatedBills: any[] = [];

    for (let i = 0; i < billRecords.length; i += BATCH_SIZE) {
      const batch = billRecords.slice(i, i + BATCH_SIZE);
      const { data: created, error: batchError } = await supabase
        .from("bills")
        .insert(batch)
        .select("id, unit_id, sc_monthly, sf_monthly");

      if (batchError) {
        console.error(`Error inserting bill batch ${i}:`, batchError);
        continue;
      }
      if (created) {
        allCreatedBills.push(...created);
        billsCreated += created.length;
      }
    }

    // Prepare all bill_payments records
    const paymentRecords: any[] = [];
    for (const bill of allCreatedBills) {
      for (let m = 0; m < 3; m++) {
        const monthIdx = quarter.start - 1 + m;
        paymentRecords.push({
          bill_id: bill.id,
          month_number: m + 1,
          month_label: `${MONTH_NAMES[monthIdx]} ${currentYear}`,
          month_date: `${currentYear}-${String(monthIdx + 1).padStart(2, "0")}-01`,
          sc_amount: Number(bill.sc_monthly),
          sf_amount: Number(bill.sf_monthly),
          total_amount: Number(bill.sc_monthly) + Number(bill.sf_monthly),
        });
      }
    }

    // Batch insert payments in chunks of 1000
    const PAY_BATCH = 1000;
    for (let i = 0; i < paymentRecords.length; i += PAY_BATCH) {
      const batch = paymentRecords.slice(i, i + PAY_BATCH);
      const { error: pError } = await supabase.from("bill_payments").insert(batch);
      if (pError) console.error(`Error inserting payment batch ${i}:`, pError);
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
