import { useState, useRef, useEffect, useCallback } from "react";
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
  targetEndDate: string;
  monthLabel: string;
}

const REKENING = {
  bank: "BCA",
  nomor: "200001000338306",
  atasNama: "PPPSRS THE JARRDIN",
};

type Step = "method" | "transfer" | "kasir";

export function QuickRenewParkingDialog({
  open,
  onOpenChange,
  subscriptionId,
  vehicleNumber,
  monthlyFee,
  targetEndDate,
  monthLabel,
}: Props) {
  const { uploadFile } = useFileUpload({ folder: "parking" });
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<Step>("method");
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
      setStep("method");
      setFile(null);
      setPreview(null);
    }
  }, [open]);

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

  const submitTransfer = async () => {
    if (!file) { toast.error("Mohon upload bukti transfer terlebih dahulu"); return; }
    setSubmitting(true);
    try {
      const path = await uploadFile(file);
      if (!path) throw new Error("Gagal upload bukti");
      const { error } = await supabase.from("parking_subscriptions").update({
        end_date: targetEndDate,
        is_active: true,
        payment_proof_url: path,
        verification_status: "proses",
        admin_notes: `Perpanjangan ${monthLabel} — Transfer BCA, menunggu verifikasi`,
      }).eq("id", subscriptionId);
      if (error) throw error;
      toast.success(`Pengajuan perpanjangan ${monthLabel} terkirim. Menunggu verifikasi admin.`);
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Gagal mengirim: " + (e?.message || ""));
    } finally { setSubmitting(false); }
  };

  const submitKasir = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("parking_subscriptions").update({
        end_date: targetEndDate,
        is_active: true,
        verification_status: "proses",
        admin_notes: `Perpanjangan ${monthLabel} — Bayar di Kasir, menunggu pembayaran`,
      }).eq("id", subscriptionId);
      if (error) throw error;
      toast.success(`Pengajuan perpanjangan ${monthLabel} terkirim. Silakan bayar di kasir.`);
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
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
              Periode: <b>{monthLabel}</b>
              {monthlyFee ? <> — Nominal: <b>Rp {Number(monthlyFee).toLocaleString("id-ID")}</b></> : null}
            </DialogDescription>
          </DialogHeader>

          {step === "method" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pilih metode pembayaran:</p>
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => setStep("transfer")}>
                <Building2 className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Transfer Bank</div>
                  <div className="text-xs text-muted-foreground">BCA {REKENING.nomor}</div>
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
                {monthlyFee ? <p>Total: <b>Rp {Number(monthlyFee).toLocaleString("id-ID")}</b></p> : null}
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
