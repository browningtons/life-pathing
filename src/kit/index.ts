// Public API surface for the kit. Apps import from '@/kit' (or relative).
//
// Anything not re-exported here is internal — touching internals from
// consuming apps creates upgrade pain when the kit version bumps.

export type { KitConfig } from './config';
export { KitProvider } from './context';
export { useKitConfig } from './use-kit-config';
export { useAuth } from './auth/useAuth';
export { useEntitlement } from './auth/useEntitlement';
export { default as UpgradeModal } from './components/UpgradeModal';
export { default as LockedOverlay } from './components/LockedOverlay';
export { default as ProBadge } from './components/ProBadge';
export { default as AdminBar } from './components/AdminBar';
export { load, save } from './persistence';
export {
  captureUtmParams,
  getUtmParams,
  stripeUrlWithUtm,
  trackLandingView,
  trackTabView,
  trackUpgradeShown,
  trackProPurchase,
  trackRestoreAttempt,
  trackEvent,
} from './analytics';
