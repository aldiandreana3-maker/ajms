import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemStatus, useToggleSystemStatus, useSystemPayments, useDeletePayment, useUpdatePaymentStatus, useSetMonthlyStatus, type MonthlyStatus } from "@/hooks/useSystemActivation";
import { Power, PowerOff, CheckCircle2, XCircle, Clock, Loader2, CreditCard, History, Trash2, Info, CheckCircle, Server, Shield, Bell, MoreHorizontal, Download } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AKTIVASI_ITEMS = [
  "Setup awal sistem AJMS",
  "Konfigurasi database & server",
  "Aktivasi akun administrator",
  "Pengaturan hak akses pengguna",
  "Integrasi payment gateway",
  "Pengujian sistem sebelum digunakan",
];

const BULANAN_ITEMS = [
  "Server & hosting sistem",
  "Maintenance sistem",
  "Backup data rutin",
  "Keamanan & update sistem",
  "Monitoring performa",
  "Dukungan teknis lanjutan",
  "Notifikasi otomatis berita terbaru ke seluruh penghuni & agent",
  "Notifikasi otomatis tagihan yang belum dibayar ke seluruh penghuni & agent",
];

function RincianDialog({
  open,
  onClose,
  type,
}: {
  open: boolean;
  onClose: () => void;
  type: "aktivasi" | "bulanan";
}) {
  const isAktivasi = type === "aktivasi";
  const items = isAktivasi ? AKTIVASI_ITEMS : BULANAN_ITEMS;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAktivasi ? (
              <span className="inline-flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Rincian Biaya Aktivasi Tahunan
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Rincian Biaya Operasional Bulanan
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Detail layanan yang tercakup dalam biaya {isAktivasi ? "aktivasi" : "bulanan"} sistem AJMS
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Harga */}
          <div className="rounded-lg p-4 bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">{isAktivasi ? "Aktivasi Tahunan" : "Operasional Bulanan"}</p>
            <p className="text-2xl font-bold text-primary">
              {isAktivasi ? "Rp 6.699.000" : "Rp 1.299.000"}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                / {isAktivasi ? "Tahun" : "Bulan"}
              </span>
            </p>
          </div>

          {/* Rincian items */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">
              Fungsi Biaya {isAktivasi ? "Aktivasi" : "Bulanan"}:
            </p>
            <ul className="space-y-2">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Ringkasan tabel */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Ringkasan</p>
            </div>
            <div className="divide-y">
              <div className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-muted-foreground">Jenis Biaya</span>
                <span className="font-medium">{isAktivasi ? "Aktivasi Tahunan" : "Operasional Bulanan"}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-muted-foreground">Nominal</span>
                <span className="font-semibold">{isAktivasi ? "Rp 6.699.000" : "Rp 1.299.000"}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2 text-sm">
                <span className="text-muted-foreground">Periode</span>
                <span className="font-medium">{isAktivasi ? "1 Kali Per Tahun" : "Setiap Bulan"}</span>
              </div>
            </div>
          </div>

          {/* Metode bayar */}
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Bayar Melalui
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="bg-background border rounded px-2 py-1">Transfer Bank</span>
              <span className="bg-background border rounded px-2 py-1">Virtual Account</span>
              <span className="bg-background border rounded px-2 py-1">QRIS</span>
              <span className="bg-background border rounded px-2 py-1">E-Wallet</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function sendBulananNotification() {
  const roles = ["super_admin", "admin", "staff_finance", "staff_tro"];
  await supabase.from("system_notifications").insert({
    title: "Pembayaran Biaya Bulanan Sistem",
    message: `Pembayaran biaya operasional bulanan sistem AJMS (Rp 1.299.000) sedang diproses. Silakan pantau status pembayaran di halaman Aktivasi Sistem.`,
    type: "info",
    target_roles: roles,
  });
}

function printPaymentReceipt(p: any) {
  const fmt = (n: number) => "IDR " + new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const d = new Date(p.tanggal_bayar);
  const tglLong = format(d, "MMMM dd, yyyy", { locale: idLocale });
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  // Sequence: derive stable 3-digit number from id
  const idHex = String(p.id).replace(/-/g, "").slice(0, 8);
  const seq = String((parseInt(idHex, 16) % 999) + 1).padStart(3, "0");
  const isAktivasi = p.jenis_pembayaran === "aktivasi";
  const refNo = `AJMS-AKTIVASI-${yy}${mm}${dd}-${seq}`;
  const projectNo = `PRJ-${yy}${mm}${dd}-${seq}`;
  const dueDate = new Date(d); dueDate.setFullYear(dueDate.getFullYear() + (isAktivasi ? 1 : 0));
  if (!isAktivasi) dueDate.setMonth(dueDate.getMonth() + 1);
  const dueLong = format(dueDate, "MMMM dd, yyyy", { locale: idLocale });
  const statusText = p.status === "berhasil" ? "PAID" : p.status === "pending" ? "PENDING" : "UNPAID";
  const statusColor = p.status === "berhasil" ? "#16a34a" : p.status === "pending" ? "#d97706" : "#dc2626";
  const nominal = Number(p.nominal);
  const paid = p.status === "berhasil" ? nominal : 0;
  const due = nominal - paid;

  const items = isAktivasi
    ? [
        { desc: "Aktivasi Sistem AJMS", detail: "Aktivasi lisensi sistem AJMS selama 1 tahun", qty: 1, price: nominal },
      ]
    : [
        { desc: "Operasional Bulanan", detail: "Biaya operasional & maintenance sistem AJMS 1 bulan", qty: 1, price: nominal },
      ];

  const rows = items.map((it, i) => `
    <tr>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;">${i + 1}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:600;">${it.desc}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563;">${it.detail}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:center;">${it.qty}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${new Intl.NumberFormat("en-US",{minimumFractionDigits:2}).format(it.price)}</td>
      <td style="padding:14px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;font-weight:600;">${new Intl.NumberFormat("en-US",{minimumFractionDigits:2}).format(it.qty * it.price)}</td>
    </tr>`).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${refNo}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;margin:0;padding:40px;max-width:900px;margin:0 auto;background:#fff;}
    .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;}
    .brand{display:flex;align-items:center;gap:12px;}
    .brand .logo{width:44px;height:44px;border:2px solid #111827;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:22px;}
    .brand .name{font-size:22px;font-weight:800;letter-spacing:1px;}
    .brand .tag{font-size:11px;color:#6b7280;margin-top:2px;}
    .invoice-title{font-size:42px;font-weight:800;letter-spacing:2px;}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:24px;}
    .info-grid .left{font-size:12px;line-height:1.7;color:#374151;}
    .info-grid .right{font-size:12px;}
    .info-grid .right .row{display:flex;justify-content:space-between;padding:4px 0;}
    .info-grid .right .row .lbl{color:#6b7280;}
    .info-grid .right .row .val{font-weight:700;}
    hr{border:none;border-top:1px solid #d1d5db;margin:20px 0;}
    .billed-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;}
    .section-title{font-size:12px;font-weight:800;letter-spacing:1px;margin-bottom:10px;}
    .billed-to{font-size:12px;line-height:1.7;color:#374151;}
    .summary-box{border:1px solid #d1d5db;padding:16px;border-radius:2px;}
    .summary-box .st{font-size:12px;font-weight:800;letter-spacing:1px;margin-bottom:8px;}
    .summary-box p{font-size:11px;line-height:1.6;color:#4b5563;margin:0;}
    table.items{width:100%;border-collapse:collapse;margin-bottom:20px;}
    table.items thead th{text-align:left;padding:10px 8px;font-size:11px;font-weight:800;letter-spacing:0.5px;border-bottom:2px solid #111827;color:#111827;}
    table.items thead th.num{text-align:center;}
    table.items thead th.right{text-align:right;}
    .totals-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px;}
    .payment-info .pi-title{font-size:12px;font-weight:800;letter-spacing:1px;margin-bottom:8px;}
    .payment-info p{font-size:11px;color:#4b5563;line-height:1.6;margin:0 0 6px;}
    .totals .trow{display:flex;justify-content:space-between;padding:6px 0;font-size:12px;}
    .totals .trow .lbl{color:#6b7280;}
    .totals .divider{border-top:1px solid #d1d5db;margin:6px 0;}
    .totals .total{font-weight:800;font-size:13px;}
    .totals .paid{color:#4b5563;}
    .totals .due{background:#dcfce7;padding:10px 12px;font-weight:800;font-size:14px;color:#111827;margin-top:8px;display:flex;justify-content:space-between;}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#6b7280;}
    .footer strong{color:#111827;}
    @media print{body{padding:20px;}}
  </style></head><body>

    <div class="top">
      <div class="brand">
        <div class="logo">A</div>
        <div>
          <div class="name">AJMS</div>
          <div class="tag">Apartemen Jarrdin Management System</div>
        </div>
      </div>
      <div class="invoice-title">INVOICE</div>
    </div>

    <div class="info-grid">
      <div class="left">
        <strong>Badan Pengelola PPPSRS The Jarrdin</strong><br/>
        Jl. Cihampelas No.160,<br/>
        Cipaganti, Kec. Coblong,<br/>
        Kota Bandung, Jawa Barat 40131<br/>
        Indonesia
      </div>
      <div class="right">
        <div class="row"><span class="lbl">Invoice #</span><span class="val">${refNo}</span></div>
        <div class="row"><span class="lbl">Invoice Date</span><span class="val">${tglLong}</span></div>
        <div class="row"><span class="lbl">Due Date</span><span class="val">${dueLong}</span></div>
        <div class="row"><span class="lbl">Status</span><span class="val" style="color:${statusColor};">${statusText}</span></div>
        <div class="row"><span class="lbl">Order / Project #</span><span class="val">${projectNo}</span></div>
      </div>
    </div>

    <hr/>

    <div class="billed-grid">
      <div>
        <div class="section-title">BILLED TO</div>
        <div class="billed-to">
          ${p.penanggung_jawab || "Badan Pengelola AJMS"}<br/>
          The Jarrdin Cihampelas<br/>
          Bandung, Jawa Barat<br/>
          Indonesia
        </div>
      </div>
      <div>
        <div class="summary-box">
          <div class="st">PROJECT SUMMARY</div>
          <p>${isAktivasi
            ? "Invoice ini mencakup biaya aktivasi & lisensi sistem AJMS untuk periode 1 (satu) tahun, termasuk pemeliharaan, pembaruan sistem, dan dukungan teknis."
            : "Invoice ini mencakup biaya operasional bulanan sistem AJMS, termasuk hosting, maintenance, dan dukungan teknis untuk periode 1 (satu) bulan."}
          </p>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="num" style="width:40px;">NO.</th>
          <th style="width:22%;">DESCRIPTION</th>
          <th>DETAILS</th>
          <th class="num" style="width:60px;">QTY</th>
          <th class="right" style="width:130px;">UNIT PRICE (IDR)</th>
          <th class="right" style="width:130px;">AMOUNT (IDR)</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals-grid">
      <div class="payment-info">
        <div class="pi-title">PAYMENT INFORMATION</div>
        <p>${p.status === "berhasil" ? "Pembayaran telah diterima penuh." : p.status === "pending" ? "Pembayaran sedang diproses." : "Pembayaran belum diterima."}</p>
        <p>Terima kasih atas kepercayaan Anda.</p>
        <p style="margin-top:10px;"><strong>Payment Method:</strong> Midtrans (AndreaPrint)</p>
        ${p.notes ? `<p style="margin-top:6px;"><strong>Catatan:</strong> ${p.notes}</p>` : ""}
      </div>
      <div class="totals">
        <div class="trow"><span class="lbl">SUBTOTAL</span><span>${fmt(nominal)}</span></div>
        <div class="trow"><span class="lbl">DISCOUNT</span><span>IDR 0.00</span></div>
        <div class="trow"><span class="lbl">TAX (0%)</span><span>IDR 0.00</span></div>
        <div class="divider"></div>
        <div class="trow total"><span>TOTAL</span><span>${fmt(nominal)}</span></div>
        <div class="trow paid"><span>AMOUNT PAID</span><span>(${fmt(paid)})</span></div>
        <div class="due"><span>AMOUNT DUE</span><span>${fmt(due)}</span></div>
      </div>
    </div>

    <div class="footer">
      Invoice ini sah dan berlaku sebagai bukti pembayaran yang sah.<br/>
      <strong>Badan Pengelola PPPSRS The Jarrdin — Sistem AJMS</strong>
    </div>

    <script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>
  </body></html>`;
  const w = window.open("", "_blank", "width=960,height=800");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}


export default function AktivasiSistem() {
  const { isSuperAdmin, isAdmin, isStaff, role, isLoading: authLoading, isMasterDev } = useAuth();
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { data: payments, isLoading: paymentsLoading } = useSystemPayments();
  const toggleStatus = useToggleSystemStatus();
  const deletePayment = useDeletePayment();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const setMonthlyStatus = useSetMonthlyStatus();
  const { toast } = useToast();
  const [payingType, setPayingType] = useState<string | null>(null);
  const [rincianDialog, setRincianDialog] = useState<"aktivasi" | "bulanan" | null>(null);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const canAccessPayment = isSuperAdmin || isAdmin || role === "staff_tro" || role === "staff_finance";
  const canDownloadReceipt = isMasterDev || isSuperAdmin || isAdmin || role === "staff_finance";

  if (!canAccessPayment) {
    return <Navigate to="/" replace />;
  }

  const isAktif = systemStatus?.system_status === "aktif";

  const handlePayment = async (jenis: "aktivasi" | "bulanan") => {
    setPayingType(jenis);
    try {
      const { data, error } = await supabase.functions.invoke("create-doku-transaction", {
        body: { jenis_pembayaran: jenis },
      });

      if (error) throw error;

      // Kirim notifikasi jika biaya bulanan
      if (jenis === "bulanan") {
        await sendBulananNotification();
        toast({
          title: "Notifikasi terkirim",
          description: "Seluruh akun terkait (Admin, Staff Finance, Staff TRO) telah diberitahu tentang pembayaran bulanan ini.",
        });
      }

      if (data?.snap_token && (window as any).snap) {
        (window as any).snap.pay(data.snap_token, {
          onSuccess: () => {
            toast({ title: "Pembayaran berhasil!", description: "Terima kasih atas pembayaran Anda." });
          },
          onPending: () => {
            toast({ title: "Pembayaran pending", description: "Silakan selesaikan pembayaran Anda." });
          },
          onError: () => {
            toast({ title: "Pembayaran gagal", description: "Silakan coba lagi.", variant: "destructive" });
          },
          onClose: () => {
            setPayingType(null);
          },
        });
        return;
      }

      // Fallback: redirect URL
      if (data?.redirect_url) {
        window.open(data.redirect_url, "_blank");
        toast({ title: "Halaman pembayaran dibuka", description: "Silakan selesaikan pembayaran di tab baru" });
      } else {
        throw new Error("No payment token or URL received");
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast({
        title: "Gagal memulai pembayaran",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setPayingType(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const statusBadge = (status: string) => {
    switch (status) {
      case "berhasil":
        return <Badge variant="outline" className="text-primary border-primary/30"><CheckCircle2 className="w-3 h-3 mr-1" />Berhasil</Badge>;
      case "gagal":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Gagal</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aktivasi Sistem AJMS</h1>
          <p className="text-muted-foreground">Kelola status aktivasi dan pembayaran sistem</p>
        </div>

        {/* System Status Card - Master Dev, Super Admin, Admin */}
        {(isMasterDev || isSuperAdmin || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isAktif ? <Power className="w-5 h-5 text-primary" /> : <PowerOff className="w-5 h-5 text-destructive" />}
                Status Sistem
              </CardTitle>
              <CardDescription>Status operasional sistem AJMS saat ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isAktif ? "bg-primary animate-pulse" : "bg-destructive"}`} />
                  <span className="text-lg font-semibold">
                    {isLoading ? "Memuat..." : isAktif ? "Sistem Aktif" : "Sistem Tidak Aktif"}
                  </span>
                </div>

                {/* Tombol ON/OFF hanya untuk Master Dev */}
                {isMasterDev && (
                  <div className="flex gap-2 ml-auto">
                    {!isAktif ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="default">
                            <Power className="w-4 h-4 mr-2" />Aktifkan Sistem
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Aktifkan Sistem AJMS?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Semua fitur sistem akan berjalan normal setelah diaktifkan. Pastikan pembayaran aktivasi telah berhasil.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleStatus.mutate("aktif")}>
                              Ya, Aktifkan
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <PowerOff className="w-4 h-4 mr-2" />Nonaktifkan Sistem
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Nonaktifkan Sistem AJMS?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Fitur tagihan dan akses penghuni akan dibatasi (read only). Apakah Anda yakin?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toggleStatus.mutate("tidak_aktif")} className="bg-destructive hover:bg-destructive/90">
                              Ya, Nonaktifkan
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}
              </div>

              {systemStatus && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {systemStatus.activated_at && (
                    <div>Terakhir diaktifkan: {format(new Date(systemStatus.activated_at), "dd MMM yyyy HH:mm", { locale: idLocale })}</div>
                  )}
                  {systemStatus.deactivated_at && (
                    <div>Terakhir dinonaktifkan: {format(new Date(systemStatus.deactivated_at), "dd MMM yyyy HH:mm", { locale: idLocale })}</div>
                  )}
                </div>
        )}
            </CardContent>
          </Card>
        )}

        {/* Status Pembayaran Bulanan - HANYA Master Developer */}
        {isMasterDev && (() => {
          const currentMonthly = ((systemStatus as { monthly_status?: string } | null)?.monthly_status || "normal") as MonthlyStatus;
          const options: { value: MonthlyStatus; label: string; desc: string; cls: string; activeCls: string }[] = [
            { value: "normal", label: "Normal", desc: "Tidak menampilkan peringatan apapun", cls: "border-border", activeCls: "border-primary bg-primary/10" },
            { value: "peringatan", label: "🟡 Peringatan Pembayaran", desc: "Tampil banner kuning: belum bayar bulanan", cls: "border-border", activeCls: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30" },
            { value: "terlambat", label: "🟠 Pembayaran Terlambat", desc: "Tampil banner oranye: lewat jatuh tempo", cls: "border-border", activeCls: "border-orange-500 bg-orange-50 dark:bg-orange-950/30" },
            { value: "dibatasi", label: "🔴 Sistem Dibatasi", desc: "Tampil banner merah: sistem dibatasi", cls: "border-border", activeCls: "border-red-500 bg-red-50 dark:bg-red-950/30" },
          ];
          return (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="w-5 h-5 text-primary" />
                  Status Pembayaran Bulanan
                </CardTitle>
                <CardDescription>
                  Dikendalikan manual oleh <strong>Master Developer</strong>. Status ini menentukan banner peringatan yang muncul ke seluruh pengguna.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt) => {
                    const active = currentMonthly === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={setMonthlyStatus.isPending}
                        onClick={() => setMonthlyStatus.mutate(opt.value)}
                        className={`text-left p-3 rounded-lg border-2 transition ${active ? opt.activeCls : opt.cls + " hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                          {active && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  ✔ Master Developer: bisa mengubah status &nbsp;•&nbsp; ❌ Super Admin / Admin: tidak memiliki akses
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Payment Cards */}
        {canAccessPayment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biaya Aktivasi */}
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Biaya Aktivasi Tahunan
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setRincianDialog("aktivasi")}
                    title="Lihat rincian"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(6699000)}</p>
                <p className="text-xs text-muted-foreground">/ Tahun</p>
                <ul className="mt-3 space-y-1">
                  {AKTIVASI_ITEMS.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                  <li
                    className="text-xs text-primary cursor-pointer hover:underline pl-4"
                    onClick={() => setRincianDialog("aktivasi")}
                  >
                    + {AKTIVASI_ITEMS.length - 3} lainnya...
                  </li>
                </ul>
                <Button
                  className="mt-4 w-full"
                  onClick={() => handlePayment("aktivasi")}
                  disabled={!!payingType}
                >
                  {payingType === "aktivasi" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Bayar Aktivasi
                </Button>
              </CardContent>
            </Card>

            {/* Biaya Bulanan */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Biaya Operasional Bulanan
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setRincianDialog("bulanan")}
                    title="Lihat rincian"
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(1299000)}</p>
                <p className="text-xs text-muted-foreground">/ Bulan</p>
                <ul className="mt-3 space-y-1">
                  {BULANAN_ITEMS.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                  <li
                    className="text-xs text-primary cursor-pointer hover:underline pl-4"
                    onClick={() => setRincianDialog("bulanan")}
                  >
                    + {BULANAN_ITEMS.length - 3} lainnya...
                  </li>
                </ul>
                <Button
                  className="mt-3 w-full"
                  onClick={() => handlePayment("bulanan")}
                  disabled={!!payingType}
                >
                  {payingType === "bulanan" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                  Bayar Bulanan
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
            <CardDescription>Semua pembayaran aktivasi dan bulanan sistem</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !payments?.length ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada riwayat pembayaran</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Catatan</TableHead>
                      {(isMasterDev || canDownloadReceipt) && <TableHead className="w-[140px]">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.tanggal_bayar), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{p.jenis_pembayaran === "aktivasi" ? "Aktivasi" : "Bulanan"}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(Number(p.nominal))}</TableCell>
                        <TableCell>{statusBadge(p.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{p.notes || "-"}</TableCell>
                        {(isMasterDev || canDownloadReceipt) && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canDownloadReceipt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => printPaymentReceipt(p)}
                                  title="Download / Cetak Bukti Pembayaran"
                                >
                                  <Download className="w-4 h-4 mr-1" /> Bukti
                                </Button>
                              )}
                              {isMasterDev && (
                                <>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {p.status !== "berhasil" && (
                                        <DropdownMenuItem onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "berhasil" })}>
                                          <CheckCircle2 className="w-4 h-4 mr-2 text-primary" /> Ubah ke Berhasil
                                        </DropdownMenuItem>
                                      )}
                                      {p.status !== "pending" && (
                                        <DropdownMenuItem onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "pending" })}>
                                          <Clock className="w-4 h-4 mr-2 text-yellow-500" /> Ubah ke Pending
                                        </DropdownMenuItem>
                                      )}
                                      {p.status !== "gagal" && (
                                        <DropdownMenuItem onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "gagal" })}>
                                          <XCircle className="w-4 h-4 mr-2 text-destructive" /> Ubah ke Gagal
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Pembayaran?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Data pembayaran ini akan dihapus permanen. Apakah Anda yakin?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deletePayment.mutate(p.id)}
                                          className="bg-destructive hover:bg-destructive/90"
                                        >
                                          Ya, Hapus
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rincian Dialog */}
      {rincianDialog && (
        <RincianDialog
          open={!!rincianDialog}
          onClose={() => setRincianDialog(null)}
          type={rincianDialog}
        />
      )}
    </MainLayout>
  );
}
