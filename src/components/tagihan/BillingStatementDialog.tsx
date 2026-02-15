import { useState, useRef, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBillRates } from "@/hooks/useBillRates";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
};

const formatPeriod = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "MMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
};

// Extract tower from unit_number like TA0202 -> A
function parseTower(unitNumber: string): string {
  if (unitNumber.startsWith("T") && unitNumber.length >= 2) {
    return unitNumber[1];
  }
  return "-";
}

// Map bill_type to display category for the statement
const billTypeDisplayMap: Record<string, string> = {
  ipl: "Service Charge",
  sinking_fund: "Sinking Fund",
  air: "Air",
  listrik: "Listrik",
  kebersihan: "Kebersihan",
  keamanan: "Keamanan",
  denda: "Denda",
  perbaikan: "Perbaikan",
};

// Order for display
const typeOrder = ["ipl", "sinking_fund", "air", "listrik", "kebersihan", "keamanan", "denda", "perbaikan"];

interface BillRow {
  id: string;
  bill_type: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: string;
  paid_amount: number | null;
  paid_at: string | null;
  created_at: string | null;
}

interface UnitInfo {
  id: string;
  unit_number: string;
  area_sqm: number | null;
  building: string | null;
}

interface PenghuniInfo {
  full_name: string;
  phone: string | null;
  address: string | null;
}

