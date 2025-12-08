import { MainLayout } from "@/components/layout/MainLayout";
import {
  Dumbbell,
  Waves,
  Car,
  ShoppingBag,
  Utensils,
  Shield,
  Wifi,
  Zap,
} from "lucide-react";

const facilities = [
  {
    icon: Waves,
    name: "Kolam Renang",
    description: "Kolam renang outdoor dengan area anak",
    status: "Aktif",
    floor: "Lt. 5",
  },
  {
    icon: Dumbbell,
    name: "Fitness Center",
    description: "Gym lengkap dengan peralatan modern",
    status: "Aktif",
    floor: "Lt. 5",
  },
  {
    icon: Car,
    name: "Basement Parking",
    description: "Parkir bawah tanah 3 lantai",
    status: "Aktif",
    floor: "B1-B3",
  },
  {
    icon: ShoppingBag,
    name: "Mini Market",
    description: "Toko kebutuhan sehari-hari 24 jam",
    status: "Aktif",
    floor: "Lt. G",
  },
  {
    icon: Utensils,
    name: "Food Court",
    description: "Area makan dengan berbagai pilihan",
    status: "Aktif",
    floor: "Lt. 2",
  },
  {
    icon: Shield,
    name: "Security 24 Jam",
    description: "Keamanan dengan CCTV dan patrol",
    status: "Aktif",
    floor: "All Area",
  },
  {
    icon: Wifi,
    name: "Internet Fiber",
    description: "Koneksi internet high-speed",
    status: "Aktif",
    floor: "All Unit",
  },
  {
    icon: Zap,
    name: "Genset Backup",
    description: "Generator listrik cadangan",
    status: "Standby",
    floor: "Basement",
  },
];

const StrukturFasilitas = () => {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Struktur Fasilitas</h1>
          <p className="text-muted-foreground">Fasilitas yang tersedia di gedung</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facilities.map((facility, index) => (
            <div
              key={facility.name}
              className="bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <facility.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{facility.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{facility.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {facility.floor}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    facility.status === "Aktif"
                      ? "bg-success-light text-success"
                      : "bg-warning-light text-warning"
                  }`}
                >
                  {facility.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default StrukturFasilitas;
