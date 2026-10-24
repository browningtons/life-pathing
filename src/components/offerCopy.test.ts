import { describe, expect, it } from 'vitest';
import { MBTI_DATA } from '../data/mbti';
import { offerCopy } from './offerCopy';

const BANNED = /journey|energy|universe|vibration|manifest|destiny/i;

describe.each([true, false])('the first-screen offer (Reading on: %s)', (readingEnabled) => {
  const copy = offerCopy('$19', readingEnabled);
  const all = [copy.eyebrow, copy.headline, copy.body, copy.inputLabel, copy.exampleLabel, ...copy.rows.flatMap((r) => [r.label, r.text])].join(' ');

  it('names both lenses in the headline', () => {
    expect(copy.headline).toMatch(/Life Path/);
    expect(copy.headline).toMatch(/four letters/);
  });

  it('says what is free and the price, once, in the body', () => {
    expect(copy.body).toMatch(/free/i);
    expect(copy.body).toContain('$19, once');
  });

  it('names what the price buys', () => {
    expect(copy.body).toMatch(readingEnabled ? /whole Reading/ : /whole Profile/);
  });

  it('keeps to one or two sentences of body', () => {
    expect(copy.body.split(/(?<=\.)\s+/).length).toBeLessThanOrEqual(2);
  });

  it('carries no type code, nickname or hardcoded date', () => {
    for (const [code, entry] of Object.entries(MBTI_DATA)) {
      expect(all).not.toMatch(new RegExp(`\\b${code}\\b`));
      expect(all).not.toContain(entry.title);
    }
    expect(all).not.toMatch(/\d{4}/);
  });

  it('stays in the almanac register', () => {
    expect(all).not.toMatch(BANNED);
  });

  it('labels the sample as an example', () => {
    expect(copy.exampleLabel).toMatch(/example/i);
  });
});
