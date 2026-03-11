import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCashier, UnitBill, CashierTransaction } from "@/hooks/useCashier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { exportToExcel } from "@/lib/exportExcel";
import {
  ArrowLeft, Ticket, Megaphone, ShoppingCart, LayoutDashboard,
  Printer, ShieldAlert, Volume2, DollarSign, Users, Clock, Search, ChevronsUpDown, Check, Loader2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function billTypeLabel(type: string) {
  const map: Record<string, string> = {
    ipl: "IPL (Iuran Pengelolaan Lingkungan)",
    air: "Air",
    listrik: "Listrik",
    denda: "Denda",
    lainnya: "Tagihan Lainnya",
  };
  return map[type] || type.toUpperCase();
}

// Generate unit options
interface UnitOption { label: string; value: string; }
function generateAllUnits(): UnitOption[] {
  const units: UnitOption[] = [];
  const towers = ["A", "B", "C", "D"];
  for (const tower of towers) {
    for (let floor = 1; floor <= 23; floor++) {
      for (let unit = 1; unit <= 35; unit++) {
        const floorStr = floor.toString().padStart(2, "0");
        const unitStr = unit.toString().padStart(2, "0");
        const code = `T${tower}${floorStr}${unitStr}`;
        units.push({ label: `Tower ${tower} Lt.${floor} Unit ${unit} (${code})`, value: code });
      }
    }
  }
  for (const tower of towers) {
    for (let num = 1; num <= 40; num++) {
      const code = `K-${tower}${num.toString().padStart(2, "0")}`;
      units.push({ label: `Komersial ${tower}-${num} (${code})`, value: code });
    }
  }
  return units;
}
const ALL_UNITS = generateAllUnits();

// Print queue ticket
function printQueueTicket(queueNumber: string) {
  const now = new Date();
  const dateStr = format(now, "dd MMMM yyyy", { locale: idLocale });
  const timeStr = format(now, "HH:mm:ss");
  const w = window.open("", "_blank", "width=320,height=480");
  if (!w) return;
  w.document.write(`
    <html><head><title>Nomor Antrian</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Segoe UI', sans-serif; text-align:center; padding:24px; background:#fff; }
      .title { font-size:14px; font-weight:600; letter-spacing:2px; color:#64748b; margin-bottom:8px; }
      .number { font-size:64px; font-weight:800; color:#0f172a; margin:16px 0; letter-spacing:4px; }
      .date { font-size:13px; color:#64748b; margin-bottom:4px; }
      .msg { font-size:12px; color:#94a3b8; margin-top:16px; border-top:1px dashed #e2e8f0; padding-top:12px; }
      .divider { border:none; border-top:2px dashed #e2e8f0; margin:12px 0; }
      @media print { body { padding:8px; } }
    </style></head><body>
    <div class="title">NOMOR ANTRIAN</div>
    <hr class="divider" />
    <div class="number">${queueNumber}</div>
    <hr class="divider" />
    <div class="date">${dateStr}</div>
    <div class="date">${timeStr}</div>
    <div class="msg">Silakan menunggu hingga nomor Anda dipanggil</div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>
  `);
  w.document.close();
}

// Print receipt - updated for unit-based billing
function printReceipt(tx: {
  transaction_id: string;
  queue_number: string;
  customer_name: string; // now stores unit_number
  items: { item_name: string; quantity: number; price: number; total: number }[];
  total_amount: number;
  payment_method: string;
  created_at: string;
}) {
  const now = new Date(tx.created_at);
  const dateStr = format(now, "dd MMMM yyyy HH:mm:ss", { locale: idLocale });
  const methodLabel = tx.payment_method === "transfer" ? "Transfer" : "QRIS";
  const itemsHtml = tx.items
    .map(
      (i) =>
        `<tr><td style="text-align:left">${i.item_name}</td><td style="text-align:right">${formatRupiah(i.total)}</td></tr>`
    )
    .join("");
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;
  w.document.write(`
    <html><head><title>Struk Pembayaran</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',sans-serif; padding:24px; background:#fff; font-size:13px; max-width:360px; margin:auto; }
      h2 { text-align:center; font-size:16px; margin-bottom:4px; }
      .sub { text-align:center; color:#64748b; font-size:12px; margin-bottom:12px; }
      .divider { border:none; border-top:1px dashed #cbd5e1; margin:10px 0; }
      .row { display:flex; justify-content:space-between; margin:4px 0; }
      table { width:100%; border-collapse:collapse; margin:8px 0; }
      th, td { padding:4px 2px; font-size:12px; }
      th { text-align:left; border-bottom:1px solid #e2e8f0; }
      .total-row { font-weight:700; font-size:15px; }
      .footer { text-align:center; color:#94a3b8; font-size:11px; margin-top:16px; }
      @media print { body { padding:8px; } }
    </style></head><body>
    <h2>STRUK PEMBAYARAN</h2>
    <div class="sub">LOKET FINANCE - AJMS</div>
    <hr class="divider"/>
    <div class="row"><span>No. Antrian</span><b>${tx.queue_number}</b></div>
    <div class="row"><span>ID Transaksi</span><b>${tx.transaction_id}</b></div>
    <div class="row"><span>No. Unit</span><b>${tx.customer_name}</b></div>
    <div class="row"><span>Tanggal</span><span>${dateStr}</span></div>
    <hr class="divider"/>
    <table><thead><tr><th>Tagihan</th><th style="text-align:right">Nominal</th></tr></thead>
    <tbody>${itemsHtml}</tbody></table>
    <hr class="divider"/>
    <div class="row total-row"><span>TOTAL</span><span>${formatRupiah(tx.total_amount)}</span></div>
    <div class="row"><span>Metode Pembayaran</span><span>${methodLabel}</span></div>
    <hr class="divider"/>
    <div class="footer">Terima kasih atas pembayaran Anda</div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>
  `);
  w.document.close();
}

// Play notification sound
function playCallSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.2);
    playTone(1100, 0.25, 0.2);
    playTone(880, 0.5, 0.3);
  } catch {}
}

