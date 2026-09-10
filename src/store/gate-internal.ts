// Internal: the entitlement context. App's shell owns the kit's useAuth()
// (a single instance; it holds state) and publishes the two things views
// need: whether the reader is Pro, and how to open the upgrade modal.

import { createContext } from 'react';

export interface Gate {
  isPro: boolean;
  /** Open the upgrade modal, tagged with where it was triggered from. */
  openUpgrade: (source: string) => void;
}

export const GateContext = createContext<Gate | null>(null);
