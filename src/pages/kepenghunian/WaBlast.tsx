import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Send,
  Upload,
  Users,
  Smile,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  StopCircle,
  Clock,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  WaContact,
  SAFETY_CONFIGS,
  SafetyMode,
  parseBulkContacts,
  parseExcelRows,
  buildMessage,
  resolveSpintax,
  applyPersonalization,
  analyzeSpamRisk,
  isSafeHour,
  shuffleArray,
  randomBetween,
  sleep,
  readCounters,
  incrementCounter,
  normalizePhone,
  isValidPhone,
} from "@/lib/waBlastUtils";

const EMOJIS = ["😊", "👍", "🎉", "🙏", "❤️", "🔥", "✨", "📣", "📢", "✅", "📌", "💬"];

type SendStatus = "pending" | "sending" | "success" | "failed" | "cancelled";

interface ContactStatus extends WaContact {
  status: SendStatus;
  error?: string;
}

export default function WaBlast() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAuth();

  // Access guard
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error("Akses ditolak");
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  // ---- State: Contacts ----
  const [contacts, setContacts] = useState<WaContact[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualUnit, setManualUnit] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [bulkText, setBulkText] = useState("");

  // ---- State: Composer ----
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileMediaRef = useRef<HTMLInputElement>(null);
  const fileExcelRef = useRef<HTMLInputElement>(null);

  // ---- State: Safety ----
  const [safetyMode, setSafetyMode] = useState<SafetyMode>("safe");
  const [shuffle, setShuffle] = useState(true);
  const [counters, setCounters] = useState(readCounters());

  // ---- State: Sending ----
  const [sending, setSending] = useState(false);
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [progress, setProgress] = useState(0);
  const [waitInfo, setWaitInfo] = useState<string | null>(null);
  const [waitCountdown, setWaitCountdown] = useState(0);
  const cancelRef = useRef(false);

  const safety = SAFETY_CONFIGS[safetyMode];
  const risk = useMemo(
    () => analyzeSpamRisk(message),
    [message],
  );
  const safeHour = isSafeHour();

  // ---- Helpers: Add contacts ----
  const addManual = () => {
    const phone = manualPhone.trim();
    if (!isValidPhone(phone)) {
      toast.error("Nomor HP tidak valid");
      return;
    }
    setContacts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: manualName.trim(),
        unit: manualUnit.trim().toUpperCase(),
        phone: normalizePhone(phone),
      },
    ]);
    setManualName("");
    setManualUnit("");
    setManualPhone("");
    toast.success("Kontak ditambahkan");
  };

  const addBulk = () => {
    const parsed = parseBulkContacts(bulkText);
    if (!parsed.length) {
      toast.error("Tidak ada nomor valid yang terdeteksi");
      return;
    }
    setContacts((prev) => dedupe([...prev, ...parsed]));
    setBulkText("");
    toast.success(`${parsed.length} kontak ditambahkan`);
  };

  const handleExcel = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
      const parsed = parseExcelRows(rows);
      if (!parsed.length) {
        toast.error("Tidak ada nomor valid pada file");
        return;
      }
      setContacts((prev) => dedupe([...prev, ...parsed]));
      toast.success(`${parsed.length} kontak diimpor`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memproses file");
    }
  };

  const dedupe = (arr: WaContact[]) => {
    const seen = new Set<string>();
    return arr.filter((c) => {
      if (seen.has(c.phone)) return false;
      seen.add(c.phone);
      return true;
    });
  };

  const removeContact = (id: string) =>
    setContacts((prev) => prev.filter((c) => c.id !== id));

  const clearContacts = () => {
    setContacts([]);
    toast.info("Daftar kontak dikosongkan");
  };

  // ---- Composer helpers ----
  const insertEmoji = (e: string) => setMessage((m) => m + e);
  const insertVar = (v: string) =>
    setMessage((m) => m + (m.endsWith(" ") || !m ? "" : " ") + v);
  const insertSpintax = () =>
    setMessage((m) => m + " {Halo|Hi|Hai}");

  const uploadMedia = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 4MB");
      return;
    }
    setUploadingMedia(true);
    try {
      const path = `wa-blast/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("kepenghunian-files")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: signed } = await supabase.storage
        .from("kepenghunian-files")
        .createSignedUrl(path, 60 * 60 * 24);
      if (!signed?.signedUrl) throw new Error("Gagal membuat URL");
      setMediaUrl(signed.signedUrl);
      setMediaName(file.name);
      toast.success("Media berhasil diupload");
    } catch (err) {
      console.error(err);
      toast.error("Gagal upload media");
    } finally {
      setUploadingMedia(false);
    }
  };

  // ---- Send Blast ----
  const startBlast = async () => {
    if (!contacts.length) {
      toast.error("Tambahkan minimal 1 kontak");
      return;
    }
    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }
    if (risk.level === "high") {
      toast.error("Risiko spam TINGGI, perbaiki pesan dulu");
      return;
    }
    const c = readCounters();
    if (c.dayCount >= safety.dailyLimit) {
      toast.error(`Limit harian (${safety.dailyLimit}) tercapai`);
      return;
    }

    cancelRef.current = false;
    setSending(true);
    setProgress(0);

    const order = shuffle ? shuffleArray(contacts) : contacts;
    const initStatus: ContactStatus[] = order.map((c) => ({
      ...c,
      status: "pending",
    }));
    setStatuses(initStatus);

    const results: ContactStatus[] = [];
    let success = 0;
    let failed = 0;
    let cancelled = 0;

    for (let i = 0; i < order.length; i++) {
      if (cancelRef.current) {
        // Mark remaining as cancelled
        for (let j = i; j < order.length; j++) {
          results.push({ ...order[j], status: "cancelled" });
          cancelled++;
        }
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx >= i ? { ...s, status: "cancelled" as SendStatus } : s,
          ),
        );
        break;
      }

      const contact = order[i];

      // Limit checks
      const cur = readCounters();
      if (cur.dayCount >= safety.dailyLimit) {
        toast.error("Limit harian tercapai, blast dihentikan");
        for (let j = i; j < order.length; j++) {
          results.push({ ...order[j], status: "cancelled" });
          cancelled++;
        }
        break;
      }
      if (cur.hourCount >= safety.hourlyLimit) {
        const wait = 60 * 5; // wait 5 min
        await waitWithCountdown(wait, "Limit per jam tercapai, menunggu");
      }

      // Long break
      if (i > 0 && i % safety.longBreakEvery === 0) {
        const mins = randomBetween(safety.longBreakMin, safety.longBreakMax);
        await waitWithCountdown(
          mins * 60,
          `Long break ${mins} menit (anti-pattern)`,
        );
        if (cancelRef.current) continue;
      }
      // Cooldown
      else if (i > 0 && i % safety.cooldownEvery === 0) {
        const cd = randomBetween(safety.cooldownMin, safety.cooldownMax);
        await waitWithCountdown(cd, `Cool-down ${cd} detik`);
        if (cancelRef.current) continue;
      }

      // Mark sending
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === contact.id ? { ...s, status: "sending" } : s,
        ),
      );

      const finalMsg = buildMessage(message, contact);

      try {
        const { data, error } = await supabase.functions.invoke(
          "send-whatsapp-fonnte",
          {
            body: {
              target: contact.phone,
              message: finalMsg,
              url: mediaUrl ?? undefined,
              filename: mediaName ?? undefined,
            },
          },
        );

        if (error) throw error;
        if (data?.success === false) throw new Error(data.error || "Gagal");

        results.push({ ...contact, status: "success" });
        success++;
        incrementCounter();
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === contact.id ? { ...s, status: "success" } : s,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error";
        results.push({ ...contact, status: "failed", error: msg });
        failed++;
        setStatuses((prev) =>
          prev.map((s) =>
            s.id === contact.id ? { ...s, status: "failed", error: msg } : s,
          ),
        );
      }

      setProgress(Math.round(((i + 1) / order.length) * 100));
      setCounters(readCounters());

      // Random delay before next (anti-spam jeda)
      if (i < order.length - 1 && !cancelRef.current) {
        const d = randomBetween(safety.minDelay, safety.maxDelay);
        await waitWithCountdown(d, `Jeda anti-spam ${d} detik sebelum pesan berikutnya`);
      }
    }

    // Save log
    try {
      const { data: userData } = await supabase.auth.getUser();
      await (supabase.from("wa_blast_history") as any).insert({
        sender_id: userData.user?.id,
        sender_name: userData.user?.email,
        gateway: "fonnte",
        message,
        media_url: mediaUrl,
        safety_mode: safetyMode,
        total_contacts: order.length,
        success_count: success,
        failed_count: failed,
        cancelled_count: cancelled,
        contacts_snapshot: order,
        results,
        status: cancelRef.current ? "cancelled" : "completed",
      });
    } catch (e) {
      console.error("Failed save log", e);
    }

    setSending(false);
    setWaitInfo(null);
    setWaitCountdown(0);
    toast.success(`Selesai: ${success} berhasil, ${failed} gagal, ${cancelled} dibatalkan`);
  };

  const waitWithCountdown = async (
    seconds: number,
    label: string,
    quiet = false,
  ) => {
    if (!quiet) setWaitInfo(label);
    for (let s = seconds; s > 0; s--) {
      if (cancelRef.current) break;
      setWaitCountdown(s);
      await sleep(1000);
    }
    setWaitCountdown(0);
    if (!quiet) setWaitInfo(null);
  };

  const cancelBlast = () => {
    cancelRef.current = true;
    toast.info("Membatalkan blast...");
  };

  // ---- Preview spintax variants ----
  const sampleContact: WaContact =
    contacts[0] ?? {
      id: "preview",
      name: "Budi",
      unit: "TA0504",
      phone: "628000000000",
    };
  const previewMsg = applyPersonalization(message, sampleContact);
  const spinPreview1 = resolveSpintax(previewMsg);
  const spinPreview2 = resolveSpintax(previewMsg);

  const stats = useMemo(() => {
    const success = statuses.filter((s) => s.status === "success").length;
    const failed = statuses.filter((s) => s.status === "failed").length;
    const cancelled = statuses.filter((s) => s.status === "cancelled").length;
    return { success, failed, cancelled };
  }, [statuses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-success/5 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">
              WhatsApp Blast Sender
            </h1>
            <p className="text-xs text-muted-foreground">
              Kirim pesan ke banyak penghuni dengan sistem keamanan tinggi
            </p>
          </div>
          <Badge className="bg-success text-success-foreground hidden sm:flex">
            Fonnte API
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col: input + composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacts */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-success" />
              <h2 className="font-bold text-foreground">Daftar Kontak</h2>
              <Badge variant="secondary" className="ml-auto">
                {contacts.length} kontak
              </Badge>
              {contacts.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearContacts}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <Tabs defaultValue="manual">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="bulk">Massal</TabsTrigger>
                <TabsTrigger value="excel">Excel/CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-3 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input
                    placeholder="Nama (opsional)"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                  <Input
                    placeholder="Unit (cth: TA0504)"
                    value={manualUnit}
                    onChange={(e) => setManualUnit(e.target.value)}
                  />
                  <Input
                    placeholder="Nomor HP (08xxx)"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                  />
                </div>
                <Button onClick={addManual} className="w-full sm:w-auto">
                  Tambah Kontak
                </Button>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-3 pt-4">
                <Textarea
                  rows={6}
                  placeholder={"Budi, 08123456789, TA0504\nAni, 08123456790, TB2231\nCitra, 08123456791, TC1502"}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={addBulk}>Parse & Tambahkan</Button>
              </TabsContent>

              <TabsContent value="excel" className="space-y-3 pt-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload .xlsx, .xls, atau .csv. Sistem otomatis deteksi kolom
                    Nama, Nomor, dan Unit.
                  </p>
                  <input
                    ref={fileExcelRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleExcel(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileExcelRef.current?.click()}
                  >
                    Pilih File
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {contacts.length > 0 && (
              <ScrollArea className="h-40 mt-4 border rounded-lg p-2">
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {contacts.map((c) => (
                      <motion.div
                        key={c.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Badge variant="outline" className="gap-2 py-1">
                          <span className="text-xs">
                            {c.name || "—"} {c.unit && `· ${c.unit}`} ·{" "}
                            {c.phone}
                          </span>
                          <button
                            onClick={() => removeContact(c.id)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </Card>

          {/* Composer */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-success" />
              <h2 className="font-bold text-foreground">Komposer Pesan</h2>
            </div>

            <Textarea
              rows={6}
              placeholder="Halo {nama}, ini pengingat tagihan untuk unit {unit}. Mohon segera diselesaikan. Terima kasih 🙏"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Smile className="w-4 h-4 mr-1" /> Emoji
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => insertEmoji(e)}
                        className="text-2xl hover:bg-muted rounded p-1"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={() => insertVar("{nama}")}
              >
                + {"{nama}"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => insertVar("{unit}")}
              >
                + {"{unit}"}
              </Button>
              <Button variant="outline" size="sm" onClick={insertSpintax}>
                + Spintax
              </Button>

              <input
                ref={fileMediaRef}
                type="file"
                accept="image/*,video/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMedia(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileMediaRef.current?.click()}
                disabled={uploadingMedia}
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                {mediaName ? "Ganti Media" : "Upload Media"}
              </Button>
              {mediaUrl && (
                <Badge variant="secondary" className="gap-1">
                  {mediaName}
                  <button
                    onClick={() => {
                      setMediaUrl(null);
                      setMediaName(null);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

              <span className="ml-auto text-xs text-muted-foreground">
                {message.length} karakter
              </span>
            </div>

            {/* Risk indicator */}
            <div
              className={`rounded-lg p-3 text-sm border ${
                risk.level === "high"
                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                  : risk.level === "medium"
                  ? "bg-warning/10 border-warning/30 text-warning"
                  : "bg-success/10 border-success/30 text-success"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {risk.level === "low" ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                Risiko spam: {risk.level.toUpperCase()}
              </div>
              {risk.reasons.length > 0 && (
                <ul className="list-disc list-inside text-xs mt-1 opacity-90">
                  {risk.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Spintax preview */}
            {message.trim() && (
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <div className="font-semibold text-muted-foreground">
                  Preview variasi (utk {sampleContact.name}/{sampleContact.unit}):
                </div>
                <div className="text-foreground">→ {spinPreview1}</div>
                <div className="text-foreground">→ {spinPreview2}</div>
              </div>
            )}
          </Card>
        </div>

        {/* Right col: preview + send panel */}
        <div className="space-y-6">
          {/* Preview WA */}
          <Card className="p-5">
            <h3 className="font-bold mb-3">Preview WhatsApp</h3>
            <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[160px]">
              <div className="bg-[#dcf8c6] inline-block rounded-lg px-3 py-2 max-w-full text-sm whitespace-pre-wrap text-black shadow">
                {spinPreview1 || "Tulis pesan di sebelah kiri..."}
              </div>
            </div>
          </Card>

          {/* Send Panel */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h3 className="font-bold">Sistem Keamanan</h3>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Mode Keamanan</Label>
              <Select
                value={safetyMode}
                onValueChange={(v) => setSafetyMode(v as SafetyMode)}
                disabled={sending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">⚡ Normal (80/hari)</SelectItem>
                  <SelectItem value="safe">🛡️ Safe (50/hari) — direkomendasikan</SelectItem>
                  <SelectItem value="ultra">🔒 Ultra Safe (30/hari)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Jeda {safety.minDelay}-{safety.maxDelay}s, cool-down setiap{" "}
                {safety.cooldownEvery} pesan
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="shuffle" className="text-sm">
                Acak urutan kontak
              </Label>
              <Switch
                id="shuffle"
                checked={shuffle}
                onCheckedChange={setShuffle}
                disabled={sending}
              />
            </div>

            {!safeHour && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs rounded-lg p-2">
                ⚠️ Di luar jam aman (08:00-21:00). Risiko terdeteksi spam lebih
                tinggi.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2">
                <div className="text-muted-foreground">Hari ini</div>
                <div className="font-bold">
                  {counters.dayCount}/{safety.dailyLimit}
                </div>
              </div>
              <div className="bg-muted/50 rounded p-2">
                <div className="text-muted-foreground">Jam ini</div>
                <div className="font-bold">
                  {counters.hourCount}/{safety.hourlyLimit}
                </div>
              </div>
            </div>

            {sending && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="bg-success/10 text-success rounded p-1">
                    ✓ {stats.success}
                  </div>
                  <div className="bg-destructive/10 text-destructive rounded p-1">
                    ✗ {stats.failed}
                  </div>
                  <div className="bg-muted rounded p-1">
                    ⊘ {stats.cancelled}
                  </div>
                </div>
                {waitInfo && (
                  <div className="bg-warning/10 text-warning text-xs rounded p-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {waitInfo} ({waitCountdown}s)
                  </div>
                )}
              </div>
            )}

            {!sending ? (
              <Button
                onClick={startBlast}
                className="w-full bg-success hover:bg-success/90 text-success-foreground"
                disabled={
                  !contacts.length ||
                  !message.trim() ||
                  risk.level === "high"
                }
              >
                <Send className="w-4 h-4 mr-2" />
                Kirim ke {contacts.length} kontak
              </Button>
            ) : (
              <Button
                onClick={cancelBlast}
                variant="destructive"
                className="w-full"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Hentikan Pengiriman
              </Button>
            )}
          </Card>

          {/* Status list */}
          {statuses.length > 0 && (
            <Card className="p-5">
              <h3 className="font-bold mb-3">Status Pengiriman</h3>
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {statuses.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-border/50"
                    >
                      <span className="truncate">
                        {s.name || "—"} · {s.phone}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          s.status === "success"
                            ? "border-success text-success"
                            : s.status === "failed"
                            ? "border-destructive text-destructive"
                            : s.status === "sending"
                            ? "border-info text-info"
                            : s.status === "cancelled"
                            ? "border-muted-foreground text-muted-foreground"
                            : ""
                        }
                      >
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <Card className="p-5 bg-muted/30">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" /> Tips Anti-Blokir
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Selalu gunakan personalisasi {"{nama}"} agar pesan tidak identik</li>
            <li>Pakai spintax untuk variasi kalimat</li>
            <li>Kirim hanya pada jam 08:00–21:00</li>
            <li>Hindari kata seperti "gratis", "promo", terlalu banyak link</li>
            <li>Mulai dengan mode Safe dulu, naikkan jika nomor sehat</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
