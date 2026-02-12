import { useState } from "react";
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
import { Trash2, Settings, Loader2 } from "lucide-react";

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
  bill_type: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: "unpaid" | "paid" | "overdue";
  paid_amount: number | null;
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
  const [editForm, setEditForm] = useState({
    unit_number: "",
    bill_type: "",
    amount: "",
    billing_period: "",
    due_date: "",
    notes: "",
  });

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
            {hasActions && <TableHead>Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((b) => (
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
          {bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={hasActions ? 8 : 7} className="text-center text-muted-foreground py-8">
                Tidak ada tagihan
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
