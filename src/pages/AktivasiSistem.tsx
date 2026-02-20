import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemStatus, useToggleSystemStatus, useSystemPayments, useDeletePayment } from "@/hooks/useSystemActivation";
import { Power, PowerOff, CheckCircle2, XCircle, Clock, Loader2, CreditCard, History, Trash2, Info, CheckCircle, Server, Shield, Bell } from "lucide-react";
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

export default function AktivasiSistem() {
  const { isSuperAdmin, isAdmin, isStaff, role, isLoading: authLoading } = useAuth();
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { data: payments, isLoading: paymentsLoading } = useSystemPayments();
  const toggleStatus = useToggleSystemStatus();
  const deletePayment = useDeletePayment();
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

        {/* System Status Card - Super Admin Only */}
        {isSuperAdmin && (
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
                      {isSuperAdmin && <TableHead className="w-[60px]">Aksi</TableHead>}
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
                        {isSuperAdmin && (
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
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
