// The Reading validator. Pure, no I/O. scripts/generate-readings.ts runs every
// generated Reading through validateReading (and retries once with the
// failures appended), then runs siblingOverlap over the whole set. Nothing a
// buyer sees has skipped these checks: every formatting failure happens in
// the script, never in a browser (docs/reading-plan.md D4, D5, T2).

import { parseReadingKey } from './readingKey';

/** The seven plain-text bodies, in reading order. */
export const READING_FIELDS = ['teaser', 'number', 'type', 'love', 'agree', 'pull', 'closing'] as const;

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
  number: [130, 180],
  type: [130, 180],
  love: [80, 120],
  agree: [130, 180],
  pull: [130, 180],
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
 * dated future, no fate. "They will" and "this one will" are the forecasts this voice
 * would most often slip into.
 */
export const FORECAST_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'second-person forecast ("you\'ll", "you are going to")', pattern: /\byou('|’)ll\b|\byou\s+are\s+(going|about)\s+to\b|\byou\s+shall\b/i },
  { label: 'third-person forecast ("they will", "this one will")', pattern: /\b(they|he|she|this person|this one|the reader|this reader)\s+(will|shall)\b|\b(they|he|she)('|’)ll\b/i },
  { label: 'will + soon/eventually/one day', pattern: /\bwill\s+(soon|eventually|one\s+day|someday|finally)\b/i },
  { label: 'dated future ("next year", "the coming months")', pattern: /\b(next|coming)\s+(year|month|months|week|weeks|season|decade)\b|\bthis\s+(month|week|season|decade)\b|\bin\s+the\s+(near\s+)?future\b/i },
  { label: 'fate ("is meant to", "is fated", "is written in the stars")', pattern: /\b(is|are)\s+(meant|fated|bound)\s+to\b|\bfated\b|\bin\s+the\s+stars\b/i },
];

/**
 * Second person. Since prompt version 2 the Reading addresses the reader as
 * "you" (D9); this pattern now checks that each body section does, and that
 * the third-person exemplars stay third person (readingPrompt.test.ts).
 */
export const SECOND_PERSON_PATTERN = /\b(you|your|yours|yourself|yourselves)\b/i;

/** The sections that carry a scene and a question to the reader (rule 3). */
export const BODY_FIELDS: readonly ReadingField[] = ['number', 'type', 'love', 'agree', 'pull'];

/**
 * The round-1 skeleton: the connectives and shapes every pilot Reading
 * reused. Matched case-insensitively as plain substrings.
 */
export const SKELETON_PHRASES: readonly string[] = [
  'both systems',
  'neither system',
  'put together,',
  'paired, the',
  'paired, they',
  'in ordinary life',
  'this pairing',
  'this combination',
  'the risk particular',
  'a separate, quieter',
  'quieter question',
  'is a separate question',
  'the question is only',
  // Round-2 drafts found new joins; banned before they became the new skeleton.
  'both halves',
  'alone misses',
  'alone would miss',
  'neither one alone',
  'its own kind of',
  'you might say it',
  'is listed as',
  'growth edge',
  'together they',
  'one number says',
  'one set of letters',
  "isn't loud",
  'is not loud',
  'here is rarely loud',
  // Stock moves a cold reader found repeated across the round-2 pilot.
  'run through',
  'runs through',
  'running through',
  'some weeks',
  'other weeks',
  'across a kitchen',
  'turn out to be',
  'turns out to be',
  'the overlap',
  'somewhere in that',
  'somewhere between',
  'the label',
  'its own label',
  'a partner learns to',
  "you're already",
  "you've already",
  'you are already',
  'maybe it is the',
  "maybe it's the",
  'is it you who',
  'one motion',
  'one gesture',
  'the number and the letters',
  'where the number ends',
  'hunch that arrives before',
  'the number wants',
  'the letters want',
  'the type wants',
  'is described as',
  'read a room',
  'reads a room',
  'reading a room',
  'you always know',
];

/** A section that opens on the number or the type: the round-1 "describe the number, describe the type" lead. */
export const SYSTEM_OPENER_PATTERN = /^\s*(life\b|the number\b|the letters\b|\d|[EI][NS][TF][JP]\b)/i;

/**
 * Jargon a stranger cannot read. Function abbreviations are matched
 * case-sensitively (they are capitalised pairs); the rest ignore case.
 */
export const JARGON_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'function abbreviation (Ni, Fe, ...)', pattern: /\b(Ni|Ne|Si|Se|Ti|Te|Fi|Fe)\b/ },
  { label: '"stack"', pattern: /\bstacks?\b/i },
  { label: '"shadow"', pattern: /\bshadows?\b/i },
  { label: 'temperament name', pattern: /\b(empaths?|theorists?|responders?|preservers?)\b/i },
];

