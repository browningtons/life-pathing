// Read scores out of pasted report text.
//
// Works on anything shaped like "Label 94%" — a TypeFinder facet list, a
// 16personalities trait summary, or a hand-typed note. Every recognised
// pole label maps onto the profile's raw inputs; everything else is
// ignored. Percentages are read toward the label they sit next to, so
// "Relaxed 66" and "Orderly 34" both store Orderly: 34.

import { FACET_CATALOG } from '../data/personality';
import type { DimensionScores, FacetScores, Profile } from '../data/profile';
import type { ProfilePatch } from '../store/context-internal';

type DimKey = keyof DimensionScores;

interface PoleTarget {
  kind: 'dimension' | 'facet';
  /** Dimension key (e, n, f, p) or facet right-pole key. */
  key: string;
  /** True when the label is the pole the stored percent points toward. */
  isRight: boolean;
}

// Dimension vocabulary. Right-hand poles are E, N, F, P.
const DIMENSION_WORDS: Record<string, { key: DimKey; isRight: boolean }> = {
  e: { key: 'e', isRight: true },
  extravert: { key: 'e', isRight: true },
  extraverted: { key: 'e', isRight: true },
  extraversion: { key: 'e', isRight: true },
  extrovert: { key: 'e', isRight: true },
  extroverted: { key: 'e', isRight: true },
  extroversion: { key: 'e', isRight: true },
  i: { key: 'e', isRight: false },
  introvert: { key: 'e', isRight: false },
  introverted: { key: 'e', isRight: false },
  introversion: { key: 'e', isRight: false },

  n: { key: 'n', isRight: true },
  intuitive: { key: 'n', isRight: true },
  intuition: { key: 'n', isRight: true },
  s: { key: 'n', isRight: false },
  sensing: { key: 'n', isRight: false },
  sensor: { key: 'n', isRight: false },
  observant: { key: 'n', isRight: false },

  f: { key: 'f', isRight: true },
  feeling: { key: 'f', isRight: true },
  feeler: { key: 'f', isRight: true },
  t: { key: 'f', isRight: false },
  thinking: { key: 'f', isRight: false },
  thinker: { key: 'f', isRight: false },

  p: { key: 'p', isRight: true },
  perceiving: { key: 'p', isRight: true },
  perceiver: { key: 'p', isRight: true },
  prospecting: { key: 'p', isRight: true },
  j: { key: 'p', isRight: false },
  judging: { key: 'p', isRight: false },
  judger: { key: 'p', isRight: false },
};

const TARGETS: Map<string, PoleTarget> = new Map();
for (const [word, t] of Object.entries(DIMENSION_WORDS)) {
  TARGETS.set(word, { kind: 'dimension', key: t.key, isRight: t.isRight });
}
for (const spec of FACET_CATALOG) {
  TARGETS.set(spec.left.toLowerCase(), { kind: 'facet', key: spec.right, isRight: false });
  TARGETS.set(spec.right.toLowerCase(), { kind: 'facet', key: spec.right, isRight: true });
}

// "Label 94", "Label: 94%", "Label — 94 %", "Label (94%)". Labels may be
// hyphenated (Self-Reliant). Single letters count so "E 51%" works.
const PAIR = /([A-Za-z][A-Za-z-]*)\s*[:=()\-–—]*\s*(\d{1,3})\s*%?/g;

export interface ReadLine {
  /** The label as the reader wrote it, e.g. "Extraverted". */
  label: string;
  value: number;
}

export interface IgnoredLine {
  /** The line as pasted, trimmed and shortened. */
  text: string;
  /** Why it was passed over: a bare number, or a label that is not one of ours. */
  reason: 'no label' | 'unknown label';
}

export interface ParsedReport {
  dimensions: Partial<DimensionScores>;
  facets: FacetScores;
  /** How many recognised label/number pairs were read. */
  matched: number;
  /** Each recognised pair, in paste order. */
  read: ReadLine[];
  /** Lines that carried a number but nothing we could use. */
  ignored: IgnoredLine[];
}

const MAX_IGNORED_TEXT = 32;

