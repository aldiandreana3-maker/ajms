import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCoaAuditLog } from "@/hooks/useChartOfAccounts";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const actionLabels: Record<string, string> = {
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
  bulk_import: "Import",
};

const actionColors: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  bulk_import: "bg-purple-100 text-purple-800",
};

interface CoaAuditDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CoaAuditDialog({ open, onOpenChange }: CoaAuditDialogProps) {
  const { logs, isLoading } = useCoaAuditLog();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Riwayat Perubahan (Audit Log)</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada riwayat</TableCell></TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={actionColors[log.action] || ""}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.action === "bulk_import"
                      ? `${log.new_data?.count || 0} akun`
                      : (log.new_data?.account_code || log.old_data?.account_code || "-") + " - " + (log.new_data?.account_name || log.old_data?.account_name || "")}
                  </TableCell>
                  <TableCell className="text-sm">{log.changed_by_name || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
