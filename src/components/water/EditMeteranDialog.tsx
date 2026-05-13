import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useWaterMeters, type WaterMeter } from "@/hooks/useWaterMeters";
import { useWaterTariff, calcWaterNominal } from "@/hooks/useWaterTariff";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meter: WaterMeter | null;
}

export function EditMeteranDialog({ open, onOpenChange, meter }: Props) {
  const { update, isUpdating } = useWaterMeters();
  const { tariff } = useWaterTariff();
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("0");

  useEffect(() => {
    if (meter) {
      setStart(String(meter.meter_start ?? 0));
      setEnd(String(meter.meter_end ?? 0));
    }
  }, [meter]);

  if (!meter) return null;

  const ms = Number(start) || 0;
  const me = Number(end) || 0;
  const usage = Math.max(0, me - ms);
  const nominal = ms === 0 && me === 0 ? 0 : calcWaterNominal(usage, tariff.abonemen, tariff.price_per_m3);

  const handleSave = async () => {
    await update({ id: meter.id, meter_start: ms, meter_end: me });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Meteran Air — Unit {meter.unit_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label>Meteran Awal</Label>
            <Input type="number" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>Meteran Akhir</Label>
            <Input type="number" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="rounded bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>Pemakaian</span><span className="font-semibold">{usage} m³</span></div>
            <div className="flex justify-between"><span>Nominal (abonemen + pemakaian)</span><span className="font-semibold text-primary">Rp {nominal.toLocaleString("id-ID")}</span></div>
            <p className="text-xs text-muted-foreground">Tagihan terkait perlu disesuaikan manual jika sudah dibuat.</p>
          </div>
          <Button onClick={handleSave} disabled={isUpdating || me < ms} className="w-full">
            {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
