// kit.config.ts is the single per-app override file.
//
// Every consuming app fills this in once. Everything else under src/kit/
// reads from this object — the kit itself never hardcodes a string.
//
// Steps when adopting the kit in a new app:
//   1. Copy this file to `kit.config.ts` (peer of package.json).
//   2. Replace every value below with your app's brand + Stripe IDs.
//   3. Wrap your <App /> in <KitProvider config={KIT_CONFIG}>.
//   4. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_PRODUCT_ID in Vercel env.
//
// Server-side IDs (price + product) are also referenced here for
// documentation, but the verify-purchase API route reads them from env so
// secrets never ship in the client bundle.

import type { KitConfig } from './src/kit';

export const KIT_CONFIG: KitConfig = {
  app: {
    name: 'Your App',
    shortName: 'App',
    // Used as the localStorage / sessionStorage key prefix. Pick something
    // unique per app — once buyers have unlocks stored under this prefix,
    // changing it will orphan their entitlement.
    storagePrefix: 'app_',
  },

  stripe: {
    // Client-side (safe to ship in the bundle)
    publishableKey: 'pk_live_REPLACE_ME',
    buyButtonId: 'buy_btn_REPLACE_ME',
    // Hosted Payment Link as a fallback path. success_url should redirect to
    // your app with `#session_id={CHECKOUT_SESSION_ID}` so verify-purchase
    // can confirm the unlock.
    paymentUrl: 'https://buy.stripe.com/REPLACE_ME',
    // For documentation / parity with the env vars on the server side.
    priceIdHint: 'price_REPLACE_ME',
    productIdHint: 'prod_REPLACE_ME',
  },

  upgrade: {
    headerTitle: 'Unlock the full app',
    headerSubtitle: 'One payment. Yours forever.',
    price: '$29',
    priceCaption: 'One-time purchase',
    features: [
      'Feature one',
      'Feature two',
      'Feature three',
    ],
    trustLine:
      'Secure payment via Stripe. 30-day refund, no questions asked. No account. No recurring charges.',
  },

  analytics: {
    // Funnel events are emitted as `${eventPrefix}${name}`.
    // Keep it short and unique per app so dashboards don't collide.
    eventPrefix: 'app_',
  },

  admin: {
    // Tap the logo this many times within tapWindowMs to toggle admin mode.
    logoTapsToToggle: 5,
    tapWindowMs: 3000,
  },
};
