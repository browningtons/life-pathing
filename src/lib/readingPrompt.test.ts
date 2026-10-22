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
import { OPENING_MOVES, buildReadingPrompt, buildRetryUser, readingExemplars, referenceFacts, shapePlan } from './readingPrompt';
import { READING_PROMPT_VERSION, enumerateReadingKeys } from './readingKey';
import { BANNED_TERMS, SECOND_PERSON_PATTERN, SKELETON_PHRASES } from './readingValidator';

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
    expect(system).toContain('Address the reader as "you" throughout.');
    expect(system).not.toMatch(/Third person throughout/);
  });

  it('asks for the seven-field JSON in the fixed order', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    const order = ['"teaser"', '"number"', '"type"', '"love"', '"agree"', '"pull"', '"closing"'].map((f) => system.indexOf(f));
    for (const i of order) expect(i).toBeGreaterThan(-1);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(system).toContain('700–900 words');
  });

  it('is prompt version 3', () => {
    expect(READING_PROMPT_VERSION).toBe(3);
    expect(buildReadingPrompt('7-16-INFJ').version).toBe(3);
  });

  it('forbids the round-1 skeleton by name', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    for (const phrase of SKELETON_PHRASES) expect(system).toContain(`"${phrase}"`);
    expect(system).toContain('must be built for this number and this type');
    expect(system).toContain('The user turn carries a shape plan for this Reading');
    expect(system).toMatch(/must not be scaffolded as "In work… In love…"/);
    expect(system).toMatch(/not "X wants A, Y wants B"/);
    expect(system).toMatch(/closing line must not be a question, a rhetorical question/);
  });

  it('bans the jargon by name', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    expect(system).toContain('(Ni, Ne, Si, Se, Ti, Te, Fi, Fe)');
    expect(system).toContain('never the word "stack", never "shadow" or "shadows"');
    expect(system).toContain('(Empath, Theorist, Responder, Preserver)');
  });

  it('asks for scenes and questions, never verdicts, with hedges capped', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    expect(system).toMatch(/one concrete, recognisable scene from an ordinary week/);
    expect(system).toMatch(/A question to the reader is welcome[^.]*at most one per section, and none is required/);
    expect(system).toMatch(/Describe tendencies, never deliver charges/);
    expect(system).toMatch(/No advice and no prescriptions/);
    expect(system).toMatch(/at most three per section/);
    expect(system).toContain('Never write "you will", "you should", "you must", "you need to" or "you have to"');
  });

  it('asks for love as something said or noticed, not a trait list', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    expect(system).toMatch(/"love" \(80–120 words\): In love\./);
    expect(system).toMatch(/one specific moment a partner would recognise/);
    expect(system).toMatch(/Not a trait list and not a specification for a partner/);
  });

  it('does not prime the banned phrases in its own instructions', () => {
    const { system } = buildReadingPrompt('7-16-INFJ');
    const list = system.slice(system.indexOf('Never write these phrases'), system.indexOf('## The section contract'));
    const rest = system.replace(list, '').toLowerCase();
    for (const phrase of ['this pairing', 'neither system', 'this combination', 'put together,']) expect(rest).not.toContain(phrase);
  });

  it('puts the life-path entry and the type entry in the user turn, without stack, shadows or famous names', () => {
    const { user } = buildReadingPrompt('7-16-INFJ');
    const facts = referenceFacts(7, 'INFJ');
    expect(user).toContain(JSON.stringify(facts.lifePath, null, 2));
    expect(user).toContain(JSON.stringify(facts.type, null, 2));
    expect(user).toContain(LIFE_PATH_MEANINGS[7].description);
    expect(user).toContain(MBTI_DATA.INFJ.desc);
    expect(user).not.toMatch(/"stack"|"shadows"|"famous"/);
    for (const name of [...LIFE_PATH_MEANINGS[7].famous, ...MBTI_DATA.INFJ.famous]) expect(user).not.toContain(name);
    expect(user).not.toMatch(/Temperament/);
    expect(facts.type.difficulties).toEqual(MBTI_DATA.INFJ.shadows);
  });

  it('names the compound label when the key has one', () => {
    const { user } = buildReadingPrompt('7-16-INFJ');
    expect(user).toContain(COMPOUND_MEANINGS[16]);
    expect(user).toMatch(/compound number 16/);
    expect(user).toMatch(/the number your birth date adds up to before it is reduced/);
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

  it('gives each key its own shape plan, a pure function of the key', () => {
    const a = shapePlan('7-16-INFJ');
    expect(shapePlan('7-16-INFJ')).toEqual(a);
    const openings = Object.values(a.openings);
    expect(new Set(openings).size).toBe(openings.length);
    for (const o of openings) expect(OPENING_MOVES).toContain(o);
    expect(a.questionEndings).toHaveLength(2);
    expect(a.questionEndings).not.toContain('teaser');
    expect(a.settings).toHaveLength(4);
    const keys = enumerateReadingKeys(new Date(2026, 9, 18));
    const distinct = new Set(keys.map((k) => JSON.stringify(shapePlan(k).openings)));
    expect(distinct.size).toBeGreaterThan(keys.length / 2);
    const { user } = buildReadingPrompt('7-16-INFJ');
    expect(user).toContain('Shape plan for this Reading');
    for (const s of a.settings) expect(user).toContain(s);
  });

  it('hands the failed draft back on retry when there is one', () => {
    const p = buildReadingPrompt('7-16-INFJ');
    const draft = { teaser: 'Draft opening.' };
    const retry = buildRetryUser(p, ['teaser: 2 words, under the 60-word floor'], draft);
    expect(retry.startsWith(p.user)).toBe(true);
    expect(retry).toContain('"teaser": "Draft opening."');
    expect(retry).toContain('Revise the draft');
  });

  it('appends the failures on retry', () => {
    const p = buildReadingPrompt('7-16-INFJ');
    const retry = buildRetryUser(p, ['teaser: 40 words, under the 60-word floor', 'pull: banned "energy" ("energy")']);
    expect(retry.startsWith(p.user)).toBe(true);
    expect(retry).toContain('- teaser: 40 words, under the 60-word floor');
    expect(retry).toContain('- pull: banned "energy" ("energy")');
  });
});
