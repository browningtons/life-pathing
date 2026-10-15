import { describe, expect, it } from 'vitest';
import { dataHeading, defaultProfileSection } from './provenance';

describe('defaultProfileSection', () => {
  it('opens on The Facets when the facets are there to read', () => {
    expect(defaultProfileSection(false)).toBe('traits');
  });

  it('opens on Temperament for a reader with letters but no facets', () => {
    expect(defaultProfileSection(true)).toBe('temperament');
  });
});

describe('dataHeading', () => {
  it("names the sample when nothing is the reader's", () => {
    expect(dataHeading({ ownBirthDate: false, lettersKnown: false, ownFacets: false })).toBe(
      'You are reading a sample profile',
    );
  });

  it("claims the whole profile only when the facets are the reader's too", () => {
    expect(dataHeading({ ownBirthDate: true, lettersKnown: true, ownFacets: true })).toBe('This is your profile');
  });

  it("says the facets are still the sample's for a letters-only reader", () => {
    const h = dataHeading({ ownBirthDate: true, lettersKnown: true, ownFacets: false });
    expect(h).toMatch(/birthdate and letters/);
    expect(h).toMatch(/facets below are still the sample's/);
    expect(h).not.toBe('This is your profile');
  });

  it("says the letters and facets are the sample's for a birthdate-only reader", () => {
    expect(dataHeading({ ownBirthDate: true, lettersKnown: false, ownFacets: false })).toMatch(
      /letters and facets below are still the sample's/,
    );
  });

  it("names the sample birthdate when only the scores are the reader's", () => {
    expect(dataHeading({ ownBirthDate: false, lettersKnown: true, ownFacets: true })).toMatch(
      /birthdate is still the sample's/,
    );
    expect(dataHeading({ ownBirthDate: false, lettersKnown: true, ownFacets: false })).toMatch(
      /birthdate and facets below are still the sample's/,
    );
  });
});
