import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface WaterMeterRow {
  unit_number: string;
  penghuni_name?: string | null;
  meter_start: number;
  meter_end: number;
  usage_m3: number;
  nominal: number;
  billing_month: string;
  created_at: string;
  recorded_by_name?: string | null;
  photo_start_signed?: string | null;
  photo_end_signed?: string | null;
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; ext: "png" | "jpeg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    return { buffer: await res.arrayBuffer(), ext: ct.includes("png") ? "png" : "jpeg" };
  } catch {
    return null;
  }
}

export async function exportWaterMetersToExcel(rows: WaterMeterRow[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Meteran Air");

  ws.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "No Unit", key: "unit", width: 12 },
    { header: "Penghuni", key: "penghuni", width: 22 },
    { header: "Bulan Tagihan", key: "bulan", width: 18 },
    { header: "Meteran Awal", key: "ms", width: 14 },
    { header: "Foto Awal", key: "fa", width: 18 },
    { header: "Link Foto Awal", key: "la", width: 22 },
    { header: "Meteran Akhir", key: "me", width: 14 },
    { header: "Foto Akhir", key: "fe", width: 18 },
    { header: "Link Foto Akhir", key: "le", width: 22 },
    { header: "Pemakaian (m³)", key: "usage", width: 14 },
    { header: "Nominal (Rp)", key: "nominal", width: 16 },
    { header: "Tanggal Input", key: "created", width: 20 },
    { header: "Petugas", key: "petugas", width: 22 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 24;

  const ROW_H = 80;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;
    const row = ws.addRow({
      no: i + 1,
      unit: r.unit_number,
      penghuni: r.penghuni_name || "-",
      bulan: format(new Date(r.billing_month), "MMMM yyyy", { locale: localeId }),
      ms: r.meter_start,
      fa: "",
      la: "",
      me: r.meter_end,
      fe: "",
      le: "",
      usage: r.usage_m3,
      nominal: r.nominal,
      created: format(new Date(r.created_at), "dd/MM/yyyy HH:mm"),
      petugas: r.recorded_by_name || "-",
    });
    row.height = ROW_H;
    row.alignment = { vertical: "middle" };

    if (r.photo_start_signed) {
      const c = row.getCell("la");
      c.value = { text: "Lihat Foto Awal", hyperlink: r.photo_start_signed } as any;
      c.font = { color: { argb: "FF0066CC" }, underline: true };
      const img = await fetchImageAsBuffer(r.photo_start_signed);
      if (img) {
        const id = wb.addImage({ buffer: img.buffer, extension: img.ext });
        ws.addImage(id, { tl: { col: 5, row: rowNum - 1 }, ext: { width: 110, height: 75 } });
      }
    }
    if (r.photo_end_signed) {
      const c = row.getCell("le");
      c.value = { text: "Lihat Foto Akhir", hyperlink: r.photo_end_signed } as any;
      c.font = { color: { argb: "FF0066CC" }, underline: true };
      const img = await fetchImageAsBuffer(r.photo_end_signed);
      if (img) {
        const id = wb.addImage({ buffer: img.buffer, extension: img.ext });
        ws.addImage(id, { tl: { col: 8, row: rowNum - 1 }, ext: { width: 110, height: 75 } });
      }
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `Meteran_Air_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`,
  );
}
