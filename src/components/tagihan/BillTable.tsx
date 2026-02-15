import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Trash2, Settings, Loader2, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { BillReceiptDialog } from "./BillReceiptDialog";

const billTypeLabels: Record<string, string> = {
  ipl: "IPL",
  kebersihan: "Kebersihan",
  keamanan: "Keamanan",
  sinking_fund: "Sinking Fund",
  listrik: "Listrik",
  air: "Air",
  denda: "Denda",
  perbaikan: "Perbaikan",
};

const statusColors: Record<string, string> = {
  unpaid: "bg-warning/20 text-warning border-warning/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

interface Bill {
  id: string;
  units?: { unit_number: string } | null;
  unit_number?: string | null;
  penghuni?: { full_name: string } | null;
  bill_type: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: "unpaid" | "paid" | "overdue";
  paid_amount: number | null;
  paid_at?: string | null;
  created_at?: string | null;
  is_auto_generated: boolean;
  notes: string | null;
}

export function BillTable({
  bills,
  onPay,
  onRevert,
  onDelete,
  onEdit,
  isDeleting,
  isEditing,
}: {
  bills: Bill[];
  onPay?: (id: string, amount: number) => void;
  onRevert?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, data: { unit_number?: string; bill_type?: "ipl" | "kebersihan" | "keamanan" | "sinking_fund" | "listrik" | "air" | "denda" | "perbaikan"; amount?: number; billing_period?: string; due_date?: string; notes?: string | null }) => void;
  isDeleting?: boolean;
  isEditing?: boolean;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [receiptBill, setReceiptBill] = useState<Bill | null>(null);
  const [editForm, setEditForm] = useState({
    unit_number: "",
    bill_type: "",
    amount: "",
    billing_period: "",
    due_date: "",
    notes: "",
  });

  // Pagination & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter bills by search
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    const q = searchQuery.toLowerCase();
    return bills.filter((b) => {
      const unit = (b.units?.unit_number || b.unit_number || "").toLowerCase();
      const penghuni = (b.penghuni?.full_name || "").toLowerCase();
      const type = (billTypeLabels[b.bill_type] || b.bill_type).toLowerCase();
      const notes = (b.notes || "").toLowerCase();
      const period = b.billing_period || "";
      return unit.includes(q) || penghuni.includes(q) || type.includes(q) || notes.includes(q) || period.includes(q);
    });
  }, [bills, searchQuery]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredBills.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBills = filteredBills.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset page when search or pageSize changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };
  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  const handleEditOpen = (bill: Bill) => {
    setEditBill(bill);
    setEditForm({
      unit_number: bill.units?.unit_number || bill.unit_number || "",
      bill_type: bill.bill_type,
      amount: bill.amount.toString(),
      billing_period: bill.billing_period,
      due_date: bill.due_date,
      notes: bill.notes || "",
    });
  };

  const handleEditSubmit = () => {
    if (editBill && onEdit) {
      onEdit(editBill.id, {
        unit_number: editForm.unit_number,
        bill_type: editForm.bill_type as "ipl" | "kebersihan" | "keamanan" | "sinking_fund" | "listrik" | "air" | "denda" | "perbaikan",
        amount: parseFloat(editForm.amount),
        billing_period: editForm.billing_period,
        due_date: editForm.due_date,
        notes: editForm.notes || null,
      });
      setEditBill(null);
    }
  };

  const hasActions = onPay || onRevert || onDelete || onEdit;

  return (
    <>
      {/* Search & Page Size Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari unit, penghuni, jenis..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">Tampilkan</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
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
              <TableHead>Unit</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Jatuh Tempo</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Kwitansi</TableHead>
              {hasActions && <TableHead>Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBills.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.units?.unit_number || b.unit_number || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {billTypeLabels[b.bill_type] || b.bill_type}
                    {b.is_auto_generated && (
                      <Badge variant="outline" className="text-xs">Auto</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {b.notes || "-"}
                </TableCell>
                <TableCell>{format(new Date(b.billing_period), "MMM yyyy")}</TableCell>
                <TableCell>{format(new Date(b.due_date), "dd/MM/yyyy")}</TableCell>
                <TableCell className="font-medium">{formatCurrency(b.amount)}</TableCell>
                <TableCell>
                  <Badge className={statusColors[b.payment_status]}>
                    {b.payment_status === "unpaid" ? "Belum Bayar" : b.payment_status === "paid" ? "Lunas" : "Terlambat"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setReceiptBill(b)}
                    title="Lihat Kwitansi"
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                </TableCell>
                {hasActions && (
                  <TableCell>
                    <div className="flex gap-1">
                      {onPay && b.payment_status === "unpaid" && (
                        <Button variant="outline" size="sm" onClick={() => onPay(b.id, b.amount)}>
                          Bayar
                        </Button>
                      )}
                      {onRevert && b.payment_status === "paid" && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => onRevert(b.id)}>
                          Batalkan
                        </Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOpen(b)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(b.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paginatedBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={hasActions ? 9 : 8} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "Tidak ditemukan tagihan yang cocok" : "Tidak ada tagihan"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredBills.length > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Halaman {safePage} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (safePage <= 3) {
                page = i + 1;
              } else if (safePage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = safePage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={page === safePage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      <BillReceiptDialog
        bill={receiptBill ? {
          id: receiptBill.id,
          unit_number: receiptBill.units?.unit_number || receiptBill.unit_number || "-",
          penghuni_name: receiptBill.penghuni?.full_name || "-",
          bill_type: receiptBill.bill_type,
          amount: receiptBill.amount,
          billing_period: receiptBill.billing_period,
          due_date: receiptBill.due_date,
          payment_status: receiptBill.payment_status,
          paid_amount: receiptBill.paid_amount,
          paid_at: receiptBill.paid_at || null,
          is_auto_generated: receiptBill.is_auto_generated,
          notes: receiptBill.notes,
          created_at: receiptBill.created_at || null,
        } : null}
        open={!!receiptBill}
        onOpenChange={(open) => !open && setReceiptBill(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tagihan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus tagihan ini? Tindakan ini tidak dapat dibatalkan.
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

      {/* Edit Dialog */}
      <Dialog open={!!editBill} onOpenChange={(open) => !open && setEditBill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Tagihan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={editForm.unit_number} onChange={(e) => setEditForm({ ...editForm, unit_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Jenis Tagihan</Label>
              <Select value={editForm.bill_type} onValueChange={(v) => setEditForm({ ...editForm, bill_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ipl">IPL</SelectItem>
                  <SelectItem value="kebersihan">Kebersihan</SelectItem>
                  <SelectItem value="keamanan">Keamanan</SelectItem>
                  <SelectItem value="sinking_fund">Sinking Fund</SelectItem>
                  <SelectItem value="listrik">Listrik</SelectItem>
                  <SelectItem value="air">Air</SelectItem>
                  <SelectItem value="denda">Denda</SelectItem>
                  <SelectItem value="perbaikan">Perbaikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periode</Label>
                <Input type="date" value={editForm.billing_period} onChange={(e) => setEditForm({ ...editForm, billing_period: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Jatuh Tempo</Label>
                <Input type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleEditSubmit} className="w-full" disabled={isEditing}>
              {isEditing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
