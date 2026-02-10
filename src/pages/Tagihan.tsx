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
import { useBills, useCreateBill, useUpdateBillPayment } from "@/hooks/useBills";
import { useUnits } from "@/hooks/useUnits";
import { useAuth } from "@/contexts/AuthContext";
import { BillRatesCard } from "@/components/tagihan/BillRatesCard";
import { GenerateBillDialog } from "@/components/tagihan/GenerateBillDialog";
import { BillTable } from "@/components/tagihan/BillTable";
import { Receipt, Plus, Loader2, CheckCircle, ShieldAlert } from "lucide-react";

export default function Tagihan() {
  const { isAdmin, isSuperAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const { data: bills, isLoading } = useBills();
  const { units } = useUnits();
  const createMutation = useCreateBill();
  const payMutation = useUpdateBillPayment();

  const [isOpen, setIsOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");

  const [form, setForm] = useState({
    unit_id: "",
    bill_type: "air" as "ipl" | "kebersihan" | "keamanan" | "sinking_fund" | "listrik" | "air" | "denda" | "perbaikan",
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
    await createMutation.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
      notes: form.notes || undefined,
    });
    setIsOpen(false);
    setForm({ unit_id: "", bill_type: "air", amount: "", billing_period: "", due_date: "", notes: "" });
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

          <div className="flex gap-2">
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
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={form.unit_id} onValueChange={(v) => setForm({ ...form, unit_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih unit" /></SelectTrigger>
                      <SelectContent>
                        {units?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jenis Tagihan</Label>
                    <Select value={form.bill_type} onValueChange={(v) => setForm({ ...form, bill_type: v as typeof form.bill_type })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="listrik">Listrik</SelectItem>
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

        {/* Bill Rates Configuration */}
        <BillRatesCard />

        {/* Bills List */}
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
                  <BillTable bills={unpaidBills} onPay={(id, amount) => { setPayingId(id); setPayAmount(amount.toString()); }} />
                </TabsContent>
                <TabsContent value="paid" className="mt-4">
                  <BillTable bills={paidBills} />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <BillTable bills={bills || []} onPay={(id, amount) => { setPayingId(id); setPayAmount(amount.toString()); }} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Payment Confirmation Dialog */}
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