export function BillingStatementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch all units
  const { data: units, isLoading: unitsLoading } = useQuery({
    queryKey: ["units-for-statement"],
    queryFn: async (): Promise<UnitInfo[]> => {
      const { data, error } = await supabase
        .from("units")
        .select("id, unit_number, area_sqm, building")
        .order("unit_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const selectedUnit = units?.find((u) => u.id === selectedUnitId);

  // Fetch penghuni for selected unit
  const { data: penghuniData } = useQuery({
    queryKey: ["penghuni-for-statement", selectedUnitId],
    queryFn: async (): Promise<PenghuniInfo | null> => {
      const { data, error } = await supabase
        .from("penghuni")
        .select("full_name, phone, address")
        .eq("unit_id", selectedUnitId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnitId,
  });

  // Fetch bills for selected unit
  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ["bills-for-statement", selectedUnitId],
    queryFn: async (): Promise<BillRow[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select("id, bill_type, amount, billing_period, due_date, payment_status, paid_amount, paid_at, created_at")
        .eq("unit_id", selectedUnitId)
        .order("billing_period", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnitId,
  });

  const { data: billRates } = useBillRates();

  // Group bills by type and compute SC/SF split for IPL
  const groupedBills = useMemo(() => {
    if (!bills || bills.length === 0) return [];

    // Find the rate for this unit's area
    const unitArea = selectedUnit?.area_sqm;
    const matchedRate = unitArea && billRates
      ? billRates.find((r) => Math.abs(r.area_sqm - unitArea) < 0.5)
      : null;

    // Build groups
    const groups: {
      type: string;
      label: string;
      rows: {
        period: string;
        invDate: string;
        invoiceAmount: number;
        receiptAmount: number;
        receiptDate: string;
        correctionAmount: number;
        outstanding: number;
      }[];
    }[] = [];

    // Split IPL bills into SC and SF
    const iplBills = bills.filter((b) => b.bill_type === "ipl");
    const otherBills = bills.filter((b) => b.bill_type !== "ipl");

    if (iplBills.length > 0 && matchedRate) {
      // SC:SF ratio from quarterly amount (5:1)
      const scRatio = 5 / 6;
      const sfRatio = 1 / 6;

      const scRows = iplBills.map((b) => {
        const scAmount = Math.round(b.amount * scRatio);
        const scPaid = b.paid_amount ? Math.round(b.paid_amount * scRatio) : 0;
        return {
          period: formatPeriod(b.billing_period),
          invDate: formatDate(b.created_at || b.billing_period),
          invoiceAmount: scAmount,
          receiptAmount: scPaid,
          receiptDate: b.paid_at ? formatDate(b.paid_at) : "",
          correctionAmount: 0,
          outstanding: scAmount - scPaid,
        };
      });

      const sfRows = iplBills.map((b) => {
        const sfAmount = Math.round(b.amount * sfRatio);
        const sfPaid = b.paid_amount ? Math.round(b.paid_amount * sfRatio) : 0;
        return {
          period: formatPeriod(b.billing_period),
          invDate: formatDate(b.created_at || b.billing_period),
          invoiceAmount: sfAmount,
          receiptAmount: sfPaid,
          receiptDate: b.paid_at ? formatDate(b.paid_at) : "",
          correctionAmount: 0,
          outstanding: sfAmount - sfPaid,
        };
      });

      groups.push({ type: "ipl", label: "Service Charge", rows: scRows });
      groups.push({ type: "sinking_fund_split", label: "Sinking Fund", rows: sfRows });
    } else if (iplBills.length > 0) {
      // No rate found, show as-is
      groups.push({
        type: "ipl",
        label: "Service Charge",
        rows: iplBills.map((b) => ({
          period: formatPeriod(b.billing_period),
          invDate: formatDate(b.created_at || b.billing_period),
          invoiceAmount: b.amount,
          receiptAmount: b.paid_amount || 0,
          receiptDate: b.paid_at ? formatDate(b.paid_at) : "",
          correctionAmount: 0,
          outstanding: b.amount - (b.paid_amount || 0),
        })),
      });
    }

    // Add standalone sinking_fund bills (not from IPL split)
    const sfBills = otherBills.filter((b) => b.bill_type === "sinking_fund");
    if (sfBills.length > 0) {
      groups.push({
        type: "sinking_fund",
        label: "Sinking Fund",
        rows: sfBills.map((b) => ({
          period: formatPeriod(b.billing_period),
          invDate: formatDate(b.created_at || b.billing_period),
          invoiceAmount: b.amount,
          receiptAmount: b.paid_amount || 0,
          receiptDate: b.paid_at ? formatDate(b.paid_at) : "",
          correctionAmount: 0,
          outstanding: b.amount - (b.paid_amount || 0),
        })),
      });
    }

    // Other bill types
    const remainingTypes = otherBills
      .filter((b) => b.bill_type !== "sinking_fund")
      .reduce((acc, b) => {
        if (!acc[b.bill_type]) acc[b.bill_type] = [];
        acc[b.bill_type].push(b);
        return acc;
      }, {} as Record<string, BillRow[]>);

    for (const type of typeOrder) {
      if (type === "ipl" || type === "sinking_fund") continue;
      const typeBills = remainingTypes[type];
      if (!typeBills || typeBills.length === 0) continue;

      groups.push({
        type,
        label: billTypeDisplayMap[type] || type,
        rows: typeBills.map((b) => ({
          period: formatPeriod(b.billing_period),
          invDate: formatDate(b.created_at || b.billing_period),
          invoiceAmount: b.amount,
          receiptAmount: b.paid_amount || 0,
          receiptDate: b.paid_at ? formatDate(b.paid_at) : "",
          correctionAmount: 0,
          outstanding: b.amount - (b.paid_amount || 0),
        })),
      });
    }

    // Filter out groups where all invoice amounts are 0
    return groups.filter((g) => g.rows.some((r) => r.invoiceAmount > 0));
  }, [bills, selectedUnit, billRates]);

  // Compute totals
  const grandTotal = useMemo(() => {
    let invoice = 0, receipt = 0, correction = 0, outstanding = 0;
    for (const g of groupedBills) {
      for (const r of g.rows) {
        invoice += r.invoiceAmount;
        receipt += r.receiptAmount;
        correction += r.correctionAmount;
        outstanding += r.outstanding;
      }
    }
    return { invoice, receipt, correction, outstanding };
  }, [groupedBills]);

  // Check if receipt/correction columns have any non-zero values
  const hasReceipts = groupedBills.some((g) => g.rows.some((r) => r.receiptAmount > 0));
  const hasCorrections = groupedBills.some((g) => g.rows.some((r) => r.correctionAmount > 0));

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Billing Statement - ${selectedUnit?.unit_number || ""}</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
          .header { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 16px; }
          .info-table { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
          .info-table td { padding: 2px 4px; vertical-align: top; }
          .info-label { font-weight: bold; width: 100px; }
          .info-sep { width: 10px; }
          .bill-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .bill-table th, .bill-table td { border: 1px solid #333; padding: 4px 6px; text-align: left; font-size: 10px; }
          .bill-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .bill-table .amount { text-align: right; }
          .bill-table .center { text-align: center; }
          .type-header td { font-weight: bold; background: #fff; }
          .subtotal td { font-weight: bold; border-top: 2px solid #333; }
          .grand-total td { font-weight: bold; border-top: 3px double #333; font-size: 11px; }
          .footer { margin-top: 20px; text-align: right; font-size: 10px; }
        </style>
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Billing Statement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cetak Billing Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Unit Selector */}
          <div className="space-y-2">
            <Label>Pilih Unit</Label>
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit..." />
              </SelectTrigger>
              <SelectContent>
                {units?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number} {u.area_sqm ? `(${u.area_sqm} m²)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {billsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {selectedUnitId && !billsLoading && (
            <>
              {/* Preview */}
              <div ref={printRef} className="bg-white text-black p-6 border rounded-lg text-xs">
                {/* Header */}
                <div className="text-center font-bold text-base mb-4">BILLING STATEMENT</div>

                {/* Info Section */}
                <div className="flex justify-between mb-4">
                  <table className="text-xs" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td className="font-bold pr-2 align-top" style={{ width: "90px" }}>Tenant name</td>
                        <td className="pr-1 align-top">:</td>
                        <td>{penghuniData?.full_name || "-"}</td>
                      </tr>
                      <tr>
                        <td className="font-bold pr-2 align-top">Address</td>
                        <td className="pr-1 align-top">:</td>
                        <td style={{ maxWidth: "250px" }}>{penghuniData?.address || "-"}</td>
                      </tr>
                      <tr>
                        <td className="font-bold pr-2 align-top">Phone</td>
                        <td className="pr-1 align-top">:</td>
                        <td>{penghuniData?.phone ? `- / ${penghuniData.phone}` : "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="text-xs" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td className="font-bold pr-2">Lot No.</td>
                        <td className="pr-1">:</td>
                        <td>{selectedUnit?.unit_number || "-"}</td>
                      </tr>
                      <tr>
                        <td className="font-bold pr-2">Area</td>
                        <td className="pr-1">:</td>
                        <td>{selectedUnit?.area_sqm ? `${selectedUnit.area_sqm}` : "-"} M2</td>
                      </tr>
                      <tr>
                        <td className="font-bold pr-2">Tower</td>
                        <td className="pr-1">:</td>
                        <td>T{selectedUnit ? parseTower(selectedUnit.unit_number) : "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Bill Table */}
                {groupedBills.length > 0 ? (
                  <table className="w-full border-collapse text-[10px]" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "90px" }}>Type</th>
                        <th colSpan={2} className="border border-gray-800 p-1 bg-gray-100 text-center font-bold">Invoice</th>
                        {hasReceipts && (
                          <th colSpan={2} className="border border-gray-800 p-1 bg-gray-100 text-center font-bold">Receipts</th>
                        )}
                        {hasCorrections && (
                          <th colSpan={2} className="border border-gray-800 p-1 bg-gray-100 text-center font-bold">Correction</th>
                        )}
                        <th rowSpan={2} className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "80px" }}>O/S</th>
                      </tr>
                      <tr>
                        <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "100px" }}>Periode</th>
                        <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "70px" }}>Rp.</th>
                        {hasReceipts && (
                          <>
                            <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "70px" }}>Rp.</th>
                            <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "70px" }}>Receive Date</th>
                          </>
                        )}
                        {hasCorrections && (
                          <>
                            <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "70px" }}>Rp.</th>
                            <th className="border border-gray-800 p-1 bg-gray-100 text-center font-bold" style={{ width: "70px" }}>Posting Date</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedBills.map((group) => {
                        const subInvoice = group.rows.reduce((s, r) => s + r.invoiceAmount, 0);
                        const subReceipt = group.rows.reduce((s, r) => s + r.receiptAmount, 0);
                        const subCorrection = group.rows.reduce((s, r) => s + r.correctionAmount, 0);
                        const subOutstanding = group.rows.reduce((s, r) => s + r.outstanding, 0);

                        return (
                          <Fragment key={group.type + group.label}>
                            {group.rows.map((row, idx) => (
                              <tr key={`${group.type}-${idx}`}>
                                {idx === 0 && (
                                  <td rowSpan={group.rows.length} className="border border-gray-800 p-1 font-bold align-top">
                                    {group.label}
                                  </td>
                                )}
                                <td className="border border-gray-800 p-1">{row.period}</td>
                                <td className="border border-gray-800 p-1 text-right">{formatCurrency(row.invoiceAmount)}</td>
                                {hasReceipts && (
                                  <>
                                    <td className="border border-gray-800 p-1 text-right">{row.receiptAmount > 0 ? formatCurrency(row.receiptAmount) : "0"}</td>
                                    <td className="border border-gray-800 p-1 text-center">{row.receiptDate || ""}</td>
                                  </>
                                )}
                                {hasCorrections && (
                                  <>
                                    <td className="border border-gray-800 p-1 text-right">{row.correctionAmount > 0 ? formatCurrency(row.correctionAmount) : "0"}</td>
                                    <td className="border border-gray-800 p-1 text-center"></td>
                                  </>
                                )}
                                <td className="border border-gray-800 p-1 text-right">{formatCurrency(row.outstanding)}</td>
                              </tr>
                            ))}
                            {/* Subtotal row */}
                            <tr className="font-bold">
                              <td className="border border-gray-800 p-1" colSpan={1}>
                                Sub Total {group.label}
                              </td>
                              <td className="border border-gray-800 p-1"></td>
                              <td className="border border-gray-800 p-1 text-right">{formatCurrency(subInvoice)}</td>
                              {hasReceipts && (
                                <>
                                  <td className="border border-gray-800 p-1 text-right">{formatCurrency(subReceipt)}</td>
                                  <td className="border border-gray-800 p-1"></td>
                                </>
                              )}
                              {hasCorrections && (
                                <>
                                  <td className="border border-gray-800 p-1 text-right">{formatCurrency(subCorrection)}</td>
                                  <td className="border border-gray-800 p-1"></td>
                                </>
                              )}
                              <td className="border border-gray-800 p-1 text-right">{formatCurrency(subOutstanding)}</td>
                            </tr>
                          </Fragment>
                        );
                      })}

                      {/* Grand Total */}
                      <tr className="font-bold text-[11px]">
                        <td className="border-t-2 border-gray-800 p-1" colSpan={2}>Total</td>
                        <td className="border-t-2 border-gray-800 p-1 text-right">{formatCurrency(grandTotal.invoice)}</td>
                        {hasReceipts && (
                          <>
                            <td className="border-t-2 border-gray-800 p-1 text-right">{formatCurrency(grandTotal.receipt)}</td>
                            <td className="border-t-2 border-gray-800 p-1"></td>
                          </>
                        )}
                        {hasCorrections && (
                          <>
                            <td className="border-t-2 border-gray-800 p-1 text-right">{formatCurrency(grandTotal.correction)}</td>
                            <td className="border-t-2 border-gray-800 p-1"></td>
                          </>
                        )}
                        <td className="border-t-2 border-gray-800 p-1 text-right">{formatCurrency(grandTotal.outstanding)}</td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-8">Tidak ada tagihan untuk unit ini</p>
                )}

                {/* Footer */}
                <div className="text-right text-[9px] mt-6 text-gray-600">
                  <p>Print Date : {format(new Date(), "dd/MM/yyyy")}</p>
                </div>
              </div>

              {/* Print Button */}
              {groupedBills.length > 0 && (
                <Button onClick={handlePrint} className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak Billing Statement
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

