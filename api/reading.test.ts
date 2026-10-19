import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';
import fixture from './_readings/__fixtures__/route-set.json' with { type: 'json' };
import defaultHandler, { createReadingHandler, safeEqual, type ReadingSet } from './reading';
import type { StripeSessions } from './_lib/entitlement';
import { fakeReq, fakeRes } from './_lib/test-http';

const READINGS = fixture as unknown as ReadingSet;
const SESSION = 'cs_test_secret_session_123';
const ENV = {
  STRIPE_SECRET_KEY: 'sk_test_x',
  STRIPE_PRICE_ID: 'price_reading',
  STRIPE_PRODUCT_ID: 'prod_pro',
  READING_ADMIN_TOKEN: 'admin-token-long-random',
};

function session(over: Partial<Record<string, unknown>> = {}): Stripe.Checkout.Session {
  return {
    payment_status: 'paid',
    line_items: { data: [{ price: { id: 'price_reading', product: 'prod_pro' } }] },
    client_reference_id: '7-16-INFJ__reddit_social_x',
    payment_intent: { latest_charge: { refunded: false } },
    ...over,
  } as unknown as Stripe.Checkout.Session;
}

let retrieve: ReturnType<typeof vi.fn>;
let makeStripe: ReturnType<typeof vi.fn>;
let errSpy: ReturnType<typeof vi.spyOn>;
let logSpy: ReturnType<typeof vi.spyOn>;

function handler(env: NodeJS.ProcessEnv = ENV) {
  return createReadingHandler({
    readings: READINGS,
    makeStripe: makeStripe as unknown as (s: string) => StripeSessions,
    env,
  });
}

async function call(
  init: Parameters<typeof fakeReq>[0],
  env?: NodeJS.ProcessEnv,
) {
  const { res, out } = fakeRes();
  await handler(env)(fakeReq(init), res);
  return out;
}

beforeEach(() => {
  retrieve = vi.fn(async () => session());
  makeStripe = vi.fn(() => ({ checkout: { sessions: { retrieve } } }));
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  // No session id in any log line, whatever the test did.
  const logged = [...errSpy.mock.calls, ...logSpy.mock.calls].flat().map(String).join(' ');
  expect(logged).not.toContain('cs_');
  errSpy.mockRestore();
  logSpy.mockRestore();
});

