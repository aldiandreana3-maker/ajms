import { useState, useRef, useMemo, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { QuarterlyBill, BillPayment } from "@/hooks/useBills";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

function parseTower(unitNumber: string): string {
  if (unitNumber.startsWith("T") && unitNumber.length >= 2) return unitNumber[1];
  return "-";
}

interface UnitInfo {
  id: string;
  unit_number: string;
  area_sqm: number | null;
}

interface PenghuniInfo {
  full_name: string;
  phone: string | null;
  address: string | null;
}

export function BillingStatementDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: units } = useQuery({
    queryKey: ["units-for-statement"],
    queryFn: async (): Promise<UnitInfo[]> => {
      const { data, error } = await supabase
        .from("units")
        .select("id, unit_number, area_sqm")
        .order("unit_number", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const selectedUnit = units?.find((u) => u.id === selectedUnitId);

  const filteredUnits = useMemo(() => {
    if (!units) return [];
    if (!unitSearch) return units;
    const q = unitSearch.toLowerCase();
    return units.filter(
      (u) => u.unit_number.toLowerCase().includes(q) || (u.area_sqm && String(u.area_sqm).includes(q))
    );
  }, [units, unitSearch]);

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

  const { data: bills, isLoading: billsLoading } = useQuery({
    queryKey: ["bills-for-statement", selectedUnitId],
    queryFn: async (): Promise<QuarterlyBill[]> => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("unit_id", selectedUnitId)
        .not("quarter_label", "is", null)
        .order("quarter_start", { ascending: true });
      if (error) throw error;

      const billIds = (data || []).map((b: any) => b.id);
      if (billIds.length === 0) return [];

      const { data: payments } = await supabase
        .from("bill_payments")
        .select("*")
        .in("bill_id", billIds)
        .order("month_number", { ascending: true });

      const paymentsByBill = new Map<string, BillPayment[]>();
      (payments || []).forEach((p: any) => {
        if (!paymentsByBill.has(p.bill_id)) paymentsByBill.set(p.bill_id, []);
        paymentsByBill.get(p.bill_id)!.push(p);
      });

      return (data || []).map((b: any) => ({
        ...b,
        bill_payments: paymentsByBill.get(b.id) || [],
      })) as QuarterlyBill[];
    },
    enabled: !!selectedUnitId,
  });

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Billing Statement - ${selectedUnit?.unit_number || ""}</title>
        <style>
          @page { margin: 15mm; size: A4; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #333; padding: 4px 6px; font-size: 10px; }
          th { background: #f0f0f0; font-weight: bold; text-align: center; }
          .amount { text-align: right; }
          .header { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 16px; }
          .info td { border: none; padding: 2px 4px; }
          .total td { font-weight: bold; border-top: 2px solid #333; }
        </style>
      </head><body>${printContent.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
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
          <div className="space-y-2">
            <Label>Pilih Unit</Label>
            <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between font-normal">
                  {selectedUnit ? `${selectedUnit.unit_number} ${selectedUnit.area_sqm ? `(${selectedUnit.area_sqm} m²)` : ""}` : "Ketik atau pilih unit..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Cari unit... (cth: TA01, B12)" value={unitSearch} onValueChange={setUnitSearch} />
                  <CommandList>
                    <CommandEmpty>Unit tidak ditemukan</CommandEmpty>
                    <CommandGroup>
                      {filteredUnits.slice(0, 100).map((u) => (
                        <CommandItem
                          key={u.id}
                          value={u.id}
                          onSelect={() => {
                            setSelectedUnitId(u.id);
                            setUnitPopoverOpen(false);
                            setUnitSearch("");
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedUnitId === u.id ? "opacity-100" : "opacity-0")} />
                          {u.unit_number} {u.area_sqm ? `(${u.area_sqm} m²)` : ""}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {billsLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {selectedUnitId && !billsLoading && (
            <>
              <div ref={printRef} className="bg-white text-black p-6 border rounded-lg text-xs">
                <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "16px" }}>
                  BILLING STATEMENT
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <table className="info" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Tenant name</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px" }}>{penghuniData?.full_name || "-"}</td></tr>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Address</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px", maxWidth: "250px" }}>{penghuniData?.address || "-"}</td></tr>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Phone</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px" }}>{penghuniData?.phone || "-"}</td></tr>
                    </tbody>
                  </table>
                  <table className="info" style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Lot No.</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px" }}>{selectedUnit?.unit_number || "-"}</td></tr>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Area</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px" }}>{selectedUnit?.area_sqm || "-"} M2</td></tr>
                      <tr><td style={{ fontWeight: "bold", border: "none", padding: "2px 4px" }}>Tower</td><td style={{ border: "none", padding: "2px" }}>:</td><td style={{ border: "none", padding: "2px 4px" }}>T{selectedUnit ? parseTower(selectedUnit.unit_number) : "-"}</td></tr>
                    </tbody>
                  </table>
                </div>

                {bills && bills.length > 0 ? (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>Periode</th>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>Bulan</th>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>SC</th>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>SF</th>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>Total</th>
                        <th style={{ border: "1px solid #333", padding: "4px", background: "#f0f0f0" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <Fragment key={bill.id}>
                          {bill.bill_payments?.map((p, idx) => (
                            <tr key={p.id}>
                              {idx === 0 && (
                                <td rowSpan={3} style={{ border: "1px solid #333", padding: "4px", fontWeight: "bold", verticalAlign: "top" }}>
                                  {bill.quarter_label}
                                </td>
                              )}
                              <td style={{ border: "1px solid #333", padding: "4px" }}>{p.month_label}</td>
                              <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.sc_amount)}</td>
                              <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.sf_amount)}</td>
                              <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(p.total_amount)}</td>
                              <td style={{ border: "1px solid #333", padding: "4px", textAlign: "center" }}>
                                {p.is_paid ? "✓ Lunas" : "Belum"}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ fontWeight: "bold", borderTop: "2px solid #333" }}>
                            <td colSpan={2} style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>Subtotal {bill.quarter_label}</td>
                            <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.sc_total)}</td>
                            <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.sf_total)}</td>
                            <td style={{ border: "1px solid #333", padding: "4px", textAlign: "right" }}>{formatCurrency(bill.total_amount)}</td>
                            <td style={{ border: "1px solid #333", padding: "4px", textAlign: "center" }}>
                              {bill.payment_status === "paid" ? "✓ Lunas" : bill.payment_status === "partial" ? "Sebagian" : "Belum"}
                            </td>
                          </tr>
                        </Fragment>
                      ))}
                      <tr style={{ fontWeight: "bold", borderTop: "3px double #333" }}>
                        <td colSpan={2} style={{ border: "1px solid #333", padding: "6px", textAlign: "right", fontSize: "11px" }}>GRAND TOTAL</td>
                        <td style={{ border: "1px solid #333", padding: "6px", textAlign: "right", fontSize: "11px" }}>
                          {formatCurrency(bills.reduce((s, b) => s + b.sc_total, 0))}
                        </td>
                        <td style={{ border: "1px solid #333", padding: "6px", textAlign: "right", fontSize: "11px" }}>
                          {formatCurrency(bills.reduce((s, b) => s + b.sf_total, 0))}
                        </td>
                        <td style={{ border: "1px solid #333", padding: "6px", textAlign: "right", fontSize: "11px" }}>
                          {formatCurrency(bills.reduce((s, b) => s + b.total_amount, 0))}
                        </td>
                        <td style={{ border: "1px solid #333", padding: "6px" }}></td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p style={{ textAlign: "center", padding: "20px", color: "#999" }}>Belum ada tagihan untuk unit ini</p>
                )}

                <div style={{ marginTop: "20px", textAlign: "right", fontSize: "9px", color: "#999" }}>
                  Dicetak pada: {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePrint} disabled={!bills || bills.length === 0}>
                  <Printer className="w-4 h-4 mr-2" />
                  Cetak
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
