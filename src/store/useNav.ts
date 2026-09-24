import { useContext } from 'react';
import { NavContext, type Nav } from './nav-internal';

/** Tab navigation. Must be used inside the app shell. */
export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) {
    throw new Error('useNav() must be used inside the app shell.');
  }
  return nav;
}
