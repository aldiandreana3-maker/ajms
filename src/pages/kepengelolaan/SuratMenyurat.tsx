import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer, RotateCcw, Search, ShieldAlert, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { correspondenceTemplates, type CorrespondenceTemplate } from '@/lib/correspondenceTemplates';
import { correspondenceDocument, fitCorrespondence } from '@/lib/correspondenceDocument';

export default function SuratMenyurat() {
  const navigate = useNavigate();
  const { isAdmin, role, isLoading } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<CorrespondenceTemplate | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [resetOpen, setResetOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const canAccess = isAdmin || role === 'staff_tro';

  useEffect(() => {
    const resize = () => { if (frameRef.current) fitCorrespondence(frameRef.current); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const readBody = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return undefined;
    doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(input => {
      if (input.checked) input.setAttribute('checked', '');
      else input.removeAttribute('checked');
    });
    return doc.querySelector('.letter-content')?.innerHTML;
  };

  const close = () => {
    const body = readBody();
    if (selected && body !== undefined) setDrafts(previous => ({ ...previous, [selected.id]: body }));
    setSelected(null);
  };

  const print = () => {
    if (!selected) return;
    const popup = window.open('', '_blank');
    if (!popup) { toast({ title: 'Izinkan jendela cetak pada browser Anda', variant: 'destructive' }); return; }
    popup.document.write(correspondenceDocument(selected, readBody()));
    popup.document.close();
    const fit = () => {
      const sheet = popup.document.querySelector<HTMLElement>('.letter-page');
      const content = popup.document.querySelector<HTMLElement>('.letter-content');
      if (!sheet || !content) return;
      content.style.zoom = '1';
      const css = popup.getComputedStyle(sheet);
      const height = (selected.orientation === 'landscape' ? 209 : 296) * 96 / 25.4;
      const available = height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 4;
      if (content.scrollHeight > available) content.style.zoom = String(available / content.scrollHeight);
    };
    popup.addEventListener('beforeprint', fit);
    Promise.all(Array.from(popup.document.images).map(image => image.decode()))
      .then(() => popup.document.fonts.ready)
      .then(() => { fit(); popup.focus(); popup.print(); })
      .catch(() => { popup.close(); toast({ title: 'Kop surat gagal dimuat. Silakan coba lagi.', variant: 'destructive' }); });
  };

  if (isLoading) return <MainLayout><p>Memuat…</p></MainLayout>;
  if (!canAccess) return <MainLayout><div className="flex min-h-[60vh] flex-col items-center justify-center gap-3"><ShieldAlert className="h-12 w-12 text-muted-foreground"/><h1 className="text-xl font-bold">Akses Ditolak</h1></div></MainLayout>;

  const [query, setQuery] = useState('');
  const filtered = correspondenceTemplates.filter(template =>
    template.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return <MainLayout>
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Button variant="ghost" size="icon" aria-label="Kembali ke Tenant Relation Office" onClick={() => navigate('/kepengelolaan/tro')}><ArrowLeft className="h-5 w-5"/></Button><h1 className="text-2xl font-bold">Surat Menyurat</h1></div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari formulir surat..." className="pl-9 pr-9" aria-label="Cari formulir surat" />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Bersihkan pencarian">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-muted-foreground">Tidak ada formulir yang cocok dengan "{query}".</p>
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template, index) => <div key={template.id} className="flex flex-col rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between"><FileText className="h-7 w-7 text-primary"/><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')} · A4 {template.orientation === 'portrait' ? 'Potret' : 'Landscape'}</span></div>
          <h2 className="mb-5 flex-1 text-lg font-semibold">{template.title}</h2>
          <Button className="w-full" onClick={() => setSelected(template)}><FileText className="mr-2 h-4 w-4"/>Buka Formulir</Button>
        </div>)}
      </div>
      )}
    </div>
    <Dialog open={selected !== null} onOpenChange={open => { if (!open) close(); }}>
      <DialogContent className="flex max-h-[95dvh] max-w-5xl flex-col gap-3 p-3 sm:p-5" aria-describedby={undefined}>
        <DialogHeader className="pr-7"><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3"><span className="text-sm text-muted-foreground">A4 · {selected?.orientation === 'landscape' ? 'Landscape' : 'Potret'}</span><div className="flex gap-2"><Button variant="outline" onClick={() => setResetOpen(true)}><RotateCcw className="mr-2 h-4 w-4"/>Reset</Button><Button onClick={print}><Printer className="mr-2 h-4 w-4"/>Cetak</Button></div></div>
        <div className="min-h-0 flex-1 overflow-auto bg-muted p-1 sm:p-4">
          {selected && <iframe key={`${selected.id}-${revision}`} ref={frameRef} title={`Isian ${selected.title}`} className="mx-auto block w-full max-w-[794px] border-0 bg-card" srcDoc={correspondenceDocument(selected, drafts[selected.id])} onLoad={() => {
            const frame = frameRef.current;
            if (!frame) return;
            const doc = frame.contentDocument;
            Promise.all(Array.from(doc?.images ?? []).map(image => image.decode().catch(() => undefined))).then(() => { if (frameRef.current) fitCorrespondence(frameRef.current); });
            doc?.addEventListener('input', () => { if (frameRef.current) fitCorrespondence(frameRef.current); });
          }}/>}
        </div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={resetOpen} onOpenChange={setResetOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Kosongkan formulir?</AlertDialogTitle><AlertDialogDescription>Isian dan perubahan pada formulir ini akan dikembalikan ke contoh awal.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={() => { if (selected) setDrafts(previous => { const next = { ...previous }; delete next[selected.id]; return next; }); setRevision(value => value + 1); }}>Reset Formulir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </MainLayout>;
}