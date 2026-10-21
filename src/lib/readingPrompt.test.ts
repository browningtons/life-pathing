import { describe, expect, it } from 'vitest';
import { COMPOUND_MEANINGS } from '../data/compoundMeanings';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import { MBTI_DATA } from '../data/mbti';
import {
  SYNTHESIS_BY_TEMPERAMENT,
  TEMPERAMENT_ORDER,
  getConvergence,
  getGrowthEdges,
} from '../data/personality';
import { buildReadingPrompt, buildRetryUser, readingExemplars } from './readingPrompt';
import { READING_PROMPT_VERSION, enumerateReadingKeys } from './readingKey';
import { BANNED_TERMS, SECOND_PERSON_PATTERN } from './readingValidator';

describe('buildReadingPrompt', () => {
  it('is a pure function of the key', () => {
    expect(buildReadingPrompt('7-16-INFJ')).toEqual(buildReadingPrompt('7-16-INFJ'));
    expect(buildReadingPrompt('7-16-INFJ')).not.toEqual(buildReadingPrompt('7-16-ENFP'));
    expect(buildReadingPrompt('7-16-INFJ').user).not.toEqual(buildReadingPrompt('7-25-INFJ').user);
  });

  it('carries the key and the prompt version', () => {
    const p = buildReadingPrompt('3-0-ESFP');
    expect(p.key).toBe('3-0-ESFP');
    expect(p.version).toBe(READING_PROMPT_VERSION);
  });

  it('builds for every one of the 528 keys', () => {
    for (const key of enumerateReadingKeys(new Date(2026, 9, 18))) {
      expect(() => buildReadingPrompt(key)).not.toThrow();
    }
  });

  it('refuses a key the app cannot produce', () => {
    expect(() => buildReadingPrompt('7-16-XXXX')).toThrow();
    expect(() => buildReadingPrompt('10-0-INFJ')).toThrow();
    expect(() => buildReadingPrompt('7-40-INFJ')).toThrow();
    expect(() => buildReadingPrompt('nonsense')).toThrow();
  });

  it('passes all four synthesis templates verbatim', () => {
    const { system } = buildReadingPrompt('8-26-ISTJ');
    for (const t of TEMPERAMENT_ORDER) expect(system).toContain(SYNTHESIS_BY_TEMPERAMENT[t]);
  });

  it("passes the key's temperament convergence themes and growth edges verbatim, and only those", () => {
    const { system } = buildReadingPrompt('7-16-INFJ'); // Empath
    for (const c of getConvergence('Empath')) expect(system).toContain(c.desc);
    for (const g of getGrowthEdges('Empath')) expect(system).toContain(g.desc);
    for (const c of getConvergence('Preserver')) expect(system).not.toContain(c.desc);
    expect(buildReadingPrompt('8-26-ISTJ').system).toContain(getConvergence('Preserver')[0].desc);
    expect(buildReadingPrompt('3-0-ESFP').system).toContain(getGrowthEdges('Responder')[0].desc);
    expect(buildReadingPrompt('1-0-INTP').system).toContain(getGrowthEdges('Theorist')[1].desc);
  });

  it('names every banned word and the framing', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    for (const { label } of BANNED_TERMS) expect(system).toContain(`"${label}"`);
    for (const label of ['journey', 'energy', 'universe', 'vibration', 'manifest', 'destiny', 'you will', 'expect', 'this year']) {
      expect(system).toContain(`"${label}"`);
    }
    expect(system).toContain('Nothing here is medical, psychological, or life advice.');
    expect(system).toMatch(/Third person throughout/);
  });

  it('asks for the six-field JSON in the fixed order', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    const order = ['"teaser"', '"number"', '"type"', '"agree"', '"pull"', '"closing"'].map((f) => system.indexOf(f));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(system).toContain('700–900 words');
  });

  it('puts the life-path entry, the type entry and the temperament in the user turn', () => {
    const { user } = buildReadingPrompt('7-16-INFJ');
    expect(user).toContain(JSON.stringify(LIFE_PATH_MEANINGS[7], null, 2));
    expect(user).toContain(JSON.stringify(MBTI_DATA.INFJ, null, 2));
    expect(user).toContain('Temperament (from the letters): Empath.');
  });

  it('names the compound label when the key has one', () => {
    const { user } = buildReadingPrompt('7-16-INFJ');
    expect(user).toContain(COMPOUND_MEANINGS[16]);
    expect(user).toMatch(/compound number 16/);
  });

  it('omits the compound clause for key 0', () => {
    const { user, system } = buildReadingPrompt('3-0-ESFP');
    expect(user).not.toMatch(/compound/i);
    expect(system).not.toMatch(/compound/i);
    // The system turn is the same whatever the compound; only the user turn differs.
    expect(buildReadingPrompt('7-0-INFJ').system).toEqual(buildReadingPrompt('7-16-INFJ').system);
  });

  it('uses no second-person exemplar', () => {
    for (const t of TEMPERAMENT_ORDER) {
      expect(SECOND_PERSON_PATTERN.test(readingExemplars(t))).toBe(false);
    }
    // The second-person reference copy is never placed in the system turn.
    const { system } = buildReadingPrompt('7-16-INFJ');
    expect(system).not.toContain(LIFE_PATH_MEANINGS[7].description);
    expect(system).not.toContain(MBTI_DATA.INFJ.desc);
  });

  it('appends the failures on retry', () => {
    const p = buildReadingPrompt('7-16-INFJ');
    const retry = buildRetryUser(p, ['teaser: 40 words, under the 60-word floor', 'pull: banned "energy" ("energy")']);
    expect(retry.startsWith(p.user)).toBe(true);
    expect(retry).toContain('- teaser: 40 words, under the 60-word floor');
    expect(retry).toContain('- pull: banned "energy" ("energy")');
  });
});
