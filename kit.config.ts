// Per-app config for Life Pathing. The kit reads from this object — the
// kit itself never hardcodes a string. See kit.config.example.ts for the
// documented contract.
//
// Stripe IDs below are placeholders. They get filled in during phase 4c
// (paywall wiring) when the real product/price/buy-button are created in
// the Stripe dashboard. Server-side IDs (price/product) come from Vercel
// env vars (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_PRODUCT_ID).

import type { KitConfig } from './src/kit';

export const KIT_CONFIG: KitConfig = {
  app: {
    name: 'Life Pathing',
    shortName: 'LP',
    storagePrefix: 'lp_',
  },

  stripe: {
    publishableKey: 'pk_live_REPLACE_ME',
    buyButtonId: 'buy_btn_REPLACE_ME',
    paymentUrl: 'https://buy.stripe.com/REPLACE_ME',
    priceIdHint: 'price_REPLACE_ME',
    productIdHint: 'prod_REPLACE_ME',
  },

  upgrade: {
    headerTitle: 'See the whole map.',
    headerSubtitle: 'One payment. Yours forever.',
    price: '$29',
    priceCaption: 'One-time purchase',
    features: [
      'Full Life Path interpretation — patterns, breakdown modes, kindred spirits',
      'Full Archetype detail — strengths, shadows, growth tips',
      'Personality dashboard — 23 facets, descriptors, temperament',
      'Convergence analysis — where your numerology and type point the same direction',
      'Personal Compass PDF you can keep, print, or share',
    ],
    trustLine:
      'Secure payment via Stripe. 30-day refund. No subscription. This is a journaling tool, not psychological or life advice.',
  },

  analytics: {
    eventPrefix: 'lp_',
  },

  admin: {
    logoTapsToToggle: 5,
    tapWindowMs: 3000,
  },
};