describe('GET /api/reading', () => {
  it('200 with the full reading for a verified session bound to the key', async () => {
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(200);
    expect(out.body).toEqual({ key: '7-16-INFJ', version: 1, reading: READINGS['7-16-INFJ'] });
    expect(retrieve).toHaveBeenCalledWith(SESSION, {
      expand: ['line_items', 'payment_intent.latest_charge'],
    });
    expect(out.headers['cache-control']).toBe('private, no-store');
  });

  it('200 for a legacy session (no reference) on any key', async () => {
    retrieve.mockResolvedValue(session({ client_reference_id: null }));
    const out = await call({ query: { key: '1-0-ESTP' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(200);
    expect((out.body as { key: string }).key).toBe('1-0-ESTP');
  });

  it('200 with the admin token, without touching Stripe', async () => {
    const out = await call({
      query: { key: '1-0-ESTP' },
      headers: { 'x-reading-admin': ENV.READING_ADMIN_TOKEN },
    });
    expect(out.statusCode).toBe(200);
    expect(makeStripe).not.toHaveBeenCalled();
  });

  it('admin works even when the Stripe env is missing', async () => {
    const out = await call(
      { query: { key: '1-0-ESTP' }, headers: { 'x-reading-admin': ENV.READING_ADMIN_TOKEN } },
      { READING_ADMIN_TOKEN: ENV.READING_ADMIN_TOKEN },
    );
    expect(out.statusCode).toBe(200);
  });

  it('402 not verified for a wrong admin token', async () => {
    const out = await call({ query: { key: '1-0-ESTP' }, headers: { 'x-reading-admin': 'nope' } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'not verified' });
  });

  it('402 when the admin door is unset, whatever the header says', async () => {
    const out = await call(
      { query: { key: '1-0-ESTP' }, headers: { 'x-reading-admin': '' } },
      { ...ENV, READING_ADMIN_TOKEN: '' },
    );
    expect(out.statusCode).toBe(402);
    const out2 = await call(
      { query: { key: '1-0-ESTP' }, headers: { 'x-reading-admin': 'undefined' } },
      { ...ENV, READING_ADMIN_TOKEN: undefined },
    );
    expect(out2.statusCode).toBe(402);
  });

  it('402 not verified with no header at all', async () => {
    const out = await call({ query: { key: '7-16-INFJ' } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'not verified' });
    expect(makeStripe).not.toHaveBeenCalled();
  });

  it('402 not verified for a session id that is not cs_', async () => {
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': 'pi_123' } });
    expect(out.statusCode).toBe(402);
    expect(makeStripe).not.toHaveBeenCalled();
  });

  it('ignores a session id in the query string', async () => {
    const out = await call({ query: { key: '7-16-INFJ', session_id: SESSION } });
    expect(out.statusCode).toBe(402);
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('402 not verified for an unpaid session', async () => {
    retrieve.mockResolvedValue(session({ payment_status: 'unpaid' }));
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'not verified' });
  });

  it('402 not verified for a session Stripe does not know', async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error(`No such checkout.session: ${SESSION}`), {
        type: 'StripeInvalidRequestError',
        code: 'resource_missing',
      }),
    );
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'not verified' });
  });

  it('402 refunded', async () => {
    retrieve.mockResolvedValue(session({ payment_intent: { latest_charge: { refunded: true } } }));
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'refunded' });
  });

  it('402 other reading, naming the bound key', async () => {
    const out = await call({ query: { key: '1-0-ESTP' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(402);
    expect(out.body).toEqual({ error: 'other reading', boundKey: '7-16-INFJ' });
  });

  it('404 for a key with no reading', async () => {
    const out = await call({ query: { key: '9-0-INTP' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(404);
    expect(out.body).toEqual({ error: 'no reading for this key' });
    expect(makeStripe).not.toHaveBeenCalled();
  });

  it('404 for a missing key or a prototype name', async () => {
    expect((await call({ headers: { 'x-reading-session': SESSION } })).statusCode).toBe(404);
    expect((await call({ query: { key: '__proto__' } })).statusCode).toBe(404);
    expect((await call({ query: { key: 'toString' } })).statusCode).toBe(404);
  });

  it('405 for anything but GET', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const out = await call({ method, query: { key: '7-16-INFJ' } });
      expect(out.statusCode).toBe(405);
      expect(out.headers.allow).toBe('GET');
    }
  });

  it('502 verification failed when Stripe throws, with no session id logged', async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error(`Connection failed for ${SESSION}`), { type: 'StripeConnectionError' }),
    );
    const out = await call({ query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } });
    expect(out.statusCode).toBe(502);
    expect(out.body).toEqual({ error: 'verification failed' });
    expect(errSpy).toHaveBeenCalled();
  });

  it('502 when the Stripe env is missing', async () => {
    const out = await call(
      { query: { key: '7-16-INFJ' }, headers: { 'x-reading-session': SESSION } },
      { READING_ADMIN_TOKEN: 'x' },
    );
    expect(out.statusCode).toBe(502);
    expect(out.body).toEqual({ error: 'verification failed' });
  });

  it('the deployed handler is wired to the imported set', async () => {
    const { res, out } = fakeRes();
    await defaultHandler(fakeReq({ query: { key: 'not-a-key' } }), res);
    expect(out.statusCode).toBe(404);
  });
});

describe('safeEqual', () => {
  it('compares exactly, across lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
    expect(safeEqual('', 'a')).toBe(false);
  });
});
