// Utility functions untuk WhatsApp Blast Sender

export interface WaContact {
  id: string;
  name: string;
  unit: string;
  phone: string; // normalized: 62xxx
}

export type SafetyMode = "normal" | "safe" | "ultra" | "custom";

export interface SafetyConfig {
  dailyLimit: number;
  hourlyLimit: number;
  minDelay: number; // seconds
  maxDelay: number;
  cooldownEvery: number; // messages
  cooldownMin: number;
  cooldownMax: number;
  longBreakEvery: number;
  longBreakMin: number; // minutes
  longBreakMax: number;
}

export const SAFETY_CONFIGS: Record<SafetyMode, SafetyConfig> = {
  normal: {
    dailyLimit: 80,
    hourlyLimit: 30,
    minDelay: 8,
    maxDelay: 18,
    cooldownEvery: 15,
    cooldownMin: 45,
    cooldownMax: 120,
    longBreakEvery: 50,
    longBreakMin: 5,
    longBreakMax: 15,
  },
  safe: {
    dailyLimit: 50,
    hourlyLimit: 20,
    minDelay: 15,
    maxDelay: 35,
    cooldownEvery: 10,
    cooldownMin: 90,
    cooldownMax: 200,
    longBreakEvery: 30,
    longBreakMin: 10,
    longBreakMax: 20,
  },
  ultra: {
    dailyLimit: 30,
    hourlyLimit: 12,
    minDelay: 25,
    maxDelay: 60,
    cooldownEvery: 6,
    cooldownMin: 120,
    cooldownMax: 300,
    longBreakEvery: 20,
    longBreakMin: 15,
    longBreakMax: 30,
  custom: {
    dailyLimit: 200,
    hourlyLimit: 60,
    minDelay: 5,
    maxDelay: 10,
    cooldownEvery: 10,
    cooldownMin: 60,
    cooldownMax: 60,
    longBreakEvery: 50,
    longBreakMin: 10,
    longBreakMax: 10,
  },
};

/** Normalize Indonesian phone to 62xxx format */
export function normalizePhone(raw: string): string {
  let p = String(raw ?? "").replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (p.startsWith("8")) p = "62" + p;
  if (!p.startsWith("62")) p = "62" + p;
  return p;
}

export function isValidPhone(raw: string): boolean {
  const n = normalizePhone(raw);
  return /^62\d{8,14}$/.test(n);
}

/** Detect type of token: phone | unit | name */
function detectTokenType(token: string): "phone" | "unit" | "name" {
  const t = token.trim();
  const digitsOnly = t.replace(/\D/g, "");
  if (digitsOnly.length >= 8 && digitsOnly.length / t.length > 0.6) {
    return "phone";
  }
  // unit pattern: letters + digits, e.g. TA0504
  if (/^[A-Za-z]{1,3}\d{2,6}$/.test(t)) return "unit";
  return "name";
}

/** Parse bulk text input into contacts */
export function parseBulkContacts(text: string): WaContact[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const contacts: WaContact[] = [];
  for (const line of lines) {
    const tokens = line.split(/[,;\t|]/).map((t) => t.trim()).filter(Boolean);
    let name = "";
    let phone = "";
    let unit = "";

    for (const tok of tokens) {
      const type = detectTokenType(tok);
      if (type === "phone" && !phone) phone = tok;
      else if (type === "unit" && !unit) unit = tok.toUpperCase();
      else if (type === "name" && !name) name = tok;
      else if (!phone && /\d{8,}/.test(tok)) phone = tok;
    }

    if (phone && isValidPhone(phone)) {
      contacts.push({
        id: crypto.randomUUID(),
        name,
        unit,
        phone: normalizePhone(phone),
      });
    }
  }
  return contacts;
}

/** Parse Excel rows (array of arrays) with optional header */
export function parseExcelRows(rows: unknown[][]): WaContact[] {
  if (!rows.length) return [];
  const result: WaContact[] = [];

  // Try header detection
  const first = (rows[0] || []).map((v) => String(v ?? "").trim().toLowerCase());
  const nameKeys = ["nama", "name", "kontak", "contact"];
  const phoneKeys = ["nomor", "phone", "hp", "wa", "whatsapp", "telepon", "telp", "no hp", "no_hp"];
  const unitKeys = ["unit", "hunian", "apartemen", "tower", "no unit", "no_unit"];

  let nameIdx = first.findIndex((h) => nameKeys.some((k) => h.includes(k)));
  let phoneIdx = first.findIndex((h) => phoneKeys.some((k) => h.includes(k)));
  let unitIdx = first.findIndex((h) => unitKeys.some((k) => h.includes(k)));

  let dataStart = 0;
  if (phoneIdx >= 0 || nameIdx >= 0 || unitIdx >= 0) {
    dataStart = 1;
  } else {
    // Auto-detect by scanning columns of data (skip header check)
    const sample = rows.slice(0, Math.min(10, rows.length));
    const colCount = Math.max(...sample.map((r) => r.length));
    const scores = Array(colCount).fill(null).map(() => ({
      digits: 0,
      unitLike: 0,
      letters: 0,
    }));
    for (const r of sample) {
      for (let i = 0; i < colCount; i++) {
        const v = String(r[i] ?? "").trim();
        if (!v) continue;
        const d = v.replace(/\D/g, "").length;
        if (d >= 8 && d / v.length > 0.6) scores[i].digits++;
        if (/^[A-Za-z]{1,3}\d{2,6}$/.test(v)) scores[i].unitLike++;
        if (/^[A-Za-z\s]+$/.test(v)) scores[i].letters++;
      }
    }
    phoneIdx = scores.findIndex((s) => s.digits > 0);
    if (phoneIdx === -1) phoneIdx = 0;
    unitIdx = scores.findIndex((s, i) => i !== phoneIdx && s.unitLike > 0);
    nameIdx = scores.findIndex(
      (s, i) => i !== phoneIdx && i !== unitIdx && s.letters > 0,
    );
  }

  for (let r = dataStart; r < rows.length; r++) {
    const row = rows[r] || [];
    const phoneRaw = phoneIdx >= 0 ? String(row[phoneIdx] ?? "").trim() : "";
    if (!phoneRaw) continue;
    if (!isValidPhone(phoneRaw)) continue;
    const name = nameIdx >= 0 ? String(row[nameIdx] ?? "").trim() : "";
    const unit = unitIdx >= 0 ? String(row[unitIdx] ?? "").trim().toUpperCase() : "";
    result.push({
      id: crypto.randomUUID(),
      name,
      unit,
      phone: normalizePhone(phoneRaw),
    });
  }
  return result;
}

/** Resolve spintax {a|b|c} → random pick */
export function resolveSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (full, group: string) => {
    if (!group.includes("|")) return full; // not spintax, leave placeholder
    const opts = group.split("|");
    return opts[Math.floor(Math.random() * opts.length)];
  });
}

