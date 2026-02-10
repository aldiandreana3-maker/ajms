import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBillRates } from "@/hooks/useBillRates";
import { useUnits } from "@/hooks/useUnits";
import { useCreateBill } from "@/hooks/useBills";
import { Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function GenerateBillDialog() {
  const { data: rates } = useBillRates();
  const { units } = useUnits();
  const createBill = useCreateBill();

  const [isOpen, setIsOpen] = useState(false);
  const [rateId, setRateId] = useState("");
  const [paymentType, setPaymentType] = useState<"monthly" | "quarterly">("quarterly");
  const [billingPeriod, setBillingPeriod] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedRate = rates?.find((r) => r.id === rateId);

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
    if (!selectedRate || selectedUnits.length === 0) {
      toast.error("Pilih tarif dan minimal 1 unit");
      return;
    }

    setIsGenerating(true);
    try {
      const amount = paymentType === "quarterly" ? selectedRate.quarterly_amount : selectedRate.monthly_amount;
      const billCount = paymentType === "quarterly" ? 1 : 3;

      for (const unitId of selectedUnits) {
        if (paymentType === "monthly") {
          // Generate 3 monthly bills
          const baseDate = new Date(billingPeriod);
          for (let i = 0; i < 3; i++) {
            const period = new Date(baseDate);
            period.setMonth(period.getMonth() + i);
            const due = new Date(dueDate);
            due.setMonth(due.getMonth() + i);

            await createBill.mutateAsync({
              unit_id: unitId,
              bill_type: "ipl",
              amount,
              billing_period: period.toISOString().split("T")[0],
              due_date: due.toISOString().split("T")[0],
              is_auto_generated: true,
              notes: `${selectedRate.area_label} - Bulan ${i + 1}/3`,
            });
          }
        } else {
          await createBill.mutateAsync({
            unit_id: unitId,
            bill_type: "ipl",
            amount,
            billing_period: billingPeriod,
            due_date: dueDate,
            is_auto_generated: true,
            notes: `${selectedRate.area_label} - Per 3 Bulan`,
          });
        }
      }

      const totalBills = selectedUnits.length * billCount;
      toast.success(`${totalBills} tagihan berhasil digenerate untuk ${selectedUnits.length} unit`);
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
          <DialogTitle>Generate Tagihan IPL</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="space-y-2">
            <Label>Tarif Tipe Unit</Label>
            <Select value={rateId} onValueChange={setRateId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe unit" />
              </SelectTrigger>
              <SelectContent>
                {rates?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.area_label} - {formatCurrency(r.quarterly_amount)}/3bln
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRate && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p>Tarif 3 bulan: <strong>{formatCurrency(selectedRate.quarterly_amount)}</strong></p>
              <p>Tarif per bulan: <strong>{formatCurrency(selectedRate.monthly_amount)}</strong></p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Metode Pembayaran</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as "monthly" | "quarterly")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarterly">Per 3 Bulan (1 tagihan)</SelectItem>
                <SelectItem value="monthly">Per Bulan (3 tagihan terpisah)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Periode Mulai</Label>
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
              {units?.map((unit) => (
                <label key={unit.id} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded cursor-pointer text-sm">
                  <Checkbox
                    checked={selectedUnits.includes(unit.id)}
                    onCheckedChange={() => toggleUnit(unit.id)}
                  />
                  <span>{unit.unit_number}</span>
                  {unit.area_sqm && <span className="text-muted-foreground">({unit.area_sqm} m²)</span>}
                </label>
              ))}
              {(!units || units.length === 0) && (
                <p className="text-center text-muted-foreground py-4 text-sm">Tidak ada unit</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating || selectedUnits.length === 0}>
            {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate {selectedUnits.length > 0 ? `${selectedUnits.length * (paymentType === "monthly" ? 3 : 1)} Tagihan` : "Tagihan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
