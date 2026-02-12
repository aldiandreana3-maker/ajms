import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

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
}: {
  bills: Bill[];
  onPay?: (id: string, amount: number) => void;
  onRevert?: (id: string) => void;
}) {
  return (
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
          {(onPay || onRevert) && <TableHead>Aksi</TableHead>}
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
            {(onPay || onRevert) && (
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
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
        {bills.length === 0 && (
          <TableRow>
            <TableCell colSpan={(onPay || onRevert) ? 8 : 7} className="text-center text-muted-foreground py-8">
              Tidak ada tagihan
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
