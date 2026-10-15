// Where a letter toggle on the Archetypes tab lands.
//
// Once the letters are the reader's own (typed, quiz, report), browsing other
// types must not overwrite them, so the toggles move a view-only type held by
// the page. While the profile is still the sample there is nothing of theirs
// to lose, and writing to the profile is what lets a first-time reader pick a
// type and watch the other tabs follow.

import type { DimensionSource } from '../data/profile';

/** True when toggles should write to the saved profile rather than a local view. */
export const togglesWriteToProfile = (source: DimensionSource): boolean => source === 'sample';
