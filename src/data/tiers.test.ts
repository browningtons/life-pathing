import { describe, expect, it } from 'vitest';
import { sections } from './personality';
import {
  FACET_DETAIL_GATE,
  GATE_COPY,
  INCLUDED_WITH_READING,
  PAID_SECTIONS,
  READING_GATE,
  READING_SECTIONS,
  isPaidSection,
} from './tiers';

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

  it('says, before the buy, that the facet sections need a pasted report', () => {
    for (const key of [FACET_DETAIL_GATE, 'descriptors'] as const) {
      expect(GATE_COPY[key].needsReport, key).toBe(true);
      expect(GATE_COPY[key].blurb, key).toMatch(/pasted .*report/);
    }
  });

  it('marks only the facet sections as needing a report', () => {
    for (const [key, copy] of Object.entries(GATE_COPY)) {
      if (key === FACET_DETAIL_GATE || key === 'descriptors') continue;
      expect(copy.needsReport, key).toBeFalsy();
    }
  });

  it('names no system the profile does not read', () => {
    for (const [key, copy] of Object.entries(GATE_COPY)) {
      expect(`${copy.title} ${copy.blurb}`, key).not.toMatch(/big five|enneagram|four lenses|four old systems/i);
    }
  });

  it('has gate copy for the Reading that names all five sections', () => {
    const copy = GATE_COPY[READING_GATE];
    expect(copy.title).toMatch(/five/i);
    for (const section of READING_SECTIONS) {
      expect(copy.blurb.toLowerCase(), section.title).toContain(section.title.toLowerCase());
    }
    expect(copy.needsReport).toBeFalsy();
  });

  it('lists the Reading sections in the contract order', () => {
    expect(READING_SECTIONS.map((s) => s.field)).toEqual(['number', 'type', 'agree', 'pull', 'closing']);
  });

  it('keeps the Reading gate out of the Profile sections', () => {
    expect((sections as readonly string[]).includes(READING_GATE)).toBe(false);
    expect((PAID_SECTIONS as readonly string[]).includes(READING_GATE)).toBe(false);
  });

  it('names the Reading in the Profile gates\' shared line', () => {
    expect(INCLUDED_WITH_READING).toMatch(/the Reading/);
  });
});