export function parseReport(text: string): ParsedReport {
  const dimensions: Partial<DimensionScores> = {};
  const facets: FacetScores = {};
  const read: ReadLine[] = [];
  const ignored: IgnoredLine[] = [];
  let matched = 0;

  for (const line of text.split(/\r?\n/)) {
    let lineMatched = 0;
    for (const m of line.matchAll(PAIR)) {
      const label = m[1].toLowerCase();
      const n = Number(m[2]);
      if (n > 100) continue;
      const target = TARGETS.get(label);
      if (!target) continue;
      const towardRight = target.isRight ? n : 100 - n;
      if (target.kind === 'dimension') {
        dimensions[target.key as DimKey] = towardRight;
      } else {
        facets[target.key] = towardRight;
      }
      read.push({ label: m[1], value: n });
      lineMatched++;
      matched++;
    }
    const trimmed = line.trim();
    if (lineMatched === 0 && /\d/.test(trimmed)) {
      const short = trimmed.length > MAX_IGNORED_TEXT ? `${trimmed.slice(0, MAX_IGNORED_TEXT - 1)}…` : trimmed;
      ignored.push({ text: short, reason: /^[\d\s%.]+$/.test(trimmed) ? 'no label' : 'unknown label' });
    }
  }

  return { dimensions, facets, matched, read, ignored };
}

const LIST_CAP = 4;

/**
 * One line saying what a paste read and what it passed over, e.g.
 * "Read: Extraverted 61, Imaginative 77 and 3 more · Ignored: '48%' (no label), 'page 3 of 12'".
 * Both lists are capped at a handful; the rest are counted.
 */
export function describeReport(parsed: ParsedReport): string {
  const capped = (items: string[]) =>
    items.length > LIST_CAP
      ? `${items.slice(0, LIST_CAP).join(', ')} and ${items.length - LIST_CAP} more`
      : items.join(', ');
  const parts: string[] = [];
  if (parsed.read.length > 0) parts.push(`Read: ${capped(parsed.read.map((r) => `${r.label} ${r.value}`))}`);
  if (parsed.ignored.length > 0) {
    parts.push(
      `Ignored: ${capped(parsed.ignored.map((i) => (i.reason === 'no label' ? `'${i.text}' (no label)` : `'${i.text}'`)))}`,
    );
  }
  return parts.join(' · ');
}

const EVEN_DIMENSIONS: DimensionScores = { e: 50, n: 50, f: 50, p: 50 };
const EVEN_FACETS: FacetScores = Object.fromEntries(FACET_CATALOG.map((f) => [f.right, 50]));

export interface PastePatch {
  patch: ProfilePatch;
  /**
   * True when something the paste did not carry was set to an even 50,
   * because the value it would otherwise keep was the sample's.
   */
  filledEven: boolean;
}

/**
 * How a parsed paste lands on the current profile.
 *
 * Whatever the paste carried becomes the reader's own. Whatever it did not
 * carry keeps its current value if that value is already the reader's; if
 * it is still the sample's, it becomes an even 50 instead. Otherwise a
 * three-facet paste would mark all twenty-three as the reader's while
 * twenty of them still described the person who built the app.
 */
export function pastePatch(profile: Profile, parsed: ParsedReport): PastePatch {
  const hasDims = Object.keys(parsed.dimensions).length > 0;
  const hasFacets = Object.keys(parsed.facets).length > 0;
  const evenDims = hasDims && profile.dimensionSource === 'sample';
  const evenFacets = hasFacets && profile.facetSource === 'sample';
  return {
    patch: {
      dimensions: evenDims ? { ...EVEN_DIMENSIONS, ...parsed.dimensions } : parsed.dimensions,
      facets: evenFacets ? { ...EVEN_FACETS, ...parsed.facets } : parsed.facets,
      ...(hasDims && { dimensionSource: 'report' as const }),
      ...(hasFacets && { facetSource: 'report' as const }),
    },
    filledEven:
      (evenDims && Object.keys(parsed.dimensions).length < 4) ||
      (evenFacets && Object.keys(parsed.facets).length < FACET_CATALOG.length),
  };
}
