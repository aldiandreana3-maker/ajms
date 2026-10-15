import { correspondenceTemplates, type CorrespondenceTemplate } from './correspondenceTemplates';

export type PrintableService = 'parking' | 'complaint' | 'access' | 'permit' | 'work-order';

// Only the selected, already-authorized record is used; no unit-wide lookup.
export interface PrintableRecord {
  id: string;
  created_at?: string | null;
  unit_number?: string | null;
  penghuni_name?: string | null;
  phone?: string | null;
  units?: { unit_number: string } | null;
  penghuni?: { full_name: string } | null;
  keluhan?: { penghuni_name: string | null } | null;
  vehicle_type?: string;
  vehicle_number?: string;
  period_type?: string | null;
  start_date?: string;
  end_date?: string | null;
  card_number?: string;
  request_type?: string | null;
  quantity_requested?: number | null;
  vendor_name?: string;
  work_description?: string;
  worker_count?: number;
  title?: string;
  subject?: string;
  description?: string | null;
  response?: string | null;
}

const templateIds: Record<PrintableService, string> = {
  parking: 'registrasi-kendaraan', complaint: 'request-complaint',
  access: 'kartu-akses', permit: 'pengajuan-izin', 'work-order': 'work-order-rab',
};

function dateText(value?: string | null, weekday = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta',
    ...(weekday ? { weekday: 'long' as const } : {}), day: '2-digit', month: 'long', year: 'numeric' });
}

function daysBetween(start?: string, end?: string | null) {
  if (!start || !end) return undefined;
  const days = Math.round((Date.parse(end.slice(0, 10)) - Date.parse(start.slice(0, 10))) / 86_400_000) + 1;
  return Number.isFinite(days) && days > 0 ? days : undefined;
}

export function serviceCorrespondence(service: PrintableService, row: PrintableRecord): CorrespondenceTemplate {
  const template = correspondenceTemplates.find(item => item.id === templateIds[service]);
  if (!template) throw new Error('Formulir tidak ditemukan');
  const doc = new DOMParser().parseFromString(template.body, 'text/html');
  const fields: Record<string, string | number | null | undefined> = {};
  const checked: string[] = [];
  const name = row.penghuni_name || row.penghuni?.full_name || row.keluhan?.penghuni_name;
  const unit = row.unit_number || row.units?.unit_number;
  const period = [dateText(row.start_date), dateText(row.end_date)].filter(Boolean).join(' s/d ');

  if (service === 'parking') {
    Object.assign(fields, { 'Tanggal surat': dateText(row.created_at), 'No. Unit': unit,
      'No. Telepon': row.phone, 'Nama Pengguna': name, 'No. Plat': row.vehicle_number,
      'Nama Pemilik/Penghuni': name });
    if (row.vehicle_type?.toLowerCase() === 'motor') checked.push('MOTOR');
    if (row.vehicle_type?.toLowerCase() === 'mobil') checked.push('MOBIL');
    if (row.period_type === 'harian') {
      checked.push('HARIAN'); fields['Periode harian'] = period;
      fields['Jumlah hari'] = daysBetween(row.start_date, row.end_date);
    } else if (row.period_type === 'bulanan') {
      checked.push('BULANAN'); fields['Periode bulanan'] = period;
    }
  } else if (service === 'complaint') {
    Object.assign(fields, { 'Hari / Tanggal': dateText(row.created_at, true), 'Nama': name,
      'No. Unit': unit, 'Telepon': row.phone,
      'Permohonan / permasalahan': [row.subject, row.description].filter(Boolean).join('\n\n'),
      'Penyelesaian': row.response, 'Nama Pemohon': name });
    checked.push('Permasalahan');
  } else if (service === 'access') {
    Object.assign(fields, { 'Nomor surat': row.card_number, 'Tanggal surat': dateText(row.created_at),
      'Nama': name, 'No. Unit': unit, 'Jumlah Kartu Akses': row.quantity_requested,
      'Nama Pemilik/Penghuni': name });
    const request = { tambah_baru: 'Tambah baru', hilang: 'Hilang', rusak: 'Rusak (Ada Fisik)', baru: 'Baru' };
    const label = request[row.request_type as keyof typeof request];
    if (label) checked.push(label);
  } else if (service === 'permit') {
    Object.assign(fields, { 'Tanggal izin': dateText(row.created_at), 'Penanggung Jawab': name,
      'No. Unit / Nama Vendor': [unit, row.vendor_name].filter(Boolean).join(' / '),
      'Jenis Pekerjaan': row.work_description,
      'Lama Pengerjaan': daysBetween(row.start_date, row.end_date) ? `${daysBetween(row.start_date, row.end_date)} Hari` : '',
      'Tanggal Pengerjaan': period, 'Jumlah Pekerja': row.worker_count,
      'Nama Penanggung Jawab': name });
  } else {
    Object.assign(fields, { 'Tanggal surat': dateText(row.created_at), 'Nama': name,
      'Unit': unit, 'Pekerjaan': [row.title, row.description].filter(Boolean).join('\n\n'),
      'Nama Pemohon': name });
  }

  // textContent prevents stored text from becoming markup; unknown fields stay blank.
  doc.querySelectorAll<HTMLElement>('[data-field]').forEach(field => {
    const value = fields[field.getAttribute('aria-label') || ''];
    field.textContent = value === null || value === undefined ? '' : String(value);
  });
  doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(input => {
    if (checked.includes(input.getAttribute('aria-label') || '')) input.setAttribute('checked', '');
    else input.removeAttribute('checked');
  });
  return { ...template, body: doc.body.innerHTML };
}