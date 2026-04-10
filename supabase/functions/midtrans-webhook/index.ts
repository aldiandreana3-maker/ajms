import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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

    const body = await req.json();
    console.log("Midtrans webhook received:", JSON.stringify(body));

    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body;

    // Verify signature: SHA512(order_id + status_code + gross_amount + server_key)
    const rawSignature = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-512", encoder.encode(rawSignature));
    const expectedSignature = toHex(hashBuffer);

    if (signature_key !== expectedSignature) {
      console.error("Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map Midtrans status to our status
    let paymentStatus: "pending" | "berhasil" | "gagal" = "pending";

    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status === "accept" || !fraud_status) {
        paymentStatus = "berhasil";
      } else {
        paymentStatus = "gagal";
      }
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      paymentStatus = "gagal";
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    }

    console.log(`Order ${order_id}: ${transaction_status} -> ${paymentStatus}`);

    // Update payment record matching the order_id in notes
    const { data: payments, error: fetchError } = await supabase
      .from("system_payments")
      .select("id, notes")
      .like("notes", `%${order_id}%`);

    if (fetchError) {
      console.error("Error fetching payment:", fetchError);
      throw fetchError;
    }

    if (payments && payments.length > 0) {
      const { error: updateError } = await supabase
        .from("system_payments")
        .update({
          status: paymentStatus,
          notes: `${payments[0].notes || ""} | Midtrans: ${transaction_status}`,
        })
        .eq("id", payments[0].id);

      if (updateError) {
        console.error("Error updating payment:", updateError);
        throw updateError;
      }

      console.log(`Payment ${payments[0].id} updated to ${paymentStatus}`);
    } else {
      console.warn(`No payment found for order_id: ${order_id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
