import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { ArrowLeft, LayoutDashboard, Loader2, TrendingUp, TrendingDown, Wallet, BookOpen, FileText, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)"];

export default function DashboardAkuntansi() {
  const navigate = useNavigate();
  const { accounts, isLoading: loadingCoa } = useChartOfAccounts();
  const { entries, isLoading: loadingJournal } = useJournalEntries();

  const isLoading = loadingCoa || loadingJournal;

  // Compute stats from COA
  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalAktiva = activeAccounts
    .filter((a) => a.account_type === "AKTIVA")
    .reduce((s, a) => s + a.current_balance, 0);
  const totalPasiva = activeAccounts
    .filter((a) => a.account_type === "PASIVA")
    .reduce((s, a) => s + a.current_balance, 0);
  const totalPendapatan = activeAccounts
    .filter((a) => a.account_type === "PENDAPATAN")
    .reduce((s, a) => s + a.current_balance, 0);
  const totalBeban = activeAccounts
    .filter((a) => a.account_type === "BEBAN")
    .reduce((s, a) => s + a.current_balance, 0);
  const totalModal = activeAccounts
    .filter((a) => a.account_type === "MODAL")
    .reduce((s, a) => s + a.current_balance, 0);

  const labaRugi = totalPendapatan - totalBeban;

  // Journal stats
  const totalJurnal = entries.length;
  const postedJurnal = entries.filter((e) => e.is_posted).length;
  const draftJurnal = totalJurnal - postedJurnal;

  // Pie chart data for account types
  const pieData = [
    { name: "Aktiva", value: Math.abs(totalAktiva) },
    { name: "Pasiva", value: Math.abs(totalPasiva) },
    { name: "Modal", value: Math.abs(totalModal) },
    { name: "Pendapatan", value: Math.abs(totalPendapatan) },
    { name: "Beban", value: Math.abs(totalBeban) },
  ].filter((d) => d.value > 0);

  // Bar chart: Pendapatan vs Beban
  const barData = [
    { name: "Pendapatan", value: totalPendapatan },
    { name: "Beban", value: totalBeban },
    { name: "Laba/Rugi", value: labaRugi },
  ];

  const statCards = [
    { label: "Total Aktiva", value: formatRp(totalAktiva), icon: Wallet, color: "text-blue-600" },
    { label: "Total Pendapatan", value: formatRp(totalPendapatan), icon: TrendingUp, color: "text-green-600" },
    { label: "Total Beban", value: formatRp(totalBeban), icon: TrendingDown, color: "text-red-600" },
    { label: "Laba / Rugi Bersih", value: formatRp(labaRugi), icon: Wallet, color: labaRugi >= 0 ? "text-green-600" : "text-red-600" },
    { label: "Jurnal Diposting", value: `${postedJurnal} / ${totalJurnal}`, icon: CheckCircle, color: "text-primary" },
    { label: "Jurnal Draft", value: String(draftJurnal), icon: FileText, color: "text-orange-600" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Keuangan</h1>
              <p className="text-muted-foreground">Ringkasan data akuntansi (read-only)</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <p className="text-lg font-bold">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pendapatan vs Beban</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                      <Tooltip formatter={(v: number) => formatRp(v)} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Komposisi Saldo per Tipe Akun</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatRp(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick info */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  📌 Dashboard ini bersifat <strong>read-only</strong>. Data diambil langsung dari saldo akun (COA) dan jurnal transaksi. Untuk melakukan perubahan, gunakan menu Jurnal Transaksi dan Posting Data.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
}
