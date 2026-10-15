import { useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { correspondenceDocument, fitCorrespondence, printCorrespondence } from '@/lib/correspondenceDocument';
import { serviceCorrespondence, type PrintableRecord, type PrintableService } from '@/lib/serviceCorrespondence';

export function ServiceRecordPrint({ service, record }: { service: PrintableService; record: PrintableRecord }) {
  const [open, setOpen] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const template = open ? serviceCorrespondence(service, record) : null;

  useEffect(() => {
    if (!open) return;
    const resize = () => { if (frameRef.current) fitCorrespondence(frameRef.current); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [open]);

  const print = () => {
    if (!template) return;
    const doc = frameRef.current?.contentDocument;
    doc?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(input => {
      if (input.checked) input.setAttribute('checked', '');
      else input.removeAttribute('checked');
    });
    void printCorrespondence(template, doc?.querySelector('.letter-content')?.innerHTML)
      .catch(error => toast.error(error instanceof Error ? error.message : 'Gagal mencetak formulir'));
  };

  return <>
    <Button variant="outline" size="icon" title="Cetak Formulir" aria-label="Cetak Formulir" data-allow-restricted="true" onClick={() => setOpen(true)}><Printer className="h-4 w-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[95dvh] max-w-5xl flex-col gap-3 p-3 sm:p-5" aria-describedby={undefined}>
        <DialogHeader className="pr-7"><DialogTitle>{template?.title}</DialogTitle></DialogHeader>
        <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
          <span className="text-sm text-muted-foreground">{record.unit_number || record.units?.unit_number} · A4</span>
          <Button onClick={print} data-allow-restricted="true"><Printer className="mr-2 h-4 w-4" />Cetak</Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-muted p-1 sm:p-4">
          {template && <iframe ref={frameRef} title={`Isian ${template.title}`} className="mx-auto block w-full max-w-[794px] border-0 bg-card" srcDoc={correspondenceDocument(template)} onLoad={() => {
            const frame = frameRef.current;
            if (!frame) return;
            const doc = frame.contentDocument;
            Promise.all(Array.from(doc?.images ?? []).map(image => image.decode().catch(() => undefined)))
              .then(() => { if (frameRef.current) fitCorrespondence(frameRef.current); });
            doc?.addEventListener('input', () => { if (frameRef.current) fitCorrespondence(frameRef.current); });
          }} />}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}