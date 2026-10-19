// Vercel serverless function: verifies a Stripe purchase for Pro unlock.
//
// Two modes:
//   GET  /api/verify-purchase?session_id=cs_...   → post-checkout confirmation
//   POST /api/verify-purchase  { email: "..." }    → manual restore
//
// GET returns { verified: boolean }. POST returns { verified: true, sessionId }
// on a match (a restored device needs the session id for /api/reading) and
// { verified: false } otherwise. Nothing else leaks.
//
// Environment variables (set in Vercel project settings):
//   STRIPE_SECRET_KEY  — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID    — Pro tier price ID  (e.g. price_1ABC...)
//   STRIPE_PRODUCT_ID  — Pro tier product ID (e.g. prod_ABC...)
//
// Both PRICE and PRODUCT are checked because Stripe occasionally rotates
// prices under the same product (e.g. promotional pricing). Either match
// counts as verified. The match lives in ./_lib/entitlement.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { lineItemMatchesPro } from './_lib/entitlement.js';

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
      // email filtering, so we page through the most recent results. The
      // Stripe account is shared with another app, so an email match alone
      // proves nothing: every matching session is retrieved with its line
      // items until one carries this product. For launch volume this is
      // fine — revisit if Pro buyers exceed ~500.
      const MAX_PAGES = 5;
      let startingAfter: string | undefined;
      for (let page = 0; page < MAX_PAGES; page++) {
        const batch = await stripe.checkout.sessions.list({
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        });
        const hits = batch.data.filter(
          (s) =>
            s.payment_status === 'paid' &&
            s.customer_details?.email?.toLowerCase() === target,
        );
        for (const hit of hits) {
          const full = await stripe.checkout.sessions.retrieve(hit.id, {
            expand: ['line_items'],
          });
          if (lineItemMatchesPro(full.line_items, priceId, productId)) {
            return res.status(200).json({ verified: true, sessionId: hit.id });
          }
        }
        if (!batch.has_more) break;
        startingAfter = batch.data[batch.data.length - 1]?.id;
      }
      return res.status(200).json({ verified: false });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    // The failure's kind only: a Stripe error message can echo a session id.
    const e = err as { type?: string; code?: string } | null;
    console.error('verify-purchase error', e?.type ?? 'unknown', e?.code ?? '');
    return res.status(500).json({ error: 'verification failed' });
  }
}
