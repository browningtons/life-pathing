// Per-app config for Life Pathing. The kit reads from this object — the
// kit itself never hardcodes a string. See kit.config.example.ts for the
// documented contract.
//
// Stripe IDs below are placeholders. They get filled in during phase 4c
// (paywall wiring) when the real product/price/buy-button are created in
// the Stripe dashboard. Server-side IDs (price/product) come from Vercel
// env vars (STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_PRODUCT_ID).

import type { KitConfig } from './src/kit';
import { READING_ENABLED } from './src/lib/readingFlag';

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
    // The $19 Payment Link (2026-10-22). Its success URL redirects to
    // https://life-pathing.vercel.app/#session_id={CHECKOUT_SESSION_ID} so the
    // unlock lands without a manual restore. The $29 price and link are
    // archived. Server-side, STRIPE_PRICE_ID and STRIPE_PRODUCT_ID in Vercel
    // must name the same price and product.
    paymentUrl: 'https://buy.stripe.com/eVq3cv1utcU72MC6lp3cc06',
    priceIdHint: 'price_PENDING_FROM_DASHBOARD',
    productIdHint: 'prod_VUXnrnuSvEozxE',
  },

  // The split itself lives in src/data/tiers.ts. This is the sales copy
  // for it, and it only promises what the app ships today. Add a line
  // here the day the feature is live, not before.
  // The modal sells the Reading once VITE_READING_ENABLED is on; until then
  // it sells the Profile at the same price (the $19 link is already live).
  upgrade: READING_ENABLED
    ? {
        headerTitle: 'Read the whole thing.',
        headerSubtitle: 'One payment. Your Reading and the whole Profile, kept on this device.',
        price: '$19',
        priceCaption: 'One-time purchase',
        features: [
          'The Reading: one document written for your Life Path number and your four letters',
          'The Number, The Type, In love, Where they agree, Where they pull, and a closing line',
          'The four temperaments, the types that sit closest, and the inner cast on the Profile',
          'Printable, and saved to this browser',
        ],
        conditionalFeatures: {
          heading: 'With a pasted TypeFinder or 16personalities report',
          features: [
            'All twenty-three facets by category, each with a reading of how strongly it runs',
            'How others tend to read you — twenty-five words, ranked',
          ],
        },
        trustLine:
          'Secure payment via Stripe. 30-day refund, no questions. No subscription, no account. One Reading per purchase, for the number and letters you bought it with. A reader\'s tool, not psychological or life advice.',
      }
    : {
        headerTitle: 'See the whole profile.',
        headerSubtitle: 'One payment. Yours on this device, for good.',
        price: '$19',
        priceCaption: 'One-time purchase',
        //
        // `features` is what a birthdate and four letters open. The facet
        // sections read the twenty-three facet scores, which only a pasted
        // report supplies, so they sit under their own line: a reader with
        // letters only learns that before paying, not after.
        features: [
          'The four temperaments, split to a hundred',
          'The types that sit closest, and which letters separate you',
          'Where the letters and the Life Path agree, and where they ask more of you',
          'The inner cast',
        ],
        conditionalFeatures: {
          heading: 'Needs a pasted TypeFinder or 16personalities report',
          features: [
            'All twenty-three facets by category, each with a reading of how strongly it runs',
            'How others tend to read you — twenty-five words, ranked',
          ],
        },
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
