// Internal: the profile store's React context. Views import `useProfile`
// from ./useProfile; App mounts <ProfileProvider> from ./ProfileProvider.

import { createContext } from 'react';
import type { DimensionScores, DimensionSource, FacetScores, FacetSource, Profile } from '../data/profile';
import type { DimensionDetail } from '../lib/deriveType';
import type { LifePathData, MbtiDimension } from '../types';

export interface ProfilePatch {
  birthDate?: string;
  dimensions?: Partial<DimensionScores>;
  facets?: Partial<FacetScores>;
  dimensionSource?: DimensionSource;
  facetSource?: FacetSource;
}

export interface ProfileStore {
  /** Raw inputs — the single source of truth. */
  profile: Profile;

  // ── Derived, memoised per profile change ─────────────────────────
  /** Four-letter code derived from `profile.dimensions`, e.g. ENFP. */
  typeCode: string;
  /** Per-dimension letter, percent, name, borderline flag. */
  dimensions: DimensionDetail[];
  /** Life Path number + breakdown computed from `profile.birthDate`. */
  lifePath: LifePathData;
  /** True while the profile still equals the bundled sample. */
  isSample: boolean;
  /** True once the birthdate is not the sample's. */
  ownBirthDate: boolean;
  /** True once the reader has supplied letters by any route. */
  lettersKnown: boolean;
  /**
   * True when the reader has their own letters but the facets are still
   * the sample's — so the facets on screen would belong to someone else.
   */
  facetsMissing: boolean;

  // ── Mutations ────────────────────────────────────────────────────
  setBirthDate: (isoDate: string) => void;
  toggleDimension: (dim: MbtiDimension) => void;
  /** Per-field dimension control on Your Data. Marks the source `report`. */
  setDimensionScore: (dim: MbtiDimension, pct: number) => void;
  /** Per-field facet control on Your Data. Marks the facet source `report`. */
  setFacetScore: (rightPole: string, pct: number) => void;
  /** All four dimensions at once, from the quiz or typed letters. */
  setLetters: (dimensions: DimensionScores, source: 'quiz' | 'typed') => void;
  /** Merge a partial set of raw inputs (used by the paste-in intake). */
  updateProfile: (patch: ProfilePatch) => void;
  /** Back to the bundled sample; clears the saved copy. */
  resetProfile: () => void;
}

export const ProfileContext = createContext<ProfileStore | null>(null);
