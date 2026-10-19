import { afterEach, describe, expect, it, vi } from 'vitest';
import { KIT_CONFIG } from '../../kit.config';
import { setKitConfig } from './config';
import {
  CLIENT_REFERENCE_MAX,
  clientReferenceId,
  stripeUrlWithRef,
  stripeUrlWithUtm,
} from './analytics';

const BASE = 'https://buy.stripe.com/test_abc';
const UTM = { utm_source: 'reddit', utm_medium: 'social', utm_campaign: 'launch' };

function ref(url: string): string | null {
  return new URL(url).searchParams.get('client_reference_id');
}

describe('stripeUrlWithRef', () => {
  it('binds the key and carries the UTMs: <key>__<source>_<medium>_<campaign>', () => {
    expect(ref(stripeUrlWithRef(BASE, { key: '7-16-INFJ', utm: UTM }))).toBe(
      '7-16-INFJ__reddit_social_launch',
    );
  });

  it('key with no UTMs is the key alone', () => {
    expect(ref(stripeUrlWithRef(BASE, { key: '1-0-ESTP', utm: {} }))).toBe('1-0-ESTP');
    expect(ref(stripeUrlWithRef(BASE, { key: '1-0-ESTP' }))).toBe('1-0-ESTP');
  });

  it('no key is the legacy UTM-only form, with no __', () => {
    const r = ref(stripeUrlWithRef(BASE, { utm: UTM }));
    expect(r).toBe('reddit_social_launch');
    expect(r).not.toContain('__');
  });

  it('nothing to send leaves the URL untouched', () => {
    expect(stripeUrlWithRef(BASE, { utm: {} })).toBe(BASE);
    expect(stripeUrlWithRef(BASE)).toBe(BASE);
    expect(stripeUrlWithRef(BASE, { key: '', utm: { utm_source: '!!!' } })).toBe(BASE);
  });

  it('skips missing UTM parts', () => {
    expect(ref(stripeUrlWithRef(BASE, { key: '7-16-INFJ', utm: { utm_source: 'x', utm_campaign: 'y' } }))).toBe(
      '7-16-INFJ__x_y',
    );
  });

  it('keeps only [A-Za-z0-9_-]', () => {
    const r = clientReferenceId({
      key: '7-16-INFJ',
      utm: { utm_source: 'news letter', utm_medium: 'e/mail', utm_campaign: 'fall+2026 ünï&x=1' },
    });
    expect(r).toBe('7-16-INFJ__newsletter_email_fall2026nx1');
    expect(r).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('keeps the existing query and encodes nothing unexpected', () => {
    const url = stripeUrlWithRef(`${BASE}?prefilled_promo_code=X`, { key: '7-16-INFJ', utm: UTM });
    const u = new URL(url);
    expect(u.searchParams.get('prefilled_promo_code')).toBe('X');
    expect(u.search).toContain('client_reference_id=7-16-INFJ__reddit_social_launch');
  });

  it('caps at 200 characters and never cuts the key', () => {
    const long = 'a'.repeat(300);
    const r = clientReferenceId({ key: '7-16-INFJ', utm: { utm_source: long } });
    expect(r.length).toBe(CLIENT_REFERENCE_MAX);
    expect(r.startsWith('7-16-INFJ__')).toBe(true);
    const legacy = clientReferenceId({ utm: { utm_source: long } });
    expect(legacy.length).toBe(CLIENT_REFERENCE_MAX);
  });

  it('ignores extra UTM fields (term, content)', () => {
    expect(clientReferenceId({ key: 'k', utm: { utm_term: 't', utm_content: 'c' } })).toBe('k');
  });
});

describe('stripeUrlWithUtm (compatibility wrapper)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the captured UTMs and produces the legacy form', () => {
    setKitConfig(KIT_CONFIG);
    const store = new Map<string, string>([
      [`${KIT_CONFIG.app.storagePrefix}utm`, JSON.stringify(UTM)],
    ]);
    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null });
    expect(ref(stripeUrlWithUtm(BASE))).toBe('reddit_social_launch');
  });

  it('no UTMs leaves the URL untouched', () => {
    setKitConfig(KIT_CONFIG);
    vi.stubGlobal('window', {});
    vi.stubGlobal('sessionStorage', { getItem: () => null });
    expect(stripeUrlWithUtm(BASE)).toBe(BASE);
  });
});
