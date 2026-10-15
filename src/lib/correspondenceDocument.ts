import letterhead from '@/assets/jarrdin-letterhead.png';
import styles from '@/styles/correspondence.css?raw';
import type { CorrespondenceTemplate } from './correspondenceTemplates';

export function correspondenceDocument(template: CorrespondenceTemplate, body?: string, additionalBodies: string[] = []) {
  const safeTitle = template.title.replace(/[<>&"]/g, '');
  const headUrl = new URL(letterhead, window.location.origin).href;
  const pages = [body ?? template.body, ...additionalBodies].map(content => `<article class="letter-page ${template.orientation}" data-template="${template.id}"><img class="letterhead" src="${headUrl}" alt="Kop surat Badan Pengelola The Jarrdin"/><main class="letter-content">${content}</main></article>`).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${safeTitle}</title><style>${styles}.letter-page {break-after:page;} .letter-page:last-child {break-after:auto;} ${template.orientation === 'landscape' ? '@media print {@page {size:A4 landscape;} html,body {width:297mm;} .letter-page {height:209mm;}}' : ''}</style></head><body>${pages}</body></html>`;
}

export function fitCorrespondence(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  const sheet = doc?.querySelector<HTMLElement>('.letter-page');
  const content = doc?.querySelector<HTMLElement>('.letter-content');
  if (!doc || !sheet || !content || !frame.contentWindow) return;
  const landscape = sheet.classList.contains('landscape');
  const pageHeight = (landscape ? 209 : 296) * 96 / 25.4;
  sheet.style.zoom = '1';
  content.style.zoom = '1';
  const css = frame.contentWindow.getComputedStyle(sheet);
  const available = pageHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 4;
  const contentHeight = content.scrollHeight;
  if (contentHeight > available) content.style.zoom = String(available / contentHeight);
  const scale = Math.min(1, frame.clientWidth / sheet.offsetWidth);
  sheet.style.zoom = String(scale);
  frame.style.height = `${Math.ceil(pageHeight * scale) + 2}px`;
}

export async function printCorrespondence(template: CorrespondenceTemplate, body?: string, additionalBodies: string[] = []) {
  const popup = window.open('', '_blank');
  if (!popup) throw new Error('Izinkan jendela cetak pada browser Anda');
  popup.document.write(correspondenceDocument(template, body, additionalBodies));
  popup.document.close();
  const fit = () => {
    popup.document.querySelectorAll<HTMLElement>('.letter-page').forEach(sheet => {
      const content = sheet.querySelector<HTMLElement>('.letter-content');
      if (!content) return;
      content.style.zoom = '1';
      const css = popup.getComputedStyle(sheet);
      const height = (template.orientation === 'landscape' ? 209 : 296) * 96 / 25.4;
      const available = height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom) - 4;
      if (content.scrollHeight > available) content.style.zoom = String(available / content.scrollHeight);
    });
  };
  popup.addEventListener('beforeprint', fit);
  try {
    await Promise.all(Array.from(popup.document.images).map(image => image.decode()));
    await popup.document.fonts.ready;
    fit(); popup.focus(); popup.print();
  } catch {
    popup.close();
    throw new Error('Kop surat gagal dimuat. Silakan coba lagi.');
  }
}