import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import ExcelJS from "exceljs";
import { toast } from "sonner";

export function ExportExcelButton({
  filename,
  sheetName,
  data,
  columns,
  label = "Export",
  disabled,
}: {
  filename: string;
  sheetName: string;
  data: Record<string, any>[];
  columns: { header: string; key: string; width?: number }[];
  label?: string;
  disabled?: boolean;
}) {
  const handle = () => {
    if (!data || data.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    exportToExcel({ filename, sheetName, data, columns });
    toast.success("Export berhasil");
  };
  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={disabled}>
      <Download className="w-4 h-4 mr-2" />{label}
    </Button>
  );
}

export function ImportExcelButton({
  onParsed,
  label = "Import",
  disabled,
}: {
  onParsed: (rows: Record<string, any>[]) => void;
  label?: string;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error("Sheet tidak ditemukan");

      const headers: string[] = [];
      ws.getRow(1).eachCell((cell) => headers.push(String(cell.value || "").trim()));

      const rows: Record<string, any>[] = [];
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return;
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          obj[h] = row.getCell(i + 1).value;
        });
        if (Object.values(obj).some((v) => v !== null && v !== undefined && v !== "")) {
          rows.push(obj);
        }
      });

      if (rows.length === 0) {
        toast.error("Tidak ada data valid dalam file");
        return;
      }
      onParsed(rows);
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={disabled}>
        <Upload className="w-4 h-4 mr-2" />{label}
      </Button>
    </>
  );
}
