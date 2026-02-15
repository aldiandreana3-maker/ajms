import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemStatus, useToggleSystemStatus, useSystemPayments, useDeletePayment } from "@/hooks/useSystemActivation";
import { Power, PowerOff, CheckCircle2, XCircle, Clock, Loader2, CreditCard, History, ShieldAlert, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

export default function AktivasiSistem() {
  const { isSuperAdmin, isStaff, isLoading: authLoading, session } = useAuth();
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { data: payments, isLoading: paymentsLoading } = useSystemPayments();
  const toggleStatus = useToggleSystemStatus();
  const deletePayment = useDeletePayment();
  const { toast } = useToast();
  const [payingType, setPayingType] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Load Midtrans Snap.js from backend config (force fresh load)
  useEffect(() => {
    const loadSnap = async () => {
      try {
        // Remove any existing snap script to force reload with latest config
        const existingScript = document.querySelector('script[src*="snap.js"]');
        if (existingScript) {
          existingScript.remove();
          delete window.snap;
        }

        const { data, error } = await supabase.functions.invoke("midtrans-config");
        if (error || !data?.client_key) return;

        const script = document.createElement("script");
        script.src = `${data.snap_url}?t=${Date.now()}`;
        script.setAttribute("data-client-key", data.client_key);
        script.onload = () => setSnapLoaded(true);
        document.head.appendChild(script);
      } catch (err) {
        console.error("Failed to load Midtrans:", err);
      }
    };
    loadSnap();
  }, []);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Only staff+ can access
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  const isAktif = systemStatus?.system_status === "aktif";

  const handlePayment = async (jenis: "aktivasi" | "bulanan") => {
    setPayingType(jenis);
    try {
      const { data, error } = await supabase.functions.invoke("create-midtrans-transaction", {
        body: { jenis_pembayaran: jenis },
      });

      if (error) throw error;
      if (!data?.token) throw new Error("No payment token received");

      if (!window.snap) {
        toast({ title: "Midtrans belum siap", description: "Silakan coba lagi dalam beberapa detik", variant: "destructive" });
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: () => {
          toast({ title: "Pembayaran berhasil!" });
          window.location.reload();
        },
        onPending: () => {
          toast({ title: "Pembayaran pending", description: "Silakan selesaikan pembayaran Anda" });
        },
        onError: () => {
          toast({ title: "Pembayaran gagal", variant: "destructive" });
        },
        onClose: () => {
          toast({ title: "Pembayaran dibatalkan", variant: "destructive" });
        },
      });
    } catch (err) {
      console.error("Payment error:", err);
      toast({ title: "Gagal memulai pembayaran", description: err instanceof Error ? err.message : "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setPayingType(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const statusBadge = (status: string) => {
    switch (status) {
      case "berhasil":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" />Berhasil</Badge>;
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
                {isAktif ? <Power className="w-5 h-5 text-green-500" /> : <PowerOff className="w-5 h-5 text-destructive" />}
                Status Sistem
              </CardTitle>
              <CardDescription>Status operasional sistem AJMS saat ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${isAktif ? "bg-green-500 animate-pulse" : "bg-destructive"}`} />
                  <span className="text-lg font-semibold">
                    {isLoading ? "Memuat..." : isAktif ? "Sistem Aktif" : "Sistem Tidak Aktif"}
                  </span>
                </div>

                <div className="flex gap-2 ml-auto">
                  {!isAktif ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
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
                          <AlertDialogAction onClick={() => toggleStatus.mutate("aktif")} className="bg-green-600 hover:bg-green-700">
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

        {/* Payment Cards with Midtrans - Super Admin Only */}
        {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />Biaya Aktivasi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(6699000)}</p>
              <p className="text-sm text-muted-foreground mt-1">Pembayaran satu kali untuk mengaktifkan sistem</p>
              <Button
                className="mt-4 w-full bg-green-600 hover:bg-green-700"
                onClick={() => handlePayment("aktivasi")}
                disabled={payingType === "aktivasi" || !snapLoaded}
              >
                {payingType === "aktivasi" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                Bayar Aktivasi
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />Biaya Bulanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(1299000)}</p>
              <p className="text-sm text-muted-foreground mt-1">Biaya pemeliharaan bulanan sistem</p>
              <Button
                className="mt-4 w-full"
                onClick={() => handlePayment("bulanan")}
                disabled={payingType === "bulanan" || !snapLoaded}
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
    </MainLayout>
  );
}
