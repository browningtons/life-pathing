// Turn whatever came back from storage (or a paste, or an old schema) into
// a valid Profile. Unknown facet keys are dropped, missing ones fall back
// to the sample, every number is clamped to 0–100.

import { FACET_CATALOG } from '../data/personality';
import {
  DEFAULT_PROFILE,
  type DimensionScores,
  type DimensionSource,
  type FacetScores,
  type FacetSource,
  type Profile,
} from '../data/profile';

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

const DIMENSION_SOURCES: readonly DimensionSource[] = ['sample', 'quiz', 'typed', 'report'];
const FACET_SOURCES: readonly FacetSource[] = ['sample', 'report'];

const dimensionsEqual = (a: DimensionScores, b: DimensionScores): boolean =>
  a.e === b.e && a.n === b.n && a.f === b.f && a.p === b.p;

const facetsEqual = (a: FacetScores, b: FacetScores): boolean => {
  for (const key of FACET_KEYS) {
    if ((a[key] ?? 50) !== (b[key] ?? 50)) return false;
  }
  return true;
};

/**
 * A stored source if it is a known value. Profiles saved before the
 * source fields existed carry none; for those, anything that differs from
 * the sample was entered on Your Data, so it reads as `report`.
 */
function normalizeDimensionSource(raw: unknown, dimensions: DimensionScores, base: DimensionSource): DimensionSource {
  if (DIMENSION_SOURCES.includes(raw as DimensionSource)) return raw as DimensionSource;
  if (raw === undefined) return dimensionsEqual(dimensions, DEFAULT_PROFILE.dimensions) ? 'sample' : 'report';
  return base;
}

function normalizeFacetSource(raw: unknown, facets: FacetScores, base: FacetSource): FacetSource {
  if (FACET_SOURCES.includes(raw as FacetSource)) return raw as FacetSource;
  if (raw === undefined) return facetsEqual(facets, DEFAULT_PROFILE.facets) ? 'sample' : 'report';
  return base;
}

/** Build a full, valid Profile from unknown input, filling gaps from `base`. */
export function normalizeProfile(raw: unknown, base: Profile = DEFAULT_PROFILE): Profile {
  const r = isRecord(raw) ? raw : {};
  const dimensions = normalizeDimensions(r.dimensions, base.dimensions);
  const facets = normalizeFacets(r.facets, base.facets);
  return {
    birthDate: normalizeBirthDate(r.birthDate, base.birthDate),
    dimensions,
    facets,
    dimensionSource: normalizeDimensionSource(r.dimensionSource, dimensions, base.dimensionSource),
    facetSource: normalizeFacetSource(r.facetSource, facets, base.facetSource),
  };
}

/** True when two profiles carry the same raw inputs, sources included. */
export function profilesEqual(a: Profile, b: Profile): boolean {
  if (a.birthDate !== b.birthDate) return false;
  if (a.dimensionSource !== b.dimensionSource) return false;
  if (a.facetSource !== b.facetSource) return false;
  if (a.dimensions.e !== b.dimensions.e) return false;
  if (a.dimensions.n !== b.dimensions.n) return false;
  if (a.dimensions.f !== b.dimensions.f) return false;
  if (a.dimensions.p !== b.dimensions.p) return false;
  for (const key of FACET_KEYS) {
    if ((a.facets[key] ?? 50) !== (b.facets[key] ?? 50)) return false;
  }
  return true;
}
