import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ChartAccount } from "@/hooks/useChartOfAccounts";

const ACCOUNT_TYPES = [
  { value: "AKTIVA", label: "Aktiva" },
  { value: "PASIVA", label: "Pasiva" },
  { value: "MODAL", label: "Modal" },
  { value: "PENDAPATAN", label: "Pendapatan" },
  { value: "BEBAN", label: "Beban" },
];

interface CoaFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: ChartAccount | null;
  onSubmit: (data: Partial<ChartAccount>) => void;
  isPending: boolean;
}

export function CoaFormDialog({ open, onOpenChange, editing, onSubmit, isPending }: CoaFormDialogProps) {
  const [form, setForm] = useState({
    account_code: "",
    account_name: "",
    account_type: "AKTIVA",
    is_detail: true,
    up_level: "",
    map_to_neraca: "",
    map_to_cash_flow: "",
    pos_budget: "",
    sumber_dana: "",
    normal_balance: "debit",
    opening_balance: 0,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        account_code: editing.account_code,
        account_name: editing.account_name,
        account_type: editing.account_type,
        is_detail: editing.is_detail,
        up_level: editing.up_level || "",
        map_to_neraca: editing.map_to_neraca || "",
        map_to_cash_flow: editing.map_to_cash_flow || "",
        pos_budget: editing.pos_budget || "",
        sumber_dana: editing.sumber_dana || "",
        normal_balance: editing.normal_balance,
        opening_balance: editing.opening_balance,
      });
    } else {
      setForm({
        account_code: "", account_name: "", account_type: "AKTIVA", is_detail: true,
        up_level: "", map_to_neraca: "", map_to_cash_flow: "", pos_budget: "", sumber_dana: "",
        normal_balance: "debit", opening_balance: 0,
      });
    }
  }, [editing, open]);

  const handleSubmit = () => {
    if (!form.account_code || !form.account_name) return;
    const payload: Partial<ChartAccount> = {
      ...form,
      opening_balance: Number(form.opening_balance),
      ...(editing ? {} : { current_balance: Number(form.opening_balance) }),
    };
    if (editing) payload.id = editing.id;
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Akun" : "Tambah Akun Baru"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Kode Akun *</Label>
              <Input value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} placeholder="1.01.01.01.00" />
            </div>
            <div>
              <Label>Tipe Akun</Label>
              <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Nama Akun / Description *</Label>
            <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Kas" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Label>Detail</Label>
              <Switch checked={form.is_detail} onCheckedChange={(v) => setForm({ ...form, is_detail: v })} />
              <span className="text-sm text-muted-foreground">{form.is_detail ? "YES" : "NO"}</span>
            </div>
            <div>
              <Label>Up Level</Label>
              <Input value={form.up_level} onChange={(e) => setForm({ ...form, up_level: e.target.value })} placeholder="1.01.01.00.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Map to Neraca</Label>
              <Input value={form.map_to_neraca} onChange={(e) => setForm({ ...form, map_to_neraca: e.target.value })} placeholder="Kas & Bank" />
            </div>
            <div>
              <Label>Map to Cash Flow</Label>
              <Input value={form.map_to_cash_flow} onChange={(e) => setForm({ ...form, map_to_cash_flow: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Pos Budget</Label>
              <Input value={form.pos_budget} onChange={(e) => setForm({ ...form, pos_budget: e.target.value })} placeholder="Finance" />
            </div>
            <div>
              <Label>Sumber Dana</Label>
              <Input value={form.sumber_dana} onChange={(e) => setForm({ ...form, sumber_dana: e.target.value })} placeholder="DC" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Saldo Normal</Label>
              <Select value={form.normal_balance} onValueChange={(v) => setForm({ ...form, normal_balance: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="kredit">Kredit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Saldo Awal</Label>
              <Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })} />
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? "Simpan Perubahan" : "Tambah Akun"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