/**
 * Verdicts and advice: telling the reader what they will, should or must do,
 * or what their growth is.
 */
export const ADVICE_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: '"you will / should / must / need to / have to"', pattern: /\byou\s+(will|should|must|need\s+to|have\s+to)\b/i },
  { label: '"the growth / the lesson / the work is to"', pattern: /\b(the\s+growth|the\s+lesson|the\s+work)\s+(you\s+are|here\s+is|is\s+to)\b/i },
];

/** Hedges, counted per section. The prompt allows two; the validator fails above this. */
export const HEDGE_PATTERN = /\btend(s|ed|ing)?\s+to\b|\boften\b|\bcan\b(?!['’]t)|\bmight\b|\bcould\b|\bperhaps\b|\bmay\b/gi;
export const HEDGE_CAP = 4;

/** How many hedges a body holds. */
export function countHedges(text: string): number {
  return (text.match(HEDGE_PATTERN) ?? []).length;
}

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
    return ['not an object with the seven fields'];
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
    const lower = value.toLowerCase();
    for (const phrase of SKELETON_PHRASES) {
      if (lower.includes(phrase)) failures.push(`${field}: skeleton phrase "${phrase}"`);
    }
    for (const { label, pattern } of JARGON_PATTERNS) {
      const m = pattern.exec(value);
      if (m) failures.push(`${field}: jargon, ${label} ("${m[0]}")`);
    }
    for (const { label, pattern } of ADVICE_PATTERNS) {
      const m = pattern.exec(value);
      if (m) failures.push(`${field}: advice, ${label} ("${m[0]}")`);
    }
    const hedges = countHedges(value);
    if (hedges > HEDGE_CAP) failures.push(`${field}: ${hedges} hedges ("tends to", "often", "can", "might", "could", "perhaps", "may"), over the cap of ${HEDGE_CAP}`);
    if (BODY_FIELDS.includes(field)) {
      if (!SECOND_PERSON_PATTERN.test(value)) failures.push(`${field}: no "you"; address the reader in the second person`);
    }
    if (field === 'closing' && value.includes('?')) failures.push('closing: a question; the closing is a statement');
    if (MARKDOWN_PATTERN.test(value)) failures.push(`${field}: markdown; bodies are plain text`);
    if (value.includes('!')) failures.push(`${field}: exclamation mark; the register has none`);
    if (/\p{Extended_Pictographic}/u.test(value)) failures.push(`${field}: emoji; the register has none`);
  }

  // "Compound number" is glossed in plain words the first time it appears.
  const firstCompound = READING_FIELDS.map((f) => (typeof r[f] === 'string' ? (r[f] as string) : ''))
    .join('\n\n')
    .match(/\bcompound\b[^.?]*[.?]/i);
  if (firstCompound && !/\b(add(s|ed)?\s+up|reduc(e|ed|es|ing))\b/i.test(firstCompound[0])) {
    failures.push('compound number: not glossed where it first appears (say it is the number the date adds up to before it is reduced)');
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
