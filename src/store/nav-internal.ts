// Internal: tab navigation. The app shell owns which tab is showing; views
// that need to send the reader somewhere else (the letters ask sending them
// to the Profile, the facet-missing card sending them to Your Data) ask
// through this context rather than taking a callback prop.

import { createContext } from 'react';

export type View = 'lifepath' | 'archetypes' | 'profile' | 'intake';

export interface Nav {
  /** Show a tab. With `anchor`, scroll to and focus the element with that id once it renders. */
  go: (view: View, anchor?: string) => void;
}

export const NavContext = createContext<Nav | null>(null);
