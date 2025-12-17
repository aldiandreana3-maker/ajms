import * as XLSX from "xlsx";

interface ExportConfig {
  filename: string;
  sheetName: string;
  data: Record<string, any>[];
  columns: { header: string; key: string; width?: number }[];
}

export function exportToExcel({ filename, sheetName, data, columns }: ExportConfig) {
  // Transform data to use custom headers
  const transformedData = data.map((row) => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col.header] = row[col.key] ?? "-";
    });
    return newRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Export configs for each Kepenghunian service
export const parkingExportColumns = [
  { header: "Nama Penghuni", key: "vehicle_brand", width: 20 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Jenis Kendaraan", key: "vehicle_type", width: 15 },
  { header: "No. Polisi", key: "vehicle_number", width: 15 },
  { header: "Warna", key: "vehicle_color", width: 15 },
  { header: "Tanggal Mulai", key: "start_date", width: 15 },
  { header: "Tanggal Akhir", key: "end_date", width: 15 },
  { header: "Biaya Bulanan", key: "monthly_fee", width: 15 },
  { header: "Status", key: "is_active", width: 10 },
  { header: "Dibuat", key: "created_at", width: 20 },
];

export const keluhanExportColumns = [
  { header: "Tanggal", key: "created_at", width: 20 },
  { header: "Nama Penghuni", key: "penghuni_name", width: 20 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Subjek", key: "subject", width: 25 },
  { header: "Deskripsi", key: "description", width: 40 },
  { header: "Status", key: "status", width: 12 },
  { header: "Respon", key: "response", width: 30 },
];

export const workPermitExportColumns = [
  { header: "Tanggal Pengajuan", key: "created_at", width: 18 },
  { header: "Nama Penghuni", key: "penghuni_name", width: 20 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Nama Vendor", key: "vendor_name", width: 20 },
  { header: "Deskripsi Pekerjaan", key: "work_description", width: 30 },
  { header: "Jumlah Pekerja", key: "worker_count", width: 15 },
  { header: "Tanggal Mulai", key: "start_date", width: 15 },
  { header: "Tanggal Selesai", key: "end_date", width: 15 },
  { header: "Status", key: "status", width: 12 },
  { header: "Catatan", key: "notes", width: 25 },
];

export const goodsMovementExportColumns = [
  { header: "Waktu", key: "created_at", width: 20 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Nama Penghuni", key: "penghuni_name", width: 20 },
  { header: "Tipe", key: "movement_type", width: 10 },
  { header: "Deskripsi Barang", key: "item_description", width: 30 },
  { header: "Jumlah", key: "quantity", width: 10 },
  { header: "Nama Pembawa", key: "carrier_name", width: 20 },
  { header: "ID Pembawa", key: "carrier_id", width: 20 },
  { header: "QR Code", key: "qr_code", width: 25 },
];

export const accessCardExportColumns = [
  { header: "Tanggal", key: "created_at", width: 20 },
  { header: "Nama Penghuni", key: "penghuni_name", width: 20 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Nomor Kartu", key: "card_number", width: 20 },
  { header: "Tipe Kartu", key: "card_type", width: 15 },
  { header: "Status", key: "status", width: 12 },
  { header: "Diterbitkan", key: "issued_at", width: 18 },
  { header: "Kadaluarsa", key: "expires_at", width: 18 },
  { header: "Catatan", key: "notes", width: 25 },
];

export const foreignGuestExportColumns = [
  { header: "Tanggal Input", key: "created_at", width: 18 },
  { header: "Nama Lengkap", key: "full_name", width: 25 },
  { header: "Unit", key: "unit_number", width: 10 },
  { header: "Tempat Lahir", key: "birth_place", width: 18 },
  { header: "Tanggal Lahir", key: "birth_date", width: 15 },
  { header: "Jenis Kelamin", key: "gender", width: 15 },
  { header: "Kewarganegaraan", key: "nationality", width: 18 },
  { header: "No. Paspor", key: "passport_number", width: 20 },
  { header: "Paspor Kadaluarsa", key: "passport_expiry", width: 18 },
  { header: "Check In", key: "check_in_date", width: 15 },
  { header: "Check Out", key: "check_out_date", width: 15 },
];
