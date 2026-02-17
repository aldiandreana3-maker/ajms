import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MIDTRANS_SERVER_KEY = Deno.env.get("MIDTRANS_SERVER_KEY");
    if (!MIDTRANS_SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData) throw new Error("No role assigned");

    const allowedRoles = [
      "super_admin", "admin", "staff", "staff_tro", "staff_finance",
      "staff_hrd_ga", "staff_engineering", "staff_outsourcing_cleaning",
      "staff_outsourcing_security", "staff_outsourcing_parkir",
    ];
    if (!allowedRoles.includes(roleData.role)) {
      throw new Error("Insufficient permissions");
    }

    const { jenis_pembayaran, notes } = await req.json();

    const nominal = jenis_pembayaran === "aktivasi" ? 6699000 : 1299000;
    const orderId = `AJMS-${jenis_pembayaran.toUpperCase()}-${Date.now()}`;

    // Midtrans Snap API
    const midtransUrl = "https://app.midtrans.com/snap/v1/transactions";
    const authString = btoa(`${MIDTRANS_SERVER_KEY}:`);

    const requestBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: nominal,
      },
      customer_details: {
        email: user.email,
        first_name: user.user_metadata?.full_name || user.email || "Customer",
      },
      item_details: [
        {
          id: jenis_pembayaran,
          price: nominal,
          quantity: 1,
          name: jenis_pembayaran === "aktivasi" ? "Biaya Aktivasi Sistem AJMS" : "Biaya Bulanan Sistem AJMS",
        },
      ],
    };

    console.log("Creating Midtrans transaction:", { orderId, nominal, jenis_pembayaran });

    const midtransRes = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`,
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!midtransRes.ok) {
      const errText = await midtransRes.text();
      console.error("Midtrans error:", midtransRes.status, errText);
      throw new Error(`Midtrans API error: ${midtransRes.status} - ${errText}`);
    }

    const midtransData = await midtransRes.json();
    console.log("Midtrans response:", JSON.stringify(midtransData));

    // Save payment record
    await supabase.from("system_payments").insert({
      jenis_pembayaran,
      nominal,
      tanggal_bayar: new Date().toISOString().split("T")[0],
      status: "pending",
      notes: notes || `Invoice: ${orderId}`,
      recorded_by: user.id,
    });

    return new Response(
      JSON.stringify({
        snap_token: midtransData.token,
        redirect_url: midtransData.redirect_url,
        order_id: orderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
