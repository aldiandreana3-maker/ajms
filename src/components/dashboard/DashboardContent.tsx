import {
  Building2,
  Users,
  Store,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  Car,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { NewsCard } from "./NewsCard";
import { ColorLegend } from "./ColorLegend";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePublishedNews } from "@/hooks/useNews";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardContentProps {
  onOpenKepenghunian: () => void;
}

export function DashboardContent({ onOpenKepenghunian }: DashboardContentProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: newsData, isLoading: newsLoading } = usePublishedNews();
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Stats with dataType: admin (red) = super admin managed, user (blue) = user managed
  const statCards = [
    { title: "Total Unit", value: stats?.totalUnits?.toString() || "0", icon: Building2, variant: "primary" as const, dataType: "admin" as const },
    { title: "Penghuni Aktif", value: stats?.activePenghuni?.toString() || "0", icon: Users, variant: "accent" as const, dataType: "admin" as const },
    { title: "Daftar Komersil", value: stats?.commercialTenants?.toString() || "0", icon: Store, variant: "info" as const, dataType: "admin" as const },
    { title: "Kartu Akses", value: stats?.accessCards?.toString() || "0", icon: CreditCard, variant: "default" as const, dataType: "user" as const },
    { title: "Total Keluhan", value: stats?.totalKeluhan?.toString() || "0", icon: MessageSquareWarning, variant: "warning" as const, dataType: "user" as const },
    { title: "Work Order", value: stats?.totalWorkOrders?.toString() || "0", icon: Wrench, variant: "default" as const, dataType: "user" as const },
    { title: "Abonemen Parkir", value: stats?.parkingSubscriptions?.toString() || "0", icon: Car, variant: "accent" as const, dataType: "user" as const },
  ];

  const formattedNews = newsData?.map((n, index) => ({
    id: index + 1,
    title: n.title,
    excerpt: n.content.substring(0, 150) + "...",
    date: new Date(n.published_at || n.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    category: "Pengumuman",
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Color Legend */}
      <ColorLegend />

      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat Datang{user ? `, ${user.user_metadata?.full_name || "Pengguna"}` : ""}!
          </h1>
          <p className="text-muted-foreground">Ringkasan data apartemen hari ini</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Orange Login/Register Button - Only shown when NOT logged in */}
          {!user && (
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-8 py-3 bg-login-orange text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <LogIn className="w-5 h-5" />
              Login / Daftar
            </button>
          )}
          <button
            onClick={onOpenKepenghunian}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-accent text-accent-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <Users className="w-5 h-5" />
            Kepenghunian
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.slice(0, 4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.slice(4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={(index + 4) * 100} />
        ))}
      </div>

      {/* News Section - Super Admin only (red border indicator) */}
      {newsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <NewsCard 
          news={formattedNews.length > 0 ? formattedNews : [
            {
              id: 0,
              title: "Belum ada berita",
              excerpt: "Tambahkan berita melalui menu Berita",
              date: new Date().toLocaleDateString("id-ID"),
              category: "Info",
            }
          ]} 
          isSuperAdminSection={true}
        />
      )}
    </div>
  );
}
