import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useChartOfAccounts, ChartAccount } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Plus, Pencil, Trash2, List, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const ACCOUNT_TYPES = [
  { value: "aset", label: "Aset (Harta)" },
  { value: "utang", label: "Utang (Kewajiban)" },
  { value: "modal", label: "Modal" },
  { value: "pendapatan", label: "Pendapatan" },
  { value: "beban", label: "Beban (Pengeluaran)" },
];

const typeBadgeColor: Record<string, string> = {
  aset: "bg-blue-100 text-blue-800",
  utang: "bg-red-100 text-red-800",
  modal: "bg-purple-100 text-purple-800",
  pendapatan: "bg-green-100 text-green-800",
  beban: "bg-orange-100 text-orange-800",
};

export default function DaftarAkun() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { accounts, isLoading, addAccount, updateAccount, deleteAccount } = useChartOfAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChartAccount | null>(null);
  const [form, setForm] = useState({ account_code: "", account_name: "", account_type: "aset", normal_balance: "debit", opening_balance: 0, description: "" });
  const [filter, setFilter] = useState("all");

  const canManage = isSuperAdmin || isAdmin;

  const resetForm = () => {
    setForm({ account_code: "", account_name: "", account_type: "aset", normal_balance: "debit", opening_balance: 0, description: "" });
    setEditing(null);
  };

  const handleSubmit = () => {
    if (!form.account_code || !form.account_name) return;
    if (editing) {
      updateAccount.mutate({ id: editing.id, ...form, opening_balance: Number(form.opening_balance) }, { onSuccess: () => { setOpen(false); resetForm(); } });
    } else {
      addAccount.mutate({ ...form, opening_balance: Number(form.opening_balance), current_balance: Number(form.opening_balance) }, { onSuccess: () => { setOpen(false); resetForm(); } });
    }
  };

  const handleEdit = (acc: ChartAccount) => {
    setEditing(acc);
    setForm({ account_code: acc.account_code, account_name: acc.account_name, account_type: acc.account_type, normal_balance: acc.normal_balance, opening_balance: acc.opening_balance, description: acc.description || "" });
    setOpen(true);
  };

  const filtered = filter === "all" ? accounts : accounts.filter((a) => a.account_type === filter);

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <List className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daftar Akun</h1>
              <p className="text-muted-foreground">Chart of Accounts</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {ACCOUNT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canManage && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Tambah Akun</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Akun" : "Tambah Akun Baru"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Kode Akun</Label>
                      <Input value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} placeholder="1-1000" />
                    </div>
                    <div>
                      <Label>Nama Akun</Label>
                      <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Kas" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipe Akun</Label>
                      <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v, normal_balance: ["aset", "beban"].includes(v) ? "debit" : "kredit" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACCOUNT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Saldo Normal</Label>
                      <Select value={form.normal_balance} onValueChange={(v) => setForm({ ...form, normal_balance: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="kredit">Kredit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Saldo Awal</Label>
                    <Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Deskripsi</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <Button onClick={handleSubmit} disabled={addAccount.isPending || updateAccount.isPending} className="w-full">
                    {(addAccount.isPending || updateAccount.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editing ? "Simpan Perubahan" : "Tambah Akun"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Saldo Normal</TableHead>
                  <TableHead className="text-right">Saldo Saat Ini</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada akun</TableCell></TableRow>
                ) : filtered.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-mono font-medium">{acc.account_code}</TableCell>
                    <TableCell className="font-medium">{acc.account_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeBadgeColor[acc.account_type] || ""}>
                        {ACCOUNT_TYPES.find((t) => t.value === acc.account_type)?.label || acc.account_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{acc.normal_balance}</TableCell>
                    <TableCell className="text-right font-mono">{formatRp(acc.current_balance)}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteAccount.mutate(acc.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
