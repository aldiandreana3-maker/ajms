import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useChartOfAccounts, ChartAccount } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Scale, Loader2 } from "lucide-react";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

function PaginatedSection({ title, accs, color }: { title: string; accs: ChartAccount[]; color: string }) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const paginated = usePagination(accs, perPage, page);

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`text-lg ${color}`}>{title}</CardTitle>
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
            {paginated.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                <TableCell>{a.account_name}</TableCell>
                <TableCell className="text-right font-medium">{formatRp(a.current_balance)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-bold bg-muted/50">
              <TableCell colSpan={2}>Total {title}</TableCell>
              <TableCell className="text-right">{formatRp(accs.reduce((s, a) => s + a.current_balance, 0))}</TableCell>
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
      </CardContent>
    </Card>
  );
}

export default function LaporanNeraca() {
  const navigate = useNavigate();
  const { accounts, isLoading } = useChartOfAccounts();

  const active = accounts.filter((a) => a.is_active);
  const aktivaAccounts = active.filter((a) => a.account_type === "AKTIVA");
  const pasivaAccounts = active.filter((a) => a.account_type === "PASIVA");
  const modalAccounts = active.filter((a) => a.account_type === "MODAL");

  const totalAktiva = aktivaAccounts.reduce((s, a) => s + a.current_balance, 0);
  const totalPasiva = pasivaAccounts.reduce((s, a) => s + a.current_balance, 0);
  const totalModal = modalAccounts.reduce((s, a) => s + a.current_balance, 0);

  const totalPendapatan = active.filter((a) => a.account_type === "PENDAPATAN").reduce((s, a) => s + a.current_balance, 0);
  const totalBeban = active.filter((a) => a.account_type === "BEBAN").reduce((s, a) => s + a.current_balance, 0);
  const labaDitahan = totalPendapatan - totalBeban;

  const totalPasivaModal = totalPasiva + totalModal + labaDitahan;
  const isBalanced = Math.abs(totalAktiva - totalPasivaModal) < 0.01;

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
              <h1 className="text-2xl font-bold text-foreground">Laporan Neraca</h1>
              <p className="text-muted-foreground">Balance Sheet — Posisi keuangan</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <PaginatedSection title="Aktiva" accs={aktivaAccounts} color="text-blue-700" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaginatedSection title="Kewajiban (Pasiva)" accs={pasivaAccounts} color="text-red-700" />
              <PaginatedSection title="Modal / Ekuitas" accs={modalAccounts} color="text-purple-700" />
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Laba Ditahan (Pendapatan − Beban)</span>
                  <span className="font-bold">{formatRp(labaDitahan)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className={isBalanced ? "border-green-300" : "border-red-300"}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Aktiva</p>
                    <p className="text-xl font-bold text-blue-700">{formatRp(totalAktiva)}</p>
                  </div>
                  <div className="flex items-center justify-center text-2xl font-bold">
                    {isBalanced ? "=" : "≠"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pasiva + Modal + Laba Ditahan</p>
                    <p className="text-xl font-bold text-purple-700">{formatRp(totalPasivaModal)}</p>
                  </div>
                </div>
                <p className={`text-center mt-4 text-sm font-medium ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                  {isBalanced ? "✅ Neraca Seimbang" : "⚠️ Neraca Tidak Seimbang"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
