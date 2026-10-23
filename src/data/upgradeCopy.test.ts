// The upgrade modal's copy lives in kit.config.ts. These checks keep it
// honest about what a letters-only buyer gets: the facet sections read
// the facet scores, which only a pasted report supplies, so they are
// listed under the report line, never in the unconditional list.

import { describe, expect, it, vi } from 'vitest';
import { KIT_CONFIG } from '../../kit.config';

const { upgrade } = KIT_CONFIG;

describe('the upgrade copy', () => {
  it('keeps the facet sections out of the unconditional list', () => {
    for (const f of upgrade.features) expect(f, f).not.toMatch(/facet|others tend to read you/i);
  });

  it('lists the facet sections under a line that names the pasted report', () => {
    const cond = upgrade.conditionalFeatures;
    expect(cond).toBeDefined();
    expect(cond?.heading).toMatch(/pasted .*report/i);
    expect(cond?.features.some((f) => /facets/i.test(f))).toBe(true);
    expect(cond?.features.some((f) => /others tend to read you/i.test(f))).toBe(true);
  });

  it('names no system the profile does not read', () => {
    const all = [...upgrade.features, ...(upgrade.conditionalFeatures?.features ?? [])].join(' ');
    expect(all).not.toMatch(/big five|enneagram|four lenses|four old systems/i);
  });
});

// The modal with the Reading flag on (the live build). kit.config reads the
// flag at import, so each check loads a fresh copy with the flag stubbed.
async function readingCopy() {
  vi.resetModules();
  vi.stubEnv('VITE_READING_ENABLED', '1');
  try {
    return (await import('../../kit.config')).KIT_CONFIG.upgrade;
  } finally {
    vi.unstubAllEnvs();
    vi.resetModules();
  }
}

describe('the upgrade copy with the Reading on', () => {
  it('tells the reader the purchase travels by receipt email', async () => {
    const copy = await readingCopy();
    expect(copy.headerSubtitle).toBe(
      'Your Reading and the whole Profile, kept on this device. Restore it elsewhere with your receipt email.',
    );
  });

  it('says one-time once, in the price caption', async () => {
    const copy = await readingCopy();
    expect(copy.priceCaption).toBe('One-time purchase');
    const rest = [copy.headerTitle, copy.headerSubtitle, ...copy.features].join(' ');
    expect(rest).not.toMatch(/one[- ]time|one payment/i);
  });

  it('folds "printable" into the first bullet and drops the saved-to-browser bullet', async () => {
    const copy = await readingCopy();
    expect(copy.features[0]).toMatch(/your four letters, printable$/);
    expect(copy.features.some((f) => /saved to this browser/i.test(f))).toBe(false);
    expect(copy.features.filter((f) => /printable/i.test(f))).toHaveLength(1);
  });

  it('names the pairing before the buy and keeps the one-Reading rule in the trust line', async () => {
    const copy = await readingCopy();
    expect(copy.pairingNote).toBe("For {pairing}. Change your letters first if that's not you.");
    expect(copy.trustLine).toMatch(/One Reading per purchase/);
  });
});

describe('the upgrade copy with the Reading off', () => {
  it('carries no pairing line', () => {
    expect(upgrade.pairingNote).toBeUndefined();
  });
});
