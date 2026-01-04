import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBills, useCreateBill, useUpdateBillPayment, useGenerateMonthlyBills } from "@/hooks/useBills";
import { useUnits } from "@/hooks/useUnits";
import { Receipt, Plus, Loader2, Zap, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const billTypeLabels: Record<string, string> = {
  ipl: "IPL",
  kebersihan: "Kebersihan",
  keamanan: "Keamanan",
  sinking_fund: "Sinking Fund",
  listrik: "Listrik",
  air: "Air",
  denda: "Denda",
  perbaikan: "Perbaikan",
};

const statusColors = {
  unpaid: "bg-warning/20 text-warning border-warning/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Tagihan() {
  const { isAdmin } = useAuth();
  const { data: bills, isLoading } = useBills();
  const { units } = useUnits();
  const createMutation = useCreateBill();
  const payMutation = useUpdateBillPayment();
  const generateMutation = useGenerateMonthlyBills();

  const [isOpen, setIsOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
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

  const [generateForm, setGenerateForm] = useState({
    billing_period: "",
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      ...form,
      amount: parseFloat(form.amount),
      notes: form.notes || undefined,
    });
    setIsOpen(false);
    setForm({
      unit_id: "",
      bill_type: "air",
      amount: "",
      billing_period: "",
      due_date: "",
      notes: "",
    });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateMutation.mutateAsync(generateForm);
    setIsGenerateOpen(false);
  };

  const handlePay = async () => {
    if (payingId && payAmount) {
      await payMutation.mutateAsync({
        id: payingId,
        paid_amount: parseFloat(payAmount),
      });
      setPayingId(null);
      setPayAmount("");
    }
  };

  const unpaidBills = bills?.filter((b) => b.payment_status === "unpaid") || [];
  const paidBills = bills?.filter((b) => b.payment_status === "paid") || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Receipt className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sistem Tagihan</h1>
              <p className="text-muted-foreground">Kelola tagihan penghuni</p>
            </div>
          </div>

          <div className="flex gap-2">
            {isAdmin && (
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Otomatis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Generate Tagihan Bulanan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sistem akan generate tagihan IPL, Kebersihan, Keamanan, dan Sinking Fund untuk semua unit yang terisi.
                    </p>
                    <div className="space-y-2">
                      <Label>Periode Tagihan</Label>
                      <Input
                        type="date"
                        value={generateForm.billing_period}
                        onChange={(e) => setGenerateForm({ ...generateForm, billing_period: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jatuh Tempo</Label>
                      <Input
                        type="date"
                        value={generateForm.due_date}
                        onChange={(e) => setGenerateForm({ ...generateForm, due_date: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
                      {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Generate
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}

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
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
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
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="500000"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Periode</Label>
                      <Input
                        type="date"
                        value={form.billing_period}
                        onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Jatuh Tempo</Label>
                      <Input
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Catatan tambahan..."
                      rows={2}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Simpan
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

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
                  <BillTable
                    bills={unpaidBills}
                    formatCurrency={formatCurrency}
                    onPay={(id, amount) => {
                      setPayingId(id);
                      setPayAmount(amount.toString());
                    }}
                  />
                </TabsContent>
                <TabsContent value="paid" className="mt-4">
                  <BillTable bills={paidBills} formatCurrency={formatCurrency} />
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  <BillTable
                    bills={bills || []}
                    formatCurrency={formatCurrency}
                    onPay={(id, amount) => {
                      setPayingId(id);
                      setPayAmount(amount.toString());
                    }}
                  />
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
                <Input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
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

interface Bill {
  id: string;
  units?: { unit_number: string } | null;
  bill_type: string;
  amount: number;
  billing_period: string;
  due_date: string;
  payment_status: "unpaid" | "paid" | "overdue";
  paid_amount: number | null;
  is_auto_generated: boolean;
}

function BillTable({ 
  bills, 
  formatCurrency, 
  onPay 
}: { 
  bills: Bill[]; 
  formatCurrency: (n: number) => string;
  onPay?: (id: string, amount: number) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Unit</TableHead>
          <TableHead>Jenis</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead>Jatuh Tempo</TableHead>
          <TableHead>Jumlah</TableHead>
          <TableHead>Status</TableHead>
          {onPay && <TableHead>Aksi</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((b) => (
          <TableRow key={b.id}>
            <TableCell>{b.units?.unit_number || "-"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {billTypeLabels[b.bill_type] || b.bill_type}
                {b.is_auto_generated && (
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>{format(new Date(b.billing_period), "MMM yyyy")}</TableCell>
            <TableCell>{format(new Date(b.due_date), "dd/MM/yyyy")}</TableCell>
            <TableCell className="font-medium">{formatCurrency(b.amount)}</TableCell>
            <TableCell>
              <Badge className={statusColors[b.payment_status]}>
                {b.payment_status === "unpaid" ? "Belum Bayar" : b.payment_status === "paid" ? "Lunas" : "Terlambat"}
              </Badge>
            </TableCell>
            {onPay && (
              <TableCell>
                {b.payment_status === "unpaid" && (
                  <Button variant="outline" size="sm" onClick={() => onPay(b.id, b.amount)}>
                    Bayar
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
        {bills.length === 0 && (
          <TableRow>
            <TableCell colSpan={onPay ? 7 : 6} className="text-center text-muted-foreground py-8">
              Tidak ada tagihan
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
