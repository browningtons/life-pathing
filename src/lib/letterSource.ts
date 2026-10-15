// What the screen may claim about the four letters, by where they came from.
//
// Typed letters are stored as 70 / 30 toward each letter (see letters.ts)
// because the profile only stores percentages. That number is a default,
// not a measurement, so the screen must not read it back as one: no
// percentages on the hero, no "clear lean" on the result card, and a note
// wherever arithmetic is done on it. Quiz, report and sample readers keep
// their percentages.

import type { DimensionSource } from '../data/profile';

/** True when the stored dimension percentages are a measurement worth showing. */
export const showsDimensionPercent = (source: DimensionSource): boolean => source !== 'typed';

/** The lean sentence on the result card, by source and how many letters are borderline. */
export function resultLeanCopy(source: DimensionSource, borderlineCount: number): string {
  if (source === 'typed') {
    return 'These are the letters you typed, taken as given. The twelve questions, or a pasted report, would show how strongly you lean on each.';
  }
  if (borderlineCount > 0) {
    const one = borderlineCount === 1;
    return `The underlined ${one ? 'letter is' : 'letters are'} a two-to-one lean, close enough to go either way. The other pages mark ${one ? 'it' : 'them'} the same way.`;
  }
  return 'A clear lean on all four letters.';
}

/** The secondary action on the result card. */
export const resultRetakeLabel = (source: DimensionSource): string =>
  source === 'typed' ? 'Take the twelve questions' : 'Take the questions again';

/** Stands in for the percentage on a hero tile when the letters were typed. */
export const TYPED_MARKER = 'Typed';

/** Hover text for the typed marker. */
export const TYPED_MARKER_TITLE = 'You typed this letter. There is no score behind it, so no percentage is shown.';

/** One line on the Temperament tab for a typed reader. */
export const TYPED_TEMPERAMENT_NOTE =
  'Your letters were typed, not scored, so this split comes from the four letters alone. Anyone who types the same four gets the same numbers.';

/** One line on the Adjacent Types tab for a typed reader. */
export const TYPED_MATCHES_NOTE =
  'Your letters were typed, not scored, so every letter weighs the same and types the same number of letters away tie. Expect ties.';
