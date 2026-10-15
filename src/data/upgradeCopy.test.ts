// The upgrade modal's copy lives in kit.config.ts. These checks keep it
// honest about what a letters-only buyer gets: the facet sections read
// the facet scores, which only a pasted report supplies, so they are
// listed under the report line, never in the unconditional list.

import { describe, expect, it } from 'vitest';
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
