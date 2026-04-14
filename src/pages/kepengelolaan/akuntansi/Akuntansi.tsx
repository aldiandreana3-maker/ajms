import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { ShieldAlert, ArrowLeft, BookOpen, FileText, Send, BarChart3, Scale, CheckCircle, List, TrendingUp, TrendingDown, ArrowUpDown, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)"];

const menuItems = [
  {
    icon: List,
    title: "Daftar Akun",
    description: "Chart of Accounts",
    detail: "Kelola semua jenis akun keuangan: Kas, Bank, Utang, Modal, Pendapatan, Beban.",
    path: "/kepengelolaan/finance/akuntansi/daftar-akun",
  },
  {
    icon: FileText,
    title: "Jurnal Transaksi",
    description: "Catat pemasukan & pengeluaran",
    detail: "Mencatat semua transaksi keuangan berdasarkan tanggal dengan debit dan kredit.",
    path: "/kepengelolaan/finance/akuntansi/jurnal",
  },
  {
    icon: Send,
    title: "Posting Data",
    description: "Jurnal → Buku Besar",
    detail: "Proses memindahkan data dari jurnal ke buku besar agar tercatat rapi.",
    path: "/kepengelolaan/finance/akuntansi/posting",
  },
  {
    icon: BookOpen,
    title: "Buku Besar",
    description: "General Ledger",
    detail: "Kumpulan transaksi yang dikelompokkan per akun. Lihat total per akun dengan jelas.",
    path: "/kepengelolaan/finance/akuntansi/buku-besar",
  },
  {
    icon: Scale,
    title: "Neraca Saldo",
    description: "Trial Balance",
    detail: "Cek apakah total debit dan kredit sudah seimbang. Jika seimbang, pencatatan sudah benar.",
    path: "/kepengelolaan/finance/akuntansi/neraca-saldo",
  },
  {
    icon: CheckCircle,
    title: "Rekonsiliasi",
    description: "Pencocokan data",
    detail: "Mencocokkan data keuangan di sistem dengan data nyata (misalnya saldo bank).",
    path: "/kepengelolaan/finance/akuntansi/rekonsiliasi",
  },
  {
    icon: TrendingUp,
    title: "Laporan Laba Rugi",
    description: "Pendapatan & Biaya",
    detail: "Laporan pendapatan dikurangi biaya/beban untuk mengetahui laba atau rugi bersih.",
    path: "/kepengelolaan/finance/akuntansi/laporan-laba-rugi",
  },
  {
    icon: BarChart3,
    title: "Laporan Neraca",
    description: "Balance Sheet",
    detail: "Posisi keuangan: Aktiva = Pasiva + Modal + Laba Ditahan.",
    path: "/kepengelolaan/finance/akuntansi/laporan-neraca",
  },
  {
    icon: ArrowUpDown,
    title: "Laporan Arus Kas",
    description: "Cash Flow Statement",
    detail: "Arus masuk dan keluar kas dari aktivitas operasional, investasi, dan pendanaan.",
    path: "/kepengelolaan/finance/akuntansi/laporan-arus-kas",
  },
];

export default function Akuntansi() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const { accounts, isLoading: loadingCoa } = useChartOfAccounts();
  const { entries, isLoading: loadingJournal } = useJournalEntries();

  const canManage = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  // Dashboard computations
  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalAktiva = activeAccounts.filter((a) => a.account_type === "AKTIVA").reduce((s, a) => s + a.current_balance, 0);
  const totalPasiva = activeAccounts.filter((a) => a.account_type === "PASIVA").reduce((s, a) => s + a.current_balance, 0);
  const totalPendapatan = activeAccounts.filter((a) => a.account_type === "PENDAPATAN").reduce((s, a) => s + a.current_balance, 0);
  const totalBeban = activeAccounts.filter((a) => a.account_type === "BEBAN").reduce((s, a) => s + a.current_balance, 0);
  const totalModal = activeAccounts.filter((a) => a.account_type === "MODAL").reduce((s, a) => s + a.current_balance, 0);
  const labaRugi = totalPendapatan - totalBeban;

  const totalJurnal = entries.length;
  const postedJurnal = entries.filter((e) => e.is_posted).length;
  const draftJurnal = totalJurnal - postedJurnal;

  const pieData = [
    { name: "Aktiva", value: Math.abs(totalAktiva) },
    { name: "Pasiva", value: Math.abs(totalPasiva) },
    { name: "Modal", value: Math.abs(totalModal) },
    { name: "Pendapatan", value: Math.abs(totalPendapatan) },
    { name: "Beban", value: Math.abs(totalBeban) },
  ].filter((d) => d.value > 0);

  const barData = [
    { name: "Pendapatan", value: totalPendapatan },
    { name: "Beban", value: totalBeban },
    { name: "Laba/Rugi", value: labaRugi },
  ];

  const statCards = [
    { label: "Total Aktiva", value: formatRp(totalAktiva), icon: Wallet, color: "text-blue-600" },
    { label: "Total Pendapatan", value: formatRp(totalPendapatan), icon: TrendingUp, color: "text-green-600" },
    { label: "Total Beban", value: formatRp(totalBeban), icon: TrendingDown, color: "text-destructive" },
    { label: "Laba / Rugi Bersih", value: formatRp(labaRugi), icon: Wallet, color: labaRugi >= 0 ? "text-green-600" : "text-destructive" },
    { label: "Jurnal Diposting", value: `${postedJurnal} / ${totalJurnal}`, icon: CheckCircle, color: "text-primary" },
    { label: "Jurnal Draft", value: String(draftJurnal), icon: FileText, color: "text-orange-600" },
  ];

  const isLoadingDashboard = loadingCoa || loadingJournal;

  if (!user || !canManage) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </MainLayout>
    );
  }

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
              <h1 className="text-2xl font-bold text-foreground">Akuntansi</h1>
              <p className="text-muted-foreground">Sistem pencatatan keuangan lengkap</p>
            </div>
          </div>
        </div>

        {/* Alur Sistem */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-2">📌 Alur Sistem:</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Daftar Akun</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Jurnal</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Posting</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Buku Besar</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Neraca Saldo</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Rekonsiliasi</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Laporan</span>
          </div>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dashboard Keuangan — inline below cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Dashboard Keuangan
          </h2>
          <p className="text-sm text-muted-foreground">Ringkasan data akuntansi (read-only)</p>

          {isLoadingDashboard ? (
            <div className="flex items-center justify-center py-16">
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

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">
                    📌 Dashboard ini bersifat <strong>read-only</strong>. Data diambil langsung dari saldo akun (COA) dan jurnal transaksi.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}