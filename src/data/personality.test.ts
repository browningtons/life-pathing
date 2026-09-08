// Descriptors and temperament derive from the stored scores, not from a
// hash of the type code. Two readers of the same type with different
// facets must read differently.

import { describe, expect, it } from 'vitest';
import {
  DESCRIPTOR_SPECS,
  dominantTemperament,
  FACET_POLES,
  getDescriptors,
  getTemperaments,
  poleScore,
  TEMPERAMENT_ORDER,
} from './personality';
import { DEFAULT_PROFILE } from './profile';

const sample = DEFAULT_PROFILE;

describe('poleScore', () => {
  it('reads the right pole directly and the left pole as its complement', () => {
    expect(poleScore(sample.facets, 'Insightful')).toBe(94);
    expect(poleScore(sample.facets, 'Factual')).toBe(6);
    expect(poleScore(sample.facets, 'Solitary')).toBe(87);
    expect(poleScore(sample.facets, 'Engaged')).toBe(13);
  });

  it('reads a missing facet as 50', () => {
    expect(poleScore({}, 'Relaxed')).toBe(50);
  });

  it('throws on an unknown pole', () => {
    expect(() => poleScore(sample.facets, 'Bogus')).toThrow(/Unknown facet pole/);
  });
});

describe('DESCRIPTOR_SPECS', () => {
  it('reference only poles that exist in the facet catalog', () => {
    const known = new Set(FACET_POLES);
    for (const spec of DESCRIPTOR_SPECS) {
      for (const { pole } of spec.poles) {
        expect(known.has(pole), `${spec.word} uses unknown pole "${pole}"`).toBe(true);
      }
    }
  });

  it('cover twenty-five distinct words', () => {
    const words = new Set(DESCRIPTOR_SPECS.map((s) => s.word));
    expect(words.size).toBe(25);
  });
});

describe('getDescriptors', () => {
  const descriptors = getDescriptors(sample.facets);
  const pct = Object.fromEntries(descriptors.map((d) => [d.word, d.pct]));

  it('is sorted high to low', () => {
    for (let i = 1; i < descriptors.length; i++) {
      expect(descriptors[i - 1].pct).toBeGreaterThanOrEqual(descriptors[i].pct);
    }
  });

  it('lands the sample near the original report: Curious on top, Organized at the bottom', () => {
    expect(descriptors[0].word).toBe('Curious');
    expect(descriptors[descriptors.length - 1].word).toBe('Organized');
    expect(pct.Curious).toBe(86);
    expect(pct.Organized).toBe(33);
    expect(pct.Pragmatic).toBeGreaterThan(35);
    expect(pct.Pragmatic).toBeLessThan(55);
  });

  it('keeps every value within 0–100', () => {
    for (const d of descriptors) {
      expect(d.pct).toBeGreaterThanOrEqual(0);
      expect(d.pct).toBeLessThanOrEqual(100);
    }
  });

  it('moves with the facets — dropping Insightful drops Curious', () => {
    const dimmer = getDescriptors({ ...sample.facets, Insightful: 6 });
    const curious = dimmer.find((d) => d.word === 'Curious')!;
    expect(curious.pct).toBeLessThan(pct.Curious - 30);
  });

  it('reads an all-50 profile as 50 everywhere', () => {
    for (const d of getDescriptors({})) expect(d.pct).toBe(50);
  });
});

describe('getTemperaments', () => {
  it('splits the sample 37 / 36 / 17 / 10, Empath first', () => {
    expect(getTemperaments(sample.dimensions).map((t) => [t.name, t.pct])).toEqual([
      ['Empath', 37],
      ['Theorist', 36],
      ['Responder', 17],
      ['Preserver', 10],
    ]);
  });

  it('always sums to exactly 100', () => {
    const cases = [
      { e: 51, n: 73, f: 50, p: 63 },
      { e: 0, n: 0, f: 0, p: 0 },
      { e: 100, n: 100, f: 100, p: 100 },
      { e: 50, n: 33, f: 33, p: 33 },
      { e: 12, n: 87, f: 41, p: 59 },
    ];
    for (const dims of cases) {
      const total = getTemperaments(dims).reduce((s, t) => s + t.pct, 0);
      expect(total, JSON.stringify(dims)).toBe(100);
    }
  });

  it('lists all four temperaments once', () => {
    const names = getTemperaments(sample.dimensions).map((t) => t.name);
    expect([...names].sort()).toEqual([...TEMPERAMENT_ORDER].sort());
  });

  it('puts a strong S/J profile on Preserver and a strong N/T profile on Theorist', () => {
    expect(dominantTemperament({ e: 40, n: 20, f: 60, p: 25 })).toBe('Preserver');
    expect(dominantTemperament({ e: 40, n: 85, f: 20, p: 50 })).toBe('Theorist');
    expect(dominantTemperament({ e: 40, n: 30, f: 60, p: 80 })).toBe('Responder');
  });

  it('breaks a dead-even F 50 toward the letter-derived temperament', () => {
    expect(dominantTemperament({ e: 51, n: 73, f: 50, p: 63 })).toBe('Empath');
    expect(dominantTemperament({ e: 51, n: 73, f: 49, p: 63 })).toBe('Theorist');
  });

  it('moves with the dimensions — more Sensing shifts weight off Empath', () => {
    const [top] = getTemperaments({ ...sample.dimensions, n: 40 });
    expect(top.name).toBe('Responder');
  });
});
