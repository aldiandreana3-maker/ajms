import { useNavigate } from "react-router-dom";
import {
  Car,
  MessageSquareWarning,
  ClipboardCheck,
  PackageOpen,
  CreditCard,
  Globe,
  ArrowLeft,
  Wrench,
  Package,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
interface KepenghunianSectionProps {
  onBack: () => void;
}

const services = [
  {
    icon: Car,
    title: "Daftar Abonemen Parkir",
    description: "Kelola langganan parkir penghuni",
    color: "primary",
    path: "/kepenghunian/abonemen-parkir",
  },
  {
    icon: MessageSquareWarning,
    title: "Daftar Keluhan Penghuni",
    description: "Lihat dan tangani keluhan",
    color: "warning",
    path: "/kepenghunian/keluhan",
  },
  {
    icon: ClipboardCheck,
    title: "Pengajuan Izin Kerja",
    description: "Proses pengajuan izin renovasi",
    color: "info",
    path: "/kepenghunian/izin-kerja",
  },
  {
    icon: PackageOpen,
    title: "Keluar & Masuk Barang",
    description: "Pencatatan lalu lintas barang",
    color: "accent",
    path: "/kepenghunian/barang",
  },
  {
    icon: CreditCard,
    title: "Pembuatan Kartu Akses",
    description: "Request kartu akses baru",
    color: "primary",
    path: "/kepenghunian/kartu-akses",
  },
  {
    icon: Globe,
    title: "Pelaporan Tamu Asing (WNA)",
    description: "Catat data tamu warga negara asing",
    color: "info",
    path: "/kepenghunian/tamu-asing",
  },
  {
    icon: Wrench,
    title: "Work Order",
    description: "Kelola work order dan perawatan",
    color: "warning",
    path: "/kepenghunian/work-order",
  },
  {
    icon: Package,
    title: "Pelayanan Paket",
    description: "Kelola paket masuk untuk penghuni",
    color: "accent",
    path: "/kepenghunian/pelayanan-paket",
    restrictedRoles: ["staff_tro", "admin", "super_admin"], // Only these roles can see this
  },
  {
    icon: Send,
    title: "WhatsApp Blast",
    description: "Kirim pesan WA broadcast ke banyak penghuni",
    color: "primary",
    path: "/kepenghunian/wa-blast",
    restrictedRoles: ["admin", "super_admin"],
  },
];

const colorStyles = {
  primary: {
    icon: "bg-primary text-primary-foreground",
    hover: "hover:border-primary/50",
  },
  accent: {
    icon: "bg-success text-success-foreground",
    hover: "hover:border-success/50",
  },
  info: {
    icon: "bg-info text-white",
    hover: "hover:border-info/50",
  },
  warning: {
    icon: "bg-warning text-white",
    hover: "hover:border-warning/50",
  },
};

export function KepenghunianSection({ onBack }: KepenghunianSectionProps) {
  const navigate = useNavigate();
  const { role, isSuperAdmin, isMasterDev, isAdmin } = useAuth();

  // Filter services based on user role
  const filteredServices = services.filter((service) => {
    if (!service.restrictedRoles) return true;
    if (isMasterDev || isSuperAdmin) return true;
    // For services restricted to admin-level roles, allow any admin
    const adminRestricted = service.restrictedRoles.every((r) =>
      ["admin", "super_admin", "master_dev"].includes(r)
    );
    if (adminRestricted && isAdmin) return true;
    return service.restrictedRoles.includes(role || "");
  });

  return (
    <div className="animate-fade-in">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, index) => {
          const styles = colorStyles[service.color as keyof typeof colorStyles];
          return (
            <div
              key={service.title}
              onClick={() => navigate(service.path)}
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
