import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Save, Loader2 } from "lucide-react";
import { useUpdateBill, useUpdateBillPaymentDetail, type QuarterlyBill, type BillPayment } from "@/hooks/useBills";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

interface EditInvoiceDialogProps {
  bill: QuarterlyBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditInvoiceDialog({ bill, open, onOpenChange }: EditInvoiceDialogProps) {
  const updateBill = useUpdateBill();
  const updatePaymentDetail = useUpdateBillPaymentDetail();

  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "partial">("unpaid");
  const [scMonthly, setScMonthly] = useState(0);
  const [sfMonthly, setSfMonthly] = useState(0);
  const [editingPayments, setEditingPayments] = useState<Record<string, { sc_amount: number; sf_amount: number; is_paid: boolean }>>({});

  useEffect(() => {
    if (bill) {
      setDueDate(bill.due_date || "");
      setNotes(bill.notes || "");
      setPaymentStatus(bill.payment_status);
      setScMonthly(bill.sc_monthly || 0);
      setSfMonthly(bill.sf_monthly || 0);

      const payments: Record<string, { sc_amount: number; sf_amount: number; is_paid: boolean }> = {};
      bill.bill_payments?.forEach((p) => {
        payments[p.id] = { sc_amount: p.sc_amount, sf_amount: p.sf_amount, is_paid: p.is_paid };
      });
      setEditingPayments(payments);
    }
  }, [bill]);

  if (!bill) return null;

  const handleSave = async () => {
    const sc_total = scMonthly * 3;
    const sf_total = sfMonthly * 3;
    const total_amount = sc_total + sf_total;

    // Update main bill
    await updateBill.mutateAsync({
      id: bill.id,
      due_date: dueDate,
      notes: notes || null,
      payment_status: paymentStatus,
      sc_monthly: scMonthly,
      sf_monthly: sfMonthly,
      sc_total,
      sf_total,
      total_amount,
      amount: total_amount,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    });

    // Update each payment detail
    for (const [paymentId, vals] of Object.entries(editingPayments)) {
      const totalAmount = vals.sc_amount + vals.sf_amount;
      await updatePaymentDetail.mutateAsync({
        id: paymentId,
        sc_amount: vals.sc_amount,
        sf_amount: vals.sf_amount,
        total_amount: totalAmount,
        is_paid: vals.is_paid,
        paid_amount: vals.is_paid ? totalAmount : null,
        paid_at: vals.is_paid ? new Date().toISOString() : null,
      });
    }

    onOpenChange(false);
  };

  const isSaving = updateBill.isPending || updatePaymentDetail.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Invoice - {bill.units?.unit_number || bill.unit_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Unit</Label>
              <Input value={bill.units?.unit_number || bill.unit_number || "-"} disabled />
            </div>
            <div>
              <Label>Penghuni</Label>
              <Input value={bill.penghuni?.full_name || "-"} disabled />
            </div>
            <div>
              <Label>Periode</Label>
              <Input value={bill.quarter_label || "-"} disabled />
            </div>
            <div>
              <Label>Tanggal Jatuh Tempo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Tarif Bulanan */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Tarif Bulanan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Charge (SC) / bulan</Label>
                <Input type="number" value={scMonthly} onChange={(e) => setScMonthly(Number(e.target.value))} />
              </div>
              <div>
                <Label>Sinking Fund (SF) / bulan</Label>
                <Input type="number" value={sfMonthly} onChange={(e) => setSfMonthly(Number(e.target.value))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Total kuartalan: {formatCurrency((scMonthly + sfMonthly) * 3)}
            </p>
          </div>

          <Separator />

          {/* Detail Per Bulan */}
          {bill.bill_payments && bill.bill_payments.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Rincian Per Bulan</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>SC</TableHead>
                    <TableHead>SF</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.bill_payments.map((p) => {
                    const ep = editingPayments[p.id] || { sc_amount: p.sc_amount, sf_amount: p.sf_amount, is_paid: p.is_paid };
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.month_label}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28 h-8"
                            value={ep.sc_amount}
                            onChange={(e) => setEditingPayments((prev) => ({
                              ...prev,
                              [p.id]: { ...ep, sc_amount: Number(e.target.value) },
                            }))}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-28 h-8"
                            value={ep.sf_amount}
                            onChange={(e) => setEditingPayments((prev) => ({
                              ...prev,
                              [p.id]: { ...ep, sf_amount: Number(e.target.value) },
                            }))}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(ep.sc_amount + ep.sf_amount)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={ep.is_paid ? "paid" : "unpaid"}
                            onValueChange={(v) => setEditingPayments((prev) => ({
                              ...prev,
                              [p.id]: { ...ep, is_paid: v === "paid" },
                            }))}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">Belum Bayar</SelectItem>
                              <SelectItem value="paid">Lunas</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <Separator />

          {/* Status & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Status Pembayaran</Label>
              <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Belum Bayar</SelectItem>
                  <SelectItem value="partial">Sebagian Terbayar</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catatan</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tambahkan catatan..." rows={2} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
