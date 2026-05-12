import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { ExportExcelButton } from "@/components/akuntansi/AccountingExcelTools";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function LaporanLabaRugi() {
  const navigate = useNavigate();
  const { accounts, isLoading } = useChartOfAccounts();

  const active = accounts.filter((a) => a.is_active);
  const pendapatanAccounts = active.filter((a) => a.account_type === "PENDAPATAN");
  const bebanAccounts = active.filter((a) => a.account_type === "BEBAN");

  const totalPendapatan = pendapatanAccounts.reduce((s, a) => s + a.current_balance, 0);
  const totalBeban = bebanAccounts.reduce((s, a) => s + a.current_balance, 0);
  const labaRugi = totalPendapatan - totalBeban;

  const [pendapatanPage, setPendapatanPage] = useState(1);
  const [pendapatanPerPage, setPendapatanPerPage] = useState(10);
  const [bebanPage, setBebanPage] = useState(1);
  const [bebanPerPage, setBebanPerPage] = useState(10);

  const paginatedPendapatan = usePagination(pendapatanAccounts, pendapatanPerPage, pendapatanPage);
  const paginatedBeban = usePagination(bebanAccounts, bebanPerPage, bebanPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Laporan Laba Rugi</h1>
              <p className="text-muted-foreground">Pendapatan & Biaya</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <ExportExcelButton
            filename={`laporan-laba-rugi-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Laba Rugi"
            data={[
              ...pendapatanAccounts.map((a) => ({ kategori: "Pendapatan", code: a.account_code, name: a.account_name, balance: a.current_balance })),
              { kategori: "TOTAL PENDAPATAN", code: "", name: "", balance: totalPendapatan },
              ...bebanAccounts.map((a) => ({ kategori: "Beban", code: a.account_code, name: a.account_name, balance: a.current_balance })),
              { kategori: "TOTAL BEBAN", code: "", name: "", balance: totalBeban },
              { kategori: labaRugi >= 0 ? "LABA BERSIH" : "RUGI BERSIH", code: "", name: "", balance: Math.abs(labaRugi) },
            ]}
            columns={[
              { header: "Kategori", key: "kategori", width: 22 },
              { header: "Kode Akun", key: "code", width: 15 },
              { header: "Nama Akun", key: "name", width: 30 },
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-700">Pendapatan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPendapatan.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                        <TableCell>{a.account_name}</TableCell>
                        <TableCell className="text-right font-medium">{formatRp(a.current_balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-green-50 font-bold">
                      <TableCell colSpan={2}>Total Pendapatan</TableCell>
                      <TableCell className="text-right text-green-700">{formatRp(totalPendapatan)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={pendapatanPage}
                  totalItems={pendapatanAccounts.length}
                  itemsPerPage={pendapatanPerPage}
                  onPageChange={setPendapatanPage}
                  onItemsPerPageChange={setPendapatanPerPage}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Beban / Biaya</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Akun</TableHead>
                      <TableHead>Nama Akun</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBeban.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                        <TableCell>{a.account_name}</TableCell>
                        <TableCell className="text-right font-medium">{formatRp(a.current_balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-red-50 font-bold">
                      <TableCell colSpan={2}>Total Beban</TableCell>
                      <TableCell className="text-right text-red-700">{formatRp(totalBeban)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <TablePagination
                  currentPage={bebanPage}
                  totalItems={bebanAccounts.length}
                  itemsPerPage={bebanPerPage}
                  onPageChange={setBebanPage}
                  onItemsPerPageChange={setBebanPerPage}
                />
              </CardContent>
            </Card>

            <Card className={labaRugi >= 0 ? "border-green-300" : "border-red-300"}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold">{labaRugi >= 0 ? "Laba Bersih" : "Rugi Bersih"}</span>
                  <span className={`text-2xl font-bold ${labaRugi >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatRp(Math.abs(labaRugi))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
