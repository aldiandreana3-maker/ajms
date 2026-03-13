import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, History, Search, Calendar, X } from "lucide-react";
import { useElectricTransactions } from "@/hooks/useElectricTransactions";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function RiwayatTransaksiListrik() {
  const navigate = useNavigate();
  const { transactions, isLoading } = useElectricTransactions();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = filterByDate(
    transactions.filter((t) => {
      const q = search.toLowerCase();
      return (
        t.unit_number.toLowerCase().includes(q) ||
        (t.penghuni_name || "").toLowerCase().includes(q) ||
        t.meter_number.toLowerCase().includes(q) ||
        (t.operator_name || "").toLowerCase().includes(q)
      );
    }),
    dateFilter
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Riwayat Transaksi Listrik</h1>
              <p className="text-muted-foreground">Semua transaksi pembelian listrik</p>
            </div>
          </div>
        </div>

        <DataFilterBar
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          dateFilter={dateFilter}
          onDateFilterChange={(v) => { setDateFilter(v); setPage(1); }}
          searchPlaceholder="Cari unit, penghuni, meter..."
        />

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Penghuni</TableHead>
                  <TableHead>No. Meter</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">kWh</TableHead>
                  <TableHead>Kasir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Memuat...</TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada transaksi</TableCell>
                  </TableRow>
                ) : (
                  paginated.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(t.transaction_date), "dd MMM yyyy HH:mm", { locale: idLocale })}
                      </TableCell>
                      <TableCell>{t.unit_number}</TableCell>
                      <TableCell>{t.penghuni_name || "-"}</TableCell>
                      <TableCell>{t.meter_number}</TableCell>
                      <TableCell className="text-right">Rp {t.nominal.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">{t.kwh_amount.toFixed(2)}</TableCell>
                      <TableCell>{t.operator_name || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filtered.length > perPage && (
          <TablePagination
            currentPage={page}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={() => {}}
          />
        )}
      </div>
    </MainLayout>
  );
}
