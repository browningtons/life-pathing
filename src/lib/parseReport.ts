// Read scores out of pasted report text.
//
// Works on anything shaped like "Label 94%" — a TypeFinder facet list, a
// 16personalities trait summary, or a hand-typed note. Every recognised
// pole label maps onto the profile's raw inputs; everything else is
// ignored. Percentages are read toward the label they sit next to, so
// "Relaxed 66" and "Orderly 34" both store Orderly: 34.

import { FACET_CATALOG } from '../data/personality';
import type { DimensionScores, FacetScores } from '../data/profile';

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

export interface ParsedReport {
  dimensions: Partial<DimensionScores>;
  facets: FacetScores;
  /** How many recognised label/number pairs were read. */
  matched: number;
}

export function parseReport(text: string): ParsedReport {
  const dimensions: Partial<DimensionScores> = {};
  const facets: FacetScores = {};
  let matched = 0;

  for (const m of text.matchAll(PAIR)) {
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
    matched++;
  }

  return { dimensions, facets, matched };
}
