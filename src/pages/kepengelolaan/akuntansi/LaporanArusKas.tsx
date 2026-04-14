import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, ArrowUpDown, Loader2 } from "lucide-react";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function LaporanArusKas() {
  const navigate = useNavigate();
  const { accounts, isLoading } = useChartOfAccounts();

  const active = accounts.filter((a) => a.is_active);

  // Group accounts by map_to_cash_flow
  const operasional = active.filter((a) => a.map_to_cash_flow?.toLowerCase().includes("operasi") || a.map_to_cash_flow?.toLowerCase().includes("operational"));
  const investasi = active.filter((a) => a.map_to_cash_flow?.toLowerCase().includes("investasi") || a.map_to_cash_flow?.toLowerCase().includes("invest"));
  const pendanaan = active.filter((a) => a.map_to_cash_flow?.toLowerCase().includes("pendanaan") || a.map_to_cash_flow?.toLowerCase().includes("financ"));
  const unmapped = active.filter((a) => a.map_to_cash_flow && a.map_to_cash_flow.trim() !== "" && !operasional.includes(a) && !investasi.includes(a) && !pendanaan.includes(a));

  const calcTotal = (accs: typeof accounts) => accs.reduce((s, a) => s + a.current_balance, 0);

  const totalOperasional = calcTotal(operasional);
  const totalInvestasi = calcTotal(investasi);
  const totalPendanaan = calcTotal(pendanaan);
  const totalUnmapped = calcTotal(unmapped);
  const totalArusKas = totalOperasional + totalInvestasi + totalPendanaan + totalUnmapped;

  const renderSection = (title: string, accs: typeof accounts, total: number) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {accs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Tidak ada akun yang di-mapping ke kategori ini.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Akun</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Mapping</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accs.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                  <TableCell>{a.account_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.map_to_cash_flow}</TableCell>
                  <TableCell className="text-right font-medium">{formatRp(a.current_balance)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">{formatRp(total)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <ArrowUpDown className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Laporan Arus Kas</h1>
              <p className="text-muted-foreground">Cash Flow Statement</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {renderSection("Arus Kas dari Aktivitas Operasional", operasional, totalOperasional)}
            {renderSection("Arus Kas dari Aktivitas Investasi", investasi, totalInvestasi)}
            {renderSection("Arus Kas dari Aktivitas Pendanaan", pendanaan, totalPendanaan)}
            {unmapped.length > 0 && renderSection("Lainnya (Mapping Tidak Terkategori)", unmapped, totalUnmapped)}

            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">Total Arus Kas Bersih</span>
                  <span className={`text-2xl font-bold ${totalArusKas >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatRp(totalArusKas)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  📌 Laporan ini mengambil data berdasarkan kolom <strong>Map to Cash Flow</strong> pada Daftar Akun (COA). Pastikan setiap akun sudah di-mapping dengan benar untuk hasil yang akurat.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
