import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Monitor, Zap } from "lucide-react";

export default function IT() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isMasterDev } = useAuth();
  const canAccess = isAdmin || isSuperAdmin || isMasterDev;

  if (!user || !canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Monitor className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">IT</h1>
            <p className="text-muted-foreground">Modul khusus tim IT</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group"
            onClick={() => navigate("/it/data-token")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Data Token</CardTitle>
                  <CardDescription>Kelola data kWh per unit</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitoring ID kWh, sisa kWh, status bypass/normalisasi, dan riwayat perubahan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