/** Apply personalization placeholders */
export function applyPersonalization(text: string, contact: WaContact): string {
  return text
    .replace(/\{nama\}/gi, contact.name || "Bapak/Ibu")
    .replace(/\{unit\}/gi, contact.unit || "-");
}

/** Build final message: personalize THEN resolve spintax */
export function buildMessage(template: string, contact: WaContact): string {
  return resolveSpintax(applyPersonalization(template, contact));
}

export interface SpamRiskResult {
  level: "low" | "medium" | "high";
  reasons: string[];
}

const RISKY_WORDS = [
  "gratis",
  "promo",
  "diskon",
  "klik",
  "menang",
  "hadiah",
  "viral",
  "limit",
  "bonus",
  "cashback",
];

export function analyzeSpamRisk(text: string): SpamRiskResult {
  const reasons: string[] = [];
  let score = 0;
  if (text.length < 20) {
    reasons.push("Pesan terlalu pendek (<20 karakter)");
    score += 2;
  }
  const linkCount = (text.match(/https?:\/\//gi) || []).length;
  if (linkCount > 1) {
    reasons.push(`Mengandung ${linkCount} link`);
    score += linkCount;
  }
  const lower = text.toLowerCase();
  const hits = RISKY_WORDS.filter((w) => lower.includes(w));
  if (hits.length) {
    reasons.push(`Kata berisiko: ${hits.join(", ")}`);
    score += hits.length;
  }
  const upperRatio =
    (text.match(/[A-Z]/g) || []).length /
    Math.max(1, text.replace(/\s/g, "").length);
  if (upperRatio > 0.3) {
    reasons.push("Terlalu banyak huruf KAPITAL");
    score += 2;
  }
  if ((text.match(/!/g) || []).length > 3) {
    reasons.push("Terlalu banyak tanda seru");
    score += 1;
  }
  if (!/\{nama\}/i.test(text) && !/\{[^{}|]+\|/.test(text)) {
    reasons.push("Tanpa personalisasi {nama} atau spintax");
    score += 1;
  }

  let level: SpamRiskResult["level"] = "low";
  if (score >= 5) level = "high";
  else if (score >= 2) level = "medium";

  return { level, reasons };
}

export function isSafeHour(): boolean {
  const h = new Date().getHours();
  return h >= 8 && h < 21;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Local counters (daily/hourly) ----
const COUNTER_KEY = "wa_blast_counters_v1";

interface Counters {
  dayKey: string;
  hourKey: string;
  dayCount: number;
  hourCount: number;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function thisHourKey() {
  const d = new Date();
  return `${todayKey()}-${d.getHours()}`;
}

export function readCounters(): Counters {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) {
      const c = JSON.parse(raw) as Counters;
      const dk = todayKey();
      const hk = thisHourKey();
      return {
        dayKey: dk,
        hourKey: hk,
        dayCount: c.dayKey === dk ? c.dayCount : 0,
        hourCount: c.hourKey === hk ? c.hourCount : 0,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    dayKey: todayKey(),
    hourKey: thisHourKey(),
    dayCount: 0,
    hourCount: 0,
  };
}

export function incrementCounter() {
  const c = readCounters();
  const next: Counters = {
    ...c,
    dayCount: c.dayCount + 1,
    hourCount: c.hourCount + 1,
  };
  localStorage.setItem(COUNTER_KEY, JSON.stringify(next));
  return next;
}
