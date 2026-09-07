// The single-source-of-truth contract: every derived value the views show
// must follow from DEFAULT_PROFILE alone.

import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from './profile';
import { getMbtiData, MBTI_DATA } from './mbti';
import { FACET_CATALOG, getTraits, getTypeMatchesForMbti } from './personality';
import { calculateLifePath } from '../lib/calculateLifePath';
import { deriveTypeCode, dimensionDetails } from '../lib/deriveType';

describe('DEFAULT_PROFILE', () => {
  it('stores dimension scores as percentages, not letters', () => {
    expect(DEFAULT_PROFILE.dimensions).toEqual({ e: 51, n: 73, f: 50, p: 63 });
  });

  it('carries exactly the 23 facets in the catalog, keyed by right-hand pole', () => {
    const stored = Object.keys(DEFAULT_PROFILE.facets).sort();
    const catalog = FACET_CATALOG.map((f) => f.right).sort();
    expect(catalog).toHaveLength(23);
    expect(stored).toEqual(catalog);
  });

  it('keeps every facet score within 0–100', () => {
    for (const pct of Object.values(DEFAULT_PROFILE.facets)) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  it('matches the TypeFinder headline facets', () => {
    const byDominant = Object.fromEntries(getTraits(DEFAULT_PROFILE.facets).map((t) => [t.dominant, t.dominantPct]));
    expect(byDominant).toMatchObject({
      Insightful: 94,
      Aesthetic: 90,
      Solitary: 87,
      Friendly: 78,
      Conceptual: 76,
    });
  });
});

describe('derived type', () => {
  const typeCode = deriveTypeCode(DEFAULT_PROFILE.dimensions);

  it('is ENFP, not INFP', () => {
    expect(typeCode).toBe('ENFP');
  });

  it('looks up "The Champion" as the nickname', () => {
    expect(getMbtiData(typeCode).title).toBe('The Champion');
  });

  it('looks up the Ne-Fi-Te-Si stack', () => {
    expect(getMbtiData(typeCode).stack).toEqual(['Ne', 'Fi', 'Te', 'Si']);
  });

  it('does not show the INFP famous list', () => {
    const famous = getMbtiData(typeCode).famous;
    expect(famous.length).toBeGreaterThan(0);
    for (const infp of MBTI_DATA.INFP.famous) {
      expect(famous).not.toContain(infp);
    }
  });

  it('flags I/E and T/F as borderline', () => {
    const flagged = dimensionDetails(DEFAULT_PROFILE.dimensions)
      .filter((d) => d.borderline)
      .map((d) => d.dim);
    expect(flagged).toEqual(['ie', 'tf']);
  });

  it('names adjacent types from the shared MBTI table', () => {
    const infp = getTypeMatchesForMbti(typeCode).find((m) => m.code === 'INFP');
    expect(infp?.name).toBe('Healer');
  });
});

describe('derived Life Path', () => {
  it('reduces 1986-08-09 to 23 → 5 with the expected breakdown', () => {
    const lp = calculateLifePath(DEFAULT_PROFILE.birthDate);
    expect(lp.number).toBe(5);
    expect(lp.compound).toBe(23);
    expect(lp.breakdown).toMatchObject({ m: 8, d: 9, ySum: 24, y: 6 });
  });
});

describe('changing the profile changes the derivations', () => {
  it('a different birthdate yields a different Life Path', () => {
    expect(calculateLifePath({ ...DEFAULT_PROFILE, birthDate: '1983-07-01' }.birthDate).number).toBe(11);
  });

  it('a different dimension score yields a different type and nickname', () => {
    const dims = { ...DEFAULT_PROFILE.dimensions, e: 30 };
    const code = deriveTypeCode(dims);
    expect(code).toBe('INFP');
    expect(getMbtiData(code).title).toBe('The Healer');
    expect(getMbtiData(code).stack).toEqual(['Fi', 'Ne', 'Si', 'Te']);
  });
});
