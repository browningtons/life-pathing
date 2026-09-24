// The profile — the single source of truth for one reader's raw inputs.
//
// ONLY raw inputs live here. Nothing derived is stored:
//   - type code (ENFP)          → derived in lib/deriveType from `dimensions`
//   - nickname, stack, famous   → looked up from the type code in data/mbti
//   - Life Path number          → computed in lib/calculateLifePath from `birthDate`
//   - "borderline" flags        → derived from `dimensions` (45–55%)
//
// Change a number here and every view follows. Nothing else needs editing.

export interface DimensionScores {
  /** Percent toward Extraversion (E). 100 - e is the Introversion score. */
  e: number;
  /** Percent toward Intuition (N). 100 - n is the Sensing score. */
  n: number;
  /** Percent toward Feeling (F). 100 - f is the Thinking score. */
  f: number;
  /** Percent toward Perceiving (P). 100 - p is the Judging score. */
  p: number;
}

/**
 * Facet scores, keyed by the facet's right-hand pole (see FACET_CATALOG in
 * data/personality). The value is the percent toward that pole; the
 * left-hand pole is 100 minus it. The comment on each line gives the
 * reading the way TypeFinder reports it.
 */
export type FacetScores = Record<string, number>;

/**
 * Where the four dimension scores came from. The sample's dimensions look
 * exactly like anyone else's, so without this nothing can tell "the reader
 * gave us letters" from "the reader typed a birthdate and the letters are
 * still the builder's".
 *
 *   sample  the bundled sample; the reader has not supplied letters
 *   quiz    the twelve-question quiz on the Life Path tab
 *   typed   four letters typed in
 *   report  a pasted report, or the per-field controls on Your Data
 */
export type DimensionSource = 'sample' | 'quiz' | 'typed' | 'report';

/** Where the facet scores came from. Facets only arrive from a report. */
export type FacetSource = 'sample' | 'report';

export interface Profile {
  /** ISO date, YYYY-MM-DD. */
  birthDate: string;
  dimensions: DimensionScores;
  facets: FacetScores;
  dimensionSource: DimensionSource;
  facetSource: FacetSource;
}

export const DEFAULT_PROFILE: Profile = {
  birthDate: '1986-08-09',

  // TypeFinder dimension scores. Stored as percentages, never letters —
  // the letters (and the type code) are derived at render time.
  dimensions: { e: 51, n: 73, f: 50, p: 63 },

  // TypeFinder's 23 facets.
  facets: {
    // Lifestyle
    Orderly: 34, // Relaxed 66
    Scheduled: 30, // Spontaneous 70
    Conscientious: 42, // Casual 58
    Disciplined: 38, // Impulsive 62
    Ambitious: 44, // Easygoing 56
    // Values
    Subjective: 43, // Objective 57
    Compassionate: 52,
    Agreeable: 73,
    Helpful: 44, // Individualist 56
    Cooperative: 60,
    Tolerant: 32, // Tough 68
    // Cognitive
    Imaginative: 54,
    Conceptual: 76,
    Progressive: 70,
    Insightful: 94,
    Aesthetic: 90,
    Adventurous: 52,
    // Energy
    Energetic: 60,
    Expressive: 50,
    Prominent: 41, // Private 59
    Joyful: 56,
    Friendly: 78,
    Engaged: 13, // Solitary 87
  },

  dimensionSource: 'sample',
  facetSource: 'sample',
};
