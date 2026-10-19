import { describe, expect, it } from 'vitest';
import { READING_ENABLED } from '../lib/readingFlag';
import { tabsFor } from './tabs';

describe('tabs', () => {
  it('has no Reading tab when the flag is off', () => {
    const ids = tabsFor(false).map((t) => t.id);
    expect(ids).toEqual(['lifepath', 'archetypes', 'profile', 'intake']);
    expect(ids).not.toContain('reading');
  });

  it('puts the Reading tab right after Profile when the flag is on', () => {
    expect(tabsFor(true).map((t) => t.id)).toEqual(['lifepath', 'archetypes', 'profile', 'reading', 'intake']);
  });

  it('is off by default (no VITE_READING_ENABLED in the test env)', () => {
    expect(READING_ENABLED).toBe(false);
  });
});
