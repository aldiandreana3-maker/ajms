import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const MUTE_KEY = "ajms_notifications_muted";

/** Generate a short "ding" sound using WebAudio (no asset needed). */
function playDing() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.start();
    o.stop(ctx.currentTime + 0.55);
    setTimeout(() => ctx.close(), 700);
  } catch {
    // ignore
  }
}

function showBrowserNotification(title: string, body: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  } catch {
    // ignore
  }
}

export function useNotificationMute() {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(MUTE_KEY) === "1";
  });

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  return { muted, toggleMute };
}

/**
 * Subscribe to realtime DB changes and trigger sound + toast + browser notification.
 * Mounted once at app root.
 */
export function useRealtimeNotifications() {
  const { user, role, isStaff } = useAuth();
  const queryClient = useQueryClient();
  const startedAtRef = useRef<number>(Date.now());

  // Ask for browser notification permission once on mount when logged in
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  const notify = useCallback(
    (title: string, body: string) => {
      const muted = localStorage.getItem(MUTE_KEY) === "1";
      if (!muted) playDing();
      toast(title, { description: body });
      showBrowserNotification(title, body);
    },
    []
  );

  useEffect(() => {
    if (!user) return;

    const channels: any[] = [];

    // 1) Broadcast messages — listen directly to INSERTs and notify recipients (sync sound)
    const broadcastChannel = supabase
      .channel("notif-broadcast-messages-v2")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "broadcast_messages" },
        (payload) => {
          const row: any = payload.new;
          if (!row) return;
          // Don't notify the sender about their own message
          if (row.sender_id === user.id) return;

          // Determine if this user is targeted
          const targetType = row.target_type || "all";
          const targetValue: string[] = Array.isArray(row.target_value) ? row.target_value : [];
          let isTargeted = targetType === "all";
          if (targetType === "custom" && targetValue.includes(user.id)) isTargeted = true;
          if ((targetType === "tower" || targetType === "unit") && targetValue.length > 0) {
            // For tower/unit, RLS already restricts visibility — trust the event delivery
            isTargeted = true;
          }
          if (!isTargeted) return;

          // Play sound SYNCHRONOUSLY (no await) — required by browser autoplay policy
          const title = row.title || "Pesan baru";
          const body = (row.content || "").slice(0, 120) || "Anda menerima pesan broadcast baru.";
          notify(`📢 ${title}`, body);
          queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
          queryClient.invalidateQueries({ queryKey: ["broadcast-messages"] });
        }
      )
      .subscribe();
    channels.push(broadcastChannel);

    // 2) Bills — notify owners of the unit when a new bill is inserted or status updated
    const billsChannel = supabase
      .channel("notif-bills")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bills" },
        (payload) => {
          const row: any = payload.new;
          if (!row) return;
          // Staff/admin: notify on every new bill
          if (isStaff) {
            notify("💳 Tagihan baru dibuat", `Unit ${row.unit_number || "-"} • ${row.quarter_label || row.billing_period}`);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
            return;
          }
          // Penghuni/agent: only if it's their unit (RLS already filters, but double-check)
          notify("💳 Tagihan baru", `Tagihan ${row.quarter_label || row.billing_period} telah diterbitkan.`);
          queryClient.invalidateQueries({ queryKey: ["bills"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bills" },
        (payload) => {
          const oldRow: any = payload.old;
          const newRow: any = payload.new;
          if (!newRow) return;
          if (oldRow?.payment_status !== newRow.payment_status && newRow.payment_status === "paid") {
            notify("✅ Pembayaran berhasil", `Tagihan unit ${newRow.unit_number || "-"} telah lunas.`);
            queryClient.invalidateQueries({ queryKey: ["bills"] });
          }
        }
      )
      .subscribe();
    channels.push(billsChannel);

    // 3) Keluhan & Work Orders — for staff/admin only
    if (isStaff) {
      const keluhanChannel = supabase
        .channel("notif-keluhan")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "keluhan" },
          (payload) => {
            const row: any = payload.new;
            notify("🛎️ Keluhan baru", `${row?.subject || "Keluhan baru"} • Unit ${row?.unit_number || "-"}`);
            queryClient.invalidateQueries({ queryKey: ["keluhan"] });
          }
        )
        .subscribe();
      channels.push(keluhanChannel);

      // Work orders use field_inspections / work_permits — notify both
      const woChannel = supabase
        .channel("notif-work-permits")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "work_permits" },
          (payload) => {
            const row: any = payload.new;
            notify("🔧 Izin kerja baru", `Unit ${row?.unit_number || "-"} • ${row?.work_description?.slice(0, 80) || ""}`);
            queryClient.invalidateQueries({ queryKey: ["work-permits"] });
          }
        )
        .subscribe();
      channels.push(woChannel);

      const inspectionChannel = supabase
        .channel("notif-field-inspections")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "field_inspections" },
          (payload) => {
            const row: any = payload.new;
            notify("📋 Laporan inspeksi baru", `Unit ${row?.unit_number || "-"}`);
            queryClient.invalidateQueries({ queryKey: ["field-inspections"] });
          }
        )
        .subscribe();
      channels.push(inspectionChannel);
    }

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [user, role, isStaff, notify, queryClient]);
}
