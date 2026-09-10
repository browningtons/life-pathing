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
    // Same Stripe account as OFL (acct_1P0WQQFgn5goWL8k); the publishable
    // key is shared across products on the account.
    publishableKey:
      'pk_live_51P0WQQFgn5goWL8kbJNjs5r7iMsj5ZJyvQXcYAca2xeLI4Zo68jr26zKj39Fw0x4fccPTnAA0IWvZbEEA6bnWZoK00fP6ihAXu',
    // Buy Button must be created in the Stripe dashboard (not API). Until
    // then, the upgrade modal falls back to the Payment Link below.
    buyButtonId: 'buy_btn_REPLACE_ME',
    // After Vercel deploy, update this Payment Link's success URL in the
    // Stripe dashboard to redirect to https://<your-domain>/#session_id={CHECKOUT_SESSION_ID}
    // so the unlock auto-activates instead of forcing a manual restore.
    paymentUrl: 'https://buy.stripe.com/dRm9AT1ut4nB4UKfVZ3cc02',
    priceIdHint: 'price_1TQGPVFgn5goWL8koiXr7aAJ',
    productIdHint: 'prod_UP4Yk3jJmpXpAi',
  },

  // The split itself lives in src/data/tiers.ts. This is the sales copy
  // for it, and it only promises what the app ships today. Add a line
  // here the day the feature is live, not before.
  upgrade: {
    headerTitle: 'See the whole profile.',
    headerSubtitle: 'One payment. Yours on this device, for good.',
    price: '$29',
    priceCaption: 'One-time purchase',
    features: [
      'All twenty-three facets by category, each with a reading of how strongly it runs',
      'How others tend to read you — twenty-five words, ranked',
      'The four temperaments, split to a hundred',
      'The types that sit closest, and which letters separate you',
      'Where four old systems agree, and where they ask more of you',
      'The inner cast',
    ],
    trustLine:
      'Secure payment via Stripe. 30-day refund. No subscription, no account. A reader\'s tool, not psychological or life advice.',
  },

  analytics: {
    eventPrefix: 'lp_',
  },

  admin: {
    logoTapsToToggle: 5,
    tapWindowMs: 3000,
  },
};
