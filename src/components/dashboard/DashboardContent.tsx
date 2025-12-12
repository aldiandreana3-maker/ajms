import {
  Building2,
  Users,
  Store,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  Car,
  ArrowRight,
  Home,
  Layers,
  MapPin,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { NewsCard } from "./NewsCard";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePublishedNews } from "@/hooks/useNews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface DashboardContentProps {
  onOpenKepenghunian: () => void;
}

// Static building information
const buildingInfo = {
  name: "Rusunami The Jarrdin Cihampelas",
  status: "Rumah Susun Sederhana Milik (Rusunami)",
  address: "Jalan Cihampelas Belakang No. 10, Kelurahan Cipaganti, Kecamatan Coblong, Kota Bandung, Jawa Barat",
  postalCode: "40131",
  landArea: "12.083 m²",
  towers: ["Tower A", "Tower B", "Tower C", "Tower D"],
  totalUnits: 2444,
  unitTypes: ["18.5 m²", "24 m²", "33 m²", "40 m²"],
  commercialUnits: 90,
  townHouse: 16,
  communalSpace: 28,
  parkingFloors: ["B1", "B2", "B3"],
  pools: 2,
  managedBy: "PPPSRS The Jarrdin Cihampelas",
  officeLocation: "Lantai Basement 1 Tower A",
};

export function DashboardContent({ onOpenKepenghunian }: DashboardContentProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: newsData, isLoading: newsLoading } = usePublishedNews();

  const displayStats = [
    { 
      title: "Total Unit Hunian", 
      value: buildingInfo.totalUnits.toLocaleString("id-ID"), 
      icon: Building2, 
      variant: "primary" as const,
      subtitle: "4 Tower"
    },
    { 
      title: "Penghuni Aktif", 
      value: statsLoading ? "..." : (stats?.activePenghuni || 0).toLocaleString("id-ID"), 
      icon: Users, 
      variant: "accent" as const,
    },
    { 
      title: "Unit Komersil", 
      value: buildingInfo.commercialUnits.toString(), 
      icon: Store, 
      variant: "info" as const 
    },
    { 
      title: "Kartu Akses Aktif", 
      value: statsLoading ? "..." : (stats?.accessCards || 0).toLocaleString("id-ID"), 
      icon: CreditCard, 
      variant: "default" as const 
    },
    { 
      title: "Total Keluhan", 
      value: statsLoading ? "..." : (stats?.totalKeluhan || 0).toString(), 
      icon: MessageSquareWarning, 
      variant: "warning" as const,
    },
    { 
      title: "Work Order", 
      value: statsLoading ? "..." : (stats?.totalWorkOrders || 0).toString(), 
      icon: Wrench, 
      variant: "default" as const 
    },
    { 
      title: "Abonemen Parkir", 
      value: statsLoading ? "..." : (stats?.parkingSubscriptions || 0).toString(), 
      icon: Car, 
      variant: "accent" as const,
      subtitle: "3 Lantai Parkir"
    },
  ];

  const formattedNews = newsData?.map((n) => ({
    id: n.id,
    title: n.title,
    excerpt: n.content.substring(0, 120) + (n.content.length > 120 ? "..." : ""),
    date: n.published_at ? format(new Date(n.published_at), "d MMMM yyyy") : "-",
    category: "Pengumuman",
  })) || [];

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
        {displayStats.slice(0, 4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={index * 100} />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayStats.slice(4).map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={(index + 4) * 100} />
        ))}
      </div>

      {/* News Section */}
      <NewsCard news={formattedNews.length > 0 ? formattedNews : [
        {
          id: "1",
          title: "Selamat datang di AJMS",
          excerpt: "Sistem manajemen rusunami siap digunakan. Tambahkan berita melalui menu Berita.",
          date: format(new Date(), "d MMMM yyyy"),
          category: "Info",
        }
      ]} />
    </div>
  );
}
