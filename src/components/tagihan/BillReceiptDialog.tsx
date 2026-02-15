import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Printer, Download } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const billTypeLabels: Record<string, string> = {
  ipl: "Service Charge (IPL)",
  kebersihan: "Kebersihan",
  keamanan: "Keamanan",
  sinking_fund: "Sinking Fund",
  listrik: "Listrik",
  air: "Air",
  denda: "Denda",
  perbaikan: "Perbaikan",
};

interface BillReceiptData {
  id: string;
  unit_number: string;
  penghuni_name: string;
  bill_type: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: string;
  paid_amount: number | null;
  paid_at: string | null;
  is_auto_generated: boolean;
  notes: string | null;
  created_at: string | null;
}

function formatDateFull(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}

function formatDateTimeFull(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), "dd MMMM yyyy, HH:mm", { locale: localeId });
  } catch {
    return dateStr;
  }
}

function formatPeriod(dateStr: string) {
  try {
    return format(new Date(dateStr), "MMMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
}

export function BillReceiptDialog({
  bill,
  open,
  onOpenChange,
}: {
  bill: BillReceiptData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!bill) return null;

  const isPaid = bill.payment_status === "paid";

  const printStyles = `
    @page { margin: 15mm; size: A4; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; margin: 0; padding: 0; }
    .receipt-container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .receipt-header { text-align: center; border-bottom: 3px double #333; padding-bottom: 12px; margin-bottom: 16px; }
    .receipt-header h1 { font-size: 18px; margin: 0 0 4px; letter-spacing: 2px; }
    .receipt-header p { font-size: 10px; margin: 2px 0; color: #555; }
    .receipt-no { text-align: right; font-size: 10px; color: #666; margin-bottom: 12px; }
    .info-grid { display: grid; grid-template-columns: 130px 10px 1fr; gap: 4px 0; margin-bottom: 16px; font-size: 11px; }
    .info-label { font-weight: bold; }
    .info-sep { text-align: center; }
    .divider { border-top: 1px dashed #999; margin: 12px 0; }
    .amount-section { margin: 16px 0; }
    .amount-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
    .amount-row.total { font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 8px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .status-paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-unpaid { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .payment-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; margin: 12px 0; }
    .payment-info h3 { margin: 0 0 8px; font-size: 12px; font-weight: bold; color: #166534; }
    .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
    .footer p { margin: 2px 0; }
  `;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kwitansi - ${bill.unit_number} - ${formatPeriod(bill.billing_period)}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleDownload = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kwitansi - ${bill.unit_number} - ${formatPeriod(bill.billing_period)}</title>
        <style>${printStyles}</style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kwitansi_${bill.unit_number}_${bill.billing_period}_${bill.bill_type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const receiptNo = `INV/${bill.billing_period.replace(/-/g, "")}/${bill.unit_number}/${bill.bill_type.toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kwitansi Tagihan</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div ref={printRef} className="bg-white text-black p-6 border rounded-lg text-xs">
          <div className="receipt-container" style={{ maxWidth: "100%", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "3px double #333", paddingBottom: "12px", marginBottom: "16px" }}>
              <h1 style={{ fontSize: "18px", margin: "0 0 4px", letterSpacing: "2px", fontWeight: "bold" }}>KWITANSI TAGIHAN</h1>
              <p style={{ fontSize: "10px", margin: "2px 0", color: "#555" }}>Apartment Management System</p>
            </div>

            {/* Receipt Number */}
            <div style={{ textAlign: "right", fontSize: "10px", color: "#666", marginBottom: "12px" }}>
              No: {receiptNo}
            </div>

            {/* Info Section */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: "bold", width: "130px", padding: "3px 0" }}>Nama Penghuni</td>
                  <td style={{ width: "10px", padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{bill.penghuni_name || "-"}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>No. Unit</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{bill.unit_number}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>Jenis Tagihan</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{billTypeLabels[bill.bill_type] || bill.bill_type}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>Periode</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{formatPeriod(bill.billing_period)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>Tanggal Terbit</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{formatDateFull(bill.created_at)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>Jatuh Tempo</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{formatDateFull(bill.due_date)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold", padding: "3px 0" }}>Tipe Generate</td>
                  <td style={{ padding: "3px 0" }}>:</td>
                  <td style={{ padding: "3px 0" }}>{bill.is_auto_generated ? "Otomatis" : "Manual"}</td>
                </tr>
                {bill.notes && (
                  <tr>
                    <td style={{ fontWeight: "bold", padding: "3px 0" }}>Catatan</td>
                    <td style={{ padding: "3px 0" }}>:</td>
                    <td style={{ padding: "3px 0" }}>{bill.notes}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Divider */}
            <div style={{ borderTop: "1px dashed #999", margin: "12px 0" }} />

            {/* Amount Section */}
            <div style={{ margin: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11px" }}>
                <span>Jumlah Tagihan</span>
                <span>{formatCurrency(bill.amount)}</span>
              </div>
              {isPaid && bill.paid_amount != null && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11px" }}>
                  <span>Jumlah Dibayar</span>
                  <span>{formatCurrency(bill.paid_amount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: "14px", fontWeight: "bold", borderTop: "2px solid #333", marginTop: "8px" }}>
                <span>Sisa Tagihan</span>
                <span>{formatCurrency(isPaid ? 0 : bill.amount)}</span>
              </div>
            </div>

            {/* Status */}
            <div style={{ textAlign: "center", margin: "16px 0" }}>
              <span style={{
                display: "inline-block",
                padding: "6px 20px",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "13px",
                background: isPaid ? "#dcfce7" : "#fef9c3",
                color: isPaid ? "#166534" : "#854d0e",
                border: isPaid ? "1px solid #86efac" : "1px solid #fde047",
              }}>
                {isPaid ? "✓ LUNAS" : "BELUM BAYAR"}
              </span>
            </div>

            {/* Payment Details */}
            {isPaid && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "12px", margin: "12px 0" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: "bold", color: "#166534" }}>Detail Pembayaran</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: "bold", width: "140px", padding: "3px 0" }}>Tanggal Pembayaran</td>
                      <td style={{ width: "10px", padding: "3px 0" }}>:</td>
                      <td style={{ padding: "3px 0" }}>{formatDateTimeFull(bill.paid_at)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "3px 0" }}>Jumlah Dibayar</td>
                      <td style={{ padding: "3px 0" }}>:</td>
                      <td style={{ padding: "3px 0" }}>{bill.paid_amount != null ? formatCurrency(bill.paid_amount) : "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "3px 0" }}>Bulan Pembayaran</td>
                      <td style={{ padding: "3px 0" }}>:</td>
                      <td style={{ padding: "3px 0" }}>{bill.paid_at ? format(new Date(bill.paid_at), "MMMM yyyy", { locale: localeId }) : "-"}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: "bold", padding: "3px 0" }}>Tahun Pembayaran</td>
                      <td style={{ padding: "3px 0" }}>:</td>
                      <td style={{ padding: "3px 0" }}>{bill.paid_at ? format(new Date(bill.paid_at), "yyyy") : "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "9px", color: "#999", borderTop: "1px solid #ddd", paddingTop: "8px" }}>
              <p style={{ margin: "2px 0" }}>Dokumen ini digenerate secara otomatis oleh sistem.</p>
              <p style={{ margin: "2px 0" }}>Dicetak pada: {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
