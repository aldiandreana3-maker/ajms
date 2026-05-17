import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TablePagination, usePagination } from "@/components/shared/TablePagination";
import { ExportExcelButton } from "@/components/akuntansi/AccountingExcelTools";
import { toast } from "sonner";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

export default function PostingData() {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin } = useAuth();
  const { entries, isLoading, postEntry } = useJournalEntries();
  const canManage = isSuperAdmin || isAdmin;

  const unposted = entries.filter((e) => !e.is_posted);
  const posted = entries.filter((e) => e.is_posted);

  const [unpostedPage, setUnpostedPage] = useState(1);
  const [unpostedPerPage, setUnpostedPerPage] = useState(10);
  const [postedPage, setPostedPage] = useState(1);
  const [postedPerPage, setPostedPerPage] = useState(10);

  const paginatedUnposted = usePagination(unposted, unpostedPerPage, unpostedPage);
  const paginatedPosted = usePagination(posted, postedPerPage, postedPage);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/kepengelolaan/finance/akuntansi")} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Send className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Posting Data</h1>
              <p className="text-muted-foreground">Pindahkan jurnal ke Buku Besar</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground flex-1">
            Posting akan memindahkan data jurnal ke buku besar dan mengupdate saldo setiap akun. Jurnal yang sudah diposting tidak dapat dihapus.
          </p>
          <ExportExcelButton
            filename={`posting-data-${new Date().toISOString().slice(0, 10)}`}
            sheetName="Posting"
            data={entries.map((e) => ({
              entry_number: e.entry_number,
              date: format(new Date(e.entry_date), "dd/MM/yyyy"),
              description: e.description,
              debit: e.total_debit,
              kredit: e.total_credit,
              status: e.is_posted ? "Terposting" : "Draft",
            }))}
            columns={[
              { header: "No. Jurnal", key: "entry_number", width: 16 },
              { header: "Tanggal", key: "date", width: 14 },
              { header: "Deskripsi", key: "description", width: 36 },
              { header: "Debit", key: "debit", width: 16 },
              { header: "Kredit", key: "kredit", width: 16 },
              { header: "Status", key: "status", width: 14 },
            ]}
          />
        </div>

        <h2 className="text-lg font-semibold">Jurnal Belum Diposting ({unposted.length})</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Jurnal</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                    {canManage && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUnposted.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Semua jurnal sudah diposting</TableCell></TableRow>
                  ) : paginatedUnposted.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono font-medium">{e.entry_number}</TableCell>
                      <TableCell>{format(new Date(e.entry_date), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(e.total_debit)}</TableCell>
                      <TableCell className="text-right font-mono">{formatRp(e.total_credit)}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => postEntry.mutate(e.id)} disabled={postEntry.isPending}>
                            {postEntry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" />Posting</>}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {unposted.length > 0 && (
              <TablePagination
                currentPage={unpostedPage}
                totalItems={unposted.length}
                itemsPerPage={unpostedPerPage}
                onPageChange={setUnpostedPage}
                onItemsPerPageChange={setUnpostedPerPage}
              />
            )}
          </>
        )}

        <h2 className="text-lg font-semibold mt-8">Jurnal Sudah Diposting ({posted.length})</h2>
        <>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Jurnal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPosted.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada jurnal yang diposting</TableCell></TableRow>
                ) : paginatedPosted.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono font-medium">{e.entry_number}</TableCell>
                    <TableCell>{format(new Date(e.entry_date), "dd MMM yyyy", { locale: idLocale })}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-right font-mono">{formatRp(e.total_debit)}</TableCell>
                    <TableCell className="text-right font-mono">{formatRp(e.total_credit)}</TableCell>
                    <TableCell><Badge>Terposting</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {posted.length > 0 && (
            <TablePagination
              currentPage={postedPage}
              totalItems={posted.length}
              itemsPerPage={postedPerPage}
              onPageChange={setPostedPage}
              onItemsPerPageChange={setPostedPerPage}
            />
          )}
        </>
      </div>
    </MainLayout>
  );
}
