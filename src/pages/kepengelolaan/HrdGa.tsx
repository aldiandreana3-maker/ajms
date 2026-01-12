import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, UserCog, ArrowLeft, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HrdGa() {
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
          <div className="flex items-center gap-3">
            <UserCog className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">HRD & GA</h1>
              <p className="text-muted-foreground">Human Resources & General Affairs</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="w-5 h-5 text-warning" />
              Dalam Pengembangan
            </CardTitle>
            <CardDescription>
              Fitur HRD & GA sedang dalam proses pengembangan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Halaman ini akan berisi fitur-fitur terkait HRD dan General Affairs seperti 
              pengelolaan karyawan, absensi, dan administrasi umum.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
