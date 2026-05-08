// Edge Function: notify-parking-expiring
// Dipanggil harian via pg_cron. Mengecek abonemen parkir yang akan habis
// dalam 7 hari dan mengirim broadcast ke semua akun (sekali per langganan per hari).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const horizonStr = horizon.toISOString().slice(0, 10);

    // Ambil abonemen aktif yang berakhir antara hari ini sampai 7 hari ke depan
    const { data: subs, error } = await supabase
      .from("parking_subscriptions")
      .select("id, vehicle_number, vehicle_type, unit_number, penghuni_name, end_date")
      .eq("is_active", true)
      .not("end_date", "is", null)
      .gte("end_date", todayStr)
      .lte("end_date", horizonStr);

    if (error) throw error;

    let sent = 0;
    let skipped = 0;
    const senderId = "00000000-0000-0000-0000-000000000000";

    for (const sub of subs || []) {
      const title = `⏰ Abonemen Parkir Akan Habis`;
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(sub.end_date as string).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      const content =
        `Abonemen parkir plat ${sub.vehicle_number} (${sub.vehicle_type || "kendaraan"}) ` +
        `unit ${sub.unit_number || "-"} a/n ${sub.penghuni_name || "-"} ` +
        `akan habis pada ${sub.end_date} (${daysLeft} hari lagi). ` +
        `Mohon segera lakukan perpanjangan.`;

      // Dedupe: jangan kirim 2x dalam 1 hari untuk plat yang sama
      const startOfDay = new Date(today).toISOString();
      const { data: existing } = await supabase
        .from("broadcast_messages")
        .select("id")
        .eq("title", title)
        .gte("created_at", startOfDay)
        .ilike("content", `%${sub.vehicle_number}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const { error: insErr } = await supabase.from("broadcast_messages").insert({
        title,
        content,
        sender_id: senderId,
        sender_name: "Sistem AJMS",
        target_type: "all",
        target_value: [],
      });

      if (insErr) {
        console.error("insert broadcast failed", insErr);
      } else {
        sent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, checked: subs?.length || 0, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("notify-parking-expiring error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
