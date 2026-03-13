import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCashier, UnitBillWithPayments, BillPaymentItem, CashierTransaction } from "@/hooks/useCashier";
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
  ArrowLeft, Megaphone, ShoppingCart, LayoutDashboard,
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

// Print invoice-style receipt
function printInvoiceReceipt(data: {
  transaction_id: string;
  queue_number: string;
  unitNumber: string;
  payments: BillPaymentItem[];
  totalAmount: number;
  totalPaid: number;
  paymentMethod: string;
  created_at: string;
}) {
  const now = new Date(data.created_at);
  const dateStr = format(now, "dd MMMM yyyy", { locale: idLocale });
  const timeStr = format(now, "HH:mm:ss") + " WIB";
  const methodLabel = data.paymentMethod === "transfer" ? "Transfer" : "QRIS";

  const rowsHtml = data.payments.map((p) => `
    <tr>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;">${p.month_label}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(Number(p.sc_amount))}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(Number(p.sf_amount))}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(Number(p.total_amount))}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-size:12px;color:#16a34a;font-weight:600;">Terbayar</td>
    </tr>
  `).join("");

  const totalSC = data.payments.reduce((s, p) => s + Number(p.sc_amount), 0);
  const totalSF = data.payments.reduce((s, p) => s + Number(p.sf_amount), 0);

  const w = window.open("", "_blank", "width=700,height=900");
  if (!w) return;
  w.document.write(`
    <html><head><title>Invoice Pembayaran</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',sans-serif; padding:32px; background:#fff; font-size:13px; max-width:650px; margin:auto; }
      h1 { text-align:center; font-size:22px; letter-spacing:4px; font-weight:800; margin-bottom:4px; }
      .sub { text-align:center; color:#64748b; font-size:11px; margin-bottom:20px; }
      .section-title { font-size:11px; font-weight:700; color:#1e40af; letter-spacing:1px; margin-bottom:8px; margin-top:20px; }
      .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 40px; }
      .info-row { display:flex; justify-content:space-between; margin:3px 0; font-size:12px; }
      .info-row span:first-child { color:#64748b; }
      .info-row span:last-child { font-weight:600; }
      table { width:100%; border-collapse:collapse; margin:8px 0; }
      th { padding:6px 8px; border:1px solid #e2e8f0; background:#f8fafc; font-size:11px; text-align:center; font-weight:700; }
      .summary { border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-top:16px; }
      .summary-row { display:flex; justify-content:space-between; margin:4px 0; font-size:13px; }
      .summary-total { font-weight:800; font-size:15px; border-top:2px solid #1e293b; padding-top:8px; margin-top:8px; }
      .status-badge { display:inline-block; padding:6px 24px; border-radius:6px; font-weight:700; font-size:13px; margin:16px auto; text-align:center; }
      .status-paid { background:#dcfce7; color:#166534; border:1px solid #86efac; }
      .footer { text-align:center; color:#94a3b8; font-size:10px; margin-top:20px; border-top:1px solid #e2e8f0; padding-top:12px; }
      hr.divider { border:none; border-top:2px solid #1e293b; margin:16px 0; }
      @media print { body { padding:16px; } }
    </style></head><body>
    <h1>INVOICE</h1>
    <div class="sub">Apartment Management System</div>
    <hr class="divider"/>
    <div class="info-grid">
      <div>
        <div class="section-title">DATA PEMBAYARAN</div>
        <div class="info-row"><span>No. Unit</span><span>${data.unitNumber}</span></div>
        <div class="info-row"><span>No. Antrian</span><span>${data.queue_number}</span></div>
        <div class="info-row"><span>Metode</span><span>${methodLabel}</span></div>
      </div>
      <div>
        <div class="section-title">INFORMASI INVOICE</div>
        <div class="info-row"><span>ID Transaksi</span><span>${data.transaction_id}</span></div>
        <div class="info-row"><span>Tanggal</span><span>${dateStr}</span></div>
        <div class="info-row"><span>Jam</span><span>${timeStr}</span></div>
      </div>
    </div>
    <div class="section-title" style="margin-top:24px;">RINCIAN TAGIHAN YANG DIBAYAR</div>
    <table>
      <thead><tr>
        <th>BULAN</th><th>SERVICE CHARGE</th><th>SINKING FUND</th><th>TOTAL</th><th>STATUS</th>
      </tr></thead>
      <tbody>
        ${rowsHtml}
        <tr style="font-weight:700;background:#f8fafc;">
          <td style="padding:6px 8px;border:1px solid #e2e8f0;font-size:12px;font-weight:700;">TOTAL</td>
          <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(totalSC)}</td>
          <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(totalSF)}</td>
          <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;font-size:12px;">${formatRupiah(data.totalAmount)}</td>
          <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;font-size:12px;">${data.payments.length}/${data.payments.length}</td>
        </tr>
      </tbody>
    </table>
    <div class="summary">
      <div class="summary-row"><span>Total Tagihan</span><span>${formatRupiah(data.totalAmount)}</span></div>
      <div class="summary-row"><span>Total Terbayar</span><span>${formatRupiah(data.totalPaid)}</span></div>
      <div class="summary-row summary-total"><span>Sisa Tagihan</span><span style="color:#dc2626;">${formatRupiah(data.totalAmount - data.totalPaid)}</span></div>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <span class="status-badge status-paid">Lunas</span>
    </div>
    <div class="footer">
      Invoice dibuat pada: ${dateStr} pukul ${timeStr}<br/>
      Dokumen ini dicetak secara otomatis oleh sistem
    </div>
    <script>window.onload=function(){window.print();}</script>
    </body></html>
  `);
  w.document.close();
}

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

  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const [unitBills, setUnitBills] = useState<UnitBillWithPayments[]>([]);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const [loadingBills, setLoadingBills] = useState(false);

  const [txSearch, setTxSearch] = useState("");
  const [txDateFilter, setTxDateFilter] = useState<DateFilterType>("today");

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
    setSelectedPaymentIds(new Set());
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

  const togglePayment = (paymentId: string) => {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(paymentId)) next.delete(paymentId);
      else next.add(paymentId);
      return next;
    });
  };

  // Gather all unpaid monthly payments across all bills
  const allUnpaidPayments: BillPaymentItem[] = unitBills.flatMap((b) =>
    b.bill_payments.filter((p) => !p.is_paid)
  );
  const selectedPayments = allUnpaidPayments.filter((p) => selectedPaymentIds.has(p.id));
  const grandTotal = selectedPayments.reduce((s, p) => s + Number(p.total_amount), 0);

  const handleCallNext = async () => {
    const result = await cashier.callNext.mutateAsync();
    if (result) playCallSound();
  };

  const handleSubmitPayment = async () => {
    if (!cashier.calledQueue || !selectedUnit || selectedPayments.length === 0) return;

    const result = await cashier.completeTransaction.mutateAsync({
      queueId: cashier.calledQueue.id,
      queueNumber: cashier.calledQueue.queue_number,
      unitNumber: selectedUnit,
      selectedPayments,
      paymentMethod,
    });

    if (result) {
      setLastReceipt({
        ...result,
        unitNumber: selectedUnit,
        payments: selectedPayments,
        totalPaid: grandTotal,
      });
      setReceiptDialog(true);
      setSelectedUnit("");
      setUnitBills([]);
      setSelectedPaymentIds(new Set());
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
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
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
            {(() => {
              const dateFiltered = txDateFilter === "all"
                ? cashier.allTransactions
                : txDateFilter === "today"
                  ? cashier.transactions
                  : filterByDate(cashier.allTransactions, txDateFilter);
              const filteredTx = txSearch
                ? dateFiltered.filter((tx) =>
                    tx.transaction_id.toLowerCase().includes(txSearch.toLowerCase()) ||
                    tx.customer_name.toLowerCase().includes(txSearch.toLowerCase()) ||
                    tx.queue_number.toLowerCase().includes(txSearch.toLowerCase())
                  )
                : dateFiltered;
              const filteredTotal = filteredTx.reduce((s, t) => s + Number(t.total_amount), 0);

              const handleExport = () => {
                exportToExcel({
                  filename: `transaksi-kasir-${format(new Date(), "yyyy-MM-dd")}`,
                  sheetName: "Transaksi",
                  data: filteredTx.map((tx) => ({
                    ...tx,
                    total_formatted: formatRupiah(Number(tx.total_amount)),
                    method_label: tx.payment_method === "transfer" ? "Transfer" : "QRIS",
                    waktu: format(new Date(tx.created_at), "dd/MM/yyyy HH:mm"),
                  })),
                  columns: [
                    { header: "ID Transaksi", key: "transaction_id", width: 30 },
                    { header: "No. Antrian", key: "queue_number", width: 12 },
                    { header: "No. Unit", key: "customer_name", width: 12 },
                    { header: "Metode", key: "method_label", width: 12 },
                    { header: "Total", key: "total_formatted", width: 20 },
                    { header: "Tanggal", key: "waktu", width: 20 },
                  ],
                });
              };

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-primary/10 rounded-xl">
                            <DollarSign className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pemasukan (Filter)</p>
                            <p className="text-xl font-bold">{formatRupiah(filteredTotal)}</p>
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
                            <p className="text-xl font-bold">{filteredTx.length}</p>
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

                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredTx.length === 0}>
                          <Download className="w-4 h-4 mr-2" />
                          Export Excel
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DataFilterBar
                        searchValue={txSearch}
                        onSearchChange={setTxSearch}
                        dateFilter={txDateFilter}
                        onDateFilterChange={setTxDateFilter}
                        searchPlaceholder="Cari ID transaksi, unit, antrian..."
                      />
                      {filteredTx.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Tidak ada transaksi ditemukan</p>
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
                              {filteredTx.map((tx) => (
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
                                    {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm")}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
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

                      {/* Bills with monthly breakdown */}
                      {selectedUnit && (
                        <div className="space-y-4">
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
                            <div className="space-y-6">
                              {unitBills.map((bill) => (
                                <Card key={bill.id} className="border">
                                  <CardHeader className="py-3 px-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{billTypeLabel(bill.bill_type)}</span>
                                        {bill.quarter_label && (
                                          <Badge variant="outline" className="text-xs">{bill.quarter_label}</Badge>
                                        )}
                                      </div>
                                      <Badge variant={bill.payment_status === "partial" ? "secondary" : "destructive"} className="text-xs">
                                        {bill.payment_status === "partial" ? "Sebagian Terbayar" : "Belum Bayar"}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="px-4 pb-4 pt-0">
                                    {bill.bill_payments.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="w-10"></TableHead>
                                              <TableHead>Bulan</TableHead>
                                              <TableHead className="text-right">Service Charge</TableHead>
                                              <TableHead className="text-right">Sinking Fund</TableHead>
                                              <TableHead className="text-right">Total</TableHead>
                                              <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {bill.bill_payments.map((payment) => (
                                              <TableRow key={payment.id} className={cn(
                                                payment.is_paid ? "opacity-60" : "cursor-pointer hover:bg-muted/50",
                                                selectedPaymentIds.has(payment.id) && "bg-primary/5"
                                              )}
                                                onClick={() => !payment.is_paid && togglePayment(payment.id)}
                                              >
                                                <TableCell>
                                                  {!payment.is_paid && (
                                                    <Checkbox
                                                      checked={selectedPaymentIds.has(payment.id)}
                                                      onCheckedChange={() => togglePayment(payment.id)}
                                                    />
                                                  )}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{payment.month_label}</TableCell>
                                                <TableCell className="text-right text-sm">{formatRupiah(Number(payment.sc_amount))}</TableCell>
                                                <TableCell className="text-right text-sm">{formatRupiah(Number(payment.sf_amount))}</TableCell>
                                                <TableCell className="text-right text-sm font-medium">{formatRupiah(Number(payment.total_amount))}</TableCell>
                                                <TableCell className="text-center">
                                                  <Badge variant={payment.is_paid ? "default" : "destructive"} className={cn("text-xs", payment.is_paid && "bg-green-600")}>
                                                    {payment.is_paid ? "Terbayar" : "Belum Bayar"}
                                                  </Badge>
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                            {/* Total row */}
                                            <TableRow className="bg-muted/50 font-semibold">
                                              <TableCell></TableCell>
                                              <TableCell className="text-sm font-bold">TOTAL</TableCell>
                                              <TableCell className="text-right text-sm">{formatRupiah(Number(bill.sc_total || 0))}</TableCell>
                                              <TableCell className="text-right text-sm">{formatRupiah(Number(bill.sf_total || 0))}</TableCell>
                                              <TableCell className="text-right text-sm font-bold">{formatRupiah(Number(bill.total_amount || bill.amount))}</TableCell>
                                              <TableCell className="text-center text-xs">
                                                {bill.bill_payments.filter((p) => p.is_paid).length}/{bill.bill_payments.length}
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      /* Non-quarterly bill (no monthly breakdown) */
                                      <div
                                        className={cn(
                                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                          selectedPaymentIds.has(bill.id) ? "bg-primary/5 border-primary/30" : "bg-muted/50 hover:bg-muted"
                                        )}
                                        onClick={() => {
                                          // For non-quarterly bills, use bill.id as a pseudo-payment selection
                                          setSelectedPaymentIds((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(bill.id)) next.delete(bill.id);
                                            else next.add(bill.id);
                                            return next;
                                          });
                                        }}
                                      >
                                        <Checkbox
                                          checked={selectedPaymentIds.has(bill.id)}
                                          onCheckedChange={() => {
                                            setSelectedPaymentIds((prev) => {
                                              const next = new Set(prev);
                                              if (next.has(bill.id)) next.delete(bill.id);
                                              else next.add(bill.id);
                                              return next;
                                            });
                                          }}
                                        />
                                        <div className="flex-1 flex items-center justify-between">
                                          <span className="text-sm font-medium">{billTypeLabel(bill.bill_type)}</span>
                                          <span className="font-bold text-sm">{formatRupiah(Number(bill.total_amount || bill.amount))}</span>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment Method */}
                      {selectedPayments.length > 0 && (
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
                      <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedUnit && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Unit</span>
                          <span className="font-mono font-bold">{selectedUnit}</span>
                        </div>
                      )}
                      {selectedPayments.length > 0 && (
                        <div className="space-y-2">
                          {selectedPayments.map((p) => (
                            <div key={p.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground truncate mr-2">{p.month_label}</span>
                              <span className="whitespace-nowrap">{formatRupiah(Number(p.total_amount))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {selectedPayments.length > 0 ? (
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
                            {cashier.completeTransaction.isPending ? "Memproses..." : "Selesai & Cetak Invoice"}
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {selectedUnit ? "Pilih bulan tagihan yang akan dibayar" : "Cari dan pilih unit terlebih dahulu"}
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
                  <span className="font-mono font-bold">{lastReceipt.unitNumber || lastReceipt.customer_name}</span>
                </div>
                {lastReceipt.payments && (
                  <div className="border-t pt-2 mt-2 space-y-1">
                    {lastReceipt.payments.map((p: BillPaymentItem) => (
                      <div key={p.id} className="flex justify-between text-xs">
                        <span>{p.month_label}</span>
                        <span>{formatRupiah(Number(p.total_amount))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  printInvoiceReceipt({
                    transaction_id: lastReceipt.transaction_id,
                    queue_number: lastReceipt.queue_number,
                    unitNumber: lastReceipt.unitNumber || lastReceipt.customer_name,
                    payments: lastReceipt.payments || [],
                    totalAmount: Number(lastReceipt.total_amount),
                    totalPaid: Number(lastReceipt.totalPaid || lastReceipt.total_amount),
                    paymentMethod: lastReceipt.payment_method,
                    created_at: lastReceipt.created_at,
                  });
                  setReceiptDialog(false);
                }}
              >
                <Printer className="w-4 h-4 mr-2" /> Cetak Invoice
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
