import { useNavigate } from "react-router-dom";
import {
  Car,
  MessageSquareWarning,
  ClipboardCheck,
  PackageOpen,
  CreditCard,
  Globe,
  Wrench,
  Package,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const services = [
  {
    icon: Car,
    title: "Abonemen Parkir",
    color: "bg-primary",
    path: "/kepenghunian/abonemen-parkir",
  },
  {
    icon: MessageSquareWarning,
    title: "Keluhan",
    color: "bg-warning",
    path: "/kepenghunian/keluhan",
  },
  {
    icon: ClipboardCheck,
    title: "Izin Kerja",
    color: "bg-info",
    path: "/kepenghunian/izin-kerja",
  },
  {
    icon: PackageOpen,
    title: "Barang",
    color: "bg-success",
    path: "/kepenghunian/barang",
  },
  {
    icon: CreditCard,
    title: "Kartu Akses",
    color: "bg-primary",
    path: "/kepenghunian/kartu-akses",
  },
  {
    icon: Globe,
    title: "Tamu Asing",
    color: "bg-info",
    path: "/kepenghunian/tamu-asing",
  },
  {
    icon: Wrench,
    title: "Work Order",
    color: "bg-warning",
    path: "/kepenghunian/work-order",
  },
  {
    icon: Package,
    title: "Paket",
    color: "bg-success",
    path: "/kepenghunian/pelayanan-paket",
    restrictedRoles: ["staff_tro", "admin", "super_admin"],
  },
  {
    icon: Ticket,
    title: "Ambil Antrian",
    color: "bg-primary",
    path: "/kepengelolaan/finance/kasir",
  },
];

export function ServiceGrid() {
  const navigate = useNavigate();
  const { role, isSuperAdmin } = useAuth();

  const filteredServices = services.filter((service) => {
    if (!service.restrictedRoles) return true;
    if (isSuperAdmin) return true;
    return service.restrictedRoles.includes(role || "");
  });

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Layanan Kepenghunian</h2>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {filteredServices.map((service) => (
          <button
            key={service.title}
            onClick={() => navigate(service.path)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg",
                service.color
              )}
            >
              <service.icon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground text-center leading-tight line-clamp-2">
              {service.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
