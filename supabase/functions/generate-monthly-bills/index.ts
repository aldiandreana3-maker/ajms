import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current date info
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-05`;

    // Check if bills already generated for this period
    const { data: existingBills } = await supabase
      .from("bills")
      .select("id")
      .eq("billing_period", billingPeriod)
      .eq("is_auto_generated", true)
      .limit(1);

    if (existingBills && existingBills.length > 0) {
      return new Response(
        JSON.stringify({ message: "Bills already generated for this period", period: billingPeriod }),
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

    // Get all units with their penghuni
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("id, unit_number, area_sqm");

    if (unitsError) throw unitsError;

    // Get active penghuni mapped by unit_id
    const { data: penghuniList } = await supabase
      .from("penghuni")
      .select("id, full_name, unit_id")
      .eq("is_active", true);

    const penghuniByUnit = new Map<string, { id: string; full_name: string }>();
    penghuniList?.forEach((p) => {
      if (p.unit_id) penghuniByUnit.set(p.unit_id, { id: p.id, full_name: p.full_name });
    });

    const billsToInsert: any[] = [];

    for (const unit of units || []) {
      if (!unit.area_sqm) continue;

      const matchedRate = rates.find((r: any) => Number(r.area_sqm) === Number(unit.area_sqm));
      if (!matchedRate) continue;

      const penghuni = penghuniByUnit.get(unit.id);
      const scAmount = Math.round((matchedRate.quarterly_amount * 5) / 6 / 3);
      const sfAmount = Math.round(matchedRate.quarterly_amount / 6 / 3);

      // SC bill
      billsToInsert.push({
        unit_id: unit.id,
        unit_number: unit.unit_number,
        penghuni_id: penghuni?.id || null,
        bill_type: "ipl",
        amount: scAmount,
        billing_period: billingPeriod,
        due_date: dueDate,
        is_auto_generated: true,
        notes: `SC (Service Charge) - ${matchedRate.area_label} - ${penghuni?.full_name || "N/A"}`,
      });

      // SF bill
      billsToInsert.push({
        unit_id: unit.id,
        unit_number: unit.unit_number,
        penghuni_id: penghuni?.id || null,
        bill_type: "sinking_fund",
        amount: sfAmount,
        billing_period: billingPeriod,
        due_date: dueDate,
        is_auto_generated: true,
        notes: `SF (Sinking Fund) - ${matchedRate.area_label} - ${penghuni?.full_name || "N/A"}`,
      });
    }

    if (billsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("bills").insert(billsToInsert);
      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({
        message: `Successfully generated ${billsToInsert.length} bills`,
        period: billingPeriod,
        due_date: dueDate,
        bills_count: billsToInsert.length,
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
