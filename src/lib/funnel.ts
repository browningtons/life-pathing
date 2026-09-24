// The Phase 1 funnel events. App-specific, so they live here rather than in
// the shared kit; they go out through the kit's trackEvent with the lp_
// prefix and any captured UTMs.
//
//   lifepath_shown   a non-sample birthdate produced a Life Path (once per session)
//   quiz_started     the reader opened the letters quiz (once per session)
//   letters_entered  the reader supplied letters, by quiz or typed
//
// Together with the kit's gate_shown, upgrade_shown, and pro_purchase,
// these answer the one question Phase 1 exists for: of the people who get
// a number, how many give us four letters? See docs/monetization-roadmap.md.

import { KIT_CONFIG } from '../../kit.config';
import { trackEvent } from '../kit';

type EventData = Record<string, string | number | boolean>;

const onceKey = (name: string) => `${KIT_CONFIG.app.storagePrefix}once_${name}`;

/**
 * Fire an event at most once per browser session. If session storage is
 * unavailable (some private modes) the event still fires; a rare double
 * count beats a silent zero.
 */
export function trackOncePerSession(name: string, data?: EventData): void {
  try {
    if (sessionStorage.getItem(onceKey(name))) return;
    sessionStorage.setItem(onceKey(name), '1');
  } catch {
    /* storage blocked — fall through and track */
  }
  trackEvent(name, data);
}

export const trackLifePathShown = (number: number): void => trackOncePerSession('lifepath_shown', { number });

export const trackQuizStarted = (): void => trackOncePerSession('quiz_started');

export const trackLettersEntered = (method: 'quiz' | 'typed'): void => trackEvent('letters_entered', { method });
