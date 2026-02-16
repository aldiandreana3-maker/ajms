import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemStatus, useToggleSystemStatus, useSystemPayments, useDeletePayment } from "@/hooks/useSystemActivation";
import { Power, PowerOff, CheckCircle2, XCircle, Clock, Loader2, CreditCard, History, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function AktivasiSistem() {
  const { isSuperAdmin, isStaff, isLoading: authLoading } = useAuth();
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { data: payments, isLoading: paymentsLoading } = useSystemPayments();
  const toggleStatus = useToggleSystemStatus();
  const deletePayment = useDeletePayment();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  const isAktif = systemStatus?.system_status === "aktif";

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

        {/* Payment Cards - Super Admin Only (Payment gateway belum dikonfigurasi) */}
        {isSuperAdmin && (
          <Card className="border-dashed border-muted-foreground/30">
            <CardContent className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Payment gateway sedang dalam proses migrasi ke DOKU</p>
              <p className="text-sm mt-1">Fitur pembayaran online akan segera tersedia kembali</p>
            </CardContent>
          </Card>
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
