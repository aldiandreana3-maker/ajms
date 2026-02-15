import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useBillRates } from "@/hooks/useBillRates";
import { useUnits } from "@/hooks/useUnits";
import { useCreateBill } from "@/hooks/useBills";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function GenerateBillDialog() {
  const { data: rates } = useBillRates();
  const { units } = useUnits();
  const createBill = useCreateBill();

  const [isOpen, setIsOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleUnit = (unitId: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId]
    );
  };

  const selectAll = () => {
    if (units) setSelectedUnits(units.map((u) => u.id));
  };

  const deselectAll = () => setSelectedUnits([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnits.length === 0 || !rates || rates.length === 0) {
      toast.error("Pilih minimal 1 unit dan pastikan tarif sudah dikonfigurasi");
      return;
    }

    setIsGenerating(true);
    try {
      let totalBills = 0;

      for (const unitId of selectedUnits) {
        const unit = units?.find((u) => u.id === unitId);
        if (!unit) continue;

        // Match unit to rate by area_sqm
        const matchedRate = rates.find((r) => unit.area_sqm && r.area_sqm === unit.area_sqm);
        if (!matchedRate) {
          toast.warning(`Unit ${unit.unit_number} (${unit.area_sqm || '?'} m²) tidak cocok dengan tarif manapun, dilewati.`);
          continue;
        }

        // Get penghuni for this unit
        const { data: penghuniData } = await supabase
          .from("penghuni")
          .select("id, full_name")
          .eq("unit_id", unitId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        const scAmount = Math.round((matchedRate.quarterly_amount * 5) / 6 / 3);
        const sfAmount = Math.round(matchedRate.quarterly_amount / 6 / 3);

        // Create SC bill
        await createBill.mutateAsync({
          unit_id: unitId,
          unit_number: unit.unit_number,
          penghuni_id: penghuniData?.id,
          bill_type: "ipl",
          amount: scAmount,
          billing_period: billingPeriod,
          due_date: dueDate,
          is_auto_generated: true,
          notes: `SC (Service Charge) - ${matchedRate.area_label} - ${penghuniData?.full_name || 'N/A'}`,
        });
        totalBills++;

        // Create SF bill
        await createBill.mutateAsync({
          unit_id: unitId,
          unit_number: unit.unit_number,
          penghuni_id: penghuniData?.id,
          bill_type: "sinking_fund",
          amount: sfAmount,
          billing_period: billingPeriod,
          due_date: dueDate,
          is_auto_generated: true,
          notes: `SF (Sinking Fund) - ${matchedRate.area_label} - ${penghuniData?.full_name || 'N/A'}`,
        });
        totalBills++;
      }

      toast.success(`${totalBills} tagihan (SC + SF) berhasil digenerate`);
      setIsOpen(false);
      setSelectedUnits([]);
    } catch (error: any) {
      toast.error("Gagal generate tagihan: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Generate Tagihan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Tagihan IPL (SC + SF)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-medium">Tagihan otomatis berdasarkan tipe unit:</p>
            <p className="text-muted-foreground">Setiap unit akan mendapat 2 tagihan per bulan: SC (Service Charge = 5/6 tarif) dan SF (Sinking Fund = 1/6 tarif), dihitung dari tarif triwulan.</p>
          </div>

          {rates && rates.length > 0 && (
            <div className="p-3 border rounded-lg text-sm space-y-1">
              <p className="font-medium mb-2">Tarif Aktif:</p>
              {rates.map((r) => (
                <p key={r.id} className="text-muted-foreground">
                  {r.area_label}: SC {formatCurrency(Math.round((r.quarterly_amount * 5) / 6 / 3))}/bln + SF {formatCurrency(Math.round(r.quarterly_amount / 6 / 3))}/bln
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periode Tagihan</Label>
              <Input type="date" value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pilih Unit ({selectedUnits.length} dipilih)</Label>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={selectAll}>Semua</Button>
                <Button type="button" variant="ghost" size="sm" onClick={deselectAll}>Hapus</Button>
              </div>
            </div>
            <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
              {units?.map((unit) => {
                const matchedRate = rates?.find((r) => unit.area_sqm && r.area_sqm === unit.area_sqm);
                return (
                  <label key={unit.id} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedUnits.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <span>{unit.unit_number}</span>
                    {unit.area_sqm && <span className="text-muted-foreground">({unit.area_sqm} m²)</span>}
                    {!matchedRate && unit.area_sqm && <span className="text-destructive text-xs">(tarif tidak cocok)</span>}
                  </label>
                );
              })}
              {(!units || units.length === 0) && (
                <p className="text-center text-muted-foreground py-4 text-sm">Tidak ada unit</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating || selectedUnits.length === 0}>
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate {selectedUnits.length > 0 ? `${selectedUnits.length * 2} Tagihan (SC + SF)` : "Tagihan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
