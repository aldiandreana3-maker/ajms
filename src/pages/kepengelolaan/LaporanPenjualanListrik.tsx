import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, BarChart3, Download, FileText } from "lucide-react";
import { useElectricTransactions } from "@/hooks/useElectricTransactions";
import { format, parseISO, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { exportToExcel } from "@/lib/exportExcel";

type ReportType = "daily" | "monthly" | "yearly";

export default function LaporanPenjualanListrik() {
  const navigate = useNavigate();
  const { transactions, isLoading } = useElectricTransactions();
  const [reportType, setReportType] = useState<ReportType>("daily");

  const now = new Date();

  const filteredTx = useMemo(() => {
    let start: Date, end: Date;
    switch (reportType) {
      case "daily":
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case "monthly":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "yearly":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
    }
    return transactions.filter((t) => {
      const d = parseISO(t.transaction_date);
      return isWithinInterval(d, { start, end });
    });
  }, [transactions, reportType]);

  const totalSales = filteredTx.reduce((s, t) => s + t.nominal, 0);
  const totalKwh = filteredTx.reduce((s, t) => s + t.kwh_amount, 0);
  const totalTx = filteredTx.length;
  const operators = [...new Set(filteredTx.map((t) => t.operator_name).filter(Boolean))];

  const handleExportExcel = () => {
    const rows = filteredTx.map((t) => ({
      Tanggal: format(parseISO(t.transaction_date), "dd/MM/yyyy HH:mm"),
      Unit: t.unit_number,
      Penghuni: t.penghuni_name || "-",
      "No. Meter": t.meter_number,
      "Nominal (Rp)": t.nominal,
      "kWh": t.kwh_amount,
      "Harga/kWh": t.price_per_kwh,
      Kasir: t.operator_name || "-",
      Catatan: t.notes || "",
    }));
    const label = reportType === "daily" ? "Harian" : reportType === "monthly" ? "Bulanan" : "Tahunan";
    exportToExcel(rows, `Laporan_Listrik_${label}_${format(now, "yyyyMMdd")}`);
  };

  const handlePrintPDF = () => {
    const label = reportType === "daily" ? "Harian" : reportType === "monthly" ? "Bulanan" : "Tahunan";
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.write(`<html><head><title>Laporan Penjualan Listrik</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 30px; font-size: 12px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      h2 { font-size: 14px; color: #666; margin-top: 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f5; }
      .summary { display: flex; gap: 30px; margin-top: 15px; }
      .summary-item { }
      .summary-item .label { color: #666; font-size: 11px; }
      .summary-item .value { font-size: 16px; font-weight: bold; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>AJMS — Laporan Penjualan Listrik</h1>
    <h2>Periode: ${label} — ${format(now, "dd MMMM yyyy", { locale: idLocale })}</h2>
    <div class="summary">
      <div class="summary-item"><div class="label">Total Penjualan</div><div class="value">Rp ${totalSales.toLocaleString("id-ID")}</div></div>
      <div class="summary-item"><div class="label">Total kWh</div><div class="value">${totalKwh.toFixed(2)} kWh</div></div>
      <div class="summary-item"><div class="label">Jumlah Transaksi</div><div class="value">${totalTx}</div></div>
    </div>
    <table>
      <thead><tr><th>Tanggal</th><th>Unit</th><th>Penghuni</th><th>Nominal</th><th>kWh</th><th>Kasir</th></tr></thead>
      <tbody>${filteredTx.map((t) => `
        <tr>
          <td>${format(parseISO(t.transaction_date), "dd/MM/yy HH:mm")}</td>
          <td>${t.unit_number}</td>
          <td>${t.penghuni_name || "-"}</td>
          <td>Rp ${t.nominal.toLocaleString("id-ID")}</td>
          <td>${t.kwh_amount.toFixed(2)}</td>
          <td>${t.operator_name || "-"}</td>
        </tr>`).join("")}
      </tbody>
    </table>
    <script>window.onload = () => window.print();</script>
    </body></html>`);
    w.document.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Laporan Penjualan Listrik</h1>
              <p className="text-muted-foreground">Ringkasan penjualan listrik</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Laporan Harian</SelectItem>
              <SelectItem value="monthly">Laporan Bulanan</SelectItem>
              <SelectItem value="yearly">Laporan Tahunan</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrintPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <p className="text-2xl font-bold text-foreground">Rp {totalSales.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total kWh Terjual</p>
              <p className="text-2xl font-bold text-foreground">{totalKwh.toFixed(2)} kWh</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
              <p className="text-2xl font-bold text-foreground">{totalTx}</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Penghuni</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">kWh</TableHead>
                  <TableHead>Kasir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Memuat...</TableCell></TableRow>
                ) : filteredTx.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>
                ) : (
                  filteredTx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{format(parseISO(t.transaction_date), "dd MMM yyyy HH:mm", { locale: idLocale })}</TableCell>
                      <TableCell>{t.unit_number}</TableCell>
                      <TableCell>{t.penghuni_name || "-"}</TableCell>
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
      </div>
    </MainLayout>
  );
}
