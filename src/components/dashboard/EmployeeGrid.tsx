import { useNavigate } from "react-router-dom";
import { UserCheck, Palmtree, Clock, FileText, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const employeeServices = [
  {
    icon: UserCheck,
    title: "Absen",
    color: "bg-primary",
    path: "/karyawan/absen",
  },
  {
    icon: Palmtree,
    title: "Cuti",
    color: "bg-success",
    path: "/karyawan/cuti",
  },
  {
    icon: Clock,
    title: "Lembur",
    color: "bg-warning",
    path: "/karyawan/lembur",
  },
  {
    icon: FileText,
    title: "Izin",
    color: "bg-info",
    path: "/karyawan/izin",
  },
  {
    icon: CalendarClock,
    title: "Jadwal Saya",
    color: "bg-accent",
    path: "/karyawan/jadwal-saya",
  },
];

export function EmployeeGrid() {
  const navigate = useNavigate();
  const { isStaff, isSuperAdmin, isAdmin } = useAuth();

  // Only show for super_admin, admin, and all staff
  if (!isStaff && !isSuperAdmin && !isAdmin) return null;

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Karyawan</h2>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:gap-4">
        {employeeServices.map((service) => (
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
