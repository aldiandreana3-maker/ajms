import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Loader2, Copy, Check, Building2 } from "lucide-react";
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
  targetEndDate: string; // YYYY-MM-DD
  monthLabel: string;
}

const REKENING = {
  bank: "BCA",
  nomor: "200001000338306",
  atasNama: "PPPSRS THE JARRDIN",
};

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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Mohon upload bukti transfer terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const path = await uploadFile(file);
      if (!path) throw new Error("Gagal upload bukti");

      const { error } = await supabase
        .from("parking_subscriptions")
        .update({
          end_date: targetEndDate,
          is_active: true,
          payment_proof_url: path,
          verification_status: "pending",
        })
        .eq("id", subscriptionId);

      if (error) throw error;

      toast.success(`Pengajuan perpanjangan ${monthLabel} berhasil dikirim. Menunggu verifikasi admin.`);
      queryClient.invalidateQueries({ queryKey: ["parking-subscriptions"] });
      setFile(null);
      setPreview(null);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Gagal mengirim: " + (e?.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Perpanjang Abonemen Parkir</DialogTitle>
          <DialogDescription>
            {vehicleNumber ? <>Plat <b>{vehicleNumber}</b> — </> : null}
            Periode: <b>{monthLabel}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Rekening */}
          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="w-4 h-4" /> Transfer ke Rekening
            </div>
            <div className="text-sm space-y-1">
              <div>Bank: <b>{REKENING.bank}</b></div>
              <div className="flex items-center gap-2">
                <span>No. Rek:</span>
                <b className="font-mono">{REKENING.nomor}</b>
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={copyRekening}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <div>a.n. <b>{REKENING.atasNama}</b></div>
              {monthlyFee ? (
                <div className="pt-1">
                  Nominal: <b>Rp {Number(monthlyFee).toLocaleString("id-ID")}</b>
                </div>
              ) : null}
            </div>
          </div>

          {/* Upload bukti */}
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
                <Button type="button" variant="outline" onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-2" /> Kamera HP
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Galeri
                </Button>
              </div>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !file} className="bg-success hover:bg-success/90 text-success-foreground">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengirim...</> : "Kirim Perpanjangan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
