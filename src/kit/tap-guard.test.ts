import { describe, expect, it } from 'vitest';
import { TAP_GUARD_MS, isEarlyPointerTap } from './tap-guard';

describe('isEarlyPointerTap', () => {
  it('swallows a pointer click inside the window', () => {
    expect(isEarlyPointerTap(1000, 1000 + 120, 1)).toBe(true);
    expect(isEarlyPointerTap(1000, 1000 + TAP_GUARD_MS - 1, 2)).toBe(true);
  });

  it('accepts a pointer click once the window has passed', () => {
    expect(isEarlyPointerTap(1000, 1000 + TAP_GUARD_MS, 1)).toBe(false);
    expect(isEarlyPointerTap(1000, 5000, 1)).toBe(false);
  });

  it('never blocks the keyboard (detail 0), even immediately', () => {
    expect(isEarlyPointerTap(1000, 1000, 0)).toBe(false);
  });
});
