import { describe, expect, it } from 'vitest';
import { parseActivation } from './activation';

describe('parseActivation', () => {
  it('reads a Stripe session id from the hash', () => {
    expect(parseActivation('#session_id=cs_test_123', '')).toEqual({ sessionId: 'cs_test_123', admin: false });
  });

  it('reads a Stripe session id from the query string', () => {
    expect(parseActivation('', '?session_id=cs_live_abc')).toEqual({ sessionId: 'cs_live_abc', admin: false });
  });

  it('ignores a session id that is not a checkout session', () => {
    expect(parseActivation('#session_id=pi_123', '').sessionId).toBeNull();
    expect(parseActivation('#session_id=', '').sessionId).toBeNull();
  });

  it('reads the admin token', () => {
    expect(parseActivation('#admin', '').admin).toBe(true);
    expect(parseActivation('#session_id=cs_1&admin', '')).toEqual({ sessionId: 'cs_1', admin: true });
  });

  it('never grants anything for pro=1 or other tokens', () => {
    const a = parseActivation('#pro=1', '?pro=1&unlocked=true');
    expect(a).toEqual({ sessionId: null, admin: false });
    expect(Object.keys(a)).toEqual(['sessionId', 'admin']);
  });

  it('returns nothing on a bare URL', () => {
    expect(parseActivation('', '')).toEqual({ sessionId: null, admin: false });
  });
});
