import { describe, expect, it, vi } from 'vitest';
import { RESTORE_MESSAGES, isPlausibleEmail, restorePurchase } from './restore';

function fetchReturning(status: number, body: unknown) {
  return vi.fn(async () => ({ ok: status >= 200 && status < 300, status, json: async () => body })) as unknown as typeof fetch;
}

describe('restorePurchase', () => {
  it('posts the trimmed email and returns the session id on a match', async () => {
    const f = fetchReturning(200, { verified: true, sessionId: 'cs_test_1' });
    expect(await restorePurchase('  ana@example.com ', f)).toEqual({ ok: true, sessionId: 'cs_test_1' });
    expect(f).toHaveBeenCalledWith('/api/verify-purchase', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ana@example.com' }),
    });
  });

  it('verified without a usable session id still unlocks', async () => {
    expect(await restorePurchase('a@b.co', fetchReturning(200, { verified: true }))).toEqual({ ok: true });
    expect(await restorePurchase('a@b.co', fetchReturning(200, { verified: true, sessionId: 'pi_x' }))).toEqual({
      ok: true,
    });
  });

  it('not found shows the receipt message', async () => {
    expect(await restorePurchase('a@b.co', fetchReturning(200, { verified: false }))).toEqual({
      ok: false,
      message: RESTORE_MESSAGES.notFound,
    });
  });

  it('a server error or network failure shows try again', async () => {
    expect(await restorePurchase('a@b.co', fetchReturning(500, { error: 'x' }))).toEqual({
      ok: false,
      message: RESTORE_MESSAGES.failed,
    });
    const boom = vi.fn(async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await restorePurchase('a@b.co', boom)).toEqual({ ok: false, message: RESTORE_MESSAGES.failed });
  });

  it('an implausible email never calls the server', async () => {
    const f = fetchReturning(200, { verified: true });
    for (const e of ['', '   ', 'nope', '@', 'a@', 'a b@c.d']) {
      expect(await restorePurchase(e, f)).toEqual({ ok: false, message: RESTORE_MESSAGES.invalid });
    }
    expect(f).not.toHaveBeenCalled();
  });
});

describe('isPlausibleEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isPlausibleEmail('ana@example.com')).toBe(true);
    expect(isPlausibleEmail('a+b@x.io')).toBe(true);
  });
});
