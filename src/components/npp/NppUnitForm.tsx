import { useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type NppUnit } from '@/lib/npp';

const numberField = z.string().trim().refine(v => !v || (/^\d+(?:[.,]\d+)?$/.test(v) && Number.isFinite(Number(v.replace(',', '.')))), 'Masukkan angka tidak negatif');
const formSchema = z.object({ unit: z.string().trim().min(1, 'Nomor unit wajib diisi').max(50), owner: z.string().trim().min(1, 'Nama pemilik wajib diisi').max(300), transfer: z.string().max(300), area: numberField, npp: numberField, tower: z.string().max(50), type: z.string().max(100), description: z.string().max(2000), remark: z.string().max(2000) });
type Fields = z.infer<typeof formSchema>;
export function NppUnitForm({ original, onClose, onSave, pending }: { original: NppUnit | null; onClose: () => void; onSave: (unit: NppUnit) => Promise<void>; pending: boolean }) {
  const [form, setForm] = useState<Fields>({ unit: original?.unit || '', owner: original?.owner || '', transfer: original?.transfer || '', area: original?.area == null ? '' : String(original.area), npp: original?.npp == null ? '' : String(original.npp), tower: original?.tower || '', type: original?.type || '', description: original?.description || '', remark: original?.remark || '' });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const parsed = formSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message || 'Periksa isian'); return; }
    const f = parsed.data; const value = f.npp ? Number(f.npp.replace(',', '.')) : null;
    const unchanged = original && value === original.npp;
    const decimals = f.npp.replace(',', '.').split('.')[1]?.length || 0;
    await onSave({ ...original, ...f, row: original?.row || 0, area: f.area ? Number(f.area.replace(',', '.')) : null, npp: value, nppFormat: unchanged ? original.nppFormat : decimals ? `0.${'0'.repeat(decimals)}` : 'General', nppDisplay: unchanged ? original.nppDisplay : value == null ? undefined : f.npp.replace(',', '.') });
  }
  return <Dialog open onOpenChange={v => { if (!v && !pending) onClose(); }}><DialogContent className="max-w-2xl max-h-[85vh] overflow-auto"><DialogHeader><DialogTitle>{original ? `Edit Unit ${original.unit}` : 'Tambah Unit NPP'}</DialogTitle></DialogHeader><form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">{([['unit','Nomor unit'],['owner','Nama pemilik'],['transfer','Balik nama'],['tower','Tower'],['type','Tipe'],['area','Luas (m²)'],['npp','NPP'],['description','Keterangan'],['remark','Remark']] as [keyof Fields,string][]).map(([key,label]) => <label key={key} className="space-y-1 text-sm font-medium">{label}<Input aria-label={label} value={form[key]} required={key === 'unit' || key === 'owner'} inputMode={key === 'npp' || key === 'area' ? 'decimal' : 'text'} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} disabled={pending}/></label>)}<div className="sm:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Batal</Button><Button type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan Unit'}</Button></div></form></DialogContent></Dialog>;
}