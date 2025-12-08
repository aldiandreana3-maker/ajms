import { MainLayout } from "@/components/layout/MainLayout";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
} from "lucide-react";

const financialSummary = [
  {
    title: "Total Pendapatan",
    value: "Rp 2.450.000.000",
    change: "+12.5%",
    isPositive: true,
    icon: TrendingUp,
  },
  {
    title: "Total Pengeluaran",
    value: "Rp 890.000.000",
    change: "+5.2%",
    isPositive: false,
    icon: TrendingDown,
  },
  {
    title: "Saldo Kas",
    value: "Rp 1.560.000.000",
    change: "+8.3%",
    isPositive: true,
    icon: DollarSign,
  },
];

const reports = [
  { id: 1, name: "Laporan Keuangan November 2025", date: "01 Des 2025", size: "2.4 MB" },
  { id: 2, name: "Laporan Keuangan Oktober 2025", date: "01 Nov 2025", size: "2.1 MB" },
  { id: 3, name: "Laporan Keuangan September 2025", date: "01 Okt 2025", size: "2.3 MB" },
  { id: 4, name: "Laporan Keuangan Q3 2025", date: "15 Okt 2025", size: "5.8 MB" },
];

const LaporanKeuangan = () => {
  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
            <p className="text-muted-foreground">Ringkasan keuangan bulanan</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Desember 2025</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financialSummary.map((item, index) => (
            <div
              key={item.title}
              className="bg-card rounded-xl border border-border p-6 shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p
                    className={`text-sm font-medium mt-2 ${
                      item.isPositive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {item.change} dari bulan lalu
                  </p>
                </div>
                <div
                  className={`p-3 rounded-xl ${
                    item.isPositive ? "bg-success-light" : "bg-destructive/10"
                  }`}
                >
                  <item.icon
                    className={`w-6 h-6 ${
                      item.isPositive ? "text-success" : "text-destructive"
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reports List */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Dokumen Laporan</h2>
            <p className="text-sm text-muted-foreground">Unduh laporan keuangan bulanan</p>
          </div>
          <div className="divide-y divide-border">
            {reports.map((report, index) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Download className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LaporanKeuangan;
