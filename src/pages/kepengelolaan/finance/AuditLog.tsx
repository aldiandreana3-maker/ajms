import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinanceAudit, FinanceAuditRow } from "@/hooks/useFinanceAudit";
import { ArrowLeft, History, Eye } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const ACTION_COLORS: Record<string, string> = {
  insert: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
};

export default function AuditLog() {
  const navigate = useNavigate();
  const [table, setTable] = useState("all");
  const [days, setDays] = useState<number>(30);
  const { data: rows = [], isLoading } = useFinanceAudit({ table, days });
  const [selected, setSelected] = useState<FinanceAuditRow | null>(null);

  const diffKeys = (a: any, b: any) => {
    const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
    const out: { k: string; old: any; new: any }[] = [];
    keys.forEach((k) => {
      const ov = a?.[k]; const nv = b?.[k];
      if (JSON.stringify(ov) !== JSON.stringify(nv)) out.push({ k, old: ov, new: nv });
    });
    return out;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <History className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Audit Log Finance</h1>
            <p className="text-muted-foreground">Riwayat perubahan seluruh data keuangan</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={table} onValueChange={setTable}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tabel</SelectItem>
              <SelectItem value="bills">Tagihan</SelectItem>
              <SelectItem value="bill_payments">Pembayaran</SelectItem>
              <SelectItem value="cashier_transactions">Kasir</SelectItem>
              <SelectItem value="expenses">Pengeluaran</SelectItem>
              <SelectItem value="journal_entries">Jurnal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 hari</SelectItem>
              <SelectItem value="30">30 hari</SelectItem>
              <SelectItem value="90">90 hari</SelectItem>
              <SelectItem value="365">1 tahun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Tabel</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Oleh</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6">Memuat...</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Belum ada aktivitas</TableCell></TableRow>
                ) : rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.created_at), "dd MMM yy HH:mm:ss", { locale: idLocale })}</TableCell>
                    <TableCell className="text-xs font-mono">{r.table_name}</TableCell>
                    <TableCell><Badge variant="outline" className={ACTION_COLORS[r.action] || ""}>{r.action}</Badge></TableCell>
                    <TableCell className="text-xs">{r.changed_by_name || "-"}</TableCell>
                    <TableCell className="text-xs">{r.changed_by_role || "-"}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{r.reason || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelected(r)}><Eye className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>Detail Perubahan — {selected.table_name} / {selected.action}</DialogTitle></DialogHeader>
              <div className="text-xs space-y-3">
                <div>Oleh: <b>{selected.changed_by_name}</b> ({selected.changed_by_role}) — {format(new Date(selected.created_at), "dd MMM yyyy HH:mm:ss", { locale: idLocale })}</div>
                {selected.action === "update" ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Sebelum</TableHead><TableHead>Sesudah</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {diffKeys(selected.old_data, selected.new_data).map((d) => (
                        <TableRow key={d.k}>
                          <TableCell className="font-mono">{d.k}</TableCell>
                          <TableCell className="text-red-600 font-mono">{JSON.stringify(d.old)}</TableCell>
                          <TableCell className="text-green-600 font-mono">{JSON.stringify(d.new)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <pre className="p-3 bg-muted rounded overflow-x-auto">{JSON.stringify(selected.new_data || selected.old_data, null, 2)}</pre>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
