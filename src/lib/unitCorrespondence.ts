import { serviceCorrespondence, type PrintableRecord, type PrintableService } from './serviceCorrespondence';
import type { CorrespondenceTemplate } from './correspondenceTemplates';

export const unitCorrespondenceServices: Record<string, PrintableService> = {
  parking_subscriptions: 'parking', keluhan: 'complaint', access_cards: 'access',
  work_permits: 'permit', work_orders: 'work-order',
};

// Legacy text is interpreted in memory only; the stored snapshot remains untouched.
export function unitCorrespondenceTemplates(service: PrintableService, rows: PrintableRecord[], savedBody?: string): CorrespondenceTemplate[] {
  const templates = rows.map(row => serviceCorrespondence(service, row));
  if (!savedBody) return templates;
  try {
    const saved: unknown = JSON.parse(savedBody);
    if (saved && typeof saved === 'object' && 'format' in saved && saved.format === 'correspondence-v1' && 'bodies' in saved && Array.isArray(saved.bodies) && saved.bodies.every(body => typeof body === 'string')) {
      const base = templates[0];
      return base ? saved.bodies.map(body => ({ ...base, body })) : templates;
    }
  } catch { /* Earlier snapshots used labeled text rather than document bodies. */ }
  const aliases: Record<string, keyof PrintableRecord> = {
    'nama penghuni': 'penghuni_name', 'nama lengkap': 'penghuni_name', 'nomor unit': 'unit_number',
    'telepon': 'phone', 'nomor telepon': 'phone', 'subjek keluhan': 'subject', 'subjek': 'subject',
    'uraian keluhan': 'description', 'deskripsi': 'description', 'tanggapan': 'response',
    'catatan pemeriksaan / tindak lanjut': 'response', 'jenis kendaraan': 'vehicle_type',
    'nomor polisi': 'vehicle_number', 'periode': 'period_type', 'jenis pengajuan': 'request_type',
    'jumlah kartu': 'quantity_requested', 'nomor kartu': 'card_number', 'nama vendor': 'vendor_name',
    'deskripsi pekerjaan': 'work_description', 'jumlah pekerja': 'worker_count', 'judul': 'title',
  };
  const blocks = savedBody.split(/\n\s*─{3,}\s*\n|\n(?=ARSIP \d+\s*\n)/).filter(block => block.trim());
  return blocks.map((block, index) => {
    const record: PrintableRecord = { ...(rows[index] ?? { id: `legacy-${index}` }) };
    let key: keyof PrintableRecord | undefined;
    block.split('\n').forEach(line => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        key = aliases[match[1].trim().toLowerCase()];
        if (key) Object.assign(record, { [key]: match[2] === '-' ? '' : match[2] });
      } else if (/^ARSIP \d+$|^[A-C]\. /i.test(line.trim())) key = undefined;
      else if (key && line.trim()) Object.assign(record, { [key]: `${record[key] ?? ''}\n${line}` });
    });
    return serviceCorrespondence(service, record);
  });
}