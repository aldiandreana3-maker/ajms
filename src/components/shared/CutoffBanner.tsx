import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface Status {
  status: "aktif" | "peringatan" | "cut_off";
  overdue_months: number;
  outstanding_amount: number;
}

/** Banner peringatan unit cut-off. Tampil untuk penghuni dengan tunggakan. */
export function CutoffBanner() {
  const { user, isLimitedAccess } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!user || !isLimitedAccess) return;
    (async () => {
      const { data: unitIds } = await supabase.rpc("get_user_unit_ids", { _user_id: user.id });
      if (!unitIds || unitIds.length === 0) return;
      const { data } = await supabase
        .from("unit_billing_status" as any)
        .select("status,overdue_months,outstanding_amount")
        .in("unit_id", unitIds as any)
        .neq("status", "aktif")
        .order("overdue_months", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setStatus(data as any);
    })();
  }, [user, isLimitedAccess]);

  if (!status || status.status === "aktif") return null;

  const isCutoff = status.status === "cut_off";
  return (
    <div className={`p-3 rounded-lg border flex items-center gap-3 ${isCutoff ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-yellow-50 border-yellow-300 text-yellow-900"}`}>
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <div className="flex-1 text-sm">
        <b>{isCutoff ? "Unit Anda CUT-OFF" : "Peringatan Tunggakan"}</b> — {status.overdue_months} bulan menunggak (Rp {Number(status.outstanding_amount).toLocaleString("id-ID")}).
        {isCutoff && " Layanan kepenghunian baru diblokir sampai lunas."}
        <Link to="/sistem-tagihan" className="underline ml-2 font-medium">Lihat Tagihan</Link>
      </div>
    </div>
  );
}

/** Guard yang blok submit form pada halaman kepenghunian jika unit cut-off. */
export function useCutoffBlocked(): { blocked: boolean; reason: string } {
  const { user, isLimitedAccess } = useAuth();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!user || !isLimitedAccess) return;
    (async () => {
      const { data: unitIds } = await supabase.rpc("get_user_unit_ids", { _user_id: user.id });
      if (!unitIds || unitIds.length === 0) return;
      const { data } = await supabase
        .from("unit_billing_status" as any)
        .select("status")
        .in("unit_id", unitIds as any)
        .eq("status", "cut_off")
        .limit(1)
        .maybeSingle();
      setBlocked(!!data);
    })();
  }, [user, isLimitedAccess]);

  return { blocked, reason: "Unit Anda dalam status CUT-OFF karena tunggakan. Lunasi tagihan terlebih dahulu." };
}
