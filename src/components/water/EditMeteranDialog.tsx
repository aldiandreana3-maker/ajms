import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWaterMeters, type WaterMeter } from "@/hooks/useWaterMeters";
import { useWaterTariff, calcWaterNominal } from "@/hooks/useWaterTariff";
import { CameraCapture } from "@/components/shared/CameraCapture";
import { useFileUpload } from "@/hooks/useFileUpload";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meter: WaterMeter | null;
}

export function EditMeteranDialog({ open, onOpenChange, meter }: Props) {
  const { update, isUpdating } = useWaterMeters();
  const { tariff } = useWaterTariff();
  const { uploadFile, uploading } = useFileUpload({ folder: "water-meters" });
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("0");
  const [photoStart, setPhotoStart] = useState<File | null>(null);
  const [photoEnd, setPhotoEnd] = useState<File | null>(null);
  const [previewStart, setPreviewStart] = useState<string | null>(null);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);

  useEffect(() => {
    if (meter) {
      setStart(String(meter.meter_start ?? 0));
      setEnd(String(meter.meter_end ?? 0));
      setPhotoStart(null);
      setPhotoEnd(null);
      // load existing photo previews via signed url
      const loadSigned = async (path: string | null, set: (v: string | null) => void) => {
        if (!path) return set(null);
        const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(path, 3600);
        set(data?.signedUrl ?? null);
      };
      loadSigned(meter.photo_start_url, setPreviewStart);
      loadSigned(meter.photo_end_url, setPreviewEnd);
    }
  }, [meter]);

  if (!meter) return null;

  const ms = Number(start) || 0;
  const me = Number(end) || 0;
  const usage = Math.max(0, me - ms);
  const nominal = ms === 0 && me === 0 ? 0 : calcWaterNominal(usage, tariff.abonemen, tariff.price_per_m3);

  const handleSave = async () => {
    const patch: any = { id: meter.id, meter_start: ms, meter_end: me };
    if (photoStart) {
      const path = await uploadFile(photoStart);
      if (path) patch.photo_start_url = path;
    }
    if (photoEnd) {
      const path = await uploadFile(photoEnd);
      if (path) patch.photo_end_url = path;
    }
    await update(patch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Meteran Air — Unit {meter.unit_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label>Meteran Awal</Label>
            <Input type="number" value={start} onChange={(e) => setStart(e.target.value)} />
            {previewStart && !photoStart && (
              <img src={previewStart} alt="Foto meteran awal" className="mt-2 w-full h-32 object-cover rounded border" />
            )}
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Ganti Foto Meteran Awal (Kamera)</Label>
              <CameraCapture label="Foto Meteran Awal" value={photoStart} onChange={setPhotoStart} />
            </div>
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Atau Upload dari Galeri</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoStart(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div>
            <Label>Meteran Akhir</Label>
            <Input type="number" value={end} onChange={(e) => setEnd(e.target.value)} />
            {previewEnd && !photoEnd && (
              <img src={previewEnd} alt="Foto meteran akhir" className="mt-2 w-full h-32 object-cover rounded border" />
            )}
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Ganti Foto Meteran Akhir (Kamera)</Label>
              <CameraCapture label="Foto Meteran Akhir" value={photoEnd} onChange={setPhotoEnd} />
            </div>
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Atau Upload dari Galeri</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoEnd(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="rounded bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Pemakaian</span><span className="font-semibold">{usage} m³</span></div>
            <div className="flex justify-between"><span>Nominal (abonemen + pemakaian)</span><span className="font-semibold text-primary">Rp {nominal.toLocaleString("id-ID")}</span></div>
            <p className="text-xs text-muted-foreground">Tagihan terkait perlu disesuaikan manual jika sudah dibuat.</p>
          </div>
          <Button onClick={handleSave} disabled={isUpdating || uploading || me < ms} className="w-full">
            {isUpdating || uploading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
