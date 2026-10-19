// The paid Reading text, cached in this browser after the first verified
// fetch (plan D2). One localStorage entry per Reading, keyed by
// `${version}|${key}`, so a prompt-version bump misses every old copy and
// the page fetches once more. Re-opens and printing then work offline.

import { KIT_CONFIG } from '../../kit.config';
import { READING_PROMPT_VERSION } from './readingKey';

/** The prompt version the client expects (lane A's READING_PROMPT_VERSION). */
export const READING_VERSION = READING_PROMPT_VERSION;

/** The full Reading as the route returns it (contract: plain-text bodies). */
export interface Reading {
  key: string;
  version: number;
  teaser: string;
  number: string;
  type: string;
  agree: string;
  pull: string;
  closing: string;
}

const FIELDS = ['teaser', 'number', 'type', 'agree', 'pull', 'closing'] as const;

export const cacheKey = (key: string, version: number = READING_VERSION): string =>
  `${KIT_CONFIG.app.storagePrefix}reading:${version}|${key}`;

/** True when `value` has every field of a Reading, as non-empty strings. */
export function isReading(value: unknown): value is Reading {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.key === 'string' &&
    typeof r.version === 'number' &&
    FIELDS.every((f) => typeof r[f] === 'string' && (r[f] as string).trim() !== '')
  );
}

/** The cached Reading for this key at this version, or null. Never throws. */
export function readCachedReading(key: string, version: number = READING_VERSION): Reading | null {
  try {
    const raw = localStorage.getItem(cacheKey(key, version));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isReading(parsed) && parsed.key === key && parsed.version === version ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Keep a Reading for next time, under the version it was written at. A
 * reading from a different version than the client expects is stored but
 * will not be read back until the versions agree. Never throws.
 */
export function writeCachedReading(reading: Reading): void {
  if (!isReading(reading)) return;
  try {
    localStorage.setItem(cacheKey(reading.key, reading.version), JSON.stringify(reading));
  } catch {
    /* private mode / quota: the next visit fetches again */
  }
}
