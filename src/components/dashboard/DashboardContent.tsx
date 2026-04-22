import { useState } from "react";
import {
  Building2,
  Users,
  Store,
  CreditCard,
  MessageSquareWarning,
  Wrench,
  Car,
  Loader2,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { NewsSlider } from "./NewsSlider";
import { ServiceGrid } from "./ServiceGrid";
import { WorkReportChart } from "./WorkReportChart";
import { EmployeeGrid } from "./EmployeeGrid";
import { EditStatDialog } from "./EditStatDialog";
import { StorageWarning } from "./StorageWarning";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";
import { usePublishedNews } from "@/hooks/useNews";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface DashboardContentProps {
  onOpenKepenghunian?: () => void;
}

interface EditDialogState {
  open: boolean;
  settingKey: string;
  currentValue: number;
  title: string;
}

export function DashboardContent({ onOpenKepenghunian }: DashboardContentProps) {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: settings, isLoading: settingsLoading } = useDashboardSettings();
  const { data: newsData, isLoading: newsLoading } = usePublishedNews();
  const { user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    settingKey: "",
    currentValue: 0,
    title: "",
  });

  // Get values from dashboard_settings for RED category stats
  const getSettingValue = (key: string): number => {
    const setting = settings?.find((s) => s.setting_key === key);
    return setting?.setting_value || 0;
  };

  const handleEditStat = (settingKey: string, title: string) => {
    setEditDialog({
      open: true,
      settingKey,
      currentValue: getSettingValue(settingKey),
      title,
    });
  };

  // RED category stats (from dashboard_settings - Super Admin editable)
  const redCategoryStats = [
    { 
      title: "Total Unit", 
      value: getSettingValue("total_units").toString(), 
      icon: Building2, 
      variant: "primary" as const,
      settingKey: "total_units",
    },
    { 
      title: "Penghuni Aktif", 
      value: getSettingValue("penghuni_aktif").toString(), 
      icon: Users, 
      variant: "accent" as const,
      settingKey: "penghuni_aktif",
    },
    { 
      title: "Daftar Komersil", 
      value: getSettingValue("data_komersil").toString(), 
      icon: Store, 
      variant: "info" as const,
      settingKey: "data_komersil",
    },
  ];

  // BLUE category stats (from actual data - user accumulated)
  const blueCategoryStats = [
    { title: "Kartu Akses", value: stats?.accessCards?.toString() || "0", icon: CreditCard, variant: "default" as const, linkTo: "/kepenghunian/kartu-akses" },
    { title: "Total Keluhan", value: stats?.totalKeluhan?.toString() || "0", icon: MessageSquareWarning, variant: "warning" as const, linkTo: "/kepenghunian/keluhan" },
    { title: "Work Order", value: stats?.totalWorkOrders?.toString() || "0", icon: Wrench, variant: "default" as const, linkTo: "/kepenghunian/work-order" },
    { title: "Abonemen Parkir", value: stats?.parkingSubscriptions?.toString() || "0", icon: Car, variant: "accent" as const, linkTo: "/kepenghunian/abonemen-parkir" },
  ];

  const formattedNews = newsData?.map((n, index) => ({
    id: n.id || index + 1,
    title: n.title,
    excerpt: n.content.substring(0, 150) + (n.content.length > 150 ? "..." : ""),
    date: new Date(n.published_at || n.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    category: "Pengumuman",
    content: n.content,
    image_url: n.image_url,
    published_at: n.published_at,
    scheduled_at: n.scheduled_at,
  })) || [];

  if (statsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Selamat Datang{user ? `, ${user.user_metadata?.full_name || "Pengguna"}` : ""}!
          </h1>
          <p className="text-muted-foreground">Ringkasan data apartemen hari ini</p>
        </div>
        
      </div>

      {/* Storage Warning for Super Admin */}
      <StorageWarning />

      {/* Stats Grid - RED Category (Super Admin Editable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {redCategoryStats.map((stat, index) => (
          <StatCard 
            key={stat.title} 
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            delay={index * 100}
            canEdit={isSuperAdmin}
            onEdit={() => handleEditStat(stat.settingKey, stat.title)}
          />
        ))}
      </div>

      {/* Stats Grid - BLUE Category (User Data) - Clickable */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {blueCategoryStats.map((stat, index) => (
          <StatCard key={stat.title} {...stat} delay={(index + 3) * 100} />
        ))}
      </div>

      {/* Employee Grid - Karyawan (Staff/Admin only) */}
      <EmployeeGrid />

      {/* Service Grid - Kepenghunian */}
      <ServiceGrid />

      {/* Work Report Chart */}
      <WorkReportChart />

      {/* News Slider */}
      {newsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <NewsSlider 
          news={formattedNews.length > 0 ? formattedNews : [
            {
              id: 0,
              title: "Belum ada berita",
              excerpt: "Tambahkan berita melalui menu Berita",
              date: new Date().toLocaleDateString("id-ID"),
              category: "Info",
            }
          ]} 
        />
      )}

      {/* Edit Dialog for Super Admin */}
      <EditStatDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog((prev) => ({ ...prev, open }))}
        settingKey={editDialog.settingKey}
        currentValue={editDialog.currentValue}
        title={editDialog.title}
      />
    </div>
  );
}
