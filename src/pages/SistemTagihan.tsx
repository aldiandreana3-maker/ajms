import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useBillStatusCounts } from "@/hooks/useBills";
import { ServerBillTable } from "@/components/tagihan/ServerBillTable";
import { Receipt, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

export default function SistemTagihan() {
  const { user } = useAuth();
  const { data: counts } = useBillStatusCounts("air");

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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tagihan Air Saya</h1>
            <p className="text-muted-foreground">Tagihan pemakaian air unit Anda</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="unpaid">
              <TabsList>
                <TabsTrigger value="unpaid">Belum Bayar ({counts?.unpaid ?? 0})</TabsTrigger>
                <TabsTrigger value="partial">Sebagian ({counts?.partial ?? 0})</TabsTrigger>
                <TabsTrigger value="paid">Lunas ({counts?.paid ?? 0})</TabsTrigger>
                <TabsTrigger value="all">Semua ({counts?.all ?? 0})</TabsTrigger>
              </TabsList>
              <TabsContent value="unpaid" className="mt-4">
                <ServerBillTable status="unpaid" showInvoice billType="air" />
              </TabsContent>
              <TabsContent value="partial" className="mt-4">
                <ServerBillTable status="partial" showInvoice billType="air" />
              </TabsContent>
              <TabsContent value="paid" className="mt-4">
                <ServerBillTable status="paid" showInvoice billType="air" />
              </TabsContent>
              <TabsContent value="all" className="mt-4">
                <ServerBillTable status="all" showInvoice billType="air" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
