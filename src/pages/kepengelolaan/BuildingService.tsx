import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ArrowLeft, ArrowRight, ClipboardCheck, HardHat } from "lucide-react";

const services = [
  {
    icon: ClipboardCheck,
    title: "Laporan Inspeksi Lapangan",
    description: "Laporan hasil inspeksi dan perbaikan unit",
    path: "/kepengelolaan/laporan-inspeksi",
  },
];

export default function BuildingService() {
  const navigate = useNavigate();

  return (
    <ProtectedRoute requireStaff>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Kembali">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning text-warning-foreground flex items-center justify-center">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Building Service</h1>
                <p className="text-sm text-muted-foreground">
                  Layanan inspeksi & pemeliharaan unit/fasilitas gedung
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Card
                key={s.path}
                className="cursor-pointer transition-all hover:shadow-md hover:border-warning/50"
                onClick={() => navigate(s.path)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-warning text-warning-foreground flex items-center justify-center">
                      <s.icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-3 text-base">{s.title}</CardTitle>
                  <CardDescription className="text-sm">{s.description}</CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
