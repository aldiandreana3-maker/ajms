import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCashier } from "@/hooks/useCashier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

export default function AmbilAntrian() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cashier = useCashier();

  const handleTakeQueue = async () => {
    const result = await cashier.takeQueue.mutateAsync();
    if (result) printQueueTicket(result.queue_number);
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ambil Antrian</h1>
              <p className="text-muted-foreground">Ambil nomor antrian untuk layanan kasir</p>
            </div>
          </div>
        </div>

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
      </div>
    </MainLayout>
  );
}
