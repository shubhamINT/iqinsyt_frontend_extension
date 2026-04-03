import type { DetectedMarket, DetectedOutcome } from '../../../shared/types.ts'

const PCT_REGEX = /\b\d{1,3}(?:\.\d+)?%\b/;
const VOLUME_REGEX = /\$[\d,]+(?:\.\d+)?[kmb]?\b/i;

export function detectKalshiDetail(): DetectedMarket | null {
  if (window.location.hostname !== 'kalshi.com') return null;

  const title = extractTitle();
  if (!title) return null;

  const outcomes = extractOutcomes();
  if (!outcomes.length) return null;

  const volume = extractVolume();
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

  return { id, title, source: 'kalshi.com', url: window.location.href, outcomes, volume };
}

function extractTitle(): string | null {
  const h1 = document.querySelector('h1');
  const text = h1?.textContent?.trim();
  return text && text.length >= 5 ? text : null;
}

function extractOutcomes(): DetectedOutcome[] {
  const outcomes: DetectedOutcome[] = [];
  const seen = new Set<string>();

  const rows = document.querySelectorAll('div[class*="box-border"][class*="overflow-hidden"]');

  for (const row of rows) {
    const el = row as HTMLElement;
    const pctHeader = el.querySelector('h2.typ-headline-x10');
    if (!pctHeader) continue;

    const pctText = pctHeader.textContent?.trim() ?? '';
    const probability = parseProbability(pctText);
    if (!probability) continue;

    const label = extractLabel(el, pctText);
    if (!label || !isValidLabel(label)) continue;

    const key = `${label}|${probability}`;
    if (!seen.has(key)) {
      seen.add(key);
      outcomes.push({ label, probability });
    }
  }

  return outcomes.slice(0, 10);
}

function parseProbability(text: string): string | null {
  const match = text.match(/(\d+)%/);
  if (match) return `${match[1]}%`;
  if (text.includes('<1%')) return '0%';
  return null;
}

function extractLabel(row: HTMLElement, pctText: string): string | null {
  // Primary: span.typ-body-x30
  const labelSpan = row.querySelector('span.typ-body-x30');
  const text = labelSpan?.textContent?.trim();
  if (text && text.length >= 2 && text !== pctText) return text;

  // Fallback: first meaningful span
  for (const span of row.querySelectorAll('span')) {
    const t = span.textContent?.trim();
    if (!t || t === pctText) continue;
    if (PCT_REGEX.test(t) || /^\d+$/.test(t)) continue;
    if (t.length < 2 || t.length > 100) continue;
    if (/buy yes|sell no|amount|sign up|vol\b|loading/i.test(t)) continue;
    return t;
  }

  return null;
}

function isValidLabel(label: string): boolean {
  if (label.length < 2 || label.length > 80) return false;
  if (/^\d+$/.test(label)) return false;
  if (PCT_REGEX.test(label)) return false;
  if (/\$[\d,]+/.test(label)) return false;
  if (/\bvol\b|\bvolume\b/i.test(label)) return false;
  return true;
}

function extractVolume(): string | null {
  const text = document.body?.innerText ?? '';
  const match = text.match(VOLUME_REGEX);
  return match?.[0] ?? null;
}
