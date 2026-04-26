// Read-only view of entitlement state for components that don't need the
// full useAuth surface. Useful for deeply-nested children that just want
// to render a <ProBadge> or hide a row.
//
// In practice useAuth() is fine for almost everything; this exists so
// future entitlement modes (server-backed subscriptions) can be swapped
// in here without touching the consuming components.

import { load } from '../persistence';

export function useEntitlement(): { isPro: boolean } {
  // Same source of truth as useAuth's persistence write. We deliberately
  // don't share state here — useAuth owns mutations; this is a peek.
  const isPro = load<boolean>('pro', false);
  return { isPro };
}
