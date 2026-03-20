import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Zap, ArrowLeft, History, Gauge, BarChart3, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const electricItems = [
  {
    icon: ShoppingCart,
    title: "Kasir Listrik",
    description: "Pembelian listrik prabayar",
    detail: "Proses pembelian token listrik prabayar untuk penghuni apartemen.",
    path: "/kepengelolaan/finance/kasir-listrik",
  },
  {
    icon: History,
    title: "Riwayat Transaksi Listrik",
    description: "Semua transaksi listrik",
    detail: "Lihat riwayat seluruh transaksi pembelian listrik penghuni.",
    path: "/kepengelolaan/finance/riwayat-listrik",
  },
  {
    icon: Gauge,
    title: "Data Meter Listrik",
    description: "Kelola meter per unit",
    detail: "Kelola data meter listrik, saldo kWh, dan harga per kWh setiap unit.",
    path: "/kepengelolaan/finance/data-meter-listrik",
  },
  {
    icon: BarChart3,
    title: "Laporan Penjualan Listrik",
    description: "Laporan harian, bulanan, tahunan",
    detail: "Lihat ringkasan penjualan listrik dengan export PDF dan Excel.",
    path: "/kepengelolaan/finance/laporan-listrik",
  },
];

export default function Kelistrikan() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();

  const canManage = (isSuperAdmin || isAdmin) && !isLimitedAccess;

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
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kelistrikan</h1>
              <p className="text-muted-foreground">Manajemen listrik prabayar apartemen</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {electricItems.map((item) => (
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
      </div>
    </MainLayout>
  );
}
