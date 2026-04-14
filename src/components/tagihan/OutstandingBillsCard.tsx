import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBills, type QuarterlyBill } from "@/hooks/useBills";
import { ManualBillDialog } from "./ManualBillDialog";
import { AlertTriangle, ChevronDown, ChevronRight, ChevronLeft, Search, FilePlus } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

interface UnitOutstanding {
  unitNumber: string;
  unitId: string | null;
  penghuniName: string;
  bills: QuarterlyBill[];
  totalOutstanding: number;
  unpaidMonths: number;
}

export function OutstandingBillsCard() {
  const { data: allBills } = useBills();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const outstandingByUnit = useMemo(() => {
    if (!allBills) return [];

    const unpaidBills = allBills.filter((b) => b.payment_status === "unpaid" || b.payment_status === "partial");

    const unitMap = new Map<string, UnitOutstanding>();

    for (const bill of unpaidBills) {
      const unitKey = bill.unit_id || bill.unit_number || "unknown";
      const existing = unitMap.get(unitKey);
      const paidMonths = bill.bill_payments?.filter((p) => p.is_paid).length || 0;
      const totalMonths = bill.bill_payments?.length || 3;
      const unpaidMonths = totalMonths - paidMonths;
      const paidAmount = bill.paid_amount || 0;
      const outstanding = (bill.total_amount || 0) - paidAmount;

      if (existing) {
        existing.bills.push(bill);
        existing.totalOutstanding += outstanding;
        existing.unpaidMonths += unpaidMonths;
      } else {
        unitMap.set(unitKey, {
          unitNumber: bill.units?.unit_number || bill.unit_number || "-",
          unitId: bill.unit_id,
          penghuniName: bill.penghuni?.full_name || "-",
          bills: [bill],
          totalOutstanding: outstanding,
          unpaidMonths,
        });
      }
    }

    return Array.from(unitMap.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [allBills]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return outstandingByUnit;
    const q = searchQuery.toLowerCase();
    return outstandingByUnit.filter(
      (u) => u.unitNumber.toLowerCase().includes(q) || u.penghuniName.toLowerCase().includes(q)
    );
  }, [outstandingByUnit, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const grandTotal = outstandingByUnit.reduce((sum, u) => sum + u.totalOutstanding, 0);

  if (outstandingByUnit.length === 0) return null;

  return (
    <Card className="border-warning/30">
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader className="py-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full hover:text-primary transition-colors">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span>Outstanding Tagihan per Unit</span>
                <Badge variant="outline" className="ml-2 text-warning border-warning/30">
                  {outstandingByUnit.length} unit
                </Badge>
              </div>
              <span className="text-sm font-bold text-destructive">{formatCurrency(grandTotal)}</span>
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari unit atau penghuni..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">Tampilkan</span>
                <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Tagihan Belum Lunas</TableHead>
                    <TableHead>Bulan Tertunggak</TableHead>
                    <TableHead>Total Outstanding</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((u) => (
                    <TableRow key={u.unitId || u.unitNumber}>
                      <TableCell className="font-medium">{u.unitNumber}</TableCell>
                      <TableCell>{u.penghuniName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {u.bills.map((b) => (
                            <Badge key={b.id} variant="outline" className="text-xs w-fit">
                              {b.quarter_label || "-"}
                              {b.payment_status === "partial" && (
                                <span className="ml-1 text-primary">(Sebagian)</span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-warning/20 text-warning border-warning/30">
                          {u.unpaidMonths} bulan
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-destructive">
                        {formatCurrency(u.totalOutstanding)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <ManualBillDialog
                                defaultUnitId={u.unitId || undefined}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <FilePlus className="w-4 h-4" />
                                  </Button>
                                }
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Buat Tagihan Manual</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        {searchQuery ? "Tidak ditemukan" : "Tidak ada tagihan tertunggak"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filtered.length > pageSize && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Halaman {safePage} dari {totalPages}</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
