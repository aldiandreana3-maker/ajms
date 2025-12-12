import {
  Building2,
  Users,
  Store,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  Car,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { NewsCard } from "./NewsCard";

interface DashboardContentProps {
  onOpenKepenghunian: () => void;
}

const stats = [
  { title: "Total Unit", value: "1,248", icon: Building2, variant: "primary" as const, trend: { value: 2.5, isPositive: true } },
  { title: "Penghuni Aktif", value: "892", icon: Users, variant: "accent" as const, trend: { value: 5.2, isPositive: true } },
  { title: "Daftar Komersil", value: "45", icon: Store, variant: "info" as const },
  { title: "Kartu Akses", value: "1,856", icon: CreditCard, variant: "default" as const },
  { title: "Total Keluhan", value: "23", icon: MessageSquareWarning, variant: "warning" as const, trend: { value: 12, isPositive: false } },
  { title: "Work Order", value: "18", icon: Wrench, variant: "default" as const },
  { title: "Abonemen Parkir", value: "456", icon: Car, variant: "accent" as const },
];

const news = [
  {
    id: 1,
    title: "Perbaikan Lift Tower A Selesai Dilakukan",
    excerpt: "Pekerjaan perbaikan lift utama Tower A telah selesai dilaksanakan. Penghuni dapat menggunakan lift seperti biasa.",
    date: "8 Desember 2025",
    category: "Maintenance",
  },
  {
    id: 2,
    title: "Jadwal Pemadaman Listrik untuk Maintenance",
    excerpt: "Akan dilakukan pemadaman listrik terjadwal pada tanggal 10 Desember 2025 pukul 09:00-12:00 WIB.",
    date: "6 Desember 2025",
    category: "Pengumuman",
  },
  {
    id: 3,
    title: "Pendaftaran Kartu Akses Baru Dibuka",
    excerpt: "Bagi penghuni yang memerlukan kartu akses tambahan, silakan mengajukan melalui aplikasi atau datang ke kantor pengelola.",
    date: "5 Desember 2025",
    category: "Layanan",
  },
];

export function DashboardContent({ onOpenKepenghunian }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Selamat Datang, Admin!</h1>
          <p className="text-muted-foreground">Ringkasan data apartemen hari ini</p>
        </div>
        <button
          onClick={onOpenKepenghunian}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-accent text-accent-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          <Users className="w-5 h-5" />
          Kepenghunian
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.slice(0, 4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.slice(4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={(index + 4) * 100} />
        ))}
      </div>

      {/* News Section */}
      <NewsCard news={news} />
    </div>
  );
}
