import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnits } from "@/hooks/useUnits";
import { useBillRates } from "@/hooks/useBillRates";
import { useCreateQuarterlyBill } from "@/hooks/useBills";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { UnitCombobox } from "./UnitCombobox";
import { toast } from "sonner";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

// Generate past quarters (previous years)
function generatePastQuarters(): { value: string; label: string; start: string; end: string; quarterLabel: string }[] {
  const currentYear = new Date().getFullYear();
  const quarters: { value: string; label: string; start: string; end: string; quarterLabel: string }[] = [];

  for (let year = currentYear - 5; year <= currentYear; year++) {
    quarters.push(
      { value: `Q1-${year}`, label: `Jan-Mar ${year}`, start: `${year}-01-01`, end: `${year}-03-31`, quarterLabel: `Jan-Mar ${year}` },
      { value: `Q2-${year}`, label: `Apr-Jun ${year}`, start: `${year}-04-01`, end: `${year}-06-30`, quarterLabel: `Apr-Jun ${year}` },
      { value: `Q3-${year}`, label: `Jul-Sep ${year}`, start: `${year}-07-01`, end: `${year}-09-30`, quarterLabel: `Jul-Sep ${year}` },
      { value: `Q4-${year}`, label: `Okt-Des ${year}`, start: `${year}-10-01`, end: `${year}-12-31`, quarterLabel: `Okt-Des ${year}` },
    );
  }

  return quarters.reverse(); // Most recent first
}

const PAST_QUARTERS = generatePastQuarters();

export function AddOutstandingDialog() {
  const { units } = useUnits();
  const { data: rates } = useBillRates();
  const createBill = useCreateQuarterlyBill();

  const [isOpen, setIsOpen] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scMonthly, setScMonthly] = useState(0);
  const [sfMonthly, setSfMonthly] = useState(0);
  const [notes, setNotes] = useState("");

  const selectedUnit = units?.find((u) => u.id === unitId);
  const quarter = PAST_QUARTERS.find((q) => q.value === selectedQuarter);

  // Auto-match rate based on unit area
  const matchedRate = useMemo(() => {
    if (!selectedUnit?.area_sqm || !rates) return null;
    return rates.find((r) => r.area_sqm === selectedUnit.area_sqm) || null;
  }, [selectedUnit, rates]);

  // Auto-fill SC/SF when rate matched
  useEffect(() => {
    if (matchedRate) {
      setScMonthly(Math.round(matchedRate.monthly_sc / 3));
      setSfMonthly(Math.round(matchedRate.monthly_sf / 3));
    } else {
      setScMonthly(0);
      setSfMonthly(0);
    }
  }, [matchedRate]);

  // Auto-fill due date from quarter end
  useEffect(() => {
    if (quarter) {
      setDueDate(quarter.end);
    }
  }, [quarter]);

  // Get penghuni name for display
  const [penghuniName, setPenghuniName] = useState("-");
  useEffect(() => {
    if (!unitId) { setPenghuniName("-"); return; }
    supabase
      .from("penghuni")
      .select("full_name")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setPenghuniName(data?.full_name || "-"));
  }, [unitId]);

  const scTotal = scMonthly * 3;
  const sfTotal = sfMonthly * 3;
  const totalAmount = scTotal + sfTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !quarter || !dueDate || totalAmount <= 0) {
      toast.error("Lengkapi semua data yang diperlukan");
      return;
    }

    // Check duplicate
    const { data: existing } = await supabase
      .from("bills")
      .select("id")
      .eq("unit_id", unitId)
      .eq("quarter_label", quarter.quarterLabel)
      .eq("bill_type", "ipl")
      .maybeSingle();

    if (existing) {
      toast.error(`Tagihan ${quarter.quarterLabel} untuk unit ini sudah ada`);
      return;
    }

    const { data: penghuniData } = await supabase
      .from("penghuni")
      .select("id, full_name")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    try {
      await createBill.mutateAsync({
        unit_id: unitId,
        unit_number: selectedUnit?.unit_number || "",
        penghuni_id: penghuniData?.id || null,
        quarter_start: quarter.start,
        quarter_end: quarter.end,
        quarter_label: quarter.quarterLabel,
        sc_monthly: scMonthly,
        sf_monthly: sfMonthly,
        due_date: dueDate,
        is_auto_generated: false,
        notes: notes || `Outstanding - ${matchedRate?.area_label || ""} - ${penghuniData?.full_name || "N/A"}`,
      });
      toast.success(`Tagihan outstanding ${quarter.quarterLabel} berhasil ditambahkan`);
      setIsOpen(false);
      resetForm();
    } catch (err: any) {
      // Error already handled by mutation
    }
  };

  const resetForm = () => {
    setUnitId("");
    setSelectedQuarter("");
    setDueDate("");
    setScMonthly(0);
    setSfMonthly(0);
    setNotes("");
    setPenghuniName("-");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tagihan Sebelumnya
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Outstanding Tagihan Sebelumnya</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Input tagihan SC & SF dari periode sebelumnya yang belum terbayar. SC dan SF otomatis sesuai tipe unit.
          </div>

          {/* Unit selection */}
          <div className="space-y-2">
            <Label>Unit</Label>
            <UnitCombobox value={unitId} onChange={setUnitId} />
          </div>

          {/* Auto-fill info */}
          {selectedUnit && (
            <div className="p-3 border rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penghuni:</span>
                <span className="font-medium">{penghuniName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe:</span>
                <span className="font-medium">{selectedUnit.area_sqm ? `${selectedUnit.area_sqm} m²` : "-"}</span>
              </div>
              {matchedRate ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarif:</span>
                  <span className="font-medium text-primary">{matchedRate.area_label}</span>
                </div>
              ) : (
                <p className="text-destructive text-xs">Tarif tidak ditemukan untuk tipe unit ini</p>
              )}
            </div>
          )}

          {/* Quarter selection */}
          <div className="space-y-2">
            <Label>Periode Kuartal</Label>
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih periode..." />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {PAST_QUARTERS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SC / SF */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SC / bulan (Rp)</Label>
              <Input
                type="number"
                value={scMonthly || ""}
                onChange={(e) => setScMonthly(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>SF / bulan (Rp)</Label>
              <Input
                type="number"
                value={sfMonthly || ""}
                onChange={(e) => setSfMonthly(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Summary */}
          {totalAmount > 0 && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span>SC × 3 bulan:</span>
                <span className="font-medium">{formatCurrency(scTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>SF × 3 bulan:</span>
                <span className="font-medium">{formatCurrency(sfTotal)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="font-bold">Total Kuartal:</span>
                <span className="font-bold text-destructive">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Due date */}
          <div className="space-y-2">
            <Label>Jatuh Tempo</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan (opsional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Misal: Tunggakan tahun 2023" />
          </div>

          <Button type="submit" className="w-full" disabled={createBill.isPending || !unitId || !selectedQuarter || totalAmount <= 0}>
            {createBill.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tambah Tagihan Outstanding
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
