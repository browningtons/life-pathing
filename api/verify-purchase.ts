// Vercel serverless function: verifies a Stripe purchase for Pro unlock.
//
// Two modes:
//   GET  /api/verify-purchase?session_id=cs_...   → post-checkout confirmation
//   POST /api/verify-purchase  { email: "..." }    → manual restore
//
// Returns { verified: boolean } in both cases. We intentionally do not leak
// anything else — the frontend only needs yes/no.
//
// Environment variables (set in Vercel project settings):
//   STRIPE_SECRET_KEY  — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID    — Pro tier price ID  (e.g. price_1ABC...)
//   STRIPE_PRODUCT_ID  — Pro tier product ID (e.g. prod_ABC...)
//
// Both PRICE and PRODUCT are checked because Stripe occasionally rotates
// prices under the same product (e.g. promotional pricing). Either match
// counts as verified.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function lineItemMatchesPro(
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const productId = process.env.STRIPE_PRODUCT_ID;

  if (!secret || !priceId || !productId) {
    return res.status(500).json({ error: 'server not configured' });
  }

  const stripe = new Stripe(secret);

  try {
    if (req.method === 'GET') {
      const sessionId = req.query.session_id;
      if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
        return res.status(400).json({ error: 'missing session_id' });
      }
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items'],
      });
      const paid = session.payment_status === 'paid';
      const matches = lineItemMatchesPro(session.line_items, priceId, productId);
      return res.status(200).json({ verified: paid && matches });
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {};
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'missing email' });
      }
      const target = email.toLowerCase();

      // Scan recent paid Checkout Sessions. `sessions.list` doesn't support
      // email filtering, so we page through the most recent results. For
      // launch volume this is fine — revisit if Pro buyers exceed ~500.
      const MAX_PAGES = 5;
      let startingAfter: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await stripe.checkout.sessions.list({
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        const hit = batch.data.find(
          (s) =>
            s.payment_status === 'paid' &&
            s.customer_details?.email?.toLowerCase() === target,
        );
        if (hit) {
          const full = await stripe.checkout.sessions.retrieve(hit.id, {
            expand: ['line_items'],
          });
          return res
            .status(200)
            .json({ verified: lineItemMatchesPro(full.line_items, priceId, productId) });
        }
        if (!batch.has_more) break;
        startingAfter = batch.data[batch.data.length - 1]?.id;
      }
      return res.status(200).json({ verified: false });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error('verify-purchase error', err);
    return res.status(500).json({ error: 'verification failed' });
  }
}
