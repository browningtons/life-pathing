// The Reading key: one string per (life path, compound label, type) the app
// can produce. Every birthdate from 1900 to today reduces to 33 (life path,
// compound) pairs; times the sixteen types that is 528 Readings, written
// offline by scripts/generate-readings.ts.
//
// Contract (docs/reading-plan.md): "<lifePath>-<compoundKey>-<TYPE>", e.g.
// "7-16-INFJ" or "1-0-ESTP". `compoundKey` is the compound number when
// COMPOUND_MEANINGS labels it (10–33), else 0. Types are uppercase.

import { COMPOUND_MEANINGS } from '../data/compoundMeanings';
import { MBTI_TYPES } from '../data/mbti';
import { calculateLifePath } from './calculateLifePath';

/** Bump when the prompt changes; every cached Reading is keyed on it. */
export const READING_PROMPT_VERSION = 2;

/** The compound number when it has a label, else 0. */
export function compoundKeyFor(compound: number): number {
  return COMPOUND_MEANINGS[compound] !== undefined ? compound : 0;
}

/** Four letters from any spelling ("infj", "INFJ-T") → "INFJ", or null. */
export function normalizeType(typeCode: string): string | null {
  const letters = typeCode.trim().toUpperCase().slice(0, 4);
  return MBTI_TYPES.includes(letters) ? letters : null;
}

/** The Reading key, or null when the type is not one of the sixteen or the life path is 0. */
export function readingKey(lifePath: number, compound: number, typeCode: string): string | null {
  const type = normalizeType(typeCode);
  if (!type || !lifePath) return null;
  return `${lifePath}-${compoundKeyFor(compound)}-${type}`;
}

export interface ParsedReadingKey {
  lifePath: number;
  compoundKey: number;
  type: string;
}

const KEY_PATTERN = /^(\d{1,2})-(\d{1,2})-([A-Z]{4})$/;

/** The parts of a well-formed key, or null. Does not check the key is one the app can produce. */
export function parseReadingKey(key: string): ParsedReadingKey | null {
  const m = KEY_PATTERN.exec(key);
  if (!m) return null;
  const type = m[3];
  if (!MBTI_TYPES.includes(type)) return null;
  return { lifePath: Number(m[1]), compoundKey: Number(m[2]), type };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Every (lifePath, compoundKey) pair a date from 1900-01-01 to `today` produces, sorted. */
export function enumerateLifePathPairs(today: Date = new Date()): { lifePath: number; compoundKey: number }[] {
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const seen = new Map<string, { lifePath: number; compoundKey: number }>();
  for (let t = Date.UTC(1900, 0, 1); t <= end; t += 86_400_000) {
    const d = new Date(t);
    const iso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    const { number, compound } = calculateLifePath(iso);
    const compoundKey = compoundKeyFor(compound);
    seen.set(`${number}-${compoundKey}`, { lifePath: number, compoundKey });
  }
  return [...seen.values()].sort((a, b) => a.lifePath - b.lifePath || a.compoundKey - b.compoundKey);
}

/** Every Reading key: each pair × the sixteen types (528 today). */
export function enumerateReadingKeys(today: Date = new Date()): string[] {
  const keys: string[] = [];
  for (const { lifePath, compoundKey } of enumerateLifePathPairs(today)) {
    for (const type of MBTI_TYPES) keys.push(`${lifePath}-${compoundKey}-${type}`);
  }
  return keys;
}
