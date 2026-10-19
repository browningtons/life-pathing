// Vercel serverless function: serves the paid text of one Reading.
//
//   GET /api/reading?key=<lifePath>-<compoundKey>-<TYPE>
//     header x-reading-session: cs_...                 (a buyer's Checkout Session)
//     or     x-reading-admin: <READING_ADMIN_TOKEN>    (Paul, before launch)
//
//   200 { key, version, reading }
//   402 { error: 'not verified' | 'refunded' | 'other reading', boundKey? }
//   404 { error: 'no reading for this key' }
//   405 { error: 'method not allowed' }
//   502 { error: 'verification failed' }      (Stripe threw, or env missing)
//
// The session is re-verified with Stripe on every fetch (plan D2, T1): paid,
// this product, not refunded, and bound to this key through
// client_reference_id. The session id travels in a header, never the query
// string, and is never logged. The full set is imported at build time; the
// function reads nothing from disk and stores nothing.
//
// Environment variables (Vercel project settings):
//   STRIPE_SECRET_KEY    — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_PRICE_ID      — the Reading's price ID
//   STRIPE_PRODUCT_ID    — the Pro product ID (either id matching counts)
//   READING_ADMIN_TOKEN  — a long random string; unset disables the admin door

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import Stripe from 'stripe';
import { verifySession, type StripeSessions } from './_lib/entitlement.js';
import readingsJson from './_readings/index.json' with { type: 'json' };

export interface Reading {
  key: string;
  version: number;
  teaser: string;
  number: string;
  type: string;
  agree: string;
  pull: string;
  closing: string;
}

export type ReadingSet = Record<string, Reading>;

export interface ReadingDeps {
  readings: ReadingSet;
  /** Builds the Stripe client; called only when a session must be verified. */
  makeStripe: (secret: string) => StripeSessions;
  env: NodeJS.ProcessEnv;
}

function header(req: VercelRequest, name: string): string | undefined {
  const v = req.headers[name];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === 'string' && s.trim() ? s.trim() : undefined;
}

/** Constant-time string compare (hashing first equalises the lengths). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function createReadingHandler(deps: ReadingDeps) {
  return async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Cache-Control', 'private, no-store');

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'method not allowed' });
    }

    const key = typeof req.query.key === 'string' ? req.query.key : '';
    const reading = Object.prototype.hasOwnProperty.call(deps.readings, key)
      ? deps.readings[key]
      : undefined;
    if (!reading) {
      return res.status(404).json({ error: 'no reading for this key' });
    }
    const ok = () =>
      res.status(200).json({ key, version: reading.version, reading });

    const adminToken = deps.env.READING_ADMIN_TOKEN;
    const admin = header(req, 'x-reading-admin');
    if (admin && adminToken && safeEqual(admin, adminToken)) return ok();

    const sessionId = header(req, 'x-reading-session');
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(402).json({ error: 'not verified' });
    }

    const secret = deps.env.STRIPE_SECRET_KEY;
    const priceId = deps.env.STRIPE_PRICE_ID;
    const productId = deps.env.STRIPE_PRODUCT_ID;
    if (!secret || !priceId || !productId) {
      console.error('reading: server not configured');
      return res.status(502).json({ error: 'verification failed' });
    }

    try {
      const result = await verifySession(deps.makeStripe(secret), sessionId, {
        key,
        priceId,
        productId,
      });
      if (result.ok) return ok();
      return res.status(402).json(
        result.boundKey
          ? { error: result.reason, boundKey: result.boundKey }
          : { error: result.reason },
      );
    } catch (err) {
      // The failure's kind only: a Stripe error message can echo the session id.
      const e = err as { type?: string; code?: string } | null;
      console.error('reading: stripe error', e?.type ?? 'unknown', e?.code ?? '');
      return res.status(502).json({ error: 'verification failed' });
    }
  };
}

export default createReadingHandler({
  readings: readingsJson as unknown as ReadingSet,
  makeStripe: (secret) => new Stripe(secret),
  env: process.env,
});
