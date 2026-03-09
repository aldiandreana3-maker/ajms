import { ReactNode } from "react";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface SystemInactiveGuardProps {
  children: ReactNode;
}

/**
 * Wraps feature pages that should be disabled when system is inactive.
 * Shows a blocking overlay with a message to activate the system first.
 * 
 * Exempted pages (do NOT wrap these):
 * - Dashboard (Index)
 * - Auth
 * - Profile
 * - Aktivasi Sistem
 * - Pelayanan Paket
 */
export function SystemInactiveGuard({ children }: SystemInactiveGuardProps) {
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { isSuperAdmin, isAdmin, role } = useAuth();
  const navigate = useNavigate();

  const isSystemInactive = systemStatus?.system_status === "tidak_aktif";
  const canAccessActivation = isSuperAdmin || isAdmin || role === "staff_tro" || role === "staff_finance";

  // While loading, system is active, or user is Super Admin → render children normally
  if (isLoading || !isSystemInactive || isSuperAdmin) {
    return <>{children}</>;
  }

  // System is inactive - show overlay
  return (
    <div className="relative">
      {/* Blurred/disabled content behind */}
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>

      {/* Blocking overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Sistem Tidak Aktif</h2>
          <p className="text-muted-foreground text-sm">
            Fitur ini tidak dapat digunakan karena sistem AJMS sedang tidak aktif. 
            Silakan lakukan pembayaran aktivasi terlebih dahulu untuk mengaktifkan kembali sistem.
          </p>
          {canAccessActivation && (
            <Button 
              onClick={() => navigate("/aktivasi-sistem")}
              className="mt-2"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ke Halaman Aktivasi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
