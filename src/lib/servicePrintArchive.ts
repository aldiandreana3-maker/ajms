export const archiveServices: Record<string, { table: string; title: string; joinUnit?: boolean }> = {
  '/kepenghunian/keluhan': { table: 'keluhan', title: 'Keluhan Penghuni', joinUnit: true },
  '/kepenghunian/abonemen-parkir': { table: 'parking_subscriptions', title: 'Abonemen Parkir', joinUnit: true },
  '/kepenghunian/pemutakhiran-data': { table: 'penghuni_updates', title: 'Pemutakhiran Data Penghuni' },
  '/kepengelolaan/pemutakhiran-data': { table: 'penghuni_updates', title: 'Pemutakhiran Data Penghuni' },
  '/kepenghunian/izin-kerja': { table: 'work_permits', title: 'Izin Kerja', joinUnit: true },
  '/kepenghunian/barang': { table: 'goods_movement', title: 'Keluar Masuk Barang', joinUnit: true },
  '/kepenghunian/kartu-akses': { table: 'access_cards', title: 'Kartu Akses', joinUnit: true },
  '/kepenghunian/tamu-asing': { table: 'foreign_guest_reports', title: 'Pelaporan Tamu Asing', joinUnit: true },
  '/kepenghunian/work-order': { table: 'work_orders', title: 'Work Order', joinUnit: true },
  '/kepenghunian/pelayanan-paket': { table: 'packages', title: 'Pelayanan Paket', joinUnit: true },
  '/kepengelolaan/data-sepeda': { table: 'bicycles', title: 'Data Kepemilikan Sepeda' },
};

const labels: Record<string, string> = {
  created_at: 'Tanggal pencatatan', updated_at: 'Terakhir diperbarui', penghuni_name: 'Nama penghuni',
  unit_number: 'Nomor unit', full_name: 'Nama lengkap', owner_name: 'Nama pemilik / penerima', phone: 'Telepon', email: 'Email',
  subject: 'Subjek', title: 'Judul', description: 'Deskripsi', response: 'Tanggapan', status: 'Status', notes: 'Catatan',
  vehicle_type: 'Jenis kendaraan', vehicle_number: 'Nomor polisi', vehicle_brand: 'Merek kendaraan', vehicle_color: 'Warna kendaraan',
  member_card: 'Kartu member', request_type: 'Jenis pengajuan', period_type: 'Periode', rental_status: 'Status sewa',
  verification_status: 'Verifikasi', start_date: 'Tanggal mulai', end_date: 'Tanggal selesai', monthly_fee: 'Biaya bulanan',
  nominal: 'Nominal', tower: 'Tower', penghuni_status: 'Status penghuni', owner_agent_name: 'Nama pemilik / agen',
  lama_tinggal: 'Lama tinggal', emergency_name: 'Kontak darurat', emergency_phone: 'Telepon darurat', emergency_relation: 'Hubungan',
  special_conditions: 'Kondisi khusus', lansia_name: 'Nama lansia', balita_name: 'Nama balita', ibu_hamil_name: 'Nama ibu hamil',
  health_name: 'Nama kondisi kesehatan', health_note: 'Catatan kesehatan', other_condition_note: 'Kondisi lainnya',
  declaration_accepted: 'Pernyataan disetujui', last_updated_at: 'Tanggal pemutakhiran', vendor_name: 'Nama vendor',
  work_description: 'Deskripsi pekerjaan', worker_count: 'Jumlah pekerja', movement_type: 'Jenis perpindahan',
  item_description: 'Deskripsi barang', quantity: 'Jumlah', carrier_name: 'Nama pembawa', carrier_id: 'Identitas pembawa',
  card_number: 'Nomor kartu', card_type: 'Jenis kartu', issued_at: 'Tanggal terbit', expires_at: 'Tanggal berakhir',
  quantity_requested: 'Jumlah kartu', nationality: 'Kewarganegaraan', passport_number: 'Nomor paspor',
  passport_expiry: 'Paspor berakhir', check_in_date: 'Check in', check_out_date: 'Check out', birth_place: 'Tempat lahir',
  birth_date: 'Tanggal lahir', gender: 'Jenis kelamin', priority: 'Prioritas', completed_at: 'Tanggal diselesaikan',
  item_name: 'Nama barang', item_type: 'Jenis barang', courier: 'Kurir', picked_up_at: 'Tanggal diambil',
  picked_up_by_name: 'Diambil oleh', recorded_by_name: 'Dicatat oleh', code: 'Kode registrasi', brand: 'Merek sepeda',
};

export function normalizeArchiveUnit(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^T(?=[A-D]\d)/, '');
}

export function archiveValue(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (Array.isArray(value)) return value.map(archiveValue).join(', ');
  if (typeof value === 'object') return '-';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text) && !Number.isNaN(Date.parse(text))) {
    return new Date(text).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  }
  return text;
}

export function archiveBody(rows: Record<string, unknown>[]) {
  return rows.map((row, index) => [
    `ARSIP ${index + 1}`,
    ...Object.entries(labels).filter(([key]) => row[key] != null && row[key] !== '')
      .map(([key, label]) => `${label}: ${archiveValue(row[key])}`),
  ].join('\n')).join('\n\n────────────────────────────────\n\n');
}

export function printArchive(title: string, header: string, body: string, footer: string, orientation: string) {
  const popup = window.open('', '_blank');
  if (!popup) return false;
  const escape = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
  const tokens = getComputedStyle(document.documentElement);
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    :root { --ink: ${tokens.getPropertyValue('--foreground')}; --paper: ${tokens.getPropertyValue('--card')}; --line: ${tokens.getPropertyValue('--border')}; }
    @page { size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 18mm; }
    body { font: 12px Arial,sans-serif; color: hsl(var(--ink)); background: hsl(var(--paper)); }
    h1 { font-size: 20px; border-bottom: 2px solid hsl(var(--line)); padding-bottom: 12px; }
    p,pre { white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.6; }
    footer { margin-top: 32px; border-top: 1px solid hsl(var(--line)); padding-top: 12px; }
  </style></head><body><p>${escape(header)}</p><h1>${escape(title)}</h1><pre>${escape(body)}</pre><footer>${escape(footer)}</footer></body></html>`);
  popup.document.close();
  popup.onload = () => { popup.focus(); popup.print(); };
  // The document contains only text and is ready immediately.
  popup.focus(); popup.print();
  return true;
}