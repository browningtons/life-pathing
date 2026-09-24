import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../kit', () => ({ trackEvent: vi.fn() }));

import { trackEvent } from '../kit';
import { trackLettersEntered, trackLifePathShown, trackOncePerSession } from './funnel';

function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
}

describe('funnel events', () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    stubSessionStorage();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('fires a once-per-session event only once', () => {
    trackLifePathShown(7);
    trackLifePathShown(3);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('lifepath_shown', { number: 7 });
  });

  it('keeps separate once-keys per event', () => {
    trackOncePerSession('a');
    trackOncePerSession('b');
    expect(trackEvent).toHaveBeenCalledTimes(2);
  });

  it('still fires when session storage throws', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    trackOncePerSession('c');
    expect(trackEvent).toHaveBeenCalledWith('c', undefined);
  });

  it('fires letters_entered every time, tagged with the method', () => {
    trackLettersEntered('quiz');
    trackLettersEntered('typed');
    expect(trackEvent).toHaveBeenNthCalledWith(1, 'letters_entered', { method: 'quiz' });
    expect(trackEvent).toHaveBeenNthCalledWith(2, 'letters_entered', { method: 'typed' });
  });
});
