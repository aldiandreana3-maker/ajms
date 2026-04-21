/**
 * Parse timestamp dari Excel import.
 * Mendukung format:
 *  - ISO string (2025-04-20, 2025-04-20T10:30:00)
 *  - DD/MM/YYYY, DD/MM/YYYY HH:mm, DD/MM/YYYY HH:mm:ss
 *  - YYYY-MM-DD HH:mm[:ss]
 * Mengembalikan ISO string atau null jika kosong/invalid.
 */
export function parseImportTimestamp(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  if (!str) return null;

  // DD/MM/YYYY [HH:mm[:ss]]
  const dmy = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dmy) {
    const [, d, m, y, hh = "0", mm = "0", ss = "0"] = dmy;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    const dt = new Date(year, parseInt(m) - 1, parseInt(d), parseInt(hh), parseInt(mm), parseInt(ss));
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  // Native parse fallback
  const dt = new Date(str);
  if (!isNaN(dt.getTime())) return dt.toISOString();
  return null;
}
