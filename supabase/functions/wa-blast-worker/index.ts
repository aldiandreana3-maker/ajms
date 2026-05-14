// Edge Function: wa-blast-worker
// Cron-driven worker yang mengirim pesan WA blast bertahap dari antrian.
// Dipanggil setiap menit oleh pg_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Campaign {
  id: string;
  message_template: string;
  media_url: string | null;
  media_filename: string | null;
  daily_cap: number;
  send_hour_start: number;
  send_hour_end: number;
  min_delay_seconds: number;
  max_delay_seconds: number;
  status: string;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
}

interface QueueItem {
  id: string;
  campaign_id: string;
  contact_name: string | null;
  contact_unit: string | null;
  contact_phone: string;
  attempts: number;
}

const FONNTE_API_TOKEN = Deno.env.get("FONNTE_API_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function jakartaHour(): number {
  // WIB = UTC+7
  const utcH = new Date().getUTCHours();
  return (utcH + 7) % 24;
}

function jakartaDateStr(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (full, group: string) => {
    if (!group.includes("|")) return full;
    const opts = group.split("|");
    return opts[Math.floor(Math.random() * opts.length)];
  });
}

function applyPersonalization(text: string, c: { name: string | null; unit: string | null }): string {
  return text
    .replace(/\{nama\}/gi, c.name || "Bapak/Ibu")
    .replace(/\{unit\}/gi, c.unit || "-");
}

function buildMessage(template: string, c: { name: string | null; unit: string | null }): string {
  return resolveSpintax(applyPersonalization(template, c));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sendViaFonnte(target: string, message: string, url?: string | null, filename?: string | null) {
  if (!FONNTE_API_TOKEN) throw new Error("FONNTE_API_TOKEN belum dikonfigurasi");
  const fd = new FormData();
  fd.append("target", target);
  fd.append("message", message);
  if (url) fd.append("url", url);
  if (filename) fd.append("filename", filename);
  fd.append("countryCode", "62");
  const res = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { Authorization: FONNTE_API_TOKEN },
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === false) {
    throw new Error(data?.reason || data?.message || `Fonnte HTTP ${res.status}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = jakartaDateStr();
  const hour = jakartaHour();

  const log: any = { processed: 0, sent: 0, failed: 0, skipped_hour: 0, campaigns: [] };

  try {
    // Fetch active campaigns
    const { data: campaigns, error: campErr } = await supabase
      .from("wa_blast_campaigns")
      .select("*")
      .eq("status", "active")
      .lte("start_date", today);
    if (campErr) throw campErr;

    for (const camp of (campaigns ?? []) as Campaign[]) {
      // Respect send window
      if (hour < camp.send_hour_start || hour >= camp.send_hour_end) {
        log.skipped_hour++;
        continue;
      }

      // Count messages already sent today for this campaign
      const startOfDayWib = new Date();
      startOfDayWib.setUTCHours(-7, 0, 0, 0); // 00:00 WIB = -7 UTC

      const { count: sentToday } = await supabase
        .from("wa_blast_queue")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", camp.id)
        .eq("status", "sent")
        .gte("sent_at", startOfDayWib.toISOString());

      // NOTE: daily_cap is informational only — kirim tetap berjalan setelah cap
      // tercapai dengan delay/jeda yang sama (safe mode konsisten) agar tidak ada
      // hard stop. Counter sentToday tetap dilog untuk monitoring.
      const overCap = (sentToday ?? 0) >= camp.daily_cap;

      // Tetap pakai batch kecil (max 2 per tick) supaya pola pengiriman natural
      const batchSize = 2;
      const { data: items, error: itemsErr } = await supabase
        .from("wa_blast_queue")
        .select("*")
        .eq("campaign_id", camp.id)
        .eq("status", "pending")
        .lte("scheduled_date", today)
        .order("created_at", { ascending: true })
        .limit(batchSize);
      if (itemsErr) throw itemsErr;

      if (!items || items.length === 0) {
        // Check if campaign is finished
        const { count: pendingLeft } = await supabase
          .from("wa_blast_queue")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", camp.id)
          .eq("status", "pending");
        if ((pendingLeft ?? 0) === 0) {
          await supabase
            .from("wa_blast_campaigns")
            .update({ status: "completed", last_run_at: new Date().toISOString() })
            .eq("id", camp.id);
        }
        continue;
      }

      let sent = 0;
      let failed = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i] as QueueItem;
        log.processed++;

        // Mark sending (atomic via update with status check)
        const { data: claim } = await supabase
          .from("wa_blast_queue")
          .update({ status: "sending", attempts: item.attempts + 1 })
          .eq("id", item.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();
        if (!claim) continue; // already taken by another worker

        const finalMsg = buildMessage(camp.message_template, {
          name: item.contact_name,
          unit: item.contact_unit,
        });

        try {
          await sendViaFonnte(item.contact_phone, finalMsg, camp.media_url, camp.media_filename);
          await supabase
            .from("wa_blast_queue")
            .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
            .eq("id", item.id);
          sent++;
          log.sent++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "error";
          // Retry up to 3 times before final fail
          const newStatus = item.attempts + 1 >= 3 ? "failed" : "pending";
          await supabase
            .from("wa_blast_queue")
            .update({ status: newStatus, error_message: msg })
            .eq("id", item.id);
          if (newStatus === "failed") {
            failed++;
            log.failed++;
          }
        }

        // Random small delay between sends within the same cron tick
        if (i < items.length - 1) {
          const d = randomBetween(camp.min_delay_seconds, camp.max_delay_seconds);
          // Cap inner-tick wait to 30s to keep cron fast; remaining throttle handled by 1-min cron interval
          await sleep(Math.min(d, 30) * 1000);
        }
      }

      // Update campaign counters
      if (sent > 0 || failed > 0) {
        await supabase
          .from("wa_blast_campaigns")
          .update({
            sent_count: camp.sent_count + sent,
            failed_count: camp.failed_count + failed,
            last_run_at: new Date().toISOString(),
          })
          .eq("id", camp.id);
      }

      log.campaigns.push({ id: camp.id, sent, failed, sentToday: (sentToday ?? 0) + sent, overCap });
    }

    return new Response(JSON.stringify({ success: true, ...log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("wa-blast-worker error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg, log }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
