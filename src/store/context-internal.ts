// Internal: the profile store's React context. Views import `useProfile`
// from ./useProfile; App mounts <ProfileProvider> from ./ProfileProvider.

import { createContext } from 'react';
import type { DimensionScores, FacetScores, Profile } from '../data/profile';
import type { DimensionDetail } from '../lib/deriveType';
import type { LifePathData, MbtiDimension } from '../types';

export interface ProfilePatch {
  birthDate?: string;
  dimensions?: Partial<DimensionScores>;
  facets?: Partial<FacetScores>;
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

  // ── Mutations ────────────────────────────────────────────────────
  setBirthDate: (isoDate: string) => void;
  toggleDimension: (dim: MbtiDimension) => void;
  setDimensionScore: (dim: MbtiDimension, pct: number) => void;
  setFacetScore: (rightPole: string, pct: number) => void;
  /** Merge a partial set of raw inputs (used by the paste-in intake). */
  updateProfile: (patch: ProfilePatch) => void;
  /** Back to the bundled sample; clears the saved copy. */
  resetProfile: () => void;
}

export const ProfileContext = createContext<ProfileStore | null>(null);
