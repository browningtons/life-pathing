import { describe, it, expect, vi } from 'vitest';
import type Stripe from 'stripe';
import {
  boundKeyOf,
  lineItemMatchesPro,
  verifySession,
  type StripeSessions,
} from './entitlement';

const PRICE = 'price_reading';
const PRODUCT = 'prod_pro';
const OPTS = { priceId: PRICE, productId: PRODUCT };

function items(
  ...lis: Array<{ price?: string; product?: string | { id: string } }>
): Stripe.ApiList<Stripe.LineItem> {
  return {
    object: 'list',
    has_more: false,
    url: '',
    data: lis.map((li) => ({ price: { id: li.price, product: li.product } })),
  } as unknown as Stripe.ApiList<Stripe.LineItem>;
}

interface SessionShape {
  payment_status?: string;
  line_items?: Stripe.ApiList<Stripe.LineItem> | null;
  client_reference_id?: string | null;
  refunded?: boolean;
  payment_intent?: unknown;
}

function stripeWith(shape: SessionShape | Error): {
  stripe: StripeSessions;
  retrieve: ReturnType<typeof vi.fn>;
} {
  const retrieve = vi.fn(async () => {
    if (shape instanceof Error) throw shape;
    return {
      payment_status: shape.payment_status ?? 'paid',
      line_items: shape.line_items === undefined ? items({ price: PRICE }) : shape.line_items,
      client_reference_id: shape.client_reference_id ?? null,
      payment_intent:
        shape.payment_intent !== undefined
          ? shape.payment_intent
          : { id: 'pi_1', latest_charge: { id: 'ch_1', refunded: shape.refunded ?? false } },
    } as unknown as Stripe.Checkout.Session;
  });
  return { stripe: { checkout: { sessions: { retrieve } } }, retrieve };
}

describe('lineItemMatchesPro', () => {
  it('matches on price id', () => {
    expect(lineItemMatchesPro(items({ price: PRICE, product: 'prod_other' }), PRICE, PRODUCT)).toBe(true);
  });
  it('matches on product id (string or expanded)', () => {
    expect(lineItemMatchesPro(items({ price: 'price_x', product: PRODUCT }), PRICE, PRODUCT)).toBe(true);
    expect(lineItemMatchesPro(items({ price: 'price_x', product: { id: PRODUCT } }), PRICE, PRODUCT)).toBe(true);
  });
  it('rejects neither', () => {
    expect(lineItemMatchesPro(items({ price: 'price_x', product: 'prod_x' }), PRICE, PRODUCT)).toBe(false);
  });
  it('rejects missing line items', () => {
    expect(lineItemMatchesPro(null, PRICE, PRODUCT)).toBe(false);
    expect(lineItemMatchesPro(undefined, PRICE, PRODUCT)).toBe(false);
  });
});

describe('boundKeyOf', () => {
  it('reads the key alone or before __utm', () => {
    expect(boundKeyOf('7-16-INFJ')).toBe('7-16-INFJ');
    expect(boundKeyOf('7-16-INFJ__reddit_social_launch')).toBe('7-16-INFJ');
    expect(boundKeyOf('1-0-ESTP__')).toBe('1-0-ESTP');
  });
  it('treats absent and UTM-only references as legacy', () => {
    expect(boundKeyOf(null)).toBeUndefined();
    expect(boundKeyOf(undefined)).toBeUndefined();
    expect(boundKeyOf('')).toBeUndefined();
    expect(boundKeyOf('reddit_social_launch')).toBeUndefined();
  });
  it('does not take a key that runs on without the separator', () => {
    expect(boundKeyOf('7-16-INFJX')).toBeUndefined();
    expect(boundKeyOf('7-16-INFJ_utm')).toBeUndefined();
  });
});

