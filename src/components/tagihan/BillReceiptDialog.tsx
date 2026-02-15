import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Printer, Download } from "lucide-react";
import type { QuarterlyBill } from "@/hooks/useBills";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const statusLabels: Record<string, string> = {
  unpaid: "BELUM BAYAR",
  partial: "SEBAGIAN TERBAYAR",
  paid: "LUNAS",
};

export function BillReceiptDialog({
  bill,
  open,
  onOpenChange,
}: {
  bill: QuarterlyBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  if (!bill) return null;

  const paidMonths = bill.bill_payments?.filter((p) => p.is_paid).length || 0;
  const totalPaid = bill.bill_payments?.filter((p) => p.is_paid).reduce((s, p) => s + (p.paid_amount || p.total_amount), 0) || 0;

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Kwitansi - ${bill.unit_number}</title>
      <style>@page{margin:15mm;size:A4}body{font-family:Arial,sans-serif;font-size:12px;color:#000}
      table{width:100%;border-collapse:collapse}td{padding:3px 0}.bold{font-weight:bold}</style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kwitansi Tagihan Kuartalan</DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white text-black p-6 border rounded-lg text-xs">
          <div style={{ textAlign: "center", borderBottom: "3px double #333", paddingBottom: "12px", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "18px", margin: "0 0 4px", letterSpacing: "2px", fontWeight: "bold" }}>KWITANSI TAGIHAN</h1>
            <p style={{ fontSize: "10px", color: "#555" }}>Apartment Management System</p>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "11px" }}>
            <tbody>
              <tr><td className="bold" style={{ width: "130px" }}>Unit</td><td style={{ width: "10px" }}>:</td><td>{bill.units?.unit_number || bill.unit_number}</td></tr>
              <tr><td className="bold">Penghuni</td><td>:</td><td>{bill.penghuni?.full_name || "-"}</td></tr>
              <tr><td className="bold">Periode</td><td>:</td><td>{bill.quarter_label}</td></tr>
              <tr><td className="bold">Jatuh Tempo</td><td>:</td><td>{bill.due_date ? format(new Date(bill.due_date), "dd MMMM yyyy", { locale: localeId }) : "-"}</td></tr>
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #999", margin: "12px 0" }} />

          {/* Monthly breakdown */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "12px" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #333", padding: "4px" }}>Bulan</th>
                <th style={{ border: "1px solid #333", padding: "4px" }}>SC</th>
                <th style={{ border: "1px solid #333", padding: "4px" }}>SF</th>
                <th style={{ border: "1px solid #333", padding: "4px" }}>Total</th>
                <th style={{ border: "1px solid #333", padding: "4px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bill.bill_payments?.map((p) => (
                <tr key={p.id}>
                  <td style={{ border: "1px solid #333", padding: "4px" }}>{p.month_label}</td>
                  <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.sc_amount)}</td>
                  <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.sf_amount)}</td>
                  <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.total_amount)}</td>
                  <td style={{ border: "1px solid #333", padding: "4px", textAlign: "center" }}>{p.is_paid ? "✓ Lunas" : "Belum"}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold" }}>
                <td style={{ border: "1px solid #333", padding: "4px" }}>TOTAL</td>
                <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.sc_total)}</td>
                <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.sf_total)}</td>
                <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.total_amount)}</td>
                <td style={{ border: "1px solid #333", padding: "4px", textAlign: "center" }}>{paidMonths}/3</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold", padding: "8px 0", borderTop: "2px solid #333" }}>
            <span>Total Terbayar</span>
            <span>{formatCurrency(totalPaid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0" }}>
            <span>Sisa Tagihan</span>
            <span>{formatCurrency(bill.total_amount - totalPaid)}</span>
          </div>

          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <span style={{
              display: "inline-block", padding: "6px 20px", borderRadius: "4px",
              fontWeight: "bold", fontSize: "13px",
              background: bill.payment_status === "paid" ? "#dcfce7" : bill.payment_status === "partial" ? "#dbeafe" : "#fef9c3",
              color: bill.payment_status === "paid" ? "#166534" : bill.payment_status === "partial" ? "#1d4ed8" : "#854d0e",
              border: `1px solid ${bill.payment_status === "paid" ? "#86efac" : bill.payment_status === "partial" ? "#93c5fd" : "#fde047"}`,
            }}>
              {bill.payment_status === "paid" ? "✓ " : ""}{statusLabels[bill.payment_status]}
            </span>
          </div>

          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "9px", color: "#999", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
            <p>Dicetak pada: {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
