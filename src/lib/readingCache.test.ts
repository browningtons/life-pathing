import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { READING_VERSION, cacheKey, isReading, readCachedReading, writeCachedReading, type Reading } from './readingCache';

const reading = (over: Partial<Reading> = {}): Reading => ({
  key: '7-16-XXXX',
  version: READING_VERSION,
  teaser: 'Opening.',
  number: 'Number.',
  type: 'Type.',
  agree: 'Agree.',
  pull: 'Pull.',
  closing: 'Closing.',
  ...over,
});

function stubLocalStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  return store;
}

describe('readingCache', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = stubLocalStorage();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keys entries by version|key under the app prefix', () => {
    expect(cacheKey('7-16-XXXX', 1)).toBe('lp_reading:1|7-16-XXXX');
  });

  it('misses when nothing is stored', () => {
    expect(readCachedReading('7-16-XXXX')).toBeNull();
  });

  it('round-trips a reading', () => {
    writeCachedReading(reading());
    expect(readCachedReading('7-16-XXXX')).toEqual(reading());
  });

  it('keeps different keys apart', () => {
    writeCachedReading(reading());
    expect(readCachedReading('1-0-XXXX')).toBeNull();
  });

  it('misses after a prompt-version bump', () => {
    writeCachedReading(reading({ version: READING_VERSION }));
    expect(readCachedReading('7-16-XXXX', READING_VERSION + 1)).toBeNull();
  });

  it('stores a reading of another version under that version only', () => {
    writeCachedReading(reading({ version: READING_VERSION + 1 }));
    expect(readCachedReading('7-16-XXXX')).toBeNull();
    expect(readCachedReading('7-16-XXXX', READING_VERSION + 1)).not.toBeNull();
  });

  it('ignores corrupt or partial entries', () => {
    store.set(cacheKey('7-16-XXXX'), '{not json');
    expect(readCachedReading('7-16-XXXX')).toBeNull();
    store.set(cacheKey('7-16-XXXX'), JSON.stringify({ ...reading(), pull: '' }));
    expect(readCachedReading('7-16-XXXX')).toBeNull();
  });

  it('ignores an entry whose key does not match its slot', () => {
    store.set(cacheKey('7-16-XXXX'), JSON.stringify(reading({ key: '1-0-XXXX' })));
    expect(readCachedReading('7-16-XXXX')).toBeNull();
  });

  it('refuses to write something that is not a reading', () => {
    writeCachedReading({ ...reading(), closing: 3 } as unknown as Reading);
    expect(store.size).toBe(0);
  });

  it('never throws when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => writeCachedReading(reading())).not.toThrow();
    expect(readCachedReading('7-16-XXXX')).toBeNull();
  });

  it('checks the shape', () => {
    expect(isReading(reading())).toBe(true);
    expect(isReading(null)).toBe(false);
    expect(isReading({ key: 'k' })).toBe(false);
  });
});
