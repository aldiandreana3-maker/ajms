import letterhead from '@/assets/jarrdin-letterhead.png';

export const defaultArchiveHeader = 'BP PPPSRS THE JARRDIN CIHAMPELAS\nAlamat Jl. Cihampelas Belakang No.10\nLantai B1 RT.008 RW.005, Bandung 40131\nTelepon (022) 82067094\nEmail thejarrdinapt@gmail.com\nWebsite : thejarrdin.com';
export const defaultArchiveFooter = 'Mengetahui,\nBADAN PENGELOLA\n\n\nNama dan tanda tangan';

export const archiveServices: Record<string, { table: string; title: string; joinUnit?: boolean }> = {
  '/kepenghunian/keluhan': { table: 'keluhan', title: 'Keluhan Penghuni', joinUnit: true },
  '/kepenghunian/abonemen-parkir': { table: 'parking_subscriptions', title: 'Abonemen Parkir', joinUnit: true },
  '/kepenghunian/pemutakhiran-data': { table: 'penghuni_updates', title: 'Pemutakhiran Data Penghuni' },
  '/kepengelolaan/tro/pemutakhiran-data': { table: 'penghuni_updates', title: 'Pemutakhiran Data Penghuni' },
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
    const date = new Date(text);
    return `${date.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' })}, pukul ${date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })}`;
  }
  return text;
}

