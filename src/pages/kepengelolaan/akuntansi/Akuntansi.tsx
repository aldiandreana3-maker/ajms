import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, ArrowLeft, BookOpen, FileText, Send, BarChart3, Scale, CheckCircle, List } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  {
    icon: List,
    title: "Daftar Akun",
    description: "Chart of Accounts",
    detail: "Kelola semua jenis akun keuangan: Kas, Bank, Utang, Modal, Pendapatan, Beban.",
    path: "/kepengelolaan/finance/akuntansi/daftar-akun",
  },
  {
    icon: FileText,
    title: "Jurnal Transaksi",
    description: "Catat pemasukan & pengeluaran",
    detail: "Mencatat semua transaksi keuangan berdasarkan tanggal dengan debit dan kredit.",
    path: "/kepengelolaan/finance/akuntansi/jurnal",
  },
  {
    icon: Send,
    title: "Posting Data",
    description: "Jurnal → Buku Besar",
    detail: "Proses memindahkan data dari jurnal ke buku besar agar tercatat rapi.",
    path: "/kepengelolaan/finance/akuntansi/posting",
  },
  {
    icon: BookOpen,
    title: "Buku Besar",
    description: "General Ledger",
    detail: "Kumpulan transaksi yang dikelompokkan per akun. Lihat total per akun dengan jelas.",
    path: "/kepengelolaan/finance/akuntansi/buku-besar",
  },
  {
    icon: Scale,
    title: "Neraca Saldo",
    description: "Trial Balance",
    detail: "Cek apakah total debit dan kredit sudah seimbang. Jika seimbang, pencatatan sudah benar.",
    path: "/kepengelolaan/finance/akuntansi/neraca-saldo",
  },
  {
    icon: CheckCircle,
    title: "Rekonsiliasi",
    description: "Pencocokan data",
    detail: "Mencocokkan data keuangan di sistem dengan data nyata (misalnya saldo bank).",
    path: "/kepengelolaan/finance/akuntansi/rekonsiliasi",
  },
];

export default function Akuntansi() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();

  const canManage = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  if (!user || !canManage) {
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Akuntansi</h1>
              <p className="text-muted-foreground">Sistem pencatatan keuangan lengkap</p>
            </div>
          </div>
        </div>

        {/* Alur Sistem */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm font-medium text-foreground mb-2">📌 Alur Sistem:</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Daftar Akun</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Jurnal</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Posting</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Buku Besar</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Neraca Saldo</span>
            <span>→</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">Rekonsiliasi</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-200 group"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
