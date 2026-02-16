import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate SHA-256 digest of request body
async function generateDigest(jsonBody: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonBody);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

// Generate HMAC-SHA256 signature
async function generateSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
  secretKey: string
): Promise<string> {
  const componentSignature =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(componentSignature)
  );

  const signatureArray = new Uint8Array(signatureBuffer);
  return `HMACSHA256=${btoa(String.fromCharCode(...signatureArray))}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DOKU_CLIENT_ID = Deno.env.get("DOKU_CLIENT_ID");
    const DOKU_SECRET_KEY = Deno.env.get("DOKU_SECRET_KEY");
    if (!DOKU_CLIENT_ID) throw new Error("DOKU_CLIENT_ID not configured");
    if (!DOKU_SECRET_KEY) throw new Error("DOKU_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Check role: must be admin or staff
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
    const invoiceNumber = `AJMS-${jenis_pembayaran.toUpperCase()}-${Date.now()}`;

    // DOKU Checkout API - Production
    const dokuUrl = "https://api.doku.com/checkout/v1/payment";
    const requestTarget = "/checkout/v1/payment";

    const requestBody = JSON.stringify({
      order: {
        amount: nominal,
        invoice_number: invoiceNumber,
      },
      payment: {
        payment_due_date: 60, // minutes
      },
      customer: {
        email: user.email,
        name: user.user_metadata?.full_name || user.email || "Customer",
      },
    });

    const requestId = crypto.randomUUID();
    const requestTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const digest = await generateDigest(requestBody);
    const signature = await generateSignature(
      DOKU_CLIENT_ID,
      requestId,
      requestTimestamp,
      requestTarget,
      digest,
      DOKU_SECRET_KEY
    );

    console.log("Creating DOKU transaction:", { invoiceNumber, nominal, jenis_pembayaran });

    const dokuRes = await fetch(dokuUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Id": DOKU_CLIENT_ID,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        "Signature": signature,
      },
      body: requestBody,
    });

    if (!dokuRes.ok) {
      const errText = await dokuRes.text();
      console.error("DOKU error:", dokuRes.status, errText);
      throw new Error(`DOKU API error: ${dokuRes.status} - ${errText}`);
    }

    const dokuData = await dokuRes.json();
    console.log("DOKU response:", JSON.stringify(dokuData));

    // Save payment record
    await supabase.from("system_payments").insert({
      jenis_pembayaran,
      nominal,
      tanggal_bayar: new Date().toISOString().split("T")[0],
      status: "pending",
      notes: notes || `Invoice: ${invoiceNumber}`,
      recorded_by: user.id,
    });

    return new Response(
      JSON.stringify({
        payment_url: dokuData.response?.payment?.url || dokuData.payment?.url,
        order_id: invoiceNumber,
        message: dokuData.message || [],
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
