import { useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, FileSpreadsheet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ImportColumn {
  header: string; // Header in Excel
  key: string; // Key to map to
  required?: boolean;
  example?: string;
}

interface ImportExcelDialogProps {
  title: string;
  templateFilename: string;
  columns: ImportColumn[];
  onImport: (rows: Record<string, any>[]) => Promise<{ success: number; failed: number; errors?: string[] }>;
  trigger?: React.ReactNode;
}

export function ImportExcelDialog({ title, templateFilename, columns, onImport, trigger }: ImportExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const headers = columns.map((c) => c.header);
    const example: Record<string, any> = {};
    columns.forEach((c) => {
      example[c.header] = c.example ?? "";
    });
    const ws = XLSX.utils.json_to_sheet([example], { header: headers });
    ws["!cols"] = columns.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${templateFilename}_Template.xlsx`);
    toast.success("Template berhasil diunduh");
  };

  const parseFile = async (selectedFile: File) => {
    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      // Map header columns -> keys
      const isDateLikeHeader = (h: string) => {
        const lower = h.toLowerCase();
        return (
          lower.includes("tanggal") ||
          lower.includes("timestamp") ||
          lower.includes("waktu") ||
          lower.includes("date") ||
          lower.includes("expire") ||
          lower.includes("kadaluarsa") ||
          lower.includes("berlaku")
        );
      };

      const mapped = json.map((row) => {
        const out: Record<string, any> = {};
        columns.forEach((c) => {
          let val = row[c.header];
          const dateLike = isDateLikeHeader(c.header) || isDateLikeHeader(c.key);

          if (val instanceof Date) {
            // Date only vs datetime — jika ada timestamp keep ISO full
            val = dateLike && (c.header.toLowerCase().includes("timestamp") || c.header.toLowerCase().includes("waktu"))
              ? val.toISOString()
              : val.toISOString().split("T")[0];
          } else if (typeof val === "number" && dateLike) {
            // Excel date serial (termasuk pecahan untuk waktu)
            const d = XLSX.SSF.parse_date_code(val);
            if (d) {
              const pad = (n: number) => String(n).padStart(2, "0");
              const hasTime = (d.H || d.M || d.S) || val % 1 !== 0;
              if (hasTime) {
                // Bangun sebagai local time lalu jadikan ISO
                const dt = new Date(
                  d.y,
                  (d.m || 1) - 1,
                  d.d || 1,
                  d.H || 0,
                  d.M || 0,
                  Math.floor(d.S || 0)
                );
                val = isNaN(dt.getTime()) ? null : dt.toISOString();
              } else {
                val = `${d.y}-${pad(d.m)}-${pad(d.d)}`;
              }
            }
          }
          out[c.key] = val === "" || val === undefined || val === null ? null : String(val).trim();
        });
        return out;
      });

      setPreviewRows(mapped);
      setResult(null);
      if (mapped.length === 0) toast.warning("File kosong atau format header tidak sesuai");
      else toast.success(`${mapped.length} baris siap diimpor`);
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    parseFile(f);
  };

  const handleImport = async () => {
    if (!previewRows.length) return;
    setImporting(true);
    try {
      // Validate required fields
      const missing: string[] = [];
      previewRows.forEach((row, idx) => {
        columns.forEach((c) => {
          if (c.required && !row[c.key]) {
            missing.push(`Baris ${idx + 2}: kolom "${c.header}" wajib diisi`);
          }
        });
      });
      if (missing.length) {
        setResult({ success: 0, failed: previewRows.length, errors: missing.slice(0, 10) });
        setImporting(false);
        return;
      }

      const res = await onImport(previewRows);
      setResult(res);
      if (res.success > 0) {
        toast.success(`${res.success} data berhasil diimpor${res.failed ? `, ${res.failed} gagal` : ""}`);
      }
      if (res.failed > 0 && res.success === 0) {
        toast.error(`Semua ${res.failed} baris gagal diimpor`);
      }
    } catch (err: any) {
      toast.error("Import gagal: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setFile(null);
      setPreviewRows([]);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Import {title} dari Excel
          </DialogTitle>
          <DialogDescription>
            Unduh template terlebih dahulu, isi sesuai format, lalu unggah kembali.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Unduh Template
            </Button>
            <p className="text-xs text-muted-foreground">
              Pastikan header kolom sesuai template. Kolom bertanda * wajib diisi.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Pilih File Excel (.xlsx, .xls, .csv)</Label>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Kolom wajib: {columns.filter((c) => c.required).map((c) => c.header).join(", ") || "—"}
            </p>
          </div>

          {previewRows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-2 bg-muted/30 text-sm font-medium">
                Preview {previewRows.length} baris (menampilkan 5 pertama)
              </div>
              <div className="overflow-x-auto max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c.key} className="whitespace-nowrap text-xs">
                          {c.header}{c.required && <span className="text-destructive">*</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.slice(0, 5).map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map((c) => (
                          <TableCell key={c.key} className="text-xs whitespace-nowrap">
                            {row[c.key] ?? <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Berhasil: <strong>{result.success}</strong>
                </div>
                <div className="flex items-center gap-1 text-destructive">
                  <XCircle className="w-4 h-4" />
                  Gagal: <strong>{result.failed}</strong>
                </div>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="text-xs text-destructive max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => <div key={i}>• {e}</div>)}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>Tutup</Button>
            <Button onClick={handleImport} disabled={!previewRows.length || importing}>
              {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Impor {previewRows.length > 0 ? `${previewRows.length} Baris` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
