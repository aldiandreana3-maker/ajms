import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Copy, Check, Building2, Banknote, ArrowLeft, X, SwitchCamera } from "lucide-react";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionId: string;
  vehicleNumber?: string | null;
  monthlyFee?: number | null;
  enableMonthSelection?: boolean;
}

const REKENING = {
  bank: "BRI",
  nomor: "777 80808 11",
  atasNama: "PPPSRS THE JARRDIN",
};

type Step = "months" | "method" | "transfer" | "kasir";

export function QuickRenewParkingDialog({
  open,
  onOpenChange,
  subscriptionId,
  vehicleNumber,
  monthlyFee,
  enableMonthSelection = false,
}: Props) {
  const { uploadFile } = useFileUpload({ folder: "parking" });
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<Step>(enableMonthSelection ? "months" : "method");
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  useEffect(() => {
    if (!open) {
      setStep(enableMonthSelection ? "months" : "method");
      setSelectedMonths(1);
      setFile(null);
      setPreview(null);
    }
  }, [open, enableMonthSelection]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  useEffect(() => () => { if (stream) stream.getTracks().forEach((t) => t.stop()); }, [stream]);

  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      setStream(ms);
      setFacingMode(mode);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = ms; }, 100);
    } catch (e) {
      console.error(e);
      try {
        const fb = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fb);
        setShowCamera(true);
        setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = fb; }, 100);
      } catch {
        toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
      }
    }
  };

  const switchCam = () => startCamera(facingMode === "user" ? "environment" : "user");

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `bukti-${Date.now()}.jpg`, { type: "image/jpeg" });
      setFile(f);
      setPreview(URL.createObjectURL(f));
      stopCamera();
    }, "image/jpeg", 0.85);
  };

  const pickFile = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const copyRekening = () => {
    navigator.clipboard.writeText(REKENING.nomor);
    setCopied(true);
    toast.success("Nomor rekening disalin");
    setTimeout(() => setCopied(false), 2000);
  };

  const computedTargetDate = useMemo(() => {
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    if (target.getDate() > 5) target.setMonth(target.getMonth() + 1);
    target.setDate(5);
    target.setMonth(target.getMonth() + (selectedMonths - 1));
    return target.toISOString().split("T")[0];
  }, [selectedMonths]);

  const computedMonthLabel = useMemo(() => {
    const d = new Date(computedTargetDate + "T00:00:00");
    return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }, [computedTargetDate]);

  const totalFee = useMemo(() => {
    if (!monthlyFee) return null;
    return monthlyFee * selectedMonths;
  }, [monthlyFee, selectedMonths]);

  // Hitung daftar bulan-bulan yang akan diperpanjang (1 row history per bulan)
  const monthsToInsert = useMemo(() => {
    const startTarget = new Date();
    startTarget.setHours(0, 0, 0, 0);
    if (startTarget.getDate() > 5) startTarget.setMonth(startTarget.getMonth() + 1);
    startTarget.setDate(1);
    const months: { year: number; month: number; label: string; date: string }[] = [];
    for (let i = 0; i < selectedMonths; i++) {
      const d = new Date(startTarget);
      d.setMonth(d.getMonth() + i);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      });
    }
    return months;
  }, [selectedMonths]);

  // Ambil context subscription untuk menyimpan ke history
  const fetchSubContext = async () => {
    const { data } = await supabase
      .from("parking_subscriptions")
      .select("vehicle_number, unit_number, unit_id, penghuni_name, monthly_fee")
      .eq("id", subscriptionId)
      .maybeSingle();
    return data;
  };

  const insertHistory = async (
    method: "transfer" | "kasir",
    proofPath: string | null,
  ) => {
    const ctx = await fetchSubContext();
    const fee = monthlyFee ?? ctx?.monthly_fee ?? 0;
    const { data: { user } } = await supabase.auth.getUser();
    const rows = monthsToInsert.map((m) => ({
      subscription_id: subscriptionId,
      vehicle_number: ctx?.vehicle_number ?? null,
      unit_number: ctx?.unit_number ?? null,
      unit_id: ctx?.unit_id ?? null,
      owner_name: ctx?.penghuni_name ?? null,
      period_month: m.month,
      period_year: m.year,
      period_label: m.label,
      period_date: m.date,
      nominal: fee,
      payment_method: method,
      payment_proof_url: proofPath,
      payment_date: new Date().toISOString(),
      verification_status: "pending",
      created_by: user?.id ?? null,
      notes: method === "transfer" ? "Transfer BRI, menunggu verifikasi" : "Bayar di Kasir, menunggu pembayaran",
    }));
    // upsert by (subscription_id, period_year, period_month)
    const { error } = await (supabase as any)
      .from("parking_payment_history")
      .upsert(rows, { onConflict: "subscription_id,period_year,period_month" });
    if (error) throw error;
  };

  const submitTransfer = async () => {
    if (!file) { toast.error("Mohon upload bukti transfer terlebih dahulu"); return; }
    setSubmitting(true);
    try {
      const path = await uploadFile(file);
      if (!path) throw new Error("Gagal upload bukti");
      await insertHistory("transfer", path);
      const { error } = await supabase.from("parking_subscriptions").update({
        end_date: computedTargetDate,
        is_active: true,
        payment_proof_url: path,
        verification_status: "proses",
        admin_notes: `Perpanjangan ${computedMonthLabel} (${selectedMonths} bln) — Transfer BRI, menunggu verifikasi`,
      }).eq("id", subscriptionId);
      if (error) throw error;
      toast.success(`Pengajuan perpanjangan ${selectedMonths} bln (s/d ${computedMonthLabel}) terkirim. Menunggu verifikasi admin.`);
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["parking-payment-history"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Gagal mengirim: " + (e?.message || ""));
    } finally { setSubmitting(false); }
  };

  const submitKasir = async () => {
    setSubmitting(true);
    try {
      await insertHistory("kasir", null);
      const { error } = await supabase.from("parking_subscriptions").update({
        end_date: computedTargetDate,
        is_active: true,
        verification_status: "proses",
        admin_notes: `Perpanjangan ${computedMonthLabel} (${selectedMonths} bln) — Bayar di Kasir, menunggu pembayaran`,
      }).eq("id", subscriptionId);
      if (error) throw error;
      toast.success(`Pengajuan perpanjangan ${selectedMonths} bln (s/d ${computedMonthLabel}) terkirim. Silakan bayar di kasir.`);
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["parking-payment-history"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Gagal mengirim: " + (e?.message || ""));
    } finally { setSubmitting(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perpanjang Abonemen Parkir</DialogTitle>
            <DialogDescription>
              {vehicleNumber ? <>Plat <b>{vehicleNumber}</b> — </> : null}
              Periode: <b>{computedMonthLabel}</b>
              {totalFee ? <> — Total: <b>Rp {Number(totalFee).toLocaleString("id-ID")}</b></> : monthlyFee ? <> — /bulan: <b>Rp {Number(monthlyFee).toLocaleString("id-ID")}</b></> : null}
            </DialogDescription>
          </DialogHeader>

          {step === "months" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Pilih durasi perpanjangan:</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((m) => (
                  <Button
                    key={m}
                    variant={selectedMonths === m ? "default" : "outline"}
                    className={selectedMonths === m ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
                    onClick={() => setSelectedMonths(m)}
                  >
                    {m} Bulan
                  </Button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                <Button onClick={() => setStep("method")}>Lanjut</Button>
              </div>
            </div>
          )}

          {step === "method" && (
            <div className="space-y-2">
              {enableMonthSelection && (
                <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setStep("months")} disabled={submitting}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Ubah Durasi ({selectedMonths} bln)
                </Button>
              )}
              <p className="text-sm text-muted-foreground">Pilih metode pembayaran:</p>
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => setStep("transfer")}>
                <Building2 className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Transfer Bank</div>
                  <div className="text-xs text-muted-foreground">BRI {REKENING.nomor}</div>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => setStep("kasir")}>
                <Banknote className="w-5 h-5 mr-3 text-success" />
                <div className="text-left">
                  <div className="font-semibold">Bayar di Kasir</div>
                  <div className="text-xs text-muted-foreground">Bayar langsung di kantor pengelola</div>
                </div>
              </Button>
            </div>
          )}

          {step === "transfer" && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setStep("method")} disabled={submitting}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
              </Button>

              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Building2 className="w-4 h-4" /> Transfer ke Rekening
                </div>
                <div>Bank: <b>{REKENING.bank}</b></div>
                <div className="flex items-center gap-2">
                  <span>No. Rek:</span>
                  <b className="font-mono">{REKENING.nomor}</b>
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={copyRekening}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <div>a.n. <b>{REKENING.atasNama}</b></div>
              </div>

              <div className="space-y-2">
                <Label>Bukti Transfer</Label>
                {preview ? (
                  <div className="space-y-2">
                    <img src={preview} alt="Bukti" className="w-full max-h-64 object-contain rounded border" />
                    <Button type="button" size="sm" variant="outline" onClick={() => { setFile(null); setPreview(null); }}>
                      Ganti foto
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => startCamera()}>
                      <Camera className="w-4 h-4 mr-2" /> Kamera HP
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" /> Galeri
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
                <Button onClick={submitTransfer} disabled={submitting || !file} className="bg-success hover:bg-success/90 text-success-foreground">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : "Kirim Perpanjangan"}
                </Button>
              </div>
            </div>
          )}

          {step === "kasir" && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setStep("method")} disabled={submitting}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
              </Button>
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <Banknote className="w-4 h-4" /> Bayar di Kasir
                </div>
                <p>Silakan datang ke kantor pengelola untuk membayar perpanjangan. Pengajuan akan tercatat dan diaktifkan setelah pembayaran diterima.</p>
                {totalFee ? <p>Total: <b>Rp {Number(totalFee).toLocaleString("id-ID")}</b></p> : monthlyFee ? <p>/bulan: <b>Rp {Number(monthlyFee).toLocaleString("id-ID")}</b> × {selectedMonths} bln</p> : null}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Batal</Button>
                <Button onClick={submitKasir} disabled={submitting} className="bg-success hover:bg-success/90 text-success-foreground">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : "Konfirmasi Bayar di Kasir"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={(o) => !o && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ambil Foto Bukti Transfer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={stopCamera}><X className="w-4 h-4 mr-1" /> Batal</Button>
              <Button variant="outline" onClick={switchCam}><SwitchCamera className="w-4 h-4 mr-1" /> Ganti</Button>
              <Button onClick={capturePhoto}><Camera className="w-4 h-4 mr-1" /> Jepret</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
