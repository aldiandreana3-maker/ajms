import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface BicycleRow {
  code: string;
  brand: string;
  owner_name: string | null;
  unit_number: string | null;
  notes: string | null;
  photo_display_url?: string | null;
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: ArrayBuffer; ext: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    const buffer = await res.arrayBuffer();
    let ext: "png" | "jpeg" = "jpeg";
    if (contentType.includes("png")) ext = "png";
    return { buffer, ext };
  } catch {
    return null;
  }
}

export async function exportBicyclesToExcel(bicycles: BicycleRow[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data Sepeda");

  sheet.columns = [
    { header: "No", key: "no", width: 6 },
    { header: "Kode", key: "kode", width: 10 },
    { header: "Merek Sepeda", key: "brand", width: 20 },
    { header: "Foto", key: "foto", width: 18 },
    { header: "Nama Pemilik", key: "owner", width: 22 },
    { header: "Unit Pemilik", key: "unit", width: 15 },
    { header: "Keterangan", key: "notes", width: 28 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;

  const ROW_HEIGHT = 80;

  for (let i = 0; i < bicycles.length; i++) {
    const b = bicycles[i];
    const rowNum = i + 2;

    const row = sheet.addRow({
      no: i + 1,
      kode: b.code,
      brand: b.brand,
      foto: "",
      owner: b.owner_name || "-",
      unit: b.unit_number || "-",
      notes: b.notes || "-",
    });

    row.height = ROW_HEIGHT;
    row.alignment = { vertical: "middle" };

    if (b.photo_display_url) {
      const imgData = await fetchImageAsBuffer(b.photo_display_url);
      if (imgData) {
        const imageId = workbook.addImage({
          buffer: imgData.buffer,
          extension: imgData.ext,
        });

        sheet.addImage(imageId, {
          tl: { col: 3, row: rowNum - 1 },
          ext: { width: 100, height: 75 },
        });
      }
    }
  }

  const buf = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Data_Sepeda.xlsx");
}
