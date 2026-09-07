// The profile store. Holds the raw profile in state and derives everything
// else (type code, dimension details, Life Path) once per change. Views
// read from `useProfile()` and never keep their own copy.

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_PROFILE, type Profile } from '../data/profile';
import { calculateLifePath } from '../lib/calculateLifePath';
import {
  deriveTypeCode,
  dimensionDetails,
  setDimensionScore as setDimensionScorePure,
  toggleDimension as toggleDimensionPure,
} from '../lib/deriveType';
import type { MbtiDimension } from '../types';
import { ProfileContext, type ProfileStore } from './context-internal';

interface ProfileProviderProps {
  children: ReactNode;
  /** Override the starting profile (tests, previews). Defaults to DEFAULT_PROFILE. */
  initialProfile?: Profile;
}

export function ProfileProvider({ children, initialProfile = DEFAULT_PROFILE }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const typeCode = useMemo(() => deriveTypeCode(profile.dimensions), [profile.dimensions]);
  const dimensions = useMemo(() => dimensionDetails(profile.dimensions), [profile.dimensions]);
  const lifePath = useMemo(() => calculateLifePath(profile.birthDate), [profile.birthDate]);

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
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    setProfile((p) => ({ ...p, facets: { ...p.facets, [rightPole]: clamped } }));
  }, []);

  const resetProfile = useCallback(() => setProfile(initialProfile), [initialProfile]);

  const value = useMemo<ProfileStore>(
    () => ({
      profile,
      typeCode,
      dimensions,
      lifePath,
      setBirthDate,
      toggleDimension,
      setDimensionScore,
      setFacetScore,
      resetProfile,
    }),
    [profile, typeCode, dimensions, lifePath, setBirthDate, toggleDimension, setDimensionScore, setFacetScore, resetProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
