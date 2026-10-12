import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Printer, Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllRows } from '@/lib/fetchAllRows';
import { archiveServices, archiveBody, normalizeArchiveUnit, printArchive } from '@/lib/servicePrintArchive';

export function ServicePrintArchive() {
  const { pathname } = useLocation();
  const { isAdmin, user } = useAuth();
  const service = archiveServices[pathname];
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [loadedUnit, setLoadedUnit] = useState('');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [draft, setDraft] = useState({ title: '', header: '', body: '', footer: '', orientation: 'portrait' });
  if (!isAdmin || !service) return null;

  async function load(force = false) {
    if (!service || !unit.trim()) { toast.error('Masukkan nomor unit'); return; }
    setBusy(true);
    setLoadedUnit('');
    try {
      const key = normalizeArchiveUnit(unit);
      const { data: saved, error: savedError } = await supabase.from('service_print_archives').select('*')
        .eq('service_key', service.table).eq('unit_number', key).maybeSingle();
      if (savedError) throw savedError;
      if (saved && !force) {
        setDraft({ title: saved.title, header: saved.header_text, body: saved.body_text, footer: saved.footer_text, orientation: saved.orientation });
        setCount(0);
      } else {
        const { data } = await fetchAllRows(supabase.from(service.table as 'keluhan')
          .select(service.joinUnit ? '*, units(unit_number)' : '*').order('created_at', { ascending: true }));
        const rows = (data as unknown as Record<string, unknown>[]).filter(row => {
          const joined = row.units as { unit_number?: string } | null;
          return normalizeArchiveUnit(String(row.unit_number || joined?.unit_number || '')) === key;
        });
        if (!rows.length) { toast.info('Tidak ada arsip untuk unit ini'); return; }
        setCount(rows.length);
        setDraft({ title: `Arsip ${service.title} — Unit ${unit.trim().toUpperCase()}`, header: 'AJMS\nAPARTEMEN JARRDIN MANAGEMENT SISTEM',
          body: archiveBody(rows), footer: 'Mengetahui,\n\n\nBadan Pengelola', orientation: 'portrait' });
      }
      setLoadedUnit(key);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal memuat arsip'); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!service || !user || !loadedUnit) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('service_print_archives').upsert({ service_key: service.table, unit_number: loadedUnit,
        title: draft.title, header_text: draft.header, body_text: draft.body, footer_text: draft.footer, orientation: draft.orientation,
        updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'service_key,unit_number' });
      if (error) throw error;
      toast.success('Arsip cetak disimpan');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Gagal menyimpan arsip'); }
    finally { setBusy(false); }
  }
  const change = (key: keyof typeof draft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  return <div className="mb-4 flex justify-end">
    <Button variant="outline" onClick={() => { setOpen(true); setLoadedUnit(''); }} className="gap-2"><Printer className="h-4 w-4" />Cetak Arsip Unit</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Arsip {service.title}</DialogTitle><DialogDescription>Unit {loadedUnit || '—'}{count > 0 ? ` · ${count} arsip` : ''}</DialogDescription></DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="w-full"><Label htmlFor="archive-unit">Nomor Unit</Label><Input id="archive-unit" placeholder="TA0202" value={unit} onChange={e => { setUnit(e.target.value); setLoadedUnit(''); }} /></div>
          <Button disabled={busy || !unit.trim()} onClick={() => load()} className="shrink-0">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Muat Arsip'}</Button>
        </div>
        {loadedUnit && <>
          <div><Label htmlFor="archive-title">Judul Cetak</Label><Input id="archive-title" value={draft.title} onChange={e => change('title', e.target.value)} /></div>
          <div><Label htmlFor="archive-header">Kop / Header</Label><Textarea id="archive-header" value={draft.header} onChange={e => change('header', e.target.value)} /></div>
          <div><Label htmlFor="archive-body">Isi Arsip Cetak</Label><Textarea id="archive-body" className="min-h-72" value={draft.body} onChange={e => change('body', e.target.value)} /></div>
          <div><Label htmlFor="archive-footer">Catatan / Tanda Tangan</Label><Textarea id="archive-footer" value={draft.footer} onChange={e => change('footer', e.target.value)} /></div>
          <div><Label>Orientasi Kertas A4</Label><Select value={draft.orientation} onValueChange={v => change('orientation', v)}><SelectTrigger aria-label="Orientasi Kertas"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="portrait">Portrait</SelectItem><SelectItem value="landscape">Landscape</SelectItem></SelectContent></Select></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled={busy} onClick={() => { if (window.confirm('Ganti isi cetak dengan data layanan terbaru? Perubahan belum disimpan akan hilang.')) load(true); }} className="gap-2"><RefreshCw className="h-4 w-4" />Data Terbaru</Button>
            <Button disabled={busy || !draft.body.trim()} onClick={save} className="gap-2"><Save className="h-4 w-4" />Simpan Arsip</Button>
            <Button variant="outline" disabled={busy || !draft.body.trim()} onClick={() => { if (!printArchive(draft.title, draft.header, draft.body, draft.footer, draft.orientation)) toast.error('Izinkan jendela cetak pada browser'); }} className="gap-2"><Printer className="h-4 w-4" />Cetak</Button>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}