describe('verifySession', () => {
  it('expands line items and the latest charge', async () => {
    const { stripe, retrieve } = stripeWith({});
    await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS });
    expect(retrieve).toHaveBeenCalledWith('cs_1', {
      expand: ['line_items', 'payment_intent.latest_charge'],
    });
  });

  it('ok for a paid, matching session bound to this key', async () => {
    const { stripe } = stripeWith({ client_reference_id: '7-16-INFJ__reddit_social_x' });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({
      ok: true,
      boundKey: '7-16-INFJ',
    });
  });

  it('ok when the reference equals the key exactly', async () => {
    const { stripe } = stripeWith({ client_reference_id: '1-0-ESTP' });
    expect(await verifySession(stripe, 'cs_1', { key: '1-0-ESTP', ...OPTS })).toEqual({
      ok: true,
      boundKey: '1-0-ESTP',
    });
  });

  it('matches on product id when the price rotated', async () => {
    const { stripe } = stripeWith({ line_items: items({ price: 'price_old', product: PRODUCT }) });
    expect((await verifySession(stripe, 'cs_1', { key: '1-0-ESTP', ...OPTS })).ok).toBe(true);
  });

  it('legacy (no reference) may read any key', async () => {
    const { stripe } = stripeWith({ client_reference_id: null });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({ ok: true });
    expect(await verifySession(stripe, 'cs_1', { key: '1-0-ESTP', ...OPTS })).toEqual({ ok: true });
  });

  it('legacy UTM-only reference may read any key', async () => {
    const { stripe } = stripeWith({ client_reference_id: 'reddit_social_launch' });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({ ok: true });
  });

  it('not verified when unpaid', async () => {
    const { stripe } = stripeWith({ payment_status: 'unpaid' });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({
      ok: false,
      reason: 'not verified',
    });
  });

  it('not verified when neither price nor product matches (another app)', async () => {
    const { stripe } = stripeWith({ line_items: items({ price: 'price_x', product: 'prod_x' }) });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({
      ok: false,
      reason: 'not verified',
    });
  });

  it('not verified when line items are missing', async () => {
    const { stripe } = stripeWith({ line_items: null });
    expect((await verifySession(stripe, 'cs_1', OPTS)).ok).toBe(false);
  });

  it('refunded when the latest charge is refunded', async () => {
    const { stripe } = stripeWith({ client_reference_id: '7-16-INFJ', refunded: true });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({
      ok: false,
      reason: 'refunded',
    });
  });

  it('refund outranks a key mismatch', async () => {
    const { stripe } = stripeWith({ client_reference_id: '1-0-ESTP', refunded: true });
    expect((await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })) ).toEqual({
      ok: false,
      reason: 'refunded',
    });
  });

  it('ok when the payment intent was not expanded (no charge object)', async () => {
    const { stripe } = stripeWith({ payment_intent: 'pi_1' });
    expect((await verifySession(stripe, 'cs_1', OPTS)).ok).toBe(true);
    const { stripe: s2 } = stripeWith({ payment_intent: null });
    expect((await verifySession(s2, 'cs_1', OPTS)).ok).toBe(true);
  });

  it('other reading, naming the bound key, when bound elsewhere', async () => {
    const { stripe } = stripeWith({ client_reference_id: '1-0-ESTP__google_cpc_x' });
    expect(await verifySession(stripe, 'cs_1', { key: '7-16-INFJ', ...OPTS })).toEqual({
      ok: false,
      reason: 'other reading',
      boundKey: '1-0-ESTP',
    });
  });

  it('a key that merely shares a prefix is another reading', async () => {
    const { stripe } = stripeWith({ client_reference_id: '1-0-ESTP' });
    const r = await verifySession(stripe, 'cs_1', { key: '1-0-EST', ...OPTS });
    expect(r).toEqual({ ok: false, reason: 'other reading', boundKey: '1-0-ESTP' });
  });

  it('no key asked: ok and reports the bound key', async () => {
    const { stripe } = stripeWith({ client_reference_id: '1-0-ESTP' });
    expect(await verifySession(stripe, 'cs_1', OPTS)).toEqual({ ok: true, boundKey: '1-0-ESTP' });
  });

  it('a session Stripe does not know is not verified', async () => {
    const err = Object.assign(new Error('No such checkout.session: cs_nope'), {
      type: 'StripeInvalidRequestError',
      code: 'resource_missing',
      statusCode: 404,
    });
    const { stripe } = stripeWith(err);
    expect(await verifySession(stripe, 'cs_nope', OPTS)).toEqual({ ok: false, reason: 'not verified' });
  });

  it('rethrows any other Stripe failure', async () => {
    const err = Object.assign(new Error('boom'), { type: 'StripeAPIError', statusCode: 500 });
    const { stripe } = stripeWith(err);
    await expect(verifySession(stripe, 'cs_1', OPTS)).rejects.toThrow('boom');
  });

  it('reads price and product from env when not passed', async () => {
    vi.stubEnv('STRIPE_PRICE_ID', PRICE);
    vi.stubEnv('STRIPE_PRODUCT_ID', PRODUCT);
    try {
      const { stripe } = stripeWith({});
      expect((await verifySession(stripe, 'cs_1', {})).ok).toBe(true);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
