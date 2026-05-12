import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useChartOfAccounts, ChartAccount } from "@/hooks/useChartOfAccounts";
import { ArrowLeft, Plus, Pencil, Trash2, List, Loader2, History, Search, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CoaFormDialog } from "@/components/akuntansi/CoaFormDialog";
import { CoaAuditDialog } from "@/components/akuntansi/CoaAuditDialog";
import { CoaImportExport } from "@/components/akuntansi/CoaImportExport";
import { CoaMutationsDialog } from "@/components/akuntansi/CoaMutationsDialog";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const ACCOUNT_TYPES = [
  { value: "AKTIVA", label: "Aktiva" },
  { value: "PASIVA", label: "Pasiva" },
  { value: "MODAL", label: "Modal" },
  { value: "PENDAPATAN", label: "Pendapatan" },
  { value: "BEBAN", label: "Beban" },
];

const typeBadgeColor: Record<string, string> = {
  AKTIVA: "bg-blue-100 text-blue-800",
  PASIVA: "bg-red-100 text-red-800",
  MODAL: "bg-purple-100 text-purple-800",
  PENDAPATAN: "bg-green-100 text-green-800",
  BEBAN: "bg-orange-100 text-orange-800",
};

export default function DaftarAkun() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { accounts, isLoading, addAccount, updateAccount, deleteAccount, bulkInsert } = useChartOfAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [editing, setEditing] = useState<ChartAccount | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const canManage = isSuperAdmin || isAdmin;

  const handleSubmit = (data: Partial<ChartAccount>) => {
    if (data.id) {
      const { id, ...updates } = data;
      updateAccount.mutate({ id, ...updates }, { onSuccess: () => { setFormOpen(false); setEditing(null); } });
    } else {
      addAccount.mutate(data, { onSuccess: () => { setFormOpen(false); setEditing(null); } });
    }
  };

  const handleEdit = (acc: ChartAccount) => {
    setEditing(acc);
    setFormOpen(true);
  };

  const handleImport = (rows: Partial<ChartAccount>[]) => {
    bulkInsert.mutate(rows);
  };

  const filtered = accounts
    .filter((a) => filter === "all" || a.account_type === filter)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.account_code.toLowerCase().includes(q) || a.account_name.toLowerCase().includes(q);
    });

  const paginatedData = usePagination(filtered, itemsPerPage, currentPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <MainLayout>
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <List className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daftar Akun (COA)</h1>
              <p className="text-muted-foreground text-sm">Chart of Accounts — {accounts.length} akun</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari kode / nama akun..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <Select value={filter} onValueChange={(v) => { setFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              <CoaImportExport accounts={accounts} onImport={handleImport} isPending={bulkInsert.isPending} />
              <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
                <History className="w-4 h-4 mr-2" />Audit Log
              </Button>
              <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Tambah
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Detail</TableHead>
                    <TableHead>Up Level</TableHead>
                    <TableHead>Map to Neraca</TableHead>
                    <TableHead>Map to Cash Flow</TableHead>
                    <TableHead>Pos Budget</TableHead>
                    <TableHead>Sumber Dana</TableHead>
                    {canManage && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow><TableCell colSpan={canManage ? 11 : 10} className="text-center py-8 text-muted-foreground">Belum ada akun</TableCell></TableRow>
                  ) : paginatedData.map((acc, i) => (
                    <TableRow key={acc.id} className={!acc.is_detail ? "bg-muted/30 font-semibold" : ""}>
                      <TableCell className="text-center">{startIndex + i + 1}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${typeBadgeColor[acc.account_type] || ""}`}>
                          {acc.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{acc.account_code}</TableCell>
                      <TableCell>{acc.account_name}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-medium ${acc.is_detail ? "text-green-600" : "text-muted-foreground"}`}>
                          {acc.is_detail ? "YES" : "NO"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{acc.up_level || "-"}</TableCell>
                      <TableCell className="text-sm">{acc.map_to_neraca || "-"}</TableCell>
                      <TableCell className="text-sm">{acc.map_to_cash_flow || "-"}</TableCell>
                      <TableCell className="text-sm">{acc.pos_budget || "-"}</TableCell>
                      <TableCell className="text-sm">{acc.sumber_dana || "-"}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Hapus akun ini?")) deleteAccount.mutate(acc.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}

        {/* Dialogs */}
        <CoaFormDialog
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
          editing={editing}
          onSubmit={handleSubmit}
          isPending={addAccount.isPending || updateAccount.isPending}
        />
        <CoaAuditDialog open={auditOpen} onOpenChange={setAuditOpen} />
      </div>
    </MainLayout>
  );
}
