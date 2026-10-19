import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeReq, fakeRes } from './_lib/test-http';

const retrieve = vi.fn();
const list = vi.fn();

vi.mock('stripe', () => ({
  default: class {
    checkout = { sessions: { retrieve, list } };
  },
}));

const { default: handler } = await import('./verify-purchase');

const PRICE = 'price_reading';
const PRODUCT = 'prod_pro';
const THIS = { data: [{ price: { id: PRICE, product: PRODUCT } }] };
const OTHER_APP = { data: [{ price: { id: 'price_other', product: 'prod_other' } }] };

async function call(init: Parameters<typeof fakeReq>[0]) {
  const { res, out } = fakeRes();
  await handler(fakeReq(init), res);
  return out;
}

let errSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_x');
  vi.stubEnv('STRIPE_PRICE_ID', PRICE);
  vi.stubEnv('STRIPE_PRODUCT_ID', PRODUCT);
  retrieve.mockReset();
  list.mockReset();
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  const logged = errSpy.mock.calls.flat().map(String).join(' ');
  expect(logged).not.toContain('cs_');
  errSpy.mockRestore();
  vi.unstubAllEnvs();
});

describe('GET (regression: unchanged)', () => {
  it('verified for a paid session with this product, expanding line items only', async () => {
    retrieve.mockResolvedValue({ payment_status: 'paid', line_items: THIS });
    const out = await call({ query: { session_id: 'cs_1' } });
    expect(out.statusCode).toBe(200);
    expect(out.body).toEqual({ verified: true });
    expect(retrieve).toHaveBeenCalledWith('cs_1', { expand: ['line_items'] });
  });

  it('matches on product id alone', async () => {
    retrieve.mockResolvedValue({
      payment_status: 'paid',
      line_items: { data: [{ price: { id: 'price_old', product: { id: PRODUCT } } }] },
    });
    expect((await call({ query: { session_id: 'cs_1' } })).body).toEqual({ verified: true });
  });

  it('not verified when unpaid or another product', async () => {
    retrieve.mockResolvedValue({ payment_status: 'unpaid', line_items: THIS });
    expect((await call({ query: { session_id: 'cs_1' } })).body).toEqual({ verified: false });
    retrieve.mockResolvedValue({ payment_status: 'paid', line_items: OTHER_APP });
    expect((await call({ query: { session_id: 'cs_1' } })).body).toEqual({ verified: false });
  });

  it('400 for a missing or malformed session id', async () => {
    expect((await call({ query: {} })).statusCode).toBe(400);
    expect((await call({ query: { session_id: 'pi_1' } })).statusCode).toBe(400);
  });

  it('500 when Stripe throws, without logging the session id', async () => {
    retrieve.mockRejectedValue(
      Object.assign(new Error('No such checkout.session: cs_secret'), { type: 'StripeInvalidRequestError' }),
    );
    const out = await call({ query: { session_id: 'cs_secret' } });
    expect(out.statusCode).toBe(500);
    expect(out.body).toEqual({ error: 'verification failed' });
  });

  it('500 when not configured', async () => {
    vi.stubEnv('STRIPE_SECRET_KEY', '');
    expect((await call({ query: { session_id: 'cs_1' } })).statusCode).toBe(500);
  });
});

describe('POST (email restore)', () => {
  it("skips the same email's session for another product and finds this one", async () => {
    list.mockResolvedValueOnce({
      has_more: false,
      data: [
        { id: 'cs_other_app', payment_status: 'paid', customer_details: { email: 'Ana@Example.com' } },
        { id: 'cs_stranger', payment_status: 'paid', customer_details: { email: 'bo@example.com' } },
        { id: 'cs_this', payment_status: 'paid', customer_details: { email: 'ana@example.com' } },
      ],
    });
    retrieve.mockImplementation(async (id: string) =>
      id === 'cs_this' ? { line_items: THIS } : { line_items: OTHER_APP },
    );
    const out = await call({ method: 'POST', body: { email: ' ana@example.com ' } });
    expect(out.statusCode).toBe(200);
    expect(out.body).toEqual({ verified: true, sessionId: 'cs_this' });
    expect(retrieve.mock.calls.map((c) => c[0])).toEqual(['cs_other_app', 'cs_this']);
  });

  it('pages past the first batch', async () => {
    list
      .mockResolvedValueOnce({
        has_more: true,
        data: [{ id: 'cs_a', payment_status: 'paid', customer_details: { email: 'ana@example.com' } }],
      })
      .mockResolvedValueOnce({
        has_more: false,
        data: [{ id: 'cs_b', payment_status: 'paid', customer_details: { email: 'ana@example.com' } }],
      });
    retrieve.mockImplementation(async (id: string) =>
      id === 'cs_b' ? { line_items: THIS } : { line_items: OTHER_APP },
    );
    const out = await call({ method: 'POST', body: JSON.stringify({ email: 'ana@example.com' }) });
    expect(out.body).toEqual({ verified: true, sessionId: 'cs_b' });
    expect(list).toHaveBeenLastCalledWith({ limit: 100, starting_after: 'cs_a' });
  });

  it('ignores unpaid sessions for the email', async () => {
    list.mockResolvedValueOnce({
      has_more: false,
      data: [{ id: 'cs_open', payment_status: 'unpaid', customer_details: { email: 'ana@example.com' } }],
    });
    const out = await call({ method: 'POST', body: { email: 'ana@example.com' } });
    expect(out.body).toEqual({ verified: false });
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('verified: false when only another product matches', async () => {
    list.mockResolvedValueOnce({
      has_more: false,
      data: [{ id: 'cs_other', payment_status: 'paid', customer_details: { email: 'ana@example.com' } }],
    });
    retrieve.mockResolvedValue({ line_items: OTHER_APP });
    const out = await call({ method: 'POST', body: { email: 'ana@example.com' } });
    expect(out.body).toEqual({ verified: false });
  });

  it('stops after five pages', async () => {
    list.mockResolvedValue({ has_more: true, data: [{ id: 'cs_x', payment_status: 'paid', customer_details: null }] });
    const out = await call({ method: 'POST', body: { email: 'ana@example.com' } });
    expect(out.body).toEqual({ verified: false });
    expect(list).toHaveBeenCalledTimes(5);
  });

  it('400 for a missing email', async () => {
    expect((await call({ method: 'POST', body: {} })).statusCode).toBe(400);
    expect((await call({ method: 'POST', body: { email: 'nope' } })).statusCode).toBe(400);
  });
});

it('405 for other methods', async () => {
  expect((await call({ method: 'PUT' })).statusCode).toBe(405);
});