export function archiveBody(rows: Record<string, unknown>[], serviceKey?: string) {
  if (serviceKey === 'keluhan') return rows.map((row, index) => [
    `ARSIP ${index + 1}`,
    `Status: ${archiveValue(row.status)}`,
    'A. IDENTITAS PENGHUNI',
    `Nama penghuni: ${archiveValue(row.penghuni_name)}`,
    `Nomor unit: ${archiveValue(row.unit_number || (row.units as { unit_number?: string } | null)?.unit_number)}`,
    `Nomor telepon: ${archiveValue(row.phone)}`,
    `Tanggal pencatatan: ${archiveValue(row.created_at)}`,
    'B. RINCIAN KELUHAN',
    `Subjek keluhan: ${archiveValue(row.subject)}`,
    `Uraian keluhan: ${archiveValue(row.description)}`,
    'C. PENCATATAN DAN TINDAK LANJUT',
    `Catatan pemeriksaan / tindak lanjut: ${row.response ? archiveValue(row.response) : ''}`,
    `Terakhir diperbarui: ${archiveValue(row.updated_at)}`,
  ].join('\n')).join('\n\n────────────────────────────────\n\n');
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
  const isComplaint = /keluhan/i.test(title);
  const blocks = body.split(/\n\s*─{3,}\s*\n|\n(?=ARSIP \d+\s*\n)/).filter(block => block.trim());
  const statusNames: Record<string, string> = { pending: 'Pending', proses: 'Proses', selesai: 'Selesai' };
  const statusNotes: Record<string, string> = { pending: 'menunggu hasil pengecekan dan tindak lanjut', proses: 'sedang dalam pengecekan dan penanganan', selesai: 'penanganan keluhan telah selesai' };
  const identityLabels = ['nama penghuni', 'nama lengkap', 'nama pemilik / penerima', 'nomor unit', 'telepon', 'nomor telepon', 'email', 'tanggal pencatatan'];
  const pages = blocks.map((block, index) => {
    const fields: { label: string; value: string }[] = [];
    const extra: string[] = [];
    for (const line of block.split('\n')) {
      if (/^ARSIP \d+$/i.test(line.trim()) || /^[A-C]\. /i.test(line.trim())) continue;
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) fields.push({ label: match[1], value: match[2] });
      else if (fields.length) fields[fields.length - 1].value += `\n${line}`;
      else if (line.trim()) extra.push(line);
    }
    const value = (...names: string[]) => fields.find(field => names.includes(field.label.toLowerCase()))?.value ?? '';
    const status = value('status').trim().toLowerCase();
    const fieldHtml = (label: string, content: string, wide = false, ruled = false) => `<div class="field ${wide ? 'wide' : ''} ${ruled ? 'ruled' : ''}"><div class="label">${escape(label)}</div><div class="value">${escape(content === '-' && ruled ? '' : content)}</div></div>`;
    const section = (name: string, contents: string, grid = false) => `<section><h2>${escape(name)}</h2><div class="fields ${grid ? 'grid' : ''}">${contents}</div></section>`;
    const identity = isComplaint
      ? fieldHtml('NAMA PENGHUNI', value('nama penghuni', 'nama lengkap')) + fieldHtml('NOMOR UNIT', value('nomor unit')) + fieldHtml('NOMOR TELEPON', value('nomor telepon', 'telepon')) + fieldHtml('TANGGAL PENCATATAN', value('tanggal pencatatan'))
      : fields.filter(field => identityLabels.includes(field.label.toLowerCase())).map(field => fieldHtml(field.label, field.value)).join('');
    const detail = isComplaint
      ? fieldHtml('SUBJEK KELUHAN', value('subjek keluhan', 'subjek'), true) + fieldHtml('URAIAN KELUHAN', value('uraian keluhan', 'deskripsi'), true)
      : fields.filter(field => !identityLabels.includes(field.label.toLowerCase()) && !['status', 'terakhir diperbarui', 'tanggapan', 'catatan'].includes(field.label.toLowerCase())).map(field => fieldHtml(field.label, field.value, true)).join('');
    return `<article class="sheet"><img class="letterhead" src="${escape(new URL(letterhead, window.location.origin).href)}" alt="" />${header !== defaultArchiveHeader && header !== 'AJMS\nAPARTEMEN JARRDIN MANAGEMENT SISTEM' ? `<div class="custom-header">${escape(header)}</div>` : ''}<main><div class="eyebrow">ARSIP PENGHUNI</div><div class="heading"><div><h1>${escape(title.replace(/\s*[—–-]\s*Unit\s+.*$/i, '').toUpperCase())}</h1><p>${isComplaint ? 'Dokumentasi keluhan dan tindak lanjut pengelolaan unit' : 'Dokumentasi administrasi dan pengelolaan unit'}</p></div><div class="record">ARSIP ${index + 1}${status ? `<span class="badge ${['pending', 'proses', 'selesai'].includes(status) ? status : ''}">${escape(statusNames[status] || status)}</span>` : ''}</div></div>${section('A. IDENTITAS PENGHUNI', identity, true)}${section(isComplaint ? 'B. RINCIAN KELUHAN' : 'B. RINCIAN LAYANAN', detail)}${section('C. PENCATATAN DAN TINDAK LANJUT', fieldHtml('CATATAN PEMERIKSAAN / TINDAK LANJUT', value('catatan pemeriksaan / tindak lanjut', 'tanggapan', 'catatan'), true, true))}${extra.length ? `<p>${escape(extra.join('\n'))}</p>` : ''}<div class="status-strip"><div><strong>STATUS PENANGANAN</strong><p>${escape(statusNames[status] || status || '—')}${statusNotes[status] && isComplaint ? ` — ${escape(statusNotes[status])}` : ''}</p></div><small>Terakhir diperbarui: ${escape(value('terakhir diperbarui'))}</small></div><div class="signature">${footer === defaultArchiveFooter || footer === 'Mengetahui,\n\n\nBadan Pengelola' ? 'Mengetahui,<br><strong>BADAN PENGELOLA</strong><div class="signature-line"></div><em>Nama dan tanda tangan</em>' : escape(footer)}</div><div class="bottom"><span>Dokumen internal — arsip administrasi ${escape(isComplaint ? 'keluhan penghuni' : 'layanan penghuni')}</span><span>AJMS | THE JARRDIN</span></div></main></article>`;
  }).join('');
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escape(title)}</title><style>
    :root { ${['archive-ink','archive-muted','archive-accent','archive-section','archive-line','archive-paper','archive-pending','archive-process','archive-done'].map(name => `--${name}: ${tokens.getPropertyValue(`--${name}`)};`).join(' ')} }
    @page { size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'}; margin: 0; }
    * { box-sizing: border-box; letter-spacing: 0; } body { margin:0; font:10pt Arial,sans-serif; color:hsl(var(--archive-ink)); background:hsl(var(--archive-paper)); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .sheet { position:relative; min-height:297mm; width:210mm; margin:0 auto; padding:50mm 17mm 8mm; break-after:page; } .sheet:last-child { break-after:auto; }
    .letterhead { position:absolute; inset:0; width:100%; height:297mm; z-index:0; } main { position:relative; z-index:1; }
    .custom-header { position:absolute; top:11mm; right:14mm; width:58mm; min-height:29mm; z-index:1; font-size:8.5pt; line-height:1.35; white-space:pre-wrap; background:hsl(var(--archive-paper)); color:hsl(var(--archive-accent)); }
    .eyebrow { display:inline-block; background:hsl(var(--archive-accent)); color:hsl(var(--archive-paper)); border-radius:2mm; padding:2mm 8mm; font-size:8pt; font-weight:bold; }
    .heading { display:flex; align-items:center; justify-content:space-between; gap:5mm; border-bottom:0.4mm solid hsl(var(--archive-accent)); padding:5mm 0 3.5mm; margin-bottom:6mm; } h1 { color:hsl(var(--archive-ink)); font-size:18pt; margin:0 0 2mm; } p { margin:0; line-height:1.55; white-space:pre-wrap; overflow-wrap:anywhere; } .heading p { color:hsl(var(--archive-muted)); font-size:9pt; }
    .record { text-align:right; min-width:24mm; color:hsl(var(--archive-ink)); font-weight:bold; font-size:9pt; } .badge { display:block; padding:1.5mm 3mm; border-radius:1.5mm; text-transform:uppercase; background:hsl(var(--archive-accent)); color:hsl(var(--archive-paper)); font-size:8pt; } .pending { background:hsl(var(--archive-pending)); } .proses { background:hsl(var(--archive-process)); } .selesai { background:hsl(var(--archive-done)); }
    section { margin-bottom:8mm; } h2 { font-size:9pt; margin:0 0 2mm; background:hsl(var(--archive-section)); padding:2.5mm 3.5mm; border-radius:1.5mm; break-after:avoid; } .fields { padding:0 3mm; } .grid { display:grid; grid-template-columns:1fr 1fr; gap:5mm 9mm; } .field { margin-bottom:2mm; break-inside:avoid; } .label { text-transform:uppercase; font-weight:bold; font-size:8pt; color:hsl(var(--archive-muted)); margin-bottom:1.5mm; } .value { color:hsl(var(--archive-muted)); white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.6; border-bottom:0.2mm solid hsl(var(--archive-line)); padding-bottom:1mm; min-height:6mm; } .wide { margin-bottom:3mm; } .ruled .value { min-height:24mm; background:repeating-linear-gradient(transparent 0,transparent 7.6mm,hsl(var(--archive-line)) 7.6mm,hsl(var(--archive-line)) 7.8mm); border-bottom:0; }
    .status-strip { display:flex; justify-content:space-between; gap:3mm; background:hsl(var(--archive-section)); border-radius:1.5mm; padding:2.5mm 3.5mm; font-size:8pt; break-inside:avoid; } .status-strip p { color:hsl(var(--archive-muted)); } small { font-size:7pt; color:hsl(var(--archive-muted)); text-align:right; }
    .signature { text-align:center; white-space:pre-wrap; line-height:1.6; margin:7mm auto 5mm; color:hsl(var(--archive-muted)); break-inside:avoid; } .signature-line { width:50mm; margin:13mm auto 1mm; border-bottom:0.2mm solid hsl(var(--archive-line)); } em { font-size:8pt; }
    .bottom { display:flex; justify-content:space-between; gap:3mm; border-top:0.3mm solid hsl(var(--archive-accent)); padding-top:2mm; font-size:7pt; color:hsl(var(--archive-muted)); }
    ${orientation === 'landscape' ? '.sheet { width:297mm; min-height:210mm; }.letterhead {height:100%;object-fit:fill;}' : ''}
  </style></head><body>${pages}</body></html>`);
  popup.document.close();
  const image = popup.document.querySelector('img');
  const ready = () => { popup.focus(); popup.print(); };
  if (image && !image.complete) { image.addEventListener('load', ready, { once: true }); image.addEventListener('error', ready, { once: true }); }
  else ready();
  return true;
}