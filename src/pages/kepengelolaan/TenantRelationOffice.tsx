import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, UserCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const troServices = [
  {
    icon: UserCheck,
    title: "Data Penghuni",
    description: "Kelola data penghuni apartemen",
    color: "primary",
    path: "/kepengelolaan/data-penghuni",
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

export default function TenantRelationOffice() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();

  // Only admin and super_admin can access, not penghuni or agent
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  if (!canAccess) {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tenant Relation Office</h1>
            <p className="text-muted-foreground">Layanan hubungan penghuni</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {troServices.map((service, index) => {
            const styles = colorStyles[service.color as keyof typeof colorStyles];
            return (
              <Card
                key={service.title}
                onClick={() => navigate(service.path)}
                className={cn(
                  "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in",
                  styles.hover
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-2", styles.icon)}>
                    <service.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Buka Layanan
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
