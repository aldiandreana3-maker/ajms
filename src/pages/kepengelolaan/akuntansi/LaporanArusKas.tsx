import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChartOfAccounts, ChartAccount } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, ArrowUpDown, Loader2 } from "lucide-react";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { ExportExcelButton } from "@/components/akuntansi/AccountingExcelTools";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function CashFlowSection({ title, accs, total }: { title: string; accs: ChartAccount[]; total: number }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const paginated = usePagination(accs, perPage, page);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accs.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Tidak ada akun yang di-mapping ke kategori ini.</p>
        ) : (
          <>
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
                {paginated.map((a) => (
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
            <TablePagination
              currentPage={page}
              totalItems={accs.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={setPerPage}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function LaporanArusKas() {
  const navigate = useNavigate();
  const { accounts, isLoading } = useChartOfAccounts();

  const active = accounts.filter((a) => a.is_active);

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

        <div className="flex justify-end">
          <ExportExcelButton
            filename={`laporan-arus-kas-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Arus Kas"
            data={[
              ...operasional.map((a) => ({ kategori: "Operasional", code: a.account_code, name: a.account_name, mapping: a.map_to_cash_flow, balance: a.current_balance })),
              { kategori: "TOTAL OPERASIONAL", code: "", name: "", mapping: "", balance: totalOperasional },
              ...investasi.map((a) => ({ kategori: "Investasi", code: a.account_code, name: a.account_name, mapping: a.map_to_cash_flow, balance: a.current_balance })),
              { kategori: "TOTAL INVESTASI", code: "", name: "", mapping: "", balance: totalInvestasi },
              ...pendanaan.map((a) => ({ kategori: "Pendanaan", code: a.account_code, name: a.account_name, mapping: a.map_to_cash_flow, balance: a.current_balance })),
              { kategori: "TOTAL PENDANAAN", code: "", name: "", mapping: "", balance: totalPendanaan },
              { kategori: "TOTAL ARUS KAS BERSIH", code: "", name: "", mapping: "", balance: totalArusKas },
            ]}
            columns={[
              { header: "Kategori", key: "kategori", width: 22 },
              { header: "Kode Akun", key: "code", width: 15 },
              { header: "Nama Akun", key: "name", width: 30 },
              { header: "Mapping", key: "mapping", width: 22 },
              { header: "Saldo", key: "balance", width: 18 },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <CashFlowSection title="Arus Kas dari Aktivitas Operasional" accs={operasional} total={totalOperasional} />
            <CashFlowSection title="Arus Kas dari Aktivitas Investasi" accs={investasi} total={totalInvestasi} />
            <CashFlowSection title="Arus Kas dari Aktivitas Pendanaan" accs={pendanaan} total={totalPendanaan} />
            {unmapped.length > 0 && <CashFlowSection title="Lainnya (Mapping Tidak Terkategori)" accs={unmapped} total={totalUnmapped} />}

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
