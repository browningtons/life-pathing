// The profile store. Holds the raw profile in state, persists it to
// localStorage through the kit's namespaced helpers, and derives everything
// else (type code, dimension details, Life Path) once per change. Views
// read from `useProfile()` and never keep their own copy.

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PROFILE, type Profile } from '../data/profile';
import { load, save } from '../kit';
import { calculateLifePath } from '../lib/calculateLifePath';
import {
  deriveTypeCode,
  dimensionDetails,
  setDimensionScore as setDimensionScorePure,
  toggleDimension as toggleDimensionPure,
} from '../lib/deriveType';
import { clampPct, normalizeProfile, profilesEqual } from '../lib/normalizeProfile';
import type { MbtiDimension } from '../types';
import { ProfileContext, type ProfilePatch, type ProfileStore } from './context-internal';

/** localStorage key (namespaced by the kit's storagePrefix). */
export const PROFILE_STORAGE_KEY = 'profile';

interface ProfileProviderProps {
  children: ReactNode;
  /**
   * Override the starting profile and skip storage (tests, previews).
   * When omitted, the saved profile is loaded, falling back to the sample.
   */
  initialProfile?: Profile;
}

export function ProfileProvider({ children, initialProfile }: ProfileProviderProps) {
  const persist = initialProfile === undefined;

  const [profile, setProfile] = useState<Profile>(() =>
    persist ? normalizeProfile(load<unknown>(PROFILE_STORAGE_KEY, null)) : initialProfile,
  );

  // Save on every change. Only write once the profile has left the sample,
  // so a first visit does not pin the sample into storage.
  useEffect(() => {
    if (!persist) return;
    if (profilesEqual(profile, DEFAULT_PROFILE)) return;
    save(PROFILE_STORAGE_KEY, profile);
  }, [persist, profile]);

  const typeCode = useMemo(() => deriveTypeCode(profile.dimensions), [profile.dimensions]);
  const dimensions = useMemo(() => dimensionDetails(profile.dimensions), [profile.dimensions]);
  const lifePath = useMemo(() => calculateLifePath(profile.birthDate), [profile.birthDate]);
  const isSample = useMemo(() => profilesEqual(profile, DEFAULT_PROFILE), [profile]);

  const setBirthDate = useCallback((birthDate: string) => {
    setProfile((p) => ({ ...p, birthDate }));
  }, []);

  const toggleDimension = useCallback((dim: MbtiDimension) => {
    setProfile((p) => ({ ...p, dimensions: toggleDimensionPure(p.dimensions, dim) }));
  }, []);

  const setDimensionScore = useCallback((dim: MbtiDimension, pct: number) => {
    setProfile((p) => ({ ...p, dimensions: setDimensionScorePure(p.dimensions, dim, pct) }));
  }, []);

  const setFacetScore = useCallback((rightPole: string, pct: number) => {
    setProfile((p) => ({ ...p, facets: { ...p.facets, [rightPole]: clampPct(pct, p.facets[rightPole] ?? 50) } }));
  }, []);

  const updateProfile = useCallback((patch: ProfilePatch) => {
    setProfile((p) =>
      normalizeProfile(
        {
          birthDate: patch.birthDate ?? p.birthDate,
          dimensions: { ...p.dimensions, ...patch.dimensions },
          facets: { ...p.facets, ...patch.facets },
        },
        p,
      ),
    );
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(initialProfile ?? DEFAULT_PROFILE);
    if (persist) save(PROFILE_STORAGE_KEY, null);
  }, [initialProfile, persist]);

  const value = useMemo<ProfileStore>(
    () => ({
      profile,
      typeCode,
      dimensions,
      lifePath,
      isSample,
      setBirthDate,
      toggleDimension,
      setDimensionScore,
      setFacetScore,
      updateProfile,
      resetProfile,
    }),
    [
      profile,
      typeCode,
      dimensions,
      lifePath,
      isSample,
      setBirthDate,
      toggleDimension,
      setDimensionScore,
      setFacetScore,
      updateProfile,
      resetProfile,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
