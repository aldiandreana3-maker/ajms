import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CloudUpload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleDateString("id-ID", { month: "long" }),
}));

export function SyncParkingToDriveButton() {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [includeProofs, setIncludeProofs] = useState(true);
  const [loading, setLoading] = useState(false);

  const years = Array.from({ length: 6 }, (_, i) => String(now.getFullYear() - 3 + i));

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-parking-drive", {
        body: { month: Number(month), year: Number(year), includeProofs },
      });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        throw new Error(details);
      }
      toast.success(
        `Tersimpan ke Google Drive: ${data.folder} — ${data.records} data, ${data.proofs_uploaded} bukti transfer.`,
      );
      if (data.proof_errors?.length) {
        toast.warning(`${data.proof_errors.length} bukti transfer gagal diunggah.`);
      }
      setOpen(false);
    } catch (e) {
      toast.error(`Gagal sinkron ke Google Drive: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CloudUpload className="w-4 h-4 mr-2" />
          Kirim ke Google Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Sinkron ke Google Drive</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="proofs" checked={includeProofs} onCheckedChange={(v) => setIncludeProofs(!!v)} />
            <Label htmlFor="proofs" className="text-sm font-normal">Ikut kirim gambar bukti transfer</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            File akan tersimpan di folder <strong>AJMS - Abonemen Parkir / {year}-{month.padStart(2, "0")}</strong> pada Google Drive yang terhubung.
          </p>
          <Button onClick={handleSync} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudUpload className="w-4 h-4 mr-2" />}
            {loading ? "Mengirim..." : "Kirim Sekarang"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
