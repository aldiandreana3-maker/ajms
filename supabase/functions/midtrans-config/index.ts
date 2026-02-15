import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientKey = Deno.env.get("MIDTRANS_CLIENT_KEY");
  if (!clientKey) {
    return new Response(JSON.stringify({ error: "MIDTRANS_CLIENT_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isProduction = clientKey.startsWith("Mid-client-");

  return new Response(
    JSON.stringify({
      client_key: clientKey,
      snap_url: isProduction
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
