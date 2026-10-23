// The upgrade modal quotes one sentence of what the reader is buying: the
// first sentence of this pairing's "In love" section. The full Reading is
// server-only, so scripts/generate-readings.ts writes that sentence into the
// free teaser file as `excerpt`, and the app reads it from there.

/** The longest excerpt, ellipsis included. */
export const EXCERPT_MAX = 220;

/**
 * The first sentence of `text`: everything up to the first `.` or `?` that a
 * space follows (a closing quote mark after the stop stays with it, and a stop
 * inside an open quotation does not count). Capped at
 * EXCERPT_MAX characters, cut at a word with an ellipsis, and trimmed.
 */
export function firstSentence(text: string): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  let end = clean.length;
  for (const m of clean.matchAll(/[.?]["”’']?(?= )/g)) {
    const candidate = clean.slice(0, m.index + m[0].length);
    // A stop inside an open quotation ("You fixed it. Why…") is not the end.
    if (quoteOpen(candidate)) continue;
    end = candidate.length;
    break;
  }
  const sentence = clean.slice(0, end).trim();
  if (sentence.length <= EXCERPT_MAX) return sentence;
  const room = sentence.slice(0, EXCERPT_MAX - 1);
  const cut = room.lastIndexOf(' ');
  return `${(cut > 0 ? room.slice(0, cut) : room).replace(/[\s,;:.—-]+$/, '')}…`;
}

/** True when `s` opens a quotation it has not closed. */
function quoteOpen(s: string): boolean {
  const straight = (s.match(/"/g) ?? []).length;
  const curlyOpen = (s.match(/“/g) ?? []).length;
  const curlyClose = (s.match(/”/g) ?? []).length;
  if (straight % 2 === 1 || curlyOpen > curlyClose) return true;
  // A leading single quote closes at a ' that no letter follows (not an apostrophe).
  if (/^['‘]/.test(s)) return !/[^\s]['’](?![A-Za-z])/.test(s.slice(1));
  return false;
}

export interface TeaserFile {
  key: string;
  version: number;
  teaser: string;
  /** The first sentence of the "In love" section (absent in files older than this field). */
  excerpt?: string;
}

/** The free teaser file for a Reading: what public/readings/<key>.json holds. */
export function teaserFileFor(reading: { key: string; version: number; teaser: string; love: string }): TeaserFile {
  const excerpt = firstSentence(reading.love);
  return {
    key: reading.key,
    version: reading.version,
    teaser: reading.teaser,
    ...(excerpt ? { excerpt } : {}),
  };
}
