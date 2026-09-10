import { describe, expect, it } from 'vitest';
import { sections } from './personality';
import { FACET_DETAIL_GATE, GATE_COPY, PAID_SECTIONS, isPaidSection } from './tiers';

describe('the free / paid split', () => {
  it('keeps the facets section free at the top level', () => {
    expect(isPaidSection('traits')).toBe(false);
  });

  it('pays for everything below the signature', () => {
    for (const s of sections) {
      if (s === 'traits') continue;
      expect(isPaidSection(s), s).toBe(true);
    }
  });

  it('names only real sections as paid', () => {
    for (const s of PAID_SECTIONS) expect(sections).toContain(s);
  });

  it('has gate copy for every section and the facet detail', () => {
    for (const key of [...sections, FACET_DETAIL_GATE]) {
      const copy = GATE_COPY[key];
      expect(copy?.title, key).toBeTruthy();
      expect(copy?.blurb, key).toBeTruthy();
    }
  });
});
