import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemStatus, useToggleSystemStatus, useSystemPayments, useAddSystemPayment, useUpdatePaymentStatus } from "@/hooks/useSystemActivation";
import { Power, PowerOff, Plus, CheckCircle2, XCircle, Clock, Loader2, CreditCard, History } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Navigate } from "react-router-dom";

export default function AktivasiSistem() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const { data: systemStatus, isLoading } = useSystemStatus();
  const { data: payments, isLoading: paymentsLoading } = useSystemPayments();
  const toggleStatus = useToggleSystemStatus();
  const addPayment = useAddSystemPayment();
  const updatePaymentStatus = useUpdatePaymentStatus();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    jenis_pembayaran: "aktivasi" as "aktivasi" | "bulanan",
    nominal: "",
    tanggal_bayar: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "pending" as "pending" | "berhasil" | "gagal",
    notes: "",
  });

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const isAktif = systemStatus?.system_status === "aktif";

  const handleAddPayment = async () => {
    await addPayment.mutateAsync({
      jenis_pembayaran: paymentForm.jenis_pembayaran,
      nominal: Number(paymentForm.nominal),
      tanggal_bayar: paymentForm.tanggal_bayar,
      due_date: paymentForm.due_date || undefined,
      status: paymentForm.status,
      notes: paymentForm.notes || undefined,
    });
    setPaymentDialogOpen(false);
    setPaymentForm({
      jenis_pembayaran: "aktivasi",
      nominal: "",
      tanggal_bayar: new Date().toISOString().split("T")[0],
      due_date: "",
      status: "pending",
      notes: "",
    });
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

        {/* System Status Card */}
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
                  <div>Terakhir diaktifkan: {format(new Date(systemStatus.activated_at), "dd MMM yyyy HH:mm", { locale: id })}</div>
                )}
                {systemStatus.deactivated_at && (
                  <div>Terakhir dinonaktifkan: {format(new Date(systemStatus.deactivated_at), "dd MMM yyyy HH:mm", { locale: id })}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
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
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Riwayat Pembayaran</CardTitle>
                <CardDescription>Semua pembayaran aktivasi dan bulanan sistem</CardDescription>
              </div>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Tambah Pembayaran</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tambah Pembayaran</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Jenis Pembayaran</label>
                      <Select value={paymentForm.jenis_pembayaran} onValueChange={(v) => setPaymentForm(p => ({ ...p, jenis_pembayaran: v as "aktivasi" | "bulanan", nominal: v === "aktivasi" ? "6699000" : "1299000" }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aktivasi">Aktivasi (Rp 6.699.000)</SelectItem>
                          <SelectItem value="bulanan">Bulanan (Rp 1.299.000)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Nominal</label>
                      <Input type="number" value={paymentForm.nominal} onChange={e => setPaymentForm(p => ({ ...p, nominal: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tanggal Bayar</label>
                      <Input type="date" value={paymentForm.tanggal_bayar} onChange={e => setPaymentForm(p => ({ ...p, tanggal_bayar: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Jatuh Tempo (opsional)</label>
                      <Input type="date" value={paymentForm.due_date} onChange={e => setPaymentForm(p => ({ ...p, due_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm(p => ({ ...p, status: v as "pending" | "berhasil" | "gagal" }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="berhasil">Berhasil</SelectItem>
                          <SelectItem value="gagal">Gagal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Catatan (opsional)</label>
                      <Input value={paymentForm.notes} onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan pembayaran..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddPayment} disabled={!paymentForm.nominal || addPayment.isPending}>
                      {addPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Simpan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : !payments?.length ? (
              <div className="text-center py-8 text-muted-foreground">Belum ada riwayat pembayaran</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.tanggal_bayar), "dd MMM yyyy", { locale: id })}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.jenis_pembayaran === "aktivasi" ? "Aktivasi" : "Bulanan"}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(Number(p.nominal))}</TableCell>
                      <TableCell>{p.due_date ? format(new Date(p.due_date), "dd MMM yyyy", { locale: id }) : "-"}</TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{p.notes || "-"}</TableCell>
                      <TableCell>
                        {p.status === "pending" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-green-600 h-8" onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "berhasil" })}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive h-8" onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "gagal" })}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
