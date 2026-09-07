// Derive MBTI letters, the type code, and borderline flags from raw
// dimension scores. Pure functions; nothing here reads a view or a store.

import { DIMENSIONS, DIMENSION_ORDER } from '../data/mbti';
import type { DimensionScores } from '../data/profile';
import type { MbtiDimension } from '../types';

/** A dimension scoring inside this band is a near-even split. */
export const BORDERLINE_MIN = 45;
export const BORDERLINE_MAX = 55;

export const isBorderline = (pct: number): boolean => pct >= BORDERLINE_MIN && pct <= BORDERLINE_MAX;

const SCORE_KEY: Record<MbtiDimension, keyof DimensionScores> = {
  ie: 'e',
  sn: 'n',
  tf: 'f',
  jp: 'p',
};

/** Raw stored percent toward the right-hand pole (E, N, F, P). */
export const rawScore = (dimensions: DimensionScores, dim: MbtiDimension): number =>
  dimensions[SCORE_KEY[dim]];

/**
 * The letter a score resolves to. A dead-even 50 resolves to the right-hand
 * pole (E, N, F, P), which is how TypeFinder reports it — so F at 50 reads F.
 */
export const letterFor = (dim: MbtiDimension, pct: number): string => {
  const { poles } = DIMENSIONS[dim];
  return pct >= 50 ? poles.right.letter : poles.left.letter;
};

export interface DimensionDetail {
  dim: MbtiDimension;
  /** "Energy", "Mind", "Nature", "Tactics". */
  label: string;
  /** Left pole letter and name, e.g. I / Introversion. */
  left: { letter: string; name: string };
  /** Right pole letter and name, e.g. E / Extraversion. */
  right: { letter: string; name: string };
  /** The letter the score resolves to. */
  letter: string;
  /** Full name of the resolved letter. */
  name: string;
  /** Percent toward the resolved letter (always >= 50). */
  pct: number;
  /** Raw stored percent toward the right-hand pole. */
  rawPct: number;
  /** True when the split is within 45–55. */
  borderline: boolean;
  tooltip: string;
}

export const dimensionDetail = (dimensions: DimensionScores, dim: MbtiDimension): DimensionDetail => {
  const meta = DIMENSIONS[dim];
  const rawPct = rawScore(dimensions, dim);
  const letter = letterFor(dim, rawPct);
  const favorsRight = letter === meta.poles.right.letter;
  return {
    dim,
    label: meta.label,
    left: meta.poles.left,
    right: meta.poles.right,
    letter,
    name: favorsRight ? meta.poles.right.name : meta.poles.left.name,
    pct: favorsRight ? rawPct : 100 - rawPct,
    rawPct,
    borderline: isBorderline(rawPct),
    tooltip: meta.tooltip,
  };
};

/** All four dimensions, in I/E → S/N → T/F → J/P order. */
export const dimensionDetails = (dimensions: DimensionScores): DimensionDetail[] =>
  DIMENSION_ORDER.map((dim) => dimensionDetail(dimensions, dim));

/** Four letters, e.g. "ENFP". */
export const deriveTypeCode = (dimensions: DimensionScores): string =>
  DIMENSION_ORDER.map((dim) => letterFor(dim, rawScore(dimensions, dim))).join('');

/** Letters of a type code paired with whether each dimension is borderline. */
export const typeCodeLetters = (
  dimensions: DimensionScores,
): { dim: MbtiDimension; letter: string; pct: number; borderline: boolean }[] =>
  dimensionDetails(dimensions).map(({ dim, letter, pct, borderline }) => ({ dim, letter, pct, borderline }));

/**
 * Flip one dimension to its other pole, keeping the same distance from
 * the midline (51% E becomes 51% I). A dead-even 50 has no mirror that
 * changes the letter, so it steps just across the line to 49.
 */
export const toggleDimension = (dimensions: DimensionScores, dim: MbtiDimension): DimensionScores => {
  const pct = rawScore(dimensions, dim);
  const mirrored = 100 - pct;
  const next = pct >= 50 ? Math.min(mirrored, 49) : Math.max(mirrored, 50);
  return { ...dimensions, [SCORE_KEY[dim]]: next };
};

/** Set one dimension's raw score directly (clamped to 0–100). */
export const setDimensionScore = (
  dimensions: DimensionScores,
  dim: MbtiDimension,
  pct: number,
): DimensionScores => ({
  ...dimensions,
  [SCORE_KEY[dim]]: Math.max(0, Math.min(100, Math.round(pct))),
});
