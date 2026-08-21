import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Receipt, Eye } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { ParkingPaymentHistory } from "@/hooks/useParkingPaymentHistory";

const formatRp = (n: number | null | undefined) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(n || 0));

const monthName = (m: number, y: number) =>
  new Date(y, (m || 1) - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

/** Nomor kwitansi konsisten: KW-PARKIR-YYYYMM-XXXX (4 karakter id) */
export const receiptNumber = (row: ParkingPaymentHistory) =>
  `KW-PARKIR-${row.period_year}${String(row.period_month).padStart(2, "0")}-${row.id.slice(0, 4).toUpperCase()}`;

async function resolveProofUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const { data } = await supabase.storage.from("kepenghunian-files").createSignedUrl(url, 3600);
  return data?.signedUrl || null;
}

function printReceipt(row: ParkingPaymentHistory, proofUrl: string | null) {
  const w = window.open("", "_blank");
  if (!w) return;
  const verified = row.verification_status === "terverifikasi";
  w.document.write(`<!DOCTYPE html><html><head><title>Kwitansi ${receiptNumber(row)}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:24px;max-width:520px;margin:0 auto;color:#111}
    .head{text-align:center;border-bottom:3px double #111;padding-bottom:10px;margin-bottom:16px}
    .head h1{font-size:18px;margin:0;letter-spacing:1px}
    .head p{margin:4px 0 0;font-size:12px;color:#555}
    .no{font-family:monospace;font-size:12px;margin-top:6px}
    .row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px dashed #ccc;font-size:13px}
    .label{font-weight:bold}
    .value{text-align:right}
    .total{margin-top:12px;padding:10px;background:#f4f4f5;display:flex;justify-content:space-between;font-weight:bold;font-size:15px}
    .st{padding:3px 8px;border-radius:4px;color:#fff;font-size:11px;font-weight:bold}
    .ok{background:#16a34a}.pending{background:#f59e0b}
    .proof{margin-top:16px;text-align:center}
    .proof img{max-width:100%;border:1px solid #ddd;border-radius:6px}
    .foot{margin-top:18px;text-align:center;font-size:11px;color:#666}
    @media print{body{padding:0}}
  </style></head><body>
    <div class="head">
      <h1>KWITANSI PEMBAYARAN</h1>
      <p>Abonemen Parkir &mdash; The Jarrdin Cihampelas</p>
      <div class="no">No. ${receiptNumber(row)}</div>
    </div>
    <div class="row"><span class="label">Periode</span><span class="value">${row.period_label || monthName(row.period_month, row.period_year)}</span></div>
    <div class="row"><span class="label">Unit</span><span class="value">${row.unit_number || "-"}</span></div>
    <div class="row"><span class="label">Nama</span><span class="value">${row.owner_name || "-"}</span></div>
    <div class="row"><span class="label">Nomor Plat</span><span class="value">${row.vehicle_number || "-"}</span></div>
    <div class="row"><span class="label">Metode Bayar</span><span class="value" style="text-transform:capitalize">${(row.payment_method || "transfer").replace(/_/g, " ")}</span></div>
    <div class="row"><span class="label">Tanggal Bayar</span><span class="value">${row.payment_date ? format(new Date(row.payment_date), "dd/MM/yyyy HH:mm") : "-"}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="st ${verified ? "ok" : "pending"}">${verified ? "TERVERIFIKASI" : "MENUNGGU VERIFIKASI"}</span></span></div>
    ${row.notes ? `<div class="row"><span class="label">Catatan</span><span class="value">${row.notes}</span></div>` : ""}
    <div class="total"><span>TOTAL DIBAYAR</span><span>${formatRp(row.nominal)}</span></div>
    ${proofUrl ? `<div class="proof"><p style="font-size:12px;color:#555;margin:0 0 6px">Bukti Transfer</p><img src="${proofUrl}" /></div>` : ""}
    <div class="foot">
      <p>Kwitansi ini dicetak otomatis oleh sistem AJMS pada ${format(new Date(), "dd/MM/yyyy HH:mm")}.</p>
      <p>Simpan sebagai bukti pembayaran abonemen parkir bulan tersebut.</p>
    </div>
    <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
  </body></html>`);
  w.document.close();
}

interface Props {
  /** Semua riwayat pembayaran (sudah difilter hak akses di level query/RLS) */
  history: ParkingPaymentHistory[];
  subscriptionId: string;
  vehicleNumber: string | null;
  unitNumber: string | null;
  ownerName?: string | null;
}

export function ParkingReceiptHistoryDialog({ history, subscriptionId, vehicleNumber, unitNumber, ownerName }: Props) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ row: ParkingPaymentHistory; url: string | null } | null>(null);

  const rows = useMemo(() => {
    const plate = (vehicleNumber || "").toUpperCase().replace(/[\s-]/g, "");
    return (history || [])
      .filter((h) => {
        if (h.subscription_id && h.subscription_id === subscriptionId) return true;
        const hPlate = (h.vehicle_number || "").toUpperCase().replace(/[\s-]/g, "");
        return !!plate && hPlate === plate;
      })
      .sort((a, b) => b.period_year - a.period_year || b.period_month - a.period_month);
  }, [history, subscriptionId, vehicleNumber]);

  const total = rows.reduce((s, r) => s + Number(r.nominal || 0), 0);

  const handlePrint = async (row: ParkingPaymentHistory) => {
    const url = await resolveProofUrl(row.payment_proof_url);
    printReceipt(row, url);
  };

  const handlePreview = async (row: ParkingPaymentHistory) => {
    const url = await resolveProofUrl(row.payment_proof_url);
    setPreview({ row, url });
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs whitespace-nowrap"
        onClick={() => setOpen(true)}
        title="Lihat kwitansi pembayaran bulanan"
      >
        <Receipt className="w-3 h-3 mr-1" />
        Kwitansi ({rows.length})
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Kwitansi Bulanan — {unitNumber || "-"} / {vehicleNumber || "-"}
            </DialogTitle>
          </DialogHeader>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Belum ada pembayaran tercatat. Kwitansi otomatis muncul setiap kali bukti transfer diupload saat perpanjangan bulanan.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <Badge variant="secondary">{rows.length} bulan terbayar</Badge>
                <Badge variant="outline">Total {formatRp(total)}</Badge>
                {ownerName && <Badge variant="outline">{ownerName}</Badge>}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Kwitansi</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Tgl Bayar</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{receiptNumber(r)}</TableCell>
                        <TableCell className="text-sm">
                          {r.period_label || monthName(r.period_month, r.period_year)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{formatRp(r.nominal)}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {(r.payment_method || "transfer").replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.payment_date ? format(new Date(r.payment_date), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.verification_status === "terverifikasi" ? "default" : "secondary"} className="text-[10px]">
                            {r.verification_status === "terverifikasi" ? "Terverifikasi" : "Menunggu"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            {r.payment_proof_url && (
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handlePreview(r)} title="Lihat bukti transfer">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => handlePrint(r)}>
                              <Printer className="w-3.5 h-3.5 mr-1" /> Cetak
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Bukti Transfer — {preview ? preview.row.period_label || monthName(preview.row.period_month, preview.row.period_year) : ""}
            </DialogTitle>
          </DialogHeader>
          {preview?.url ? (
            <img src={preview.url} alt="Bukti transfer" className="w-full rounded border" />
          ) : (
            <p className="text-sm text-muted-foreground">Bukti tidak dapat dimuat.</p>
          )}
          {preview && (
            <Button onClick={() => handlePrint(preview.row)} className="w-full">
              <Printer className="w-4 h-4 mr-2" /> Cetak Kwitansi
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
