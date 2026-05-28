import { useNavigate } from "react-router-dom";
import { AlertTriangle, CreditCard, AlertCircle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Banner peringatan pembayaran bulanan AJMS.
 * State dikendalikan manual oleh Master Developer via field monthly_status
 * pada tabel system_activation: normal | peringatan | terlambat | dibatasi.
 */
export function MonthlyPaymentBanner() {
  const { data: systemStatus } = useSystemStatus();
  const { user, isSuperAdmin, isAdmin, isMasterDev, role } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const monthlyStatus = (systemStatus as { monthly_status?: string } | null | undefined)
    ?.monthly_status as "normal" | "peringatan" | "terlambat" | "dibatasi" | undefined;

  if (!monthlyStatus || monthlyStatus === "normal") return null;

  const canPay =
    isMasterDev || isSuperAdmin || isAdmin || role === "staff_finance";

  const config = {
    peringatan: {
      icon: AlertTriangle,
      title: "🟡 Peringatan Pembayaran Bulanan",
      message:
        "Biaya operasional bulanan AJMS belum dibayar. Segera lakukan pembayaran agar sistem tetap berjalan normal.",
      wrap: "bg-yellow-50 border-yellow-300 text-yellow-900 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-200",
      btn: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    terlambat: {
      icon: AlertCircle,
      title: "🟠 Pembayaran Terlambat",
      message:
        "Pembayaran operasional bulanan telah melewati batas waktu. Beberapa fitur sistem dapat dibatasi sampai pembayaran diselesaikan.",
      wrap: "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-200",
      btn: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    dibatasi: {
      icon: Ban,
      title: "🔴 Sistem Dibatasi",
      message:
        "Sistem sedang dibatasi karena pembayaran operasional bulanan belum diselesaikan. Silakan lakukan pembayaran untuk mengaktifkan kembali layanan penuh.",
      wrap: "bg-red-50 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200",
      btn: "bg-red-600 hover:bg-red-700 text-white",
    },
  }[monthlyStatus];

  const Icon = config.icon;

  return (
    <div className={`border-b px-4 md:px-6 py-3 ${config.wrap}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{config.title}</p>
          <p className="text-xs md:text-sm opacity-90 mt-0.5">{config.message}</p>
        </div>
        {canPay && (
          <Button
            size="sm"
            className={`flex-shrink-0 ${config.btn}`}
            onClick={() => navigate("/aktivasi-sistem")}
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Bayar Sekarang
          </Button>
        )}
      </div>
    </div>
  );
}