export default function SistemKasir() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isStaff } = useAuth();
  const canAccess = isSuperAdmin || isAdmin || isStaff;
  const cashier = useCashier();

  // Unit search state
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  // Bills state
  const [unitBills, setUnitBills] = useState<UnitBill[]>([]);
  const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set());
  const [loadingBills, setLoadingBills] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [receiptDialog, setReceiptDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const filteredUnits = useMemo(() => {
    if (!unitSearch) return ALL_UNITS.slice(0, 50);
    const q = unitSearch.toLowerCase();
    return ALL_UNITS.filter((u) => u.label.toLowerCase().includes(q) || u.value.toLowerCase().includes(q)).slice(0, 50);
  }, [unitSearch]);

  const handleSelectUnit = async (unitCode: string) => {
    setSelectedUnit(unitCode);
    setUnitOpen(false);
    setUnitSearch("");
    setSelectedBillIds(new Set());
    setLoadingBills(true);
    try {
      const bills = await cashier.fetchUnitBills(unitCode);
      setUnitBills(bills);
    } catch {
      setUnitBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  const toggleBill = (billId: string) => {
    setSelectedBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(billId)) next.delete(billId);
      else next.add(billId);
      return next;
    });
  };

  const selectedBills = unitBills.filter((b) => selectedBillIds.has(b.id));
  const grandTotal = selectedBills.reduce((s, b) => s + Number(b.total_amount || b.amount), 0);

  const handleTakeQueue = async () => {
    const result = await cashier.takeQueue.mutateAsync();
    if (result) printQueueTicket(result.queue_number);
  };

  const handleCallNext = async () => {
    const result = await cashier.callNext.mutateAsync();
    if (result) playCallSound();
  };

  const handleSubmitPayment = async () => {
    if (!cashier.calledQueue || !selectedUnit || selectedBills.length === 0) return;

    const result = await cashier.completeTransaction.mutateAsync({
      queueId: cashier.calledQueue.id,
      queueNumber: cashier.calledQueue.queue_number,
      unitNumber: selectedUnit,
      selectedBills,
      paymentMethod,
    });

    if (result) {
      setLastReceipt({ ...result });
      setReceiptDialog(true);
      setSelectedUnit("");
      setUnitBills([]);
      setSelectedBillIds(new Set());
      setPaymentMethod("transfer");
    }
  };

  if (!user || !canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sistem Kasir</h1>
              <p className="text-muted-foreground">Antrian, pembayaran tagihan unit, dan struk otomatis</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1.5">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Antrian</span>
            </TabsTrigger>
            <TabsTrigger value="call" className="gap-1.5">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Panggil</span>
            </TabsTrigger>
            <TabsTrigger value="cashier" className="gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Kasir</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pemasukan Hari Ini</p>
                      <p className="text-xl font-bold">{formatRupiah(cashier.todayTotal)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <ShoppingCart className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transaksi</p>
                      <p className="text-xl font-bold">{cashier.transactions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Antrian Menunggu</p>
                      <p className="text-xl font-bold">{cashier.waitingQueues.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Selesai Dilayani</p>
                      <p className="text-xl font-bold">{cashier.completedQueues.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daftar Transaksi Hari Ini</CardTitle>
              </CardHeader>
              <CardContent>
                {cashier.transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Belum ada transaksi hari ini</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Transaksi</TableHead>
                          <TableHead>Antrian</TableHead>
                          <TableHead>No. Unit</TableHead>
                          <TableHead>Metode</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Waktu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashier.transactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="font-mono text-xs">{tx.transaction_id}</TableCell>
                            <TableCell><Badge variant="outline">{tx.queue_number}</Badge></TableCell>
                            <TableCell className="font-mono font-medium">{tx.customer_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {tx.payment_method === "transfer" ? "Transfer" : "QRIS"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(Number(tx.total_amount))}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {format(new Date(tx.created_at), "HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-2 border-dashed border-primary/30">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="p-6 bg-primary/10 rounded-full">
                    <Ticket className="w-16 h-16 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Ambil Nomor Antrian</h2>
                  <p className="text-muted-foreground text-center max-w-sm">
                    Tekan tombol di bawah untuk mengambil nomor antrian. Tiket akan dicetak otomatis.
                  </p>
                  <Button size="lg" className="text-lg px-8 py-6" onClick={handleTakeQueue} disabled={cashier.takeQueue.isPending}>
                    <Ticket className="w-5 h-5 mr-2" />
                    {cashier.takeQueue.isPending ? "Memproses..." : "Ambil Nomor Antrian"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Antrian Hari Ini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Menunggu</span>
                    <Badge variant="outline" className="text-yellow-600">{cashier.waitingQueues.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Dipanggil</span>
                    <Badge variant="outline" className="text-blue-600">
                      {cashier.calledQueue ? cashier.calledQueue.queue_number : "-"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Selesai</span>
                    <Badge variant="outline" className="text-green-600">{cashier.completedQueues.length}</Badge>
                  </div>
                  {cashier.waitingQueues.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Antrian menunggu:</p>
                      <div className="flex flex-wrap gap-2">
                        {cashier.waitingQueues.map((q) => (
                          <Badge key={q.id} variant="secondary" className="text-sm">{q.queue_number}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Call Tab */}
          <TabsContent value="call" className="space-y-4">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground p-8 sm:p-12 text-center">
                <p className="text-sm font-medium tracking-widest uppercase opacity-80 mb-2">Sekarang Dipanggil</p>
                <div className="text-7xl sm:text-9xl font-black tracking-wider my-6">
                  {cashier.calledQueue?.queue_number || "---"}
                </div>
                <div className="inline-flex items-center gap-2 bg-primary-foreground/20 rounded-full px-4 py-2">
                  <Megaphone className="w-4 h-4" />
                  <span className="text-sm font-semibold">LOKET: FINANCE</span>
                </div>
              </div>
              <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">
                    Antrian menunggu: <strong>{cashier.waitingQueues.length}</strong>
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleCallNext}
                  disabled={cashier.callNext.isPending || cashier.waitingQueues.length === 0}
                  className="gap-2"
                >
                  <Volume2 className="w-5 h-5" />
                  {cashier.callNext.isPending ? "Memanggil..." : "Panggil Nomor Berikutnya"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cashier Tab */}
          <TabsContent value="cashier" className="space-y-4">
            {!cashier.calledQueue ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Megaphone className="w-12 h-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-center">
                    Belum ada antrian yang dipanggil. Panggil nomor antrian terlebih dahulu di tab <strong>Panggil</strong>.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Kasir Pembayaran</CardTitle>
                        <Badge className="text-lg px-3 py-1">{cashier.calledQueue.queue_number}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Unit Search */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Search className="w-4 h-4" /> Cari Unit
                        </Label>
                        <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={unitOpen} className="w-full justify-between font-normal">
                              {selectedUnit
                                ? ALL_UNITS.find((u) => u.value === selectedUnit)?.label || selectedUnit
                                : "Ketik nomor unit... (cth: TA0110, TB0522)"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput placeholder="Cari unit... (cth: TA0110)" value={unitSearch} onValueChange={setUnitSearch} />
                              <CommandList>
                                <CommandEmpty>Unit tidak ditemukan</CommandEmpty>
                                <CommandGroup>
                                  {filteredUnits.map((u) => (
                                    <CommandItem
                                      key={u.value}
                                      value={u.value}
                                      onSelect={() => handleSelectUnit(u.value)}
                                    >
                                      <Check className={cn("mr-2 h-4 w-4", selectedUnit === u.value ? "opacity-100" : "opacity-0")} />
                                      {u.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Bills list */}
                      {selectedUnit && (
                        <div className="space-y-3">
                          <Label>Tagihan Unit {selectedUnit}</Label>
                          {loadingBills ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Memuat tagihan...</span>
                            </div>
                          ) : unitBills.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted rounded-lg">
                              Tidak ada tagihan yang belum dibayar untuk unit ini
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {unitBills.map((bill) => (
                                <div
                                  key={bill.id}
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                    selectedBillIds.has(bill.id) ? "bg-primary/5 border-primary/30" : "bg-muted/50 hover:bg-muted"
                                  )}
                                  onClick={() => toggleBill(bill.id)}
                                >
                                  <Checkbox
                                    checked={selectedBillIds.has(bill.id)}
                                    onCheckedChange={() => toggleBill(bill.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-medium text-sm">{billTypeLabel(bill.bill_type)}</span>
                                      <span className="font-bold text-sm">{formatRupiah(Number(bill.total_amount || bill.amount))}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {bill.quarter_label && (
                                        <Badge variant="outline" className="text-xs">{bill.quarter_label}</Badge>
                                      )}
                                      <Badge variant={bill.payment_status === "partial" ? "secondary" : "destructive"} className="text-xs">
                                        {bill.payment_status === "partial" ? "Sebagian" : "Belum Bayar"}
                                      </Badge>
                                    </div>
                                    {(bill.sc_total || bill.sf_total) && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        SC: {formatRupiah(Number(bill.sc_total || 0))} | SF: {formatRupiah(Number(bill.sf_total || 0))}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Method */}
                      {selectedBills.length > 0 && (
                        <div>
                          <Label>Metode Pembayaran</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transfer">🏦 Transfer</SelectItem>
                              <SelectItem value="qris">📱 QRIS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Summary Card */}
                <div className="space-y-4">
                  <Card className="sticky top-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Ringkasan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedUnit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unit</span>
                          <span className="font-mono font-bold">{selectedUnit}</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        {selectedBills.map((bill) => (
                          <div key={bill.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground truncate mr-2">{billTypeLabel(bill.bill_type)}</span>
                            <span className="whitespace-nowrap">{formatRupiah(Number(bill.total_amount || bill.amount))}</span>
                          </div>
                        ))}
                      </div>
                      {selectedBills.length > 0 && (
                        <>
                          <div className="border-t pt-3 flex justify-between items-center">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-xl text-primary">{formatRupiah(grandTotal)}</span>
                          </div>
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={handleSubmitPayment}
                            disabled={cashier.completeTransaction.isPending || grandTotal <= 0}
                          >
                            {cashier.completeTransaction.isPending ? "Memproses..." : "Selesai & Cetak Struk"}
                          </Button>
                        </>
                      )}
                      {selectedBills.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {selectedUnit ? "Pilih tagihan yang akan dibayar" : "Cari dan pilih unit terlebih dahulu"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialog} onOpenChange={setReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Transaksi Berhasil</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-3">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-green-700 dark:text-green-300 font-bold text-lg">✓ Pembayaran Diterima</p>
                <p className="text-2xl font-black text-green-800 dark:text-green-200 mt-1">
                  {formatRupiah(Number(lastReceipt.total_amount))}
                </p>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{lastReceipt.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Antrian</span>
                  <span>{lastReceipt.queue_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Unit</span>
                  <span className="font-mono font-bold">{lastReceipt.customer_name}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  printReceipt(lastReceipt);
                  setReceiptDialog(false);
                }}
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Struk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
