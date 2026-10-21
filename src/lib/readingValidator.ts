// The Reading validator. Pure, no I/O. scripts/generate-readings.ts runs every
// generated Reading through validateReading (and retries once with the
// failures appended), then runs siblingOverlap over the whole set. Nothing a
// buyer sees has skipped these checks: every formatting failure happens in
// the script, never in a browser (docs/reading-plan.md D4, D5, T2).

import { parseReadingKey } from './readingKey';

/** The six plain-text bodies, in reading order. */
export const READING_FIELDS = ['teaser', 'number', 'type', 'agree', 'pull', 'closing'] as const;

export type ReadingField = (typeof READING_FIELDS)[number];

export type ReadingSections = Record<ReadingField, string>;

/** The full Reading as stored in api/_readings/index.json. */
export interface Reading extends ReadingSections {
  key: string;
  version: number;
  /** A hand-edited key the script never regenerates (ledger L8). */
  locked?: boolean;
  /** A hand-written test Reading, never served. */
  fixture?: boolean;
}

/** Word bounds per field, inclusive. */
export const WORD_BOUNDS: Record<ReadingField, [number, number]> = {
  teaser: [60, 120],
  number: [150, 200],
  type: [150, 200],
  agree: [150, 200],
  pull: [150, 200],
  closing: [15, 40],
};

export const TOTAL_WORD_BOUNDS: [number, number] = [700, 900];

/**
 * Banned words and phrases, matched case-insensitively on word boundaries.
 * The list in docs/reading-design.md, with the inflections that carry the same
 * meaning ("journeys", "destined"). "Expectation" is not banned; "expect" is.
 */
export const BANNED_TERMS: { label: string; pattern: RegExp }[] = [
  { label: 'journey', pattern: /\bjourney(s|ed|ing)?\b/i },
  { label: 'energy', pattern: /\benerg(y|ies)\b/i },
  { label: 'universe', pattern: /\buniverses?\b/i },
  { label: 'vibration', pattern: /\bvibrations?\b/i },
  { label: 'manifest', pattern: /\bmanifest(s|ed|ing|ation|ations)?\b/i },
  { label: 'destiny', pattern: /\b(destiny|destinies|destined)\b/i },
  { label: 'you will', pattern: /\byou\s+will\b/i },
  { label: 'expect', pattern: /\bexpect(s|ed|ing)?\b/i },
  { label: 'this year', pattern: /\bthis\s+year\b/i },
];

/**
 * Forecasts. No section may predict: no "will" attached to the reader, no
 * dated future, no fate. Third-person "they will" is the forecast this voice
 * would most often slip into.
 */
export const FORECAST_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'second-person forecast ("you\'ll", "you are going to")', pattern: /\byou('|’)ll\b|\byou\s+are\s+(going|about)\s+to\b|\byou\s+shall\b/i },
  { label: 'third-person forecast ("they will", "this person will")', pattern: /\b(they|he|she|this person|the reader|this reader)\s+(will|shall)\b|\b(they|he|she)('|’)ll\b/i },
  { label: 'will + soon/eventually/one day', pattern: /\bwill\s+(soon|eventually|one\s+day|someday|finally)\b/i },
  { label: 'dated future ("next year", "the coming months")', pattern: /\b(next|coming)\s+(year|month|months|week|weeks|season|decade)\b|\bthis\s+(month|week|season|decade)\b|\bin\s+the\s+(near\s+)?future\b/i },
  { label: 'fate ("is meant to", "is fated", "is written in the stars")', pattern: /\b(is|are)\s+(meant|fated|bound)\s+to\b|\bfated\b|\bin\s+the\s+stars\b/i },
];

/** Second person. The Reading is third person throughout. */
export const SECOND_PERSON_PATTERN = /\b(you|your|yours|yourself|yourselves)\b/i;

/** Markdown in a plain-text body: headings, bold/italic markers, list bullets, links. */
const MARKDOWN_PATTERN = /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s)|\*\*|__|\[[^\]]+\]\([^)]+\)/;

/** Words: whitespace-separated tokens holding at least one letter or digit. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/**
 * Every rule a Reading must pass. Returns the failures, empty when it passes.
 * Accepts unknown input (the model's parsed JSON).
 */
