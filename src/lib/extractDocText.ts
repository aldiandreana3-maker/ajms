// Extracts plain text from TXT, DOCX, PDF files (client-side).
import mammoth from "mammoth";

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return await file.text();
  }

  if (name.endsWith(".docx")) {
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return value || "";
  }

  if (name.endsWith(".pdf")) {
    // Lazy-load pdfjs to keep main bundle small
    const pdfjs: any = await import("pdfjs-dist");
    // Use a CDN worker — avoids bundler config issues
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strs = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
      text += strs.join(" ") + "\n\n";
    }
    return text;
  }

  throw new Error("Format file tidak didukung. Gunakan TXT, DOCX, atau PDF.");
}

/**
 * Pecah teks panjang menjadi potongan ~500 karakter dengan batas paragraf.
 * Menghasilkan list { question, answer, keywords } siap insert ke knowledge base.
 */
export function chunkArticle(
  raw: string,
  topicTitle: string,
  maxChars = 600
): { question: string; answer: string; keywords: string[] }[] {
  const clean = raw.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];

  // Split by paragraph then merge to ~maxChars per chunk
  const paragraphs = clean.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = "";
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).length <= maxChars) {
      buf = buf ? buf + "\n\n" + p : p;
    } else {
      if (buf) chunks.push(buf);
      // If single paragraph too long, hard-split by sentence
      if (p.length > maxChars) {
        const sentences = p.split(/(?<=[.!?])\s+/);
        let sBuf = "";
        for (const s of sentences) {
          if ((sBuf + " " + s).length <= maxChars) sBuf = sBuf ? sBuf + " " + s : s;
          else {
            if (sBuf) chunks.push(sBuf);
            sBuf = s;
          }
        }
        if (sBuf) chunks.push(sBuf);
        buf = "";
      } else {
        buf = p;
      }
    }
  }
  if (buf) chunks.push(buf);

  // Build KB rows. Question = first sentence (max 120 chars), keywords = top words
  return chunks.map((chunk, idx) => {
    const firstSentence = chunk.split(/(?<=[.!?])\s/)[0]?.slice(0, 120) || `${topicTitle} bagian ${idx + 1}`;
    return {
      question: `${topicTitle} — ${firstSentence}`.slice(0, 200),
      answer: chunk,
      keywords: extractKeywords(chunk, topicTitle),
    };
  });
}

function extractKeywords(text: string, topic: string): string[] {
  const stop = new Set([
    "yang","untuk","dengan","dari","akan","atau","ini","itu","pada","tidak","ada","adalah",
    "dan","di","ke","oleh","sebagai","juga","agar","bisa","dapat","jika","maka","saya","anda",
    "kami","kita","mereka","the","and","for","with","from","that","this","are","was","were",
    "have","has","you","your","not","but","all","any","one","two"
  ]);
  const words = (topic + " " + text)
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w));
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}
