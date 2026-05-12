import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle, FileText, Loader2 } from "lucide-react";
import { useBillsPaginated, type QuarterlyBill } from "@/hooks/useBills";
import { InvoiceDialog } from "./InvoiceDialog";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const statusColors: Record<string, string> = {
  unpaid: "bg-warning/20 text-warning border-warning/30",
  partial: "bg-blue-100 text-blue-700 border-blue-300",
  paid: "bg-success/20 text-success border-success/30",
};
const statusLabels: Record<string, string> = {
  unpaid: "Belum Bayar",
  partial: "Bayar Sebagian",
  paid: "Lunas",
};

export function ServerBillTable({
  status = "all",
  showInvoice = false,
}: {
  status?: "all" | "unpaid" | "partial" | "paid";
  showInvoice?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [invoiceBill, setInvoiceBill] = useState<QuarterlyBill | null>(null);

  const { data, isLoading, isFetching } = useBillsPaginated({
    status,
    page: currentPage,
    pageSize,
    search: searchQuery,
  });

  const bills = data?.bills || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const colSpan = showInvoice ? 11 : 10;

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-80 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari unit, periode, catatan..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="pl-9"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={handleSearch}>Cari</Button>
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
          <span className="text-muted-foreground whitespace-nowrap">dari {total} data</span>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {isFetching && !isLoading && (
          <div className="absolute top-2 right-2 z-10">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Penghuni</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>SC/bln</TableHead>
              <TableHead>SF/bln</TableHead>
              <TableHead>Lain-lain</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Terbayar</TableHead>
              <TableHead>Status</TableHead>
              {showInvoice && <TableHead>Invoice</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Tidak ditemukan tagihan yang cocok" : "Tidak ada tagihan"}
                </TableCell>
              </TableRow>
            ) : (
              bills.map((b) => {
                const isExpanded = expandedBill === b.id;
                const paidMonths = b.bill_payments?.filter((p) => p.is_paid).length || 0;
                return (
                  <>
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setExpandedBill(isExpanded ? null : b.id)}>
                      <TableCell>{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</TableCell>
                      <TableCell className="font-medium">{b.units?.unit_number || b.unit_number || "-"}</TableCell>
                      <TableCell>{b.penghuni?.full_name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{b.quarter_label || "-"}</span>
                          {b.is_auto_generated && <Badge variant="outline" className="text-xs">Auto</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(b.sc_monthly)}</TableCell>
                      <TableCell>{formatCurrency(b.sf_monthly)}</TableCell>
                      <TableCell>{formatCurrency(Math.max(0, (b.total_amount || 0) - (b.sc_total || 0) - (b.sf_total || 0)))}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(b.total_amount)}</TableCell>
                      <TableCell><span className="text-sm">{paidMonths}/3 bulan</span></TableCell>
                      <TableCell>
                        <Badge className={statusColors[b.payment_status]}>{statusLabels[b.payment_status] || b.payment_status}</Badge>
                      </TableCell>
                      {showInvoice && (
                        <TableCell>
                          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={(e) => { e.stopPropagation(); setInvoiceBill(b); }}>
                            <FileText className="w-3.5 h-3.5" />Invoice
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${b.id}-detail`}>
                        <TableCell colSpan={colSpan} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <p className="text-sm font-medium mb-3">Rincian Pembayaran Per Bulan</p>
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
                                {b.bill_payments?.map((p) => (
                                  <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.month_label}</TableCell>
                                    <TableCell>{formatCurrency(p.sc_amount)}</TableCell>
                                    <TableCell>{formatCurrency(p.sf_amount)}</TableCell>
                                    <TableCell className="font-medium">{formatCurrency(p.total_amount)}</TableCell>
                                    <TableCell>
                                      {p.is_paid ? (
                                        <Badge className="bg-success/20 text-success border-success/30">
                                          <CheckCircle className="w-3 h-3 mr-1" />Lunas
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-warning/20 text-warning border-warning/30">Belum Bayar</Badge>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {(!b.bill_payments || b.bill_payments.length === 0) && (
                                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">Tidak ada data pembayaran</TableCell></TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Halaman {safePage} dari {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (safePage <= 3) page = i + 1;
              else if (safePage >= totalPages - 2) page = totalPages - 4 + i;
              else page = safePage - 2 + i;
              return (
                <Button key={page} variant={page === safePage ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <InvoiceDialog bill={invoiceBill} open={!!invoiceBill} onOpenChange={(open) => !open && setInvoiceBill(null)} />
    </>
  );
}
