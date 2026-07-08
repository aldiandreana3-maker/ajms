import { ReactNode, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Ban } from "lucide-react";

/**
 * Ketika monthly_status = "dibatasi":
 * - Master Dev: bypass, akses normal.
 * - Semua role lain (termasuk admin/super admin): mode read-only.
 *   Hanya bisa melihat & mengekspor data, tidak bisa menambah / mengubah / menghapus.
 * - Pengecualian (tetap normal):
 *   • Tenant Relation Officer (/kepengelolaan/tro)
 *   • Seluruh layanan Kepenghunian, termasuk Pelayanan Paket (/kepenghunian/*)
 */

// Kata kunci yang menandakan tombol MUTASI (diblokir saat restricted).
const MUTATING_PATTERNS = [
  "tambah", "simpan", "hapus", "ubah", "edit", "update", "perbarui",
  "kirim", "bayar", "aktifkan", "nonaktifkan", "verifikasi",
  "batalkan", "batal ", "generate", "buat", "daftar baru",
  "import", "upload", "unggah", "reset", "assign", "tetapkan",
  "posting", "rekonsiliasi", "approve", "setujui", "tolak",
  "selesai", "mulai", "berangkat", "checkin", "check-in", "checkout", "check-out",
];

// Kata kunci tombol yang DIIZINKAN meskipun cocok pola mutasi.
const ALLOWED_PATTERNS = [
  "export", "ekspor", "download", "unduh", "excel", "pdf",
  "print", "cetak", "filter", "cari", "search",
  "refresh", "muat ulang", "tutup", "close", "kembali",
  "logout", "keluar", "profil", "profile",
  "selanjutnya", "sebelumnya", "next", "prev",
  "lihat", "detail", "view",
];

function isExemptPath(pathname: string) {
  return (
    pathname.startsWith("/kepengelolaan/tro") ||
    pathname === "/kepenghunian/pelayanan-paket" ||
    pathname.startsWith("/kepenghunian")
  );
}

export function RestrictedModeGuard({ children }: { children: ReactNode }) {
  const { data: systemStatus } = useSystemStatus();
  const { isMasterDev, user } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  const monthlyStatus = (systemStatus as { monthly_status?: string } | null | undefined)
    ?.monthly_status;

  const active =
    !!user && monthlyStatus === "dibatasi" && !isMasterDev && !isExemptPath(location.pathname);

  const handleCaptureClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!active) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Izinkan klik pada link navigasi (anchor / react-router link)
      const anchor = target.closest("a");
      if (anchor && anchor.getAttribute("href")) return;

      // Izinkan elemen yang eksplisit ditandai
      if (target.closest('[data-allow-restricted="true"]')) return;

      // Izinkan tab, tombol dialog close, dsb.
      const roleTab = target.closest('[role="tab"], [role="menuitem"], [role="option"]');
      if (roleTab) return;

      const btn = target.closest("button, [role='button'], input[type='submit'], input[type='button']");
      if (!btn) return;

      const text = (btn.textContent || "").toLowerCase().trim();
      const ariaLabel = (btn.getAttribute("aria-label") || "").toLowerCase();
      const combined = `${text} ${ariaLabel}`;

      // Whitelist dulu
      if (ALLOWED_PATTERNS.some((p) => combined.includes(p))) return;

      // Hanya blokir kalau MENGANDUNG kata mutasi,
      // atau submit button yang benar-benar berada di dalam <form>.
      const isMutating = MUTATING_PATTERNS.some((p) => combined.includes(p));
      const isFormSubmit =
        (btn as HTMLButtonElement).type === "submit" && !!btn.closest("form");

      if (isMutating || isFormSubmit) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Sistem dibatasi",
          description:
            "Fitur ini dinonaktifkan sementara. Silakan lakukan pembayaran bulanan untuk mengaktifkan kembali.",
          variant: "destructive",
        });
      }

    },
    [active, toast]
  );

  if (!active) return <>{children}</>;

  return (
    <div className="relative">
      <div
        onClickCapture={handleCaptureClick}
        className="[&_button:not([data-allow-restricted='true']):not([role='tab'])]:cursor-default"
      >
      >
        {children}
      </div>
    </div>
  );
}
