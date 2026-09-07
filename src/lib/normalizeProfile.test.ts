import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILE } from '../data/profile';
import { normalizeProfile, profilesEqual } from './normalizeProfile';

describe('normalizeProfile', () => {
  it('returns the sample profile for garbage input', () => {
    expect(normalizeProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile('nope')).toEqual(DEFAULT_PROFILE);
    expect(normalizeProfile({})).toEqual(DEFAULT_PROFILE);
  });

  it('keeps valid stored values', () => {
    const stored = {
      birthDate: '1990-01-15',
      dimensions: { e: 30, n: 40, f: 80, p: 20 },
      facets: { ...DEFAULT_PROFILE.facets, Insightful: 12 },
    };
    expect(normalizeProfile(stored)).toEqual(stored);
  });

  it('drops unknown facet keys and fills missing ones from the sample', () => {
    const out = normalizeProfile({ facets: { Bogus: 99, Insightful: 40 } });
    expect(out.facets.Bogus).toBeUndefined();
    expect(out.facets.Insightful).toBe(40);
    expect(out.facets.Aesthetic).toBe(DEFAULT_PROFILE.facets.Aesthetic);
    expect(Object.keys(out.facets)).toHaveLength(23);
  });

  it('clamps and rounds numbers, and coerces numeric strings', () => {
    const out = normalizeProfile({ dimensions: { e: 140, n: -5, f: '61.4', p: 'x' } });
    expect(out.dimensions).toEqual({ e: 100, n: 0, f: 61, p: DEFAULT_PROFILE.dimensions.p });
  });

  it('rejects a malformed birthdate', () => {
    expect(normalizeProfile({ birthDate: '08/09/1986' }).birthDate).toBe(DEFAULT_PROFILE.birthDate);
    expect(normalizeProfile({ birthDate: 19860809 }).birthDate).toBe(DEFAULT_PROFILE.birthDate);
  });
});

describe('profilesEqual', () => {
  it('is true for the sample against itself', () => {
    expect(profilesEqual(DEFAULT_PROFILE, { ...DEFAULT_PROFILE })).toBe(true);
  });

  it('is false when any raw input differs', () => {
    expect(profilesEqual(DEFAULT_PROFILE, { ...DEFAULT_PROFILE, birthDate: '1990-01-01' })).toBe(false);
    expect(
      profilesEqual(DEFAULT_PROFILE, { ...DEFAULT_PROFILE, dimensions: { ...DEFAULT_PROFILE.dimensions, e: 52 } }),
    ).toBe(false);
    expect(
      profilesEqual(DEFAULT_PROFILE, { ...DEFAULT_PROFILE, facets: { ...DEFAULT_PROFILE.facets, Joyful: 57 } }),
    ).toBe(false);
  });
});
