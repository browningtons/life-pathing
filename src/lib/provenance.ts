// Whose data is on screen, said plainly. A profile is three inputs (the
// birthdate, the four letters, the twenty-three facets), and each one is
// either the reader's or still the sample's. These helpers turn that into
// the one decision each view needs, so the rule lives in one tested place.

import type { Section } from '../data/personality';

export interface Ownership {
  /** The birthdate is the reader's, not the sample's. */
  ownBirthDate: boolean;
  /** The four letters came from the reader (typed, quiz, or a report). */
  lettersKnown: boolean;
  /** The facet scores came from a pasted report. */
  ownFacets: boolean;
}

/**
 * The Profile sub-tab a reader lands on. The facets need a pasted report,
 * so a reader with their own letters but the sample's facets opens on the
 * first section that reads the letters: Temperament. Everyone else opens on
 * The Facets.
 */
export function defaultProfileSection(facetsMissing: boolean): Section {
  return facetsMissing ? 'temperament' : 'traits';
}

/** The Your Data subtitle: which of the three inputs are the reader's. */
export function dataHeading({ ownBirthDate, lettersKnown, ownFacets }: Ownership): string {
  if (ownFacets) {
    return ownBirthDate ? 'This is your profile' : "Your scores; the birthdate is still the sample's";
  }
  if (lettersKnown) {
    return ownBirthDate
      ? "Your birthdate and letters; the facets below are still the sample's"
      : "Your letters; the birthdate and facets below are still the sample's";
  }
  if (ownBirthDate) return "Your birthdate; the letters and facets below are still the sample's";
  return 'You are reading a sample profile';
}
