// The app's tabs, in order. The Reading tab sits after Profile and exists
// only while the Reading flag is on (see src/lib/readingFlag.ts).

import type { View } from './nav-internal';

export interface Tab {
  id: View;
  label: string;
}

const BASE_TABS: Tab[] = [
  { id: 'lifepath', label: 'Life Path' },
  { id: 'archetypes', label: 'Archetypes' },
  { id: 'profile', label: 'Profile' },
  { id: 'intake', label: 'Your Data' },
];

export function tabsFor(readingEnabled: boolean): Tab[] {
  if (!readingEnabled) return BASE_TABS;
  const at = BASE_TABS.findIndex((t) => t.id === 'profile') + 1;
  return [...BASE_TABS.slice(0, at), { id: 'reading', label: 'Reading' }, ...BASE_TABS.slice(at)];
}
