// Edge Function: send-whatsapp-fonnte
// Proxy ke Fonnte API untuk pengiriman pesan WhatsApp tunggal.
// Token API disimpan sebagai secret FONNTE_API_TOKEN.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SendPayload {
  target: string; // 628xxxx
  message: string;
  url?: string; // optional media URL
  filename?: string;
  delay?: string; // e.g. "2"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- AuthN ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // ---- AuthZ: must be admin or above ----
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const allowed = (roles ?? []).some((r: { role: string }) =>
      ["admin", "super_admin", "master_dev"].includes(r.role),
    );
    if (!allowed) {
      return json({ error: "Forbidden" }, 403);
    }

    // ---- Validate body ----
    let payload: SendPayload;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!payload?.target || typeof payload.target !== "string") {
      return json({ error: "Field 'target' wajib diisi" }, 400);
    }
    if (!payload?.message || typeof payload.message !== "string") {
      return json({ error: "Field 'message' wajib diisi" }, 400);
    }
    if (payload.message.length > 4096) {
      return json({ error: "Pesan maksimal 4096 karakter" }, 400);
    }

    const FONNTE_API_TOKEN = Deno.env.get("FONNTE_API_TOKEN");
    if (!FONNTE_API_TOKEN) {
      return json({ error: "FONNTE_API_TOKEN belum dikonfigurasi" }, 500);
    }

    // ---- Call Fonnte ----
    const formData = new FormData();
    formData.append("target", payload.target);
    formData.append("message", payload.message);
    if (payload.url) formData.append("url", payload.url);
    if (payload.filename) formData.append("filename", payload.filename);
    if (payload.delay) formData.append("delay", payload.delay);
    formData.append("countryCode", "62");

    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_API_TOKEN },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.status === false) {
      return json(
        {
          success: false,
          error:
            data?.reason ||
            data?.message ||
            `Fonnte error (HTTP ${res.status})`,
          fonnte: data,
        },
        200, // return 200 so frontend can read the error per-contact
      );
    }

    return json({ success: true, fonnte: data }, 200);
  } catch (err) {
    console.error("send-whatsapp-fonnte error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return json({ success: false, error: msg }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
