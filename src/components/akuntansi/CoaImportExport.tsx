import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { ChartAccount } from "@/hooks/useChartOfAccounts";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const HEADERS = ["No", "Type", "Account Code", "Description", "Detail", "Up Level", "Map to Neraca", "Map to Cash Flow", "Pos Budget", "Sumber Dana"];

interface Props {
  accounts: ChartAccount[];
  onImport: (data: Partial<ChartAccount>[]) => void;
  isPending: boolean;
}

export function CoaImportExport({ accounts, onImport, isPending }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("COA");

    ws.addRow(HEADERS);
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };

    accounts.forEach((acc, i) => {
      ws.addRow([
        i + 1,
        acc.account_type,
        acc.account_code,
        acc.account_name,
        acc.is_detail ? "YES" : "NO",
        acc.up_level || "",
        acc.map_to_neraca || "",
        acc.map_to_cash_flow || "",
        acc.pos_budget || "",
        acc.sumber_dana || "",
      ]);
    });

    ws.columns.forEach((col) => { col.width = 22; });

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "Daftar_Akun_COA.xlsx");
    toast.success("Export berhasil");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error("Sheet tidak ditemukan");

      const rows: Partial<ChartAccount>[] = [];
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // skip header
        const code = String(row.getCell(3).value || "").trim();
        const name = String(row.getCell(4).value || "").trim();
        if (!code || !name) return;

        rows.push({
          account_type: String(row.getCell(2).value || "AKTIVA").trim().toUpperCase(),
          account_code: code,
          account_name: name,
          is_detail: String(row.getCell(5).value || "YES").trim().toUpperCase() === "YES",
          up_level: String(row.getCell(6).value || "").trim(),
          map_to_neraca: String(row.getCell(7).value || "").trim(),
          map_to_cash_flow: String(row.getCell(8).value || "").trim(),
          pos_budget: String(row.getCell(9).value || "").trim(),
          sumber_dana: String(row.getCell(10).value || "").trim(),
          normal_balance: ["AKTIVA", "BEBAN"].includes(String(row.getCell(2).value || "AKTIVA").trim().toUpperCase()) ? "debit" : "kredit",
          opening_balance: 0,
          current_balance: 0,
        });
      });

      if (rows.length === 0) {
        toast.error("Tidak ada data valid ditemukan");
        return;
      }

      onImport(rows);
    } catch (err: any) {
      toast.error("Gagal membaca file: " + err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex gap-2">
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isPending}>
        <Upload className="w-4 h-4 mr-2" />Import
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" />Export
      </Button>
    </div>
  );
}
