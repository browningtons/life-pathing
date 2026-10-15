import { useCallback, useEffect, useRef } from 'react';

/** How long a freshly rendered control ignores pointer input, in ms. */
export const TAP_GUARD_MS = 350;

/**
 * True when a click should be swallowed: it came from a pointer (a mouse
 * or finger click has detail >= 1; a keyboard Enter/Space has detail 0) and
 * landed within the window after the control appeared. This is the second
 * half of a double-tap, landing on whatever the first tap just rendered.
 */
export function isEarlyPointerTap(
  appearedAt: number,
  now: number,
  detail: number,
  windowMs: number = TAP_GUARD_MS,
): boolean {
  return detail > 0 && now - appearedAt < windowMs;
}

/**
 * Returns `early(event)`: true when this click is a stray double-tap on a
 * control that just appeared. The window restarts whenever `resetKey`
 * changes (a new phase, the next question). Keyboard clicks never count.
 */
export function useTapGuard(resetKey: unknown = null): (event: { detail: number }) => boolean {
  const appearedAt = useRef(0);
  useEffect(() => {
    appearedAt.current = performance.now();
  }, [resetKey]);
  return useCallback((event) => isEarlyPointerTap(appearedAt.current, performance.now(), event.detail), []);
}
