import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Scale, Loader2 } from "lucide-react";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function NeracaSaldo() {
  const navigate = useNavigate();
  const { accounts, isLoading } = useChartOfAccounts();

  const activeAccounts = accounts.filter((a) => a.is_active);

  let totalDebit = 0;
  let totalCredit = 0;
  activeAccounts.forEach((a) => {
    if (a.normal_balance === "debit") totalDebit += a.current_balance;
    else totalCredit += a.current_balance;
  });

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Neraca Saldo</h1>
              <p className="text-muted-foreground">Trial Balance — cek keseimbangan debit & kredit</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <div className="flex items-center gap-3">
            <Badge variant={isBalanced ? "default" : "destructive"} className="text-sm">
              {isBalanced ? "✓ Seimbang" : "✗ Tidak Seimbang"}
            </Badge>
            <span className="text-sm">Total Debit: <strong>{formatRp(totalDebit)}</strong></span>
            <span className="text-sm">Total Kredit: <strong>{formatRp(totalCredit)}</strong></span>
            {!isBalanced && <span className="text-sm text-destructive">Selisih: {formatRp(Math.abs(totalDebit - totalCredit))}</span>}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAccounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono">{a.account_code}</TableCell>
                    <TableCell className="font-medium">{a.account_name}</TableCell>
                    <TableCell className="capitalize">{a.account_type}</TableCell>
                    <TableCell className="text-right font-mono">{a.normal_balance === "debit" ? formatRp(a.current_balance) : "-"}</TableCell>
                    <TableCell className="text-right font-mono">{a.normal_balance === "kredit" ? formatRp(a.current_balance) : "-"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3}>TOTAL</TableCell>
                  <TableCell className="text-right font-mono">{formatRp(totalDebit)}</TableCell>
                  <TableCell className="text-right font-mono">{formatRp(totalCredit)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
