import * as XLSX from 'xlsx';
import Decimal from 'decimal.js';
Decimal.set({ precision: 40 });
export interface NppUnit { row: number; unit: string; owner: string; area: number | null; tower: string; type: string; description: string; transfer: string; npp: number | null; nppFormat?: string; nppDisplay?: string; remark: string }
export interface NppOwner { key: string; name: string; units: NppUnit[]; area: number; npp: number; nppExact: string; nppFormat?: string }
export const normalizeOwner = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleUpperCase('id-ID');
export const nppOwnerName = (unit: NppUnit) => unit.transfer?.trim() ? unit.transfer : unit.owner;
export const nppValue = (n: number | string, format = 'General') => format === 'General' ? new Decimal(n).toFixed() : XLSX.SSF.format(format, Number(n));
export const sumNpp = (units: NppUnit[]) => units.reduce((s, u) => s.plus(u.npp != null && u.npp >= 0 ? u.npp : 0), new Decimal(0)).toFixed();
export const nppUnitValue = (u: NppUnit) => u.npp == null ? 'NPP Belum Tersedia' : u.nppDisplay ?? nppValue(u.npp, u.nppFormat);
export const nppOwnerValue = (g: NppOwner) => g.units.every(u => u.npp == null) ? 'NPP Belum Tersedia' : nppValue(g.nppExact, g.nppFormat);
export const nppNumber = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(n);
export function parseNpp(buffer: ArrayBuffer): NppUnit[] {
 const workbook = XLSX.read(buffer, { type: 'array', cellNF: true, cellText: true });
 const sheetName = workbook.SheetNames.find(n => n.trim().toUpperCase() === 'MASTER DATA UPDATE');
 if (!sheetName) throw new Error('Sheet MASTER DATA UPDATE tidak ditemukan');
 const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: null });
 const headerIndex = rows.findIndex(r => r.some(v => String(v).trim().toUpperCase() === 'NO. UNIT'));
 if (headerIndex < 0) throw new Error('Kolom NO. UNIT tidak ditemukan');
 const header = rows[headerIndex].map(v => String(v).trim().toUpperCase());
 const required = ['NO. UNIT','NAMA PEMILIK','M2','TOWER','TYPE','KETERANGAN','BALIK NAMA','NPP','REMARK UNIT KURATOR/KAGUM'];
 if (required.some(k => !header.includes(k))) throw new Error('Kolom wajib tidak lengkap: ' + required.filter(k => !header.includes(k)).join(', '));
 const numeric = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  s = s.replace('%','').replace(/\s/g,'');
  if (s.includes(',')) s = s.replace(/\./g,'').replace(',','.');
  const n = Number(s); return Number.isFinite(n) ? n : null;
 };
 return rows.slice(headerIndex + 1).flatMap((r, i) => {
  const get = (k: string) => r[header.indexOf(k)]; const text = (k: string) => String(get(k) ?? '');
  const unit = text('NO. UNIT').trim();
   const cell = workbook.Sheets[sheetName][XLSX.utils.encode_cell({ r: headerIndex + i + 1, c: header.indexOf('NPP') })];
  if (!unit || /^(TOTAL|JUMLAH|GRAND TOTAL|SUBTOTAL)\b/i.test(unit)) return [];
  return [{ row: headerIndex + i + 2, unit, owner: text('NAMA PEMILIK'), area: numeric(get('M2')), tower: text('TOWER').trim(), type: text('TYPE').trim().toLowerCase(), description: text('KETERANGAN'), transfer: text('BALIK NAMA'), npp: numeric(get('NPP')), nppFormat: cell?.z || 'General', nppDisplay: cell?.w || (get('NPP') == null ? undefined : String(get('NPP'))), remark: text('REMARK UNIT KURATOR/KAGUM') }];
 });
}
export function validateNpp(rows: NppUnit[]) {
 const seen = new Set<string>(); const issues: { row: number; unit: string; message: string }[] = []; const unique: NppUnit[] = [];
 for (const r of rows) {
  const unit = r.unit.trim().toUpperCase();
  if (seen.has(unit)) { issues.push({row:r.row,unit:r.unit,message:'Nomor unit duplikat — tidak dihitung ulang'}); continue; }
  seen.add(unit); unique.push(r);
   if (!normalizeOwner(nppOwnerName(r))) issues.push({row:r.row,unit:r.unit,message:'Nama pemilik kosong'});
  if (r.area == null || r.area < 0) issues.push({row:r.row,unit:r.unit,message:'Luas kosong/tidak valid/negatif'});
  if (r.npp == null || r.npp < 0) issues.push({row:r.row,unit:r.unit,message:r.npp == null ? 'NPP Belum Tersedia' : 'NPP negatif'});
 }
 return { unique, issues };
}
export function groupNpp(rows: NppUnit[], aliases: Record<string,string>): NppOwner[] {
 const groups = new Map<string,NppOwner>();
 for (const r of rows) {
   const raw = normalizeOwner(nppOwnerName(r)); const name = aliases[raw] || raw || `PEMILIK BELUM DIISI — ${r.unit}`; const key = normalizeOwner(name);
  const group = groups.get(key) || {key,name,units:[],area:0,npp:0,nppExact:'0',nppFormat:r.nppFormat};
  group.units.push(r); group.area += r.area != null && r.area >= 0 ? r.area : 0; group.nppExact = new Decimal(group.nppExact).plus(r.npp != null && r.npp >= 0 ? r.npp : 0).toFixed(); group.npp = Number(group.nppExact); if (group.nppFormat !== r.nppFormat) group.nppFormat = 'General'; groups.set(key,group);
 }
 return [...groups.values()];
}
export function exportNpp(groups: NppOwner[], mode: 'owners'|'units'|'selected') {
 const wb = XLSX.utils.book_new();
 const data = mode === 'units' ? groups.flatMap(g => g.units.map(u => ({ 'Baris Sumber':u.row,'NO. UNIT':u.unit,'NAMA PEMILIK ASLI':u.owner,'Nama Kelompok':g.name,'M2':u.area,'TOWER':u.tower,'Type':u.type,'KETERANGAN':u.description,'BALIK NAMA':u.transfer,'NPP':u.npp,'REMARK UNIT KURATOR/KAGUM':u.remark }))) : groups.map(g => ({'Nama Pemilik':g.name,'Jumlah Unit':g.units.length,'Daftar Nomor Unit':g.units.map(u=>u.unit).join(', '),'Total Luas (m²)':g.area,'Total NPP':g.npp,'Verifikasi':'Belum diverifikasi'}));
 const ws=XLSX.utils.json_to_sheet(data); ws['!cols']=Object.keys(data[0]||{}).map(k=>({wch:k.includes('Nama')||k.includes('PEMILIK')?35:22}));
 const keys=Object.keys(data[0]||{}); const col=keys.findIndex(k=>k==='NPP'||k==='Total NPP');
 for(let i=0;i<data.length;i++){ const cell=ws[XLSX.utils.encode_cell({r:i+1,c:col})]; if(cell)cell.z=mode==='units' ? (groups.flatMap(g=>g.units)[i].nppFormat || 'General') : (groups[i].nppFormat || 'General'); }
 XLSX.utils.book_append_sheet(wb,ws,mode==='units'?'Detail Unit':'Rekap Pemilik'); XLSX.writeFile(wb,`NPP_2026_${mode}.xlsx`);
}
