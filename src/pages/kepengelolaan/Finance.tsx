import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Wallet, ArrowLeft, Receipt, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Finance() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();

  const canManage = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  if (!user) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Finance</h1>
              <p className="text-muted-foreground">Layanan keuangan dan pembayaran</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admin: Sistem Tagihan IPL */}
          {canManage && (
            <Card
              className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group"
              onClick={() => navigate("/tagihan")}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Receipt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Sistem Tagihan IPL</CardTitle>
                    <CardDescription>Kelola tagihan IPL penghuni</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Atur tarif per tipe unit, generate tagihan otomatis, dan kelola pembayaran penghuni.
                </p>
              </CardContent>
            </Card>
          )}

          {/* All users: Tagihan Saya */}
          <Card
            className="cursor-pointer hover:shadow-lg hover:border-accent/40 transition-all duration-200 group"
            onClick={() => navigate("/sistem-tagihan")}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                  <Eye className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Tagihan Saya</CardTitle>
                  <CardDescription>Lihat dan bayar tagihan unit Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lihat tagihan untuk semua unit yang Anda kelola dan konfirmasi pembayaran secara mandiri.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
