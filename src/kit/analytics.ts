// Generic analytics layer. Consuming apps fire events through trackEvent()
// or the named helpers below. Event names get the app's eventPrefix so a
// shared Vercel Analytics dashboard can split them per app.
//
// UTMs are captured from the landing URL on first load and forwarded to
// Stripe via client_reference_id so revenue can be attributed by channel.

import { track } from '@vercel/analytics';
import { getKitConfig } from './config';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

const UTM_STORAGE_KEY = 'utm';

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  [key: string]: string | undefined;
}

function utmStorageKey(): string {
  return `${getKitConfig().app.storagePrefix}${UTM_STORAGE_KEY}`;
}

function eventName(name: string): string {
  return `${getKitConfig().analytics.eventPrefix}${name}`;
}

export function captureUtmParams(): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(utmStorageKey())) return;

  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  let hasAny = false;

  for (const k of UTM_KEYS) {
    const val = params.get(k);
    if (val) {
      utm[k] = val;
      hasAny = true;
    }
  }

  if (hasAny) {
    sessionStorage.setItem(utmStorageKey(), JSON.stringify(utm));
  }
}

export function getUtmParams(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(utmStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Stripe accepts client_reference_id up to 200 characters of [A-Za-z0-9_-].
export const CLIENT_REFERENCE_MAX = 200;

function refSafe(s: string | undefined): string {
  return (s ?? '').replace(/[^A-Za-z0-9_-]/g, '');
}

/**
 * The `client_reference_id` for a purchase: `<key>__<source>_<medium>_<campaign>`.
 * With no key it is the legacy UTM-only form (no `__`). Only Stripe's
 * allowed characters survive; the UTM tail is cut so the whole fits in 200
 * characters and the key is never truncated. Empty when there is nothing
 * to send.
 */
export function clientReferenceId(opts: { key?: string; utm?: UtmParams }): string {
  const utm = opts.utm ?? {};
  const tail = [utm.utm_source, utm.utm_medium, utm.utm_campaign]
    .map(refSafe)
    .filter(Boolean)
    .join('_');
  const key = refSafe(opts.key).slice(0, CLIENT_REFERENCE_MAX);
  if (!key) return tail.slice(0, CLIENT_REFERENCE_MAX);
  if (!tail) return key;
  const room = CLIENT_REFERENCE_MAX - key.length - 2;
  return room > 0 ? `${key}__${tail.slice(0, room)}` : key;
}

/**
 * Decorates a Stripe Payment Link with `client_reference_id`, binding the
 * purchase to a Reading key (when given) and carrying the buyer's traffic
 * source to the Stripe dashboard.
 */
export function stripeUrlWithRef(
  baseUrl: string,
  opts: { key?: string; utm?: UtmParams } = {},
): string {
  const ref = clientReferenceId(opts);
  if (!ref) return baseUrl;
  const url = new URL(baseUrl);
  url.searchParams.set('client_reference_id', ref);
  return url.toString();
}

/** Legacy form: UTMs only, no Reading key. Kept for compatibility. */
export function stripeUrlWithUtm(baseUrl: string): string {
  return stripeUrlWithRef(baseUrl, { utm: getUtmParams() });
}

// ── Generic event helper ────────────────────────────────
// Apps can fire arbitrary events via trackEvent('thing_did', { extra }).
// The named helpers below are just thin wrappers for the common funnel
// events every app shares.

export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean | undefined | null>,
): void {
  track(eventName(name), { ...getUtmParams(), ...data });
}

export function trackLandingView(): void {
  trackEvent('landing_view');
}

export function trackTabView(tab: string): void {
  trackEvent('tab_view', { tab });
}

export function trackUpgradeShown(source: string): void {
  trackEvent('upgrade_shown', { source });
}

export function trackProPurchase(): void {
  trackEvent('pro_purchase');
}

export function trackRestoreAttempt(success: boolean): void {
  trackEvent('restore_attempt', { success });
}
