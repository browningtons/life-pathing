import { describe, expect, it } from 'vitest';
import { FACET_CATALOG } from '../data/personality';
import { DEFAULT_PROFILE } from '../data/profile';
import { parseReport, pastePatch } from './parseReport';

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

describe('pastePatch', () => {
  const partial = parseReport('Insightful 81%\nAesthetic 64%\nSolitary 70%');

  it('fills facets the paste did not carry with an even 50 while they are still the sample', () => {
    const { patch, filledEven } = pastePatch(DEFAULT_PROFILE, partial);
    expect(filledEven).toBe(true);
    expect(patch.facetSource).toBe('report');
    expect(patch.dimensionSource).toBeUndefined();
    expect(patch.facets).toMatchObject({ Insightful: 81, Aesthetic: 64, Engaged: 30, Friendly: 50, Conceptual: 50 });
    expect(Object.keys(patch.facets!)).toHaveLength(23);
  });

  it('keeps facets that are already the reader own', () => {
    const own = { ...DEFAULT_PROFILE, facetSource: 'report' as const };
    const { patch, filledEven } = pastePatch(own, partial);
    expect(filledEven).toBe(false);
    expect(patch.facets).toEqual(partial.facets);
  });

  it('fills dimensions the same way, and leaves facets alone when the paste has none', () => {
    const { patch, filledEven } = pastePatch(DEFAULT_PROFILE, parseReport('Extraverted 30%'));
    expect(filledEven).toBe(true);
    expect(patch.dimensions).toEqual({ e: 30, n: 50, f: 50, p: 50 });
    expect(patch.dimensionSource).toBe('report');
    expect(patch.facets).toEqual({});
    expect(patch.facetSource).toBeUndefined();
  });

  it('does not report an even fill when a full report replaces everything', () => {
    const full = parseReport(
      ['Extraverted 51', 'Intuitive 73', 'Feeling 50', 'Prospecting 63'].join('\n') +
        '\n' +
        FACET_CATALOG.map((f) => `${f.right} 40%`).join('\n'),
    );
    expect(pastePatch(DEFAULT_PROFILE, full).filledEven).toBe(false);
  });
});
