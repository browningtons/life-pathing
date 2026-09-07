import { describe, expect, it } from 'vitest';
import { parseReport } from './parseReport';

describe('parseReport', () => {
  it('reads a TypeFinder-style facet list toward the labelled pole', () => {
    const out = parseReport(`
      Relaxed 66%
      Insightful 94%
      Solitary 87%
      Friendly 78%
      Conceptual 76%
    `);
    expect(out.facets).toEqual({
      Orderly: 34,
      Insightful: 94,
      Engaged: 13,
      Friendly: 78,
      Conceptual: 76,
    });
    expect(out.matched).toBe(5);
  });

  it('reads dimension words from either pole', () => {
    const out = parseReport('Extraverted 51% · Intuitive 73% · Thinking 50% · Judging 37%');
    expect(out.dimensions).toEqual({ e: 51, n: 73, f: 50, p: 63 });
  });

  it('reads single-letter dimension shorthand', () => {
    expect(parseReport('E 51 N 73 F 50 P 63').dimensions).toEqual({ e: 51, n: 73, f: 50, p: 63 });
    expect(parseReport('I 60').dimensions).toEqual({ e: 40 });
  });

  it('handles 16personalities vocabulary and punctuation', () => {
    const out = parseReport('Extraverted: 51%, Observant (40%), Feeling — 50%, Prospecting = 63%');
    expect(out.dimensions).toEqual({ e: 51, n: 60, f: 50, p: 63 });
  });

  it('handles hyphenated labels and is case-insensitive', () => {
    const out = parseReport('SELF-RELIANT 40\ncooperative 60');
    expect(out.facets).toEqual({ Cooperative: 60 });
    expect(out.matched).toBe(2);
  });

  it('ignores unknown labels and numbers over 100', () => {
    const out = parseReport('Assertive 60% Tolerant 120% Curious 85');
    expect(out.facets).toEqual({});
    expect(out.dimensions).toEqual({});
    expect(out.matched).toBe(0);
  });

  it('returns empty results for empty text', () => {
    expect(parseReport('')).toEqual({ dimensions: {}, facets: {}, matched: 0 });
  });
});
