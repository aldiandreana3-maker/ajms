import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBillStatusCounts } from "@/hooks/useBills";
import { useAuth } from "@/contexts/AuthContext";
import { BillRatesCard } from "@/components/tagihan/BillRatesCard";
import { OutstandingBillsCard } from "@/components/tagihan/OutstandingBillsCard";
import { GenerateBillDialog } from "@/components/tagihan/GenerateBillDialog";
import { BillingStatementDialog } from "@/components/tagihan/BillingStatementDialog";
import { ManualBillDialog } from "@/components/tagihan/ManualBillDialog";
import { ServerBillTable } from "@/components/tagihan/ServerBillTable";
import { Receipt, ShieldAlert, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export default function Tagihan() {
  const { isAdmin, isSuperAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const { data: bills, isLoading } = useBills();

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

  const unpaidBills = bills?.filter((b) => b.payment_status === "unpaid") || [];
  const partialBills = bills?.filter((b) => b.payment_status === "partial") || [];
  const paidBills = bills?.filter((b) => b.payment_status === "paid") || [];

  // Recap totals for paid bills
  const totalPaidAmount = paidBills.reduce((sum, b) => sum + (b.paid_amount || b.total_amount), 0);
  const totalPaidSC = paidBills.reduce((sum, b) => sum + b.sc_total, 0);
  const totalPaidSF = paidBills.reduce((sum, b) => sum + b.sf_total, 0);

  const handleExportPaid = () => {
    if (paidBills.length === 0) return;
    const rows = paidBills.map((b) => ({
      unit: b.units?.unit_number || b.unit_number || "-",
      penghuni: b.penghuni?.full_name || "-",
      periode: b.quarter_label,
      sc_bulanan: b.sc_monthly,
      sf_bulanan: b.sf_monthly,
      lain_lain: Math.max(0, (b.total_amount || 0) - (b.sc_total || 0) - (b.sf_total || 0)),
      total_kuartal: b.total_amount,
      jumlah_dibayar: b.paid_amount || b.total_amount,
      tanggal_lunas: b.paid_at ? format(new Date(b.paid_at), "dd/MM/yyyy HH:mm") : "-",
      catatan: b.notes || "",
    }));
    exportToExcel({
      filename: `Tagihan_Lunas_${format(new Date(), "yyyyMMdd")}`,
      sheetName: "Tagihan Lunas",
      data: rows,
      columns: [
        { header: "Unit", key: "unit", width: 12 },
        { header: "Penghuni", key: "penghuni", width: 20 },
        { header: "Periode", key: "periode", width: 16 },
        { header: "SC/bulan", key: "sc_bulanan", width: 15 },
        { header: "SF/bulan", key: "sf_bulanan", width: 15 },
        { header: "Lain-lain", key: "lain_lain", width: 15 },
        { header: "Total", key: "total_kuartal", width: 18 },
        { header: "Jumlah Dibayar", key: "jumlah_dibayar", width: 18 },
        { header: "Tanggal Lunas", key: "tanggal_lunas", width: 20 },
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
              <p className="text-muted-foreground">Kelola tagihan IPL kuartalan penghuni</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <BillingStatementDialog />
            <ManualBillDialog />
            <GenerateBillDialog />
          </div>
        </div>

        <BillRatesCard />
        <OutstandingBillsCard />

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
                  <TabsTrigger value="partial">Sebagian ({partialBills.length})</TabsTrigger>
                  <TabsTrigger value="paid">Lunas ({paidBills.length})</TabsTrigger>
                  <TabsTrigger value="all">Semua ({bills?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="unpaid" className="mt-4">
                  <BillTable bills={unpaidBills} showInvoice />
                </TabsContent>

                <TabsContent value="partial" className="mt-4">
                  <BillTable bills={partialBills} showInvoice />
                </TabsContent>

                <TabsContent value="paid" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleExportPaid} disabled={paidBills.length === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </Button>
                  </div>
                  <BillTable bills={paidBills} showInvoice />
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                  <BillTable bills={bills || []} showInvoice />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
