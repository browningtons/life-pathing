// Internal: the entitlement context. App's shell owns the kit's useAuth()
// (a single instance; it holds state) and publishes the two things views
// need: whether the reader is Pro, and how to open the upgrade modal.

import { createContext } from 'react';

export interface Gate {
  isPro: boolean;
  /** Open the upgrade modal, tagged with where it was triggered from. */
  openUpgrade: (source: string) => void;
  /** Restore a purchase by checkout email (the kit's flow). */
  restore: () => void;
  /**
   * True while an admin is viewing as admin (the AdminBar toggle). The
   * Reading then fetches with the admin token instead of a session id.
   */
  adminView: boolean;
}

export const GateContext = createContext<Gate | null>(null);
