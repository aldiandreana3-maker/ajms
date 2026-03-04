import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePayrollList, useEmployeeSummary, useCreatePayroll } from "@/hooks/usePayroll";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const months = [
  { value: 1, label: "Januari" }, { value: 2, label: "Februari" }, { value: 3, label: "Maret" },
  { value: 4, label: "April" }, { value: 5, label: "Mei" }, { value: 6, label: "Juni" },
  { value: 7, label: "Juli" }, { value: 8, label: "Agustus" }, { value: 9, label: "September" },
  { value: 10, label: "Oktober" }, { value: 11, label: "November" }, { value: 12, label: "Desember" },
];

function useStaffProfiles() {
  return useQuery({
    queryKey: ["staff-profiles-payroll"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["super_admin", "admin", "staff", "staff_tro", "staff_finance", "staff_hrd_ga", "staff_engineering", "staff_outsourcing_cleaning", "staff_outsourcing_security", "staff_outsourcing_parkir"]);
      if (rolesErr) throw rolesErr;
      const userIds = [...new Set(roles?.map(r => r.user_id) || [])];
      if (userIds.length === 0) return [];
      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (profErr) throw profErr;
      return profiles || [];
    },
  });
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
}

function CreatePayrollDialog({ staffProfiles }: { staffProfiles: any[] }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [baseSalary, setBaseSalary] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [deductions, setDeductions] = useState(0);

  const { data: summary } = useEmployeeSummary(selectedUserId, periodMonth, periodYear);
  const createPayroll = useCreatePayroll();

  const totalSalary = baseSalary + allowance - deductions;
  const employeeName = staffProfiles.find(p => p.id === selectedUserId)?.full_name || "";

  const handleSubmit = () => {
    if (!selectedUserId) return;
    createPayroll.mutate({
      user_id: selectedUserId,
      employee_name: employeeName,
      period_month: periodMonth,
      period_year: periodYear,
      total_attendance: summary?.totalAttendance || 0,
      total_leaves: summary?.totalLeaves || 0,
      total_overtimes: summary?.totalOvertimes || 0,
      total_permits: summary?.totalPermits || 0,
      base_salary: baseSalary,
      allowance,
      deductions,
      total_salary: totalSalary,
    }, {
      onSuccess: () => {
        setOpen(false);
        setSelectedUserId("");
        setBaseSalary(0);
        setAllowance(0);
        setDeductions(0);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" />Buat Slip Gaji</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Buat Slip Gaji</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Karyawan</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger><SelectValue placeholder="Pilih karyawan" /></SelectTrigger>
              <SelectContent>
                {staffProfiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Bulan</Label>
              <Select value={String(periodMonth)} onValueChange={v => setPeriodMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tahun</Label>
              <Input type="number" value={periodYear} onChange={e => setPeriodYear(Number(e.target.value))} />
            </div>
          </div>

          {selectedUserId && summary && (
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kehadiran</span><span className="font-medium">{summary.totalAttendance} hari</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cuti (disetujui)</span><span className="font-medium">{summary.totalLeaves} hari</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lembur (disetujui)</span><span className="font-medium">{summary.totalOvertimes}x ({summary.totalOvertimeHours.toFixed(1)} jam)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Izin (disetujui)</span><span className="font-medium">{summary.totalPermits} hari</span></div>
              </CardContent>
            </Card>
          )}

          <div>
            <Label>Gaji Pokok</Label>
            <Input type="number" value={baseSalary} onChange={e => setBaseSalary(Number(e.target.value))} />
          </div>
          <div>
            <Label>Tunjangan / Lembur</Label>
            <Input type="number" value={allowance} onChange={e => setAllowance(Number(e.target.value))} />
          </div>
          <div>
            <Label>Potongan</Label>
            <Input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} />
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
            <span className="font-medium">Total Gaji</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(totalSalary)}</span>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!selectedUserId || createPayroll.isPending}>
            {createPayroll.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Simpan Slip Gaji
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SlipGaji() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const { data: payrolls, isLoading } = usePayrollList(filterMonth, filterYear);
  const { data: staffProfiles } = useStaffProfiles();

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/hrd-ga")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Slip Gaji</h1>
            <p className="text-muted-foreground">Input dan perhitungan slip gaji karyawan</p>
          </div>
          <CreatePayrollDialog staffProfiles={staffProfiles || []} />
        </div>

        <div className="flex gap-4 items-end">
          <div>
            <Label className="text-xs">Bulan</Label>
            <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tahun</Label>
            <Input type="number" className="w-[100px]" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} />
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Daftar Slip Gaji — {months.find(m => m.value === filterMonth)?.label} {filterYear}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : !payrolls?.length ? (
              <p className="text-center text-muted-foreground py-8">Belum ada slip gaji untuk periode ini</p>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Karyawan</TableHead>
                      <TableHead className="text-center">Hadir</TableHead>
                      <TableHead className="text-center">Cuti</TableHead>
                      <TableHead className="text-center">Lembur</TableHead>
                      <TableHead className="text-center">Izin</TableHead>
                      <TableHead className="text-right">Gaji Pokok</TableHead>
                      <TableHead className="text-right">Tunjangan</TableHead>
                      <TableHead className="text-right">Potongan</TableHead>
                      <TableHead className="text-right">Total Gaji</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrolls.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.employee_name}</TableCell>
                        <TableCell className="text-center">{p.total_attendance}</TableCell>
                        <TableCell className="text-center">{p.total_leaves}</TableCell>
                        <TableCell className="text-center">{p.total_overtimes}</TableCell>
                        <TableCell className="text-center">{p.total_permits}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(p.base_salary))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(p.allowance))}</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(Number(p.deductions))}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatCurrency(Number(p.total_salary))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
