import { MainLayout } from "@/components/layout/MainLayout";
import { Building2, Users, Award, Target } from "lucide-react";

const TentangKami = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Tentang Kami</h1>
          <p className="text-muted-foreground text-lg">
            AJMS - Sistem Manajemen Properti Terpercaya
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Visi Kami</h3>
            <p className="text-muted-foreground">
              Menjadi sistem manajemen properti terdepan yang memberikan solusi
              terintegrasi untuk pengelolaan rusunami modern di Indonesia.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-success-light" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Misi Kami</h3>
            <p className="text-muted-foreground">
              Menyediakan platform yang efisien, transparan, dan mudah digunakan
              untuk meningkatkan kualitas hidup penghuni apartemen.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-info flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-info-light" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Tim Kami</h3>
            <p className="text-muted-foreground">
              Didukung oleh tim profesional berpengalaman dalam bidang properti
              dan teknologi informasi.
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-warning-light" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Pengalaman</h3>
            <p className="text-muted-foreground">
              Lebih dari 10 tahun pengalaman dalam mengelola berbagai properti
              residensial di seluruh Indonesia.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TentangKami;
