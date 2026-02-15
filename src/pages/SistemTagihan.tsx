import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useBills } from "@/hooks/useBills";
import { BillTable } from "@/components/tagihan/BillTable";
import { Receipt, Loader2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export default function SistemTagihan() {
  const { user } = useAuth();
  const { data: bills, isLoading } = useBills();

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <LogIn className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Login Diperlukan</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Silakan login terlebih dahulu untuk melihat tagihan Anda.
          </p>
          <Button asChild>
            <Link to="/auth">Login</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const unpaidBills = bills?.filter((b) => b.payment_status === "unpaid") || [];
  const partialBills = bills?.filter((b) => b.payment_status === "partial") || [];
  const paidBills = bills?.filter((b) => b.payment_status === "paid") || [];

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sistem Tagihan</h1>
            <p className="text-muted-foreground">Tagihan unit Anda</p>
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
                <TabsContent value="paid" className="mt-4">
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
