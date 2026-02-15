import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBills, useCreateBill, useUpdateBillPayment, useRevertBillPayment, useDeleteBill, useUpdateBill } from "@/hooks/useBills";
import { useAuth } from "@/contexts/AuthContext";
import { BillRatesCard } from "@/components/tagihan/BillRatesCard";
import { GenerateBillDialog } from "@/components/tagihan/GenerateBillDialog";
import { BillingStatementDialog } from "@/components/tagihan/BillingStatementDialog";
import { BillTable } from "@/components/tagihan/BillTable";
import { UnitCombobox } from "@/components/tagihan/UnitCombobox";
import { Receipt, Plus, Loader2, CheckCircle, ShieldAlert, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { format } from "date-fns";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function Tagihan() {
  const { isAdmin, isSuperAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const { data: bills, isLoading } = useBills();
  const createMutation = useCreateBill();
  const payMutation = useUpdateBillPayment();
  const revertMutation = useRevertBillPayment();
  const deleteMutation = useDeleteBill();
  const updateBillMutation = useUpdateBill();

  const [isOpen, setIsOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const [form, setForm] = useState({
    unit_number: "",
    bill_type: "ipl" as "ipl" | "kebersihan" | "keamanan" | "sinking_fund" | "listrik" | "air" | "denda" | "perbaikan",
    amount: "",
    billing_period: "",
    due_date: "",
    notes: "",
  });

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_number) return;
    await createMutation.mutateAsync({
      unit_number: form.unit_number,
      bill_type: form.bill_type,
      amount: parseFloat(form.amount),
      billing_period: form.billing_period,
      due_date: form.due_date,
      notes: form.notes || undefined,
    });
    setIsOpen(false);
    setForm({ unit_number: "", bill_type: "ipl", amount: "", billing_period: "", due_date: "", notes: "" });
  };

  const handlePay = async () => {
    if (payingId && payAmount) {
      await payMutation.mutateAsync({ id: payingId, paid_amount: parseFloat(payAmount) });
      setPayingId(null);
      setPayAmount("");
    }
  };

  const unpaidBills = bills?.filter((b) => b.payment_status === "unpaid") || [];
  const paidBills = bills?.filter((b) => b.payment_status === "paid") || [];

  // Recap totals for paid bills
  const totalPaidAmount = paidBills.reduce((sum, b) => sum + (b.paid_amount || b.amount), 0);
  const totalPaidSC = paidBills.filter(b => b.bill_type === "ipl").reduce((sum, b) => sum + (b.paid_amount || b.amount), 0);
  const totalPaidSF = paidBills.filter(b => b.bill_type === "sinking_fund").reduce((sum, b) => sum + (b.paid_amount || b.amount), 0);
  const totalPaidOther = totalPaidAmount - totalPaidSC - totalPaidSF;

  const handleExportPaid = () => {
    if (paidBills.length === 0) return;
    const rows = paidBills.map((b) => ({
      unit: b.units?.unit_number || (b as any).unit_number || "-",
      penghuni: b.penghuni?.full_name || "-",
      jenis: b.bill_type === "ipl" ? "Service Charge" : b.bill_type === "sinking_fund" ? "Sinking Fund" : b.bill_type,
      periode: b.billing_period,
      jatuh_tempo: b.due_date,
      jumlah_tagihan: b.amount,
      jumlah_dibayar: b.paid_amount || b.amount,
      tanggal_bayar: b.paid_at ? format(new Date(b.paid_at), "dd/MM/yyyy HH:mm") : "-",
      catatan: b.notes || "",
    }));
    exportToExcel({
      filename: `Tagihan_Lunas_${format(new Date(), "yyyyMMdd")}`,
      sheetName: "Tagihan Lunas",
      data: rows,
      columns: [
        { header: "Unit", key: "unit", width: 12 },
        { header: "Penghuni", key: "penghuni", width: 20 },
        { header: "Jenis", key: "jenis", width: 18 },
        { header: "Periode", key: "periode", width: 12 },
        { header: "Jatuh Tempo", key: "jatuh_tempo", width: 12 },
        { header: "Jumlah Tagihan", key: "jumlah_tagihan", width: 18 },
        { header: "Jumlah Dibayar", key: "jumlah_dibayar", width: 18 },
        { header: "Tanggal Bayar", key: "tanggal_bayar", width: 20 },
        { header: "Catatan", key: "catatan", width: 25 },
      ],
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Receipt className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sistem Tagihan</h1>
              <p className="text-muted-foreground">Kelola tagihan IPL penghuni</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <BillingStatementDialog />
            <GenerateBillDialog />
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tagihan Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tambah Tagihan Manual</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <UnitCombobox value={form.unit_number} onChange={(v) => setForm({ ...form, unit_number: v })} />
                  <div className="space-y-2">
                    <Label>Jenis Tagihan</Label>
                    <Select value={form.bill_type} onValueChange={(v) => setForm({ ...form, bill_type: v as typeof form.bill_type })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ipl">IPL</SelectItem>
                        <SelectItem value="kebersihan">Kebersihan</SelectItem>
                        <SelectItem value="keamanan">Keamanan</SelectItem>
                        <SelectItem value="sinking_fund">Sinking Fund</SelectItem>
                        <SelectItem value="listrik">Listrik</SelectItem>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="denda">Denda</SelectItem>
                        <SelectItem value="perbaikan">Perbaikan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah (Rp)</Label>
                    <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500000" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Periode</Label>
                      <Input type="date" value={form.billing_period} onChange={(e) => setForm({ ...form, billing_period: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Jatuh Tempo</Label>
                      <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <BillRatesCard />

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="unpaid">
                <TabsList>
                  <TabsTrigger value="unpaid">Belum Bayar ({unpaidBills.length})</TabsTrigger>
                  <TabsTrigger value="paid">Lunas ({paidBills.length})</TabsTrigger>
                  <TabsTrigger value="all">Semua ({bills?.length || 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="unpaid" className="mt-4">
                  <BillTable bills={unpaidBills} onPay={(id, amount) => { setPayingId(id); setPayAmount(amount.toString()); }} onRevert={(id) => revertMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onEdit={(id, data) => updateBillMutation.mutate({ id, ...data })} isDeleting={deleteMutation.isPending} isEditing={updateBillMutation.isPending} />
                </TabsContent>
                <TabsContent value="paid" className="mt-4 space-y-4">
                  {/* Recap Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Terkumpul</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaidAmount)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Service Charge (SC)</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaidSC)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Sinking Fund (SF)</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaidSF)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Lainnya</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(totalPaidOther)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleExportPaid} disabled={paidBills.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                  <BillTable bills={paidBills} onRevert={(id) => revertMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onEdit={(id, data) => updateBillMutation.mutate({ id, ...data })} isDeleting={deleteMutation.isPending} isEditing={updateBillMutation.isPending} />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <BillTable bills={bills || []} onPay={(id, amount) => { setPayingId(id); setPayAmount(amount.toString()); }} onRevert={(id) => revertMutation.mutate(id)} onDelete={(id) => deleteMutation.mutate(id)} onEdit={(id, data) => updateBillMutation.mutate({ id, ...data })} isDeleting={deleteMutation.isPending} isEditing={updateBillMutation.isPending} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!payingId} onOpenChange={(open) => !open && setPayingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jumlah Dibayar (Rp)</Label>
                <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <Button onClick={handlePay} disabled={payMutation.isPending} className="w-full">
                {payMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Konfirmasi Lunas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
