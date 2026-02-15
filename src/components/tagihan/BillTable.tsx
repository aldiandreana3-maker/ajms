import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CheckCircle, XCircle, FileText } from "lucide-react";
import type { QuarterlyBill } from "@/hooks/useBills";
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
  partial: "Sebagian",
  paid: "Lunas",
};

export function BillTable({
  bills,
  onPayMonth,
  onRevertMonth,
  onDelete,
  isDeleting,
  showInvoice = false,
}: {
  bills: QuarterlyBill[];
  onPayMonth?: (paymentId: string, amount: number) => void;
  onRevertMonth?: (paymentId: string) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  showInvoice?: boolean;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  const [invoiceBill, setInvoiceBill] = useState<QuarterlyBill | null>(null);

  // Pagination & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter((b) => {
      const unit = (b.units?.unit_number || b.unit_number || "").toLowerCase();
      const penghuni = (b.penghuni?.full_name || "").toLowerCase();
      const quarter = (b.quarter_label || "").toLowerCase();
      const notes = (b.notes || "").toLowerCase();
      return unit.includes(q) || penghuni.includes(q) || quarter.includes(q) || notes.includes(q);
    });
  }, [bills, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBills = filteredBills.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleExpand = (billId: string) => {
    setExpandedBill((prev) => (prev === billId ? null : billId));
  };

  const hasActions = onDelete || showInvoice;

  return (
    <>
      {/* Search & Page Size */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari unit, penghuni, periode..."
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
          <span className="text-muted-foreground whitespace-nowrap">dari {filteredBills.length} data</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Penghuni</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>SC/bln</TableHead>
              <TableHead>SF/bln</TableHead>
              <TableHead>Total Kuartal</TableHead>
              <TableHead>Terbayar</TableHead>
              <TableHead>Status</TableHead>
              {hasActions && <TableHead>{showInvoice && !onDelete ? "Invoice" : "Aksi"}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBills.map((b) => {
              const isExpanded = expandedBill === b.id;
              const paidMonths = b.bill_payments?.filter((p) => p.is_paid).length || 0;
              const colSpan = hasActions ? 10 : 9;

              return (
                <>{/* Main row */}
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(b.id)}>
                    <TableCell>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </TableCell>
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
                    <TableCell className="font-bold">{formatCurrency(b.total_amount)}</TableCell>
                    <TableCell>
                      <span className="text-sm">{paidMonths}/3 bulan</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[b.payment_status]}>
                        {statusLabels[b.payment_status] || b.payment_status}
                      </Badge>
                    </TableCell>
                    {hasActions && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {showInvoice && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={(e) => { e.stopPropagation(); setInvoiceBill(b); }}
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Invoice
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(b.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Expanded detail rows */}
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
                                {(onPayMonth || onRevertMonth) && <TableHead>Aksi</TableHead>}
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
                                  {(onPayMonth || onRevertMonth) && (
                                    <TableCell>
                                      {!p.is_paid && onPayMonth && (
                                        <Button variant="outline" size="sm" onClick={() => onPayMonth(p.id, p.total_amount)}>
                                          Bayar
                                        </Button>
                                      )}
                                      {p.is_paid && onRevertMonth && (
                                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => onRevertMonth(p.id)}>
                                          <XCircle className="w-3 h-3 mr-1" />Batalkan
                                        </Button>
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              ))}
                              {(!b.bill_payments || b.bill_payments.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={(onPayMonth || onRevertMonth) ? 6 : 5} className="text-center text-muted-foreground py-4">
                                    Tidak ada data pembayaran
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
            {paginatedBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasActions ? 10 : 9} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Tidak ditemukan tagihan yang cocok" : "Tidak ada tagihan"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredBills.length > pageSize && (
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tagihan kuartalan ini beserta semua detail pembayarannya?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId && onDelete) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Dialog */}
      <InvoiceDialog
        bill={invoiceBill}
        open={!!invoiceBill}
        onOpenChange={(open) => !open && setInvoiceBill(null)}
      />
    </>
  );
}
