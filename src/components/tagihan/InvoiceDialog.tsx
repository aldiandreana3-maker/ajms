import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Printer, FileText, CheckCircle, Clock, AlertCircle, Pencil } from "lucide-react";
import type { QuarterlyBill } from "@/hooks/useBills";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EditInvoiceDialog } from "./EditInvoiceDialog";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle; bg: string }> = {
  unpaid: { label: "Belum Bayar", color: "text-warning", icon: AlertCircle, bg: "bg-warning/10 border-warning/30" },
  partial: { label: "Sebagian Terbayar", color: "text-blue-600", icon: Clock, bg: "bg-blue-50 border-blue-200" },
  paid: { label: "Lunas", color: "text-success", icon: CheckCircle, bg: "bg-success/10 border-success/30" },
};

export function InvoiceDialog({
  bill,
  open,
  onOpenChange,
}: {
  bill: QuarterlyBill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { isSuperAdmin, isMasterDev, isAdmin } = useAuth();
  const canEdit = isMasterDev || isSuperAdmin || isAdmin;

  // Fetch unit type info
  const { data: unitInfo } = useQuery({
    queryKey: ["unit-info", bill?.unit_id],
    queryFn: async () => {
      if (!bill?.unit_id) return null;
      const { data } = await supabase
        .from("units")
        .select("unit_number, type, area_sqm, building, floor")
        .eq("id", bill.unit_id)
        .maybeSingle();
      return data;
    },
    enabled: !!bill?.unit_id && open,
  });

  // Fetch agent info if exists
  const { data: agentInfo } = useQuery({
    queryKey: ["agent-for-unit", bill?.unit_id],
    queryFn: async () => {
      if (!bill?.unit_id) return null;
      const { data } = await supabase
        .from("agent_units")
        .select("agent_id, agents(name, phone)")
        .eq("unit_id", bill.unit_id)
        .limit(1);
      if (data && data.length > 0) {
        const agent = (data[0] as any).agents;
        return agent ? { name: agent.name, phone: agent.phone } : null;
      }
      return null;
    },
    enabled: !!bill?.unit_id && open,
  });

  if (!bill) return null;

  const status = statusConfig[bill.payment_status] || statusConfig.unpaid;
  const StatusIcon = status.icon;
  const paidMonths = bill.bill_payments?.filter((p) => p.is_paid).length || 0;
  const totalPaid = bill.bill_payments?.filter((p) => p.is_paid).reduce((s, p) => s + (p.paid_amount || p.total_amount), 0) || 0;
  const remaining = bill.total_amount - totalPaid;
  const now = new Date();

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${bill.unit_number || bill.units?.unit_number}</title>
      <style>
        @page{margin:15mm;size:A4}
        body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a1a;line-height:1.5}
        table{width:100%;border-collapse:collapse}
        .invoice-header{text-align:center;border-bottom:3px solid #1a1a1a;padding-bottom:16px;margin-bottom:20px}
        .invoice-header h1{font-size:22px;margin:0;letter-spacing:3px}
        .invoice-header p{font-size:10px;color:#666;margin:4px 0 0}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
        .info-section h3{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:1px;margin:0 0 8px;border-bottom:1px solid #e5e5e5;padding-bottom:4px}
        .info-row{display:flex;justify-content:space-between;padding:2px 0;font-size:11px}
        .info-row .label{color:#666}
        .info-row .value{font-weight:600}
        .detail-table th{background:#f5f5f5;border:1px solid #d4d4d4;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#525252}
        .detail-table td{border:1px solid #d4d4d4;padding:8px;font-size:11px}
        .detail-table .text-right{text-align:right}
        .detail-table .text-center{text-align:center}
        .detail-table .total-row{font-weight:bold;background:#fafafa}
        .status-badge{display:inline-block;padding:8px 24px;border-radius:6px;font-weight:bold;font-size:14px;text-align:center;margin:16px auto;letter-spacing:1px}
        .status-unpaid{background:#fef3c7;color:#92400e;border:2px solid #f59e0b}
        .status-partial{background:#dbeafe;color:#1e40af;border:2px solid #3b82f6}
        .status-paid{background:#dcfce7;color:#166534;border:2px solid #22c55e}
        .summary-box{border:1px solid #d4d4d4;border-radius:6px;padding:12px;margin-top:16px}
        .summary-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px}
        .summary-row.total{font-weight:bold;font-size:14px;border-top:2px solid #1a1a1a;padding-top:8px;margin-top:4px}
        .footer{text-align:center;font-size:9px;color:#999;border-top:1px solid #e5e5e5;padding-top:12px;margin-top:24px}
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice Tagihan
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white text-black p-6 border rounded-lg text-sm">
          {/* Header */}
          <div className="invoice-header" style={{ textAlign: "center", borderBottom: "3px solid #1a1a1a", paddingBottom: "16px", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "22px", margin: "0", letterSpacing: "3px", fontWeight: "bold" }}>INVOICE</h1>
            <p style={{ fontSize: "10px", color: "#666", margin: "4px 0 0" }}>Apartment Management System</p>
          </div>

          {/* Info Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            {/* Left: Data Penghuni */}
            <div>
              <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "1px", margin: "0 0 8px", borderBottom: "1px solid #e5e5e5", paddingBottom: "4px" }}>
                Data Penghuni
              </h3>
              <div style={{ fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Nama</span>
                  <span style={{ fontWeight: 600 }}>{bill.penghuni?.full_name || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>No. Unit</span>
                  <span style={{ fontWeight: 600 }}>{bill.units?.unit_number || bill.unit_number || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Tipe Unit</span>
                  <span style={{ fontWeight: 600 }}>{unitInfo?.type || "-"}{unitInfo?.area_sqm ? ` (${unitInfo.area_sqm} m²)` : ""}</span>
                </div>
                {bill.penghuni?.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#666" }}>Telepon</span>
                    <span style={{ fontWeight: 600 }}>{bill.penghuni.phone}</span>
                  </div>
                )}
                {agentInfo && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span style={{ color: "#666" }}>Agent</span>
                    <span style={{ fontWeight: 600 }}>{agentInfo.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Info Invoice */}
            <div>
              <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "1px", margin: "0 0 8px", borderBottom: "1px solid #e5e5e5", paddingBottom: "4px" }}>
                Informasi Invoice
              </h3>
              <div style={{ fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Tanggal Invoice</span>
                  <span style={{ fontWeight: 600 }}>{format(new Date(bill.created_at), "dd MMMM yyyy", { locale: localeId })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Jam Dibuat</span>
                  <span style={{ fontWeight: 600 }}>{format(new Date(bill.created_at), "HH:mm", { locale: localeId })} WIB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Periode</span>
                  <span style={{ fontWeight: 600 }}>{bill.quarter_label || "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span style={{ color: "#666" }}>Jatuh Tempo</span>
                  <span style={{ fontWeight: 600, color: "#dc2626" }}>{bill.due_date ? format(new Date(bill.due_date), "dd MMMM yyyy", { locale: localeId }) : "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Breakdown Table */}
          <h3 style={{ fontSize: "11px", textTransform: "uppercase", color: "#666", letterSpacing: "1px", margin: "0 0 8px", borderBottom: "1px solid #e5e5e5", paddingBottom: "4px" }}>
            Rincian Tagihan Per Bulan
          </h3>
          <table className="detail-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={{ border: "1px solid #d4d4d4", padding: "8px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#525252" }}>Bulan</th>
                <th style={{ border: "1px solid #d4d4d4", padding: "8px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#525252" }}>Service Charge</th>
                <th style={{ border: "1px solid #d4d4d4", padding: "8px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#525252" }}>Sinking Fund</th>
                <th style={{ border: "1px solid #d4d4d4", padding: "8px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#525252" }}>Total</th>
                <th style={{ border: "1px solid #d4d4d4", padding: "8px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", color: "#525252" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bill.bill_payments?.map((p) => (
                <tr key={p.id}>
                  <td style={{ border: "1px solid #d4d4d4", padding: "8px", fontWeight: 600 }}>{p.month_label}</td>
                  <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right" }}>{formatCurrency(p.sc_amount)}</td>
                  <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right" }}>{formatCurrency(p.sf_amount)}</td>
                  <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right", fontWeight: 600 }}>{formatCurrency(p.total_amount)}</td>
                  <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "center" }}>
                    {p.is_paid ? (
                      <span style={{ color: "#166534", fontWeight: 600 }}>✓ Lunas</span>
                    ) : (
                      <span style={{ color: "#92400e", fontWeight: 600 }}>Belum Bayar</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!bill.bill_payments || bill.bill_payments.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ border: "1px solid #d4d4d4", padding: "12px", textAlign: "center", color: "#999" }}>
                    Tidak ada rincian bulanan
                  </td>
                </tr>
              )}
              {/* Total Row */}
              <tr style={{ fontWeight: "bold", background: "#fafafa" }}>
                <td style={{ border: "1px solid #d4d4d4", padding: "8px" }}>TOTAL</td>
                <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right" }}>{formatCurrency(bill.sc_total)}</td>
                <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right" }}>{formatCurrency(bill.sf_total)}</td>
                <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "right" }}>{formatCurrency(bill.total_amount)}</td>
                <td style={{ border: "1px solid #d4d4d4", padding: "8px", textAlign: "center" }}>{paidMonths}/3</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div style={{ border: "1px solid #d4d4d4", borderRadius: "6px", padding: "12px", marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
              <span>Total Tagihan</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(bill.total_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px" }}>
              <span>Total Terbayar</span>
              <span style={{ fontWeight: 600, color: "#166534" }}>{formatCurrency(totalPaid)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: "14px", fontWeight: "bold", borderTop: "2px solid #1a1a1a", marginTop: "4px" }}>
              <span>Sisa Tagihan</span>
              <span style={{ color: remaining > 0 ? "#dc2626" : "#166534" }}>{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ textAlign: "center", margin: "16px 0" }}>
            <span style={{
              display: "inline-block", padding: "8px 24px", borderRadius: "6px",
              fontWeight: "bold", fontSize: "14px", letterSpacing: "1px",
              background: bill.payment_status === "paid" ? "#dcfce7" : bill.payment_status === "partial" ? "#dbeafe" : "#fef3c7",
              color: bill.payment_status === "paid" ? "#166534" : bill.payment_status === "partial" ? "#1e40af" : "#92400e",
              border: `2px solid ${bill.payment_status === "paid" ? "#22c55e" : bill.payment_status === "partial" ? "#3b82f6" : "#f59e0b"}`,
            }}>
              {bill.payment_status === "paid" ? "✓ " : ""}{statusConfig[bill.payment_status]?.label || "Belum Bayar"}
            </span>
          </div>

          {bill.notes && (
            <div style={{ fontSize: "11px", color: "#666", marginTop: "12px", padding: "8px", background: "#fafafa", borderRadius: "4px" }}>
              <strong>Catatan:</strong> {bill.notes}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: "9px", color: "#999", borderTop: "1px solid #e5e5e5", paddingTop: "12px", marginTop: "24px" }}>
            <p>Invoice dibuat pada: {format(now, "dd MMMM yyyy", { locale: localeId })} pukul {format(now, "HH:mm", { locale: localeId })} WIB</p>
            <p style={{ marginTop: "2px" }}>Dokumen ini dicetak secara otomatis oleh sistem</p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
