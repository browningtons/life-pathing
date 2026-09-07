import { describe, expect, it } from 'vitest';
import {
  deriveTypeCode,
  dimensionDetails,
  isBorderline,
  setDimensionScore,
  toggleDimension,
  typeCodeLetters,
} from './deriveType';
import { DEFAULT_PROFILE } from '../data/profile';

describe('deriveTypeCode', () => {
  it('derives ENFP from the stored dimension scores', () => {
    expect(deriveTypeCode(DEFAULT_PROFILE.dimensions)).toBe('ENFP');
  });

  it('derives ENFP from E 51 / N 73 / F 50 / P 63', () => {
    expect(deriveTypeCode({ e: 51, n: 73, f: 50, p: 63 })).toBe('ENFP');
  });

  it('resolves a dead-even 50 to the right-hand pole', () => {
    expect(deriveTypeCode({ e: 50, n: 50, f: 50, p: 50 })).toBe('ENFP');
  });

  it('derives the opposite type below the midline', () => {
    expect(deriveTypeCode({ e: 49, n: 20, f: 49, p: 10 })).toBe('ISTJ');
  });
});

describe('isBorderline', () => {
  it('flags 45 through 55 inclusive', () => {
    expect(isBorderline(45)).toBe(true);
    expect(isBorderline(50)).toBe(true);
    expect(isBorderline(55)).toBe(true);
  });

  it('does not flag scores outside the band', () => {
    expect(isBorderline(44)).toBe(false);
    expect(isBorderline(56)).toBe(false);
    expect(isBorderline(73)).toBe(false);
  });
});

describe('dimensionDetails', () => {
  const details = dimensionDetails(DEFAULT_PROFILE.dimensions);

  it('returns the four dimensions in I/E, S/N, T/F, J/P order', () => {
    expect(details.map((d) => d.dim)).toEqual(['ie', 'sn', 'tf', 'jp']);
    expect(details.map((d) => d.label)).toEqual(['Energy', 'Mind', 'Nature', 'Tactics']);
  });

  it('flags I/E at 51 and T/F at 50 as borderline, not N or P', () => {
    const byDim = Object.fromEntries(details.map((d) => [d.dim, d]));
    expect(byDim.ie.borderline).toBe(true);
    expect(byDim.tf.borderline).toBe(true);
    expect(byDim.sn.borderline).toBe(false);
    expect(byDim.jp.borderline).toBe(false);
  });

  it('reports the percent toward the resolved letter', () => {
    const byDim = Object.fromEntries(details.map((d) => [d.dim, d]));
    expect(byDim.ie).toMatchObject({ letter: 'E', pct: 51, name: 'Extraversion' });
    expect(byDim.sn).toMatchObject({ letter: 'N', pct: 73, name: 'Intuition' });
    expect(byDim.tf).toMatchObject({ letter: 'F', pct: 50, name: 'Feeling' });
    expect(byDim.jp).toMatchObject({ letter: 'P', pct: 63, name: 'Perceiving' });
  });

  it('flips the percent when the left pole wins', () => {
    const [ie] = dimensionDetails({ e: 30, n: 73, f: 50, p: 63 });
    expect(ie).toMatchObject({ letter: 'I', pct: 70, rawPct: 30, name: 'Introversion' });
  });
});

describe('typeCodeLetters', () => {
  it('pairs each letter with its borderline flag', () => {
    expect(typeCodeLetters(DEFAULT_PROFILE.dimensions)).toEqual([
      { dim: 'ie', letter: 'E', pct: 51, borderline: true },
      { dim: 'sn', letter: 'N', pct: 73, borderline: false },
      { dim: 'tf', letter: 'F', pct: 50, borderline: true },
      { dim: 'jp', letter: 'P', pct: 63, borderline: false },
    ]);
  });
});

describe('toggleDimension', () => {
  it('mirrors a score across the midline', () => {
    expect(toggleDimension({ e: 51, n: 73, f: 50, p: 63 }, 'sn').n).toBe(27);
    expect(toggleDimension({ e: 51, n: 73, f: 50, p: 63 }, 'ie').e).toBe(49);
  });

  it('steps a dead-even 50 just across the line so the letter changes', () => {
    const next = toggleDimension({ e: 51, n: 73, f: 50, p: 63 }, 'tf');
    expect(next.f).toBe(49);
    expect(deriveTypeCode(next)).toBe('ENTP');
  });

  it('toggling twice returns to the original letter', () => {
    const start = { e: 51, n: 73, f: 50, p: 63 };
    const twice = toggleDimension(toggleDimension(start, 'jp'), 'jp');
    expect(deriveTypeCode(twice)).toBe('ENFP');
  });

  it('does not touch other dimensions', () => {
    const next = toggleDimension({ e: 51, n: 73, f: 50, p: 63 }, 'jp');
    expect(next).toMatchObject({ e: 51, n: 73, f: 50 });
  });
});

describe('setDimensionScore', () => {
  it('sets and clamps a raw score', () => {
    expect(setDimensionScore({ e: 51, n: 73, f: 50, p: 63 }, 'ie', 120).e).toBe(100);
    expect(setDimensionScore({ e: 51, n: 73, f: 50, p: 63 }, 'ie', -3).e).toBe(0);
    expect(setDimensionScore({ e: 51, n: 73, f: 50, p: 63 }, 'jp', 40.6).p).toBe(41);
  });
});
