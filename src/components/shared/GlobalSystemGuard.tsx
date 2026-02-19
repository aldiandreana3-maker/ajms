import { ReactNode } from "react";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface GlobalSystemGuardProps {
  children: ReactNode;
}

/**
 * Global guard yang membungkus seluruh aplikasi.
 * Ketika sistem tidak aktif:
 * - Super Admin: tetap bisa akses semua halaman (untuk mengaktifkan kembali)
 * - Semua pengguna lain: melihat halaman peringatan penuh (full-page block)
 *
 * Halaman yang selalu bisa diakses tanpa login: /auth
 */
export function GlobalSystemGuard({ children }: GlobalSystemGuardProps) {
  const { data: systemStatus, isLoading, refetch } = useSystemStatus();
  const { isSuperAdmin, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSystemInactive = systemStatus?.system_status === "tidak_aktif";

  // Halaman auth selalu bisa diakses
  const isAuthPage = location.pathname === "/auth";

  // Selama loading, tampilkan anak (jangan block dulu)
  if (isLoading) {
    return <>{children}</>;
  }

  // Jika sistem aktif / super admin / di halaman auth → tampil normal
  if (!isSystemInactive || isSuperAdmin || isAuthPage) {
    return <>{children}</>;
  }

  // Sistem tidak aktif & bukan super admin → tampilkan halaman peringatan penuh
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Sistem Tidak Aktif</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Layanan <strong>AJMS</strong> saat ini sedang tidak aktif. Akses ke seluruh fitur 
            telah dinonaktifkan sementara.
          </p>
        </div>

        {/* Info box */}
        <div className="bg-muted/50 border border-border rounded-xl p-5 text-left space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Apa yang bisa Anda lakukan?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Hubungi pengelola atau administrator AJMS untuk informasi lebih lanjut.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Sistem hanya dapat diaktifkan kembali oleh <strong>Super Admin</strong> melalui halaman Aktivasi Sistem.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              Coba refresh halaman ini setelah beberapa saat jika sistem sudah diaktifkan.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Jika user sudah login sebagai admin/finance/tro → arahkan ke aktivasi */}
          {user && (
            <Button
              variant="default"
              onClick={() => navigate("/aktivasi-sistem")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Halaman Aktivasi
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Status
          </Button>
          {!user && (
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
            >
              Login
            </Button>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground">
          AJMS — Apartemen Jati Modern & Serasi
        </p>
      </div>
    </div>
  );
}