export function validateReading(reading: unknown): string[] {
  const failures: string[] = [];
  if (typeof reading !== 'object' || reading === null || Array.isArray(reading)) {
    return ['not an object with the six fields'];
  }
  const r = reading as Record<string, unknown>;

  let total = 0;
  for (const field of READING_FIELDS) {
    const value = r[field];
    if (value === undefined) {
      failures.push(`${field}: missing`);
      continue;
    }
    if (typeof value !== 'string') {
      failures.push(`${field}: not a string`);
      continue;
    }
    if (value.trim() === '') {
      failures.push(`${field}: empty`);
      continue;
    }
    const words = countWords(value);
    total += words;
    const [lo, hi] = WORD_BOUNDS[field];
    if (words < lo) failures.push(`${field}: ${words} words, under the ${lo}-word floor`);
    if (words > hi) failures.push(`${field}: ${words} words, over the ${hi}-word ceiling`);

    for (const { label, pattern } of BANNED_TERMS) {
      const m = pattern.exec(value);
      if (m) failures.push(`${field}: banned "${label}" ("${m[0]}")`);
    }
    for (const { label, pattern } of FORECAST_PATTERNS) {
      const m = pattern.exec(value);
      if (m) failures.push(`${field}: forecast, ${label} ("${m[0]}")`);
    }
    const second = SECOND_PERSON_PATTERN.exec(value);
    if (second) failures.push(`${field}: second person ("${second[0]}"); write in the third person`);
    if (MARKDOWN_PATTERN.test(value)) failures.push(`${field}: markdown; bodies are plain text`);
    if (value.includes('!')) failures.push(`${field}: exclamation mark; the register has none`);
    if (/\p{Extended_Pictographic}/u.test(value)) failures.push(`${field}: emoji; the register has none`);
  }

  const [tlo, thi] = TOTAL_WORD_BOUNDS;
  const allPresent = READING_FIELDS.every((f) => typeof r[f] === 'string' && (r[f] as string).trim() !== '');
  if (allPresent) {
    if (total < tlo) failures.push(`total: ${total} words, under the ${tlo}-word floor`);
    if (total > thi) failures.push(`total: ${total} words, over the ${thi}-word ceiling`);
  }
  return failures;
}

// ── Sibling overlap (T2) ─────────────────────────────────────────────
// Everyone who is a 7 and INFJ gets the same text, and a reader of one
// document cannot see that it matches its siblings. This pass compares
// every pair that shares a number (same life path and compound) or a type,
// and flags the pairs whose shared 6-grams cross the threshold.

/** The set of lowercase word 6-grams across the six bodies. */
export function shingles(reading: ReadingSections, n = 6): Set<string> {
  const words = READING_FIELDS.map((f) => reading[f] ?? '')
    .join(' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(' '));
  return out;
}

/**
 * Shared 6-grams over the smaller set: the share of the shorter Reading's
 * 6-grams that also appear in the other. 0 is no shared run of six words, 1
 * is the shorter one wholly contained in the other.
 */
export function overlapRatio(a: Set<string>, b: Set<string>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  if (small.size === 0) return 0;
  let shared = 0;
  for (const g of small) if (large.has(g)) shared += 1;
  return shared / small.size;
}

export interface OverlapFlag {
  a: string;
  b: string;
  /** What the two share: the number (life path + compound) or the type. */
  sibling: 'number' | 'type';
  ratio: number;
}

/**
 * Every sibling pair (same number, or same type) whose shared 6-gram ratio
 * exceeds `threshold`, highest first. Keys that do not parse are skipped.
 */
export function siblingOverlap(readings: Record<string, ReadingSections>, threshold = 0.15): OverlapFlag[] {
  const parsed = Object.keys(readings)
    .sort()
    .map((key) => ({ key, parts: parseReadingKey(key), grams: shingles(readings[key]) }))
    .filter((e) => e.parts !== null);

  const flags: OverlapFlag[] = [];
  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      const x = parsed[i];
      const y = parsed[j];
      const sameNumber = x.parts!.lifePath === y.parts!.lifePath && x.parts!.compoundKey === y.parts!.compoundKey;
      const sameType = x.parts!.type === y.parts!.type;
      if (!sameNumber && !sameType) continue;
      const ratio = overlapRatio(x.grams, y.grams);
      if (ratio > threshold) flags.push({ a: x.key, b: y.key, sibling: sameNumber ? 'number' : 'type', ratio });
    }
  }
  return flags.sort((p, q) => q.ratio - p.ratio || p.a.localeCompare(q.a) || p.b.localeCompare(q.b));
}
