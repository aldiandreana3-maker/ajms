import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Zap, Search, Printer, Save, ShoppingCart } from "lucide-react";
import { useElectricMeters } from "@/hooks/useElectricMeters";
import { useElectricTransactions } from "@/hooks/useElectricTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export default function KasirListrik() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { meters } = useElectricMeters();
  const { createTransaction } = useElectricTransactions();

  const [selectedMeterId, setSelectedMeterId] = useState("");
  const [nominal, setNominal] = useState("");
  const [notes, setNotes] = useState("");
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);
  const nominalNum = parseFloat(nominal) || 0;
  const pricePerKwh = selectedMeter?.price_per_kwh ?? 1444.70;
  const kwhAmount = nominalNum > 0 ? Math.floor((nominalNum / pricePerKwh) * 100) / 100 : 0;
  const balanceBefore = selectedMeter?.kwh_balance ?? 0;
  const balanceAfter = balanceBefore + kwhAmount;

  const handleProcess = async () => {
    if (!selectedMeter || nominalNum <= 0) return;

    const txData = {
      meter_id: selectedMeter.id,
      unit_id: selectedMeter.unit_id,
      unit_number: selectedMeter.unit_number,
      penghuni_name: selectedMeter.penghuni_name,
      meter_number: selectedMeter.meter_number,
      nominal: nominalNum,
      price_per_kwh: pricePerKwh,
      kwh_amount: kwhAmount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      operator_id: user?.id,
      operator_name: profile?.full_name || user?.email || "Kasir",
      notes: notes || null,
    };

    const result = await createTransaction.mutateAsync(txData);
    if (result) {
      setLastReceipt({ ...txData, id: result.id, transaction_date: new Date().toISOString() });
      setNominal("");
      setNotes("");
      setSelectedMeterId("");
    }
  };

  const handlePrint = () => {
    if (!lastReceipt) return;
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Struk Listrik</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; font-size: 12px; }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        h2 { margin: 4px 0; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="center">
        <h2>AJMS</h2>
        <p>Apartemen Jarrdin Cihampelas</p>
        <p><strong>STRUK PEMBELIAN LISTRIK</strong></p>
      </div>
      <div class="line"></div>
      <div class="row"><span>Tanggal</span><span>${new Date(lastReceipt.transaction_date).toLocaleString("id-ID")}</span></div>
      <div class="row"><span>Unit</span><span>${lastReceipt.unit_number}</span></div>
      <div class="row"><span>Penghuni</span><span>${lastReceipt.penghuni_name || "-"}</span></div>
      <div class="row"><span>No. Meter</span><span>${lastReceipt.meter_number}</span></div>
      <div class="line"></div>
      <div class="row"><span>Nominal</span><span>Rp ${lastReceipt.nominal.toLocaleString("id-ID")}</span></div>
      <div class="row"><span>Harga/kWh</span><span>Rp ${lastReceipt.price_per_kwh.toLocaleString("id-ID")}</span></div>
      <div class="row"><span>Jumlah kWh</span><span>${lastReceipt.kwh_amount.toFixed(2)} kWh</span></div>
      <div class="line"></div>
      <div class="row"><span>Saldo Sebelum</span><span>${lastReceipt.balance_before.toFixed(2)} kWh</span></div>
      <div class="row"><strong><span>Saldo Setelah</span></strong><strong><span>${lastReceipt.balance_after.toFixed(2)} kWh</span></strong></div>
      <div class="line"></div>
      <div class="row"><span>Kasir</span><span>${lastReceipt.operator_name}</span></div>
      ${lastReceipt.notes ? `<div class="row"><span>Catatan</span><span>${lastReceipt.notes}</span></div>` : ""}
      <div class="line"></div>
      <div class="center"><p>Terima kasih</p></div>
      <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kasir Listrik</h1>
              <p className="text-muted-foreground">Pembelian listrik prabayar penghuni</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Input Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Meter / Unit</Label>
                <Select value={selectedMeterId} onValueChange={setSelectedMeterId}>
                  <SelectTrigger>
                    <Search className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Cari unit / meter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {meters
                      .filter((m) => m.meter_status === "aktif")
                      .map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.unit_number} — {m.meter_number} ({m.penghuni_name || "N/A"})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMeter && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Unit</p>
                    <p className="font-medium text-foreground">{selectedMeter.unit_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Penghuni</p>
                    <p className="font-medium text-foreground">{selectedMeter.penghuni_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">No. Meter</p>
                    <p className="font-medium text-foreground">{selectedMeter.meter_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo kWh</p>
                    <p className="font-medium text-foreground">{selectedMeter.kwh_balance.toFixed(2)} kWh</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nominal Pembelian (Rp)</Label>
                <Input
                  type="number"
                  placeholder="Masukkan nominal..."
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Textarea
                  placeholder="Catatan transaksi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleProcess}
                disabled={!selectedMeter || nominalNum <= 0 || createTransaction.isPending}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {createTransaction.isPending ? "Memproses..." : "Proses Pembelian"}
              </Button>
            </CardContent>
          </Card>

          {/* Right: Preview / Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rincian Pembelian</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedMeter && nominalNum > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga per kWh</span>
                      <span className="font-medium text-foreground">Rp {pricePerKwh.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nominal</span>
                      <span className="font-medium text-foreground">Rp {nominalNum.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">kWh Didapat</span>
                      <span className="font-bold text-primary">{kwhAmount.toFixed(2)} kWh</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saldo Sebelum</span>
                        <span className="text-foreground">{balanceBefore.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="font-bold text-foreground">Saldo Setelah</span>
                        <span className="font-bold text-primary">{balanceAfter.toFixed(2)} kWh</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Pilih meter dan masukkan nominal untuk melihat rincian pembelian.
                  </p>
                )}
              </CardContent>
            </Card>

            {lastReceipt && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Printer className="w-5 h-5" />
                    Transaksi Terakhir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit</span>
                    <span className="text-foreground">{lastReceipt.unit_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nominal</span>
                    <span className="text-foreground">Rp {lastReceipt.nominal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">kWh</span>
                    <span className="text-foreground">{lastReceipt.kwh_amount.toFixed(2)} kWh</span>
                  </div>
                  <Button variant="outline" className="w-full mt-3" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Struk
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
