// Shared Stripe entitlement checks for the serverless routes.
//
//   lineItemMatchesPro  — the price-id / product-id match (moved unchanged
//                         from verify-purchase.ts, which still uses it).
//   verifySession       — the Reading route's check (plan T1): paid, this
//                         product, not refunded, and bound to this key.
//
// Environment variables (set in Vercel project settings):
//   STRIPE_SECRET_KEY  — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID    — Pro tier price ID  (e.g. price_1ABC...)
//   STRIPE_PRODUCT_ID  — Pro tier product ID (e.g. prod_ABC...)
//
// Both PRICE and PRODUCT are checked because Stripe occasionally rotates
// prices under the same product (e.g. promotional pricing). Either match
// counts.

import type Stripe from 'stripe';

export function lineItemMatchesPro(
  items: Stripe.ApiList<Stripe.LineItem> | null | undefined,
  priceId: string,
  productId: string,
): boolean {
  if (!items?.data) return false;
  return items.data.some((li) => {
    const liPriceId = li.price?.id;
    const liProductId =
      typeof li.price?.product === 'string'
        ? li.price.product
        : li.price?.product?.id;
    return liPriceId === priceId || liProductId === productId;
  });
}

/** The slice of the Stripe client verifySession uses (mockable in tests). */
export interface StripeSessions {
  checkout: {
    sessions: {
      retrieve: (
        id: string,
        params?: { expand?: string[] },
      ) => Promise<Stripe.Checkout.Session>;
    };
  };
}

export type VerifyResult =
  | { ok: true; boundKey?: string }
  | { ok: false; reason: 'not verified' | 'refunded' | 'other reading'; boundKey?: string };

// A Reading key at the head of client_reference_id: "<lp>-<compoundKey>-<TYPE>",
// alone or followed by "__<utm>". Pre-Phase-2 sessions carry either no
// reference or a UTM-only one ("reddit_social_launch"); neither starts with
// a key, so both are legacy.
const KEY_PREFIX = /^(\d{1,2}-\d{1,2}-[EI][NS][FT][JP])(?:__|$)/;

/** The Reading key a session is bound to, or undefined for a legacy session. */
export function boundKeyOf(ref: string | null | undefined): string | undefined {
  if (!ref) return undefined;
  return KEY_PREFIX.exec(ref)?.[1];
}

function isMissingResource(err: unknown): boolean {
  const e = err as { type?: string; code?: string; statusCode?: number } | null;
  return (
    e?.type === 'StripeInvalidRequestError' &&
    (e.code === 'resource_missing' || e.statusCode === 404)
  );
}

/**
 * Re-verifies a Checkout Session for the Reading route.
 *
 * - unpaid, or no line item for this product        → 'not verified'
 * - the payment's latest charge is refunded          → 'refunded'
 * - bound to a different key than `opts.key`        → 'other reading' (+ boundKey)
 * - no key bound (legacy buyer)                      → ok, any key
 *
 * A session id Stripe has never heard of is 'not verified'. Any other Stripe
 * failure is thrown, for the route to answer 502.
 */
export async function verifySession(
  stripe: StripeSessions,
  sessionId: string,
  opts: { key?: string; priceId?: string; productId?: string } = {},
): Promise<VerifyResult> {
  const priceId = opts.priceId ?? process.env.STRIPE_PRICE_ID ?? '';
  const productId = opts.productId ?? process.env.STRIPE_PRODUCT_ID ?? '';

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent.latest_charge'],
    });
  } catch (err) {
    if (isMissingResource(err)) return { ok: false, reason: 'not verified' };
    throw err;
  }

  const paid = session.payment_status === 'paid';
  if (!paid || !lineItemMatchesPro(session.line_items, priceId, productId)) {
    return { ok: false, reason: 'not verified' };
  }

  const pi = session.payment_intent;
  const charge = pi && typeof pi === 'object' ? pi.latest_charge : null;
  if (charge && typeof charge === 'object' && charge.refunded === true) {
    return { ok: false, reason: 'refunded' };
  }

  const boundKey = boundKeyOf(session.client_reference_id);
  if (!boundKey) return { ok: true };
  if (opts.key !== undefined && boundKey !== opts.key) {
    return { ok: false, reason: 'other reading', boundKey };
  }
  return { ok: true, boundKey };
}
