import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Download,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinancialReport } from "@/hooks/useFinancialReport";

const LaporanKeuangan = () => {
  const { isSuperAdmin, isLimitedAccess } = useAuth();
  const { data: financialData, isLoading } = useFinancialReport();

  const income = financialData?.totalIncome || 0;
  const expenses = financialData?.totalExpense || 0;
  const balance = income - expenses;

  const [reports, setReports] = useState([
    { id: "1", name: "Laporan Keuangan November 2025", date: "01 Des 2025", size: "2.4 MB" },
    { id: "2", name: "Laporan Keuangan Oktober 2025", date: "01 Nov 2025", size: "2.1 MB" },
    { id: "3", name: "Laporan Keuangan September 2025", date: "01 Okt 2025", size: "2.3 MB" },
    { id: "4", name: "Laporan Keuangan Q3 2025", date: "15 Okt 2025", size: "5.8 MB" },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<{ id: string; name: string; date: string; size: string } | null>(null);
  const [form, setForm] = useState({ name: "", date: "", size: "" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const financialSummary = [
    {
      title: "Total Pendapatan",
      value: formatCurrency(income),
      change: "+12.5%",
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(expenses),
      change: "+5.2%",
      isPositive: false,
      icon: TrendingDown,
    },
    {
      title: "Saldo Kas",
      value: formatCurrency(balance),
      change: "+8.3%",
      isPositive: true,
      icon: DollarSign,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReport) {
      setReports(reports.map(r => r.id === editingReport.id ? { ...r, ...form } : r));
    } else {
      setReports([{ id: Date.now().toString(), ...form }, ...reports]);
    }
    setIsOpen(false);
    setEditingReport(null);
    setForm({ name: "", date: "", size: "" });
  };

  const handleEdit = (report: typeof reports[0]) => {
    setEditingReport(report);
    setForm({ name: report.name, date: report.date, size: report.size });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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

        {/* Summary Cards - hidden for penghuni/agent */}
        {!isLimitedAccess && (
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
        )}

        {/* Reports List */}
        <div className="bg-card rounded-xl border border-border shadow-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">Dokumen Laporan</h2>
              <p className="text-sm text-muted-foreground">Unduh laporan keuangan bulanan</p>
            </div>
            {isSuperAdmin && (
              <Button onClick={() => { setEditingReport(null); setForm({ name: "", date: "", size: "" }); setIsOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Laporan
              </Button>
            )}
          </div>
          <div className="divide-y divide-border">
            {reports.map((report) => (
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
                <div className="flex items-center gap-2">
                  {isSuperAdmin && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(report)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Download className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditingReport(null); setForm({ name: "", date: "", size: "" }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReport ? "Edit Laporan" : "Tambah Laporan Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Laporan</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Laporan Keuangan November 2025"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  placeholder="01 Des 2025"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ukuran File</Label>
                <Input
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="2.4 MB"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editingReport ? "Update" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default LaporanKeuangan;
