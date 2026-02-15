import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBillRates } from "@/hooks/useBillRates";
import { useUnits } from "@/hooks/useUnits";
import { useCreateQuarterlyBill } from "@/hooks/useBills";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const currentYear = new Date().getFullYear();
const QUARTERS = [
  { value: `Q1-${currentYear}`, label: `Jan-Mar ${currentYear}`, start: `${currentYear}-01-01`, end: `${currentYear}-03-31`, quarterLabel: `Jan-Mar ${currentYear}` },
  { value: `Q2-${currentYear}`, label: `Apr-Jun ${currentYear}`, start: `${currentYear}-04-01`, end: `${currentYear}-06-30`, quarterLabel: `Apr-Jun ${currentYear}` },
  { value: `Q3-${currentYear}`, label: `Jul-Sep ${currentYear}`, start: `${currentYear}-07-01`, end: `${currentYear}-09-30`, quarterLabel: `Jul-Sep ${currentYear}` },
  { value: `Q4-${currentYear}`, label: `Okt-Des ${currentYear}`, start: `${currentYear}-10-01`, end: `${currentYear}-12-31`, quarterLabel: `Okt-Des ${currentYear}` },
  { value: `Q1-${currentYear + 1}`, label: `Jan-Mar ${currentYear + 1}`, start: `${currentYear + 1}-01-01`, end: `${currentYear + 1}-03-31`, quarterLabel: `Jan-Mar ${currentYear + 1}` },
  { value: `Q2-${currentYear + 1}`, label: `Apr-Jun ${currentYear + 1}`, start: `${currentYear + 1}-04-01`, end: `${currentYear + 1}-06-30`, quarterLabel: `Apr-Jun ${currentYear + 1}` },
];

export function GenerateBillDialog() {
  const { data: rates } = useBillRates();
  const { units } = useUnits();
  const createBill = useCreateQuarterlyBill();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const quarter = QUARTERS.find((q) => q.value === selectedQuarter);

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
    if (selectedUnits.length === 0 || !rates || rates.length === 0 || !quarter) {
      toast.error("Pilih periode dan minimal 1 unit");
      return;
    }

    setIsGenerating(true);
    try {
      let totalBills = 0;

      for (const unitId of selectedUnits) {
        const unit = units?.find((u) => u.id === unitId);
        if (!unit) continue;

        const matchedRate = rates.find((r) => unit.area_sqm && r.area_sqm === unit.area_sqm);
        if (!matchedRate) {
          toast.warning(`Unit ${unit.unit_number} (${unit.area_sqm || '?'} m²) tidak cocok dengan tarif manapun, dilewati.`);
          continue;
        }

        const { data: penghuniData } = await supabase
          .from("penghuni")
          .select("id, full_name")
          .eq("unit_id", unitId)
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        await createBill.mutateAsync({
          unit_id: unitId,
          unit_number: unit.unit_number,
          penghuni_id: penghuniData?.id,
          quarter_start: quarter.start,
          quarter_end: quarter.end,
          quarter_label: quarter.quarterLabel,
          sc_monthly: matchedRate.monthly_sc,
          sf_monthly: matchedRate.monthly_sf,
          due_date: dueDate,
          is_auto_generated: true,
          notes: `${matchedRate.area_label} - ${penghuniData?.full_name || 'N/A'}`,
        });
        totalBills++;
      }

      toast.success(`${totalBills} tagihan kuartalan berhasil digenerate`);
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
          <DialogTitle>Generate Tagihan Kuartalan (SC + SF)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-medium">Tagihan per periode 3 bulan:</p>
            <p className="text-muted-foreground">Setiap unit mendapat 1 tagihan per kuartal dengan rincian SC dan SF per bulan. Penghuni dapat membayar per bulan.</p>
          </div>

          {rates && rates.length > 0 && (
            <div className="p-3 border rounded-lg text-sm space-y-1">
              <p className="font-medium mb-2">Tarif Aktif (per bulan):</p>
              {rates.map((r) => (
                <p key={r.id} className="text-muted-foreground">
                  {r.area_label}: SC {formatCurrency(r.monthly_sc)}/bln + SF {formatCurrency(r.monthly_sf)}/bln = {formatCurrency((r.monthly_sc + r.monthly_sf) * 3)}/kuartal
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periode Kuartal</Label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kuartal..." />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <Button type="submit" className="w-full" disabled={isGenerating || selectedUnits.length === 0 || !selectedQuarter}>
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate {selectedUnits.length > 0 ? `${selectedUnits.length} Tagihan Kuartalan` : "Tagihan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
