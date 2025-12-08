import {
  Car,
  MessageSquareWarning,
  ClipboardCheck,
  PackageOpen,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KepenghunianSectionProps {
  onBack: () => void;
}

const services = [
  {
    icon: Car,
    title: "Daftar Abonemen Parkir",
    description: "Kelola langganan parkir penghuni",
    color: "primary",
  },
  {
    icon: MessageSquareWarning,
    title: "Daftar Keluhan Penghuni",
    description: "Lihat dan tangani keluhan",
    color: "warning",
  },
  {
    icon: ClipboardCheck,
    title: "Pengajuan Izin Kerja",
    description: "Proses pengajuan izin renovasi",
    color: "info",
  },
  {
    icon: PackageOpen,
    title: "Keluar & Masuk Barang",
    description: "Pencatatan lalu lintas barang",
    color: "accent",
  },
  {
    icon: CreditCard,
    title: "Pembuatan Kartu Akses",
    description: "Request kartu akses baru",
    color: "primary",
  },
];

const colorStyles = {
  primary: {
    bg: "bg-primary/10",
    icon: "bg-primary text-primary-foreground",
    hover: "hover:border-primary/50",
  },
  accent: {
    bg: "bg-success-light",
    icon: "bg-success text-success-light",
    hover: "hover:border-success/50",
  },
  info: {
    bg: "bg-info-light",
    icon: "bg-info text-info-light",
    hover: "hover:border-info/50",
  },
  warning: {
    bg: "bg-warning-light",
    icon: "bg-warning text-warning-light",
    hover: "hover:border-warning/50",
  },
};

export function KepenghunianSection({ onBack }: KepenghunianSectionProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Layanan Kepenghunian</h1>
          <p className="text-muted-foreground">Akses semua layanan untuk penghuni</p>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => {
          const styles = colorStyles[service.color as keyof typeof colorStyles];
          return (
            <div
              key={service.title}
              className={cn(
                "group p-6 rounded-xl border border-border bg-card shadow-card cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in",
                styles.hover
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-4", styles.icon)}>
                <service.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground">{service.description}</p>
              <div className="mt-4 flex items-center gap-2 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Buka Layanan
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
