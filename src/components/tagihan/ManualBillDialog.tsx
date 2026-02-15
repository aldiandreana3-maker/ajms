import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnits } from "@/hooks/useUnits";
import { useCreateManualBill } from "@/hooks/useBills";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { UnitCombobox } from "./UnitCombobox";

const BILL_TYPES = [
  { value: "kebersihan", label: "Kebersihan" },
  { value: "keamanan", label: "Keamanan" },
  { value: "sinking_fund", label: "Sinking Fund" },
  { value: "listrik", label: "Listrik" },
  { value: "air", label: "Air" },
  { value: "denda", label: "Denda" },
  { value: "perbaikan", label: "Perbaikan" },
];

export function ManualBillDialog() {
  const { units } = useUnits();
  const createBill = useCreateManualBill();

  const [isOpen, setIsOpen] = useState(false);
  const [unitId, setUnitId] = useState("");
  const [billType, setBillType] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("");
  const [notes, setNotes] = useState("");

  const selectedUnit = units?.find((u) => u.id === unitId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId || !billType || !amount || !dueDate || !billingPeriod) return;

    // Get penghuni for this unit
    const { data: penghuniData } = await supabase
      .from("penghuni")
      .select("id, full_name")
      .eq("unit_id", unitId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    await createBill.mutateAsync({
      unit_id: unitId,
      unit_number: selectedUnit?.unit_number || "",
      penghuni_id: penghuniData?.id || null,
      bill_type: billType,
      amount: parseFloat(amount),
      billing_period: billingPeriod,
      due_date: dueDate,
      notes: notes || `${BILL_TYPES.find(t => t.value === billType)?.label} - ${penghuniData?.full_name || 'N/A'}`,
    });

    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setUnitId("");
    setBillType("");
    setAmount("");
    setDueDate("");
    setBillingPeriod("");
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Tagihan Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Tagihan Manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Unit</Label>
            <UnitCombobox value={unitId} onChange={setUnitId} />
          </div>

          <div className="space-y-2">
            <Label>Jenis Tagihan</Label>
            <Select value={billType} onValueChange={setBillType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis..." />
              </SelectTrigger>
              <SelectContent>
                {BILL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jumlah (Rp)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
          </div>

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
            <Label>Catatan (opsional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <Button type="submit" className="w-full" disabled={createBill.isPending || !unitId || !billType || !amount}>
            {createBill.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Buat Tagihan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
