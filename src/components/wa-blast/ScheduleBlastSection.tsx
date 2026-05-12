import { useEffect, useMemo, useState } from "react";
import { CalendarClock, PauseCircle, PlayCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { WaContact } from "@/lib/waBlastUtils";

interface Campaign {
  id: string;
  name: string;
  message_template: string;
  daily_cap: number;
  send_hour_start: number;
  send_hour_end: number;
  start_date: string;
  status: string;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  last_run_at: string | null;
  created_at: string;
}

interface Props {
  contacts: WaContact[];
  message: string;
  mediaUrl: string | null;
  mediaName: string | null;
}

export default function ScheduleBlastSection({ contacts, message, mediaUrl, mediaName }: Props) {
  const [name, setName] = useState("");
  const [dailyCap, setDailyCap] = useState(50);
  const [hourStart, setHourStart] = useState(9);
  const [hourEnd, setHourEnd] = useState(20);
  const [minDelay, setMinDelay] = useState(30);
  const [maxDelay, setMaxDelay] = useState(90);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const estimatedDays = useMemo(() => {
    if (!contacts.length || dailyCap <= 0) return 0;
    return Math.ceil(contacts.length / dailyCap);
  }, [contacts.length, dailyCap]);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("wa_blast_campaigns") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error) setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  };

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 15000);
    return () => clearInterval(interval);
  }, []);

  const createCampaign = async () => {
    if (!contacts.length) return toast.error("Tambahkan kontak dulu");
    if (!message.trim()) return toast.error("Pesan kosong");
    if (!name.trim()) return toast.error("Beri nama kampanye");
    if (dailyCap < 1 || dailyCap > 500) return toast.error("Batas harian 1-500");

    setCreating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: camp, error: cErr } = await (supabase.from("wa_blast_campaigns") as any)
        .insert({
          name: name.trim(),
          message_template: message,
          media_url: mediaUrl,
          media_filename: mediaName,
          daily_cap: dailyCap,
          send_hour_start: hourStart,
          send_hour_end: hourEnd,
          min_delay_seconds: minDelay,
          max_delay_seconds: maxDelay,
          start_date: startDate,
          status: "active",
          total_contacts: contacts.length,
          created_by: u.user?.id,
          created_by_name: u.user?.email,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      // Distribute contacts across days
      const startD = new Date(startDate + "T00:00:00");
      const queueRows = contacts.map((c, idx) => {
        const dayOffset = Math.floor(idx / dailyCap);
        const d = new Date(startD);
        d.setDate(d.getDate() + dayOffset);
        return {
          campaign_id: camp.id,
          contact_name: c.name || null,
          contact_unit: c.unit || null,
          contact_phone: c.phone,
          scheduled_date: d.toISOString().slice(0, 10),
        };
      });

      // Insert in chunks of 500
      for (let i = 0; i < queueRows.length; i += 500) {
        const batch = queueRows.slice(i, i + 500);
        const { error: qErr } = await (supabase.from("wa_blast_queue") as any).insert(batch);
        if (qErr) throw qErr;
      }

      toast.success(`Kampanye "${name}" dijadwalkan: ${contacts.length} kontak × ${estimatedDays} hari`);
      setName("");
      loadCampaigns();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal membuat kampanye";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("wa_blast_campaigns") as any)
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Status diubah: ${status}`);
      loadCampaigns();
    }
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await (supabase.from("wa_blast_campaigns") as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Kampanye dihapus");
      loadCampaigns();
    }
  };

  const triggerNow = async () => {
    try {
      const { error } = await supabase.functions.invoke("wa-blast-worker", { body: {} });
      if (error) throw error;
      toast.success("Worker dipicu");
      setTimeout(loadCampaigns, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal";
      toast.error(msg);
    }
  };

  return (
    <Card className="p-5 space-y-4 border-info/30 bg-info/5">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-info" />
        <h2 className="font-bold text-foreground">Antrian Multi-Hari (Otomatis)</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Cocok untuk volume besar (mis. 2000 kontak). Sistem mengirim bertahap setiap hari sesuai
        batas yang aman, otomatis berjalan di latar belakang via cron — Anda bisa tutup browser.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Nama Kampanye</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cth: Pengingat IPL Q1" />
        </div>
        <div>
          <Label className="text-xs">Mulai Tanggal</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Batas per Hari</Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={dailyCap}
            onChange={(e) => setDailyCap(Math.max(1, Number(e.target.value) || 50))}
          />
        </div>
        <div>
          <Label className="text-xs">Jam Kirim (WIB)</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={23}
              value={hourStart}
              onChange={(e) => setHourStart(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
            />
            <span>-</span>
            <Input
              type="number"
              min={1}
              max={24}
              value={hourEnd}
              onChange={(e) => setHourEnd(Math.max(1, Math.min(24, Number(e.target.value) || 24)))}
            />
          </div>
        </div>
        <div>
          <Label className="text-xs">Jeda min (detik)</Label>
          <Input
            type="number"
            min={5}
            value={minDelay}
            onChange={(e) => setMinDelay(Math.max(5, Number(e.target.value) || 30))}
          />
        </div>
        <div>
          <Label className="text-xs">Jeda max (detik)</Label>
          <Input
            type="number"
            min={5}
            value={maxDelay}
            onChange={(e) => setMaxDelay(Math.max(minDelay, Number(e.target.value) || 90))}
          />
        </div>
      </div>

      {contacts.length > 0 && (
        <div className="rounded-lg bg-background border border-border p-3 text-xs space-y-1">
          <div>
            <b>{contacts.length}</b> kontak ÷ <b>{dailyCap}</b>/hari = <b>{estimatedDays} hari</b> pengiriman
          </div>
          <div className="text-muted-foreground">
            Mulai {startDate}, jam {hourStart}:00–{hourEnd}:00 WIB, jeda {minDelay}–{maxDelay} detik per pesan.
          </div>
        </div>
      )}

      <Button
        onClick={createCampaign}
        disabled={creating || !contacts.length || !message.trim() || !name.trim()}
        className="w-full bg-info hover:bg-info/90 text-info-foreground"
      >
        <CalendarClock className="w-4 h-4 mr-2" />
        {creating ? "Menjadwalkan..." : `Jadwalkan ${contacts.length} kontak ke antrian`}
      </Button>

      {/* Active campaigns */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Kampanye Terjadwal</h3>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={triggerNow} title="Picu worker sekarang">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {loading && campaigns.length === 0 && (
          <p className="text-xs text-muted-foreground">Memuat...</p>
        )}
        {!loading && campaigns.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada kampanye terjadwal.</p>
        )}
        {campaigns.map((c) => {
          const total = c.total_contacts || 1;
          const done = c.sent_count + c.failed_count;
          const pct = Math.round((done / total) * 100);
          return (
            <div key={c.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.daily_cap}/hari · jam {c.send_hour_start}:00–{c.send_hour_end}:00 · mulai {c.start_date}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    c.status === "active"
                      ? "border-success text-success"
                      : c.status === "completed"
                      ? "border-info text-info"
                      : c.status === "paused"
                      ? "border-warning text-warning"
                      : "border-muted-foreground text-muted-foreground"
                  }
                >
                  {c.status}
                </Badge>
              </div>
              <Progress value={pct} className="h-1.5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {c.sent_count}/{c.total_contacts} terkirim · {c.failed_count} gagal
                </span>
                <div className="flex gap-1">
                  {c.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, "paused")}>
                      <PauseCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {c.status === "paused" && (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(c.id, "active")}>
                      <PlayCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus kampanye?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Semua antrian yang belum terkirim akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCampaign(c.id)}>
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
