// Turn whatever came back from storage (or a paste, or an old schema) into
// a valid Profile. Unknown facet keys are dropped, missing ones fall back
// to the sample, every number is clamped to 0–100.

import { FACET_CATALOG } from '../data/personality';
import { DEFAULT_PROFILE, type DimensionScores, type FacetScores, type Profile } from '../data/profile';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const FACET_KEYS = new Set(FACET_CATALOG.map((f) => f.right));

export const clampPct = (n: unknown, fallback: number): number => {
  const v = typeof n === 'number' ? n : typeof n === 'string' ? Number(n) : NaN;
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function normalizeDimensions(raw: unknown, base: DimensionScores = DEFAULT_PROFILE.dimensions): DimensionScores {
  const r = isRecord(raw) ? raw : {};
  return {
    e: clampPct(r.e, base.e),
    n: clampPct(r.n, base.n),
    f: clampPct(r.f, base.f),
    p: clampPct(r.p, base.p),
  };
}

export function normalizeFacets(raw: unknown, base: FacetScores = DEFAULT_PROFILE.facets): FacetScores {
  const r = isRecord(raw) ? raw : {};
  const out: FacetScores = {};
  for (const key of FACET_KEYS) {
    out[key] = clampPct(r[key], base[key] ?? 50);
  }
  return out;
}

export function normalizeBirthDate(raw: unknown, base: string = DEFAULT_PROFILE.birthDate): string {
  return typeof raw === 'string' && ISO_DATE.test(raw) ? raw : base;
}

/** Build a full, valid Profile from unknown input, filling gaps from `base`. */
export function normalizeProfile(raw: unknown, base: Profile = DEFAULT_PROFILE): Profile {
  const r = isRecord(raw) ? raw : {};
  return {
    birthDate: normalizeBirthDate(r.birthDate, base.birthDate),
    dimensions: normalizeDimensions(r.dimensions, base.dimensions),
    facets: normalizeFacets(r.facets, base.facets),
  };
}

/** True when two profiles carry the same raw inputs. */
export function profilesEqual(a: Profile, b: Profile): boolean {
  if (a.birthDate !== b.birthDate) return false;
  if (a.dimensions.e !== b.dimensions.e) return false;
  if (a.dimensions.n !== b.dimensions.n) return false;
  if (a.dimensions.f !== b.dimensions.f) return false;
  if (a.dimensions.p !== b.dimensions.p) return false;
  for (const key of FACET_KEYS) {
    if ((a.facets[key] ?? 50) !== (b.facets[key] ?? 50)) return false;
  }
  return true;
}
