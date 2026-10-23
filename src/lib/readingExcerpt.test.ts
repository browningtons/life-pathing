// The excerpt rule the teaser writer (scripts/generate-readings.ts) applies,
// and a check that the teaser files on disk were rewritten with it.

import { describe, expect, it } from 'vitest';
import index from '../../api/_readings/index.json';
import { EXCERPT_MAX, firstSentence, teaserFileFor } from './readingExcerpt';

const TEASER_FILES = import.meta.glob('../../public/readings/*.json', { import: 'default', eager: true }) as Record<
  string,
  { key: string; excerpt?: string }
>;

describe('firstSentence', () => {
  it('stops at the first full stop a space follows', () => {
    expect(firstSentence('She waits by the door. You do not notice. Later.')).toBe('She waits by the door.');
  });

  it('stops at a question mark too, whichever comes first', () => {
    expect(firstSentence('Who left the light on? Nobody says. Then.')).toBe('Who left the light on?');
  });

  it('ignores a stop with no space after it', () => {
    expect(firstSentence('It cost $1.50 at the stall. Then more.')).toBe('It cost $1.50 at the stall.');
  });

  it('keeps a closing quote with its stop, and reads past a stop inside an open quote', () => {
    expect(firstSentence('"You fixed it. Why talk about it?" Then more.')).toBe('"You fixed it. Why talk about it?"');
    expect(firstSentence("'You don't have to,' a partner says. Then.")).toBe("'You don't have to,' a partner says.");
  });

  it('returns the whole text, trimmed, when there is no second sentence', () => {
    expect(firstSentence('  one line with no stop  ')).toBe('one line with no stop');
  });

  it(`caps at ${EXCERPT_MAX} characters, cut at a word, with an ellipsis`, () => {
    const long = `${'word '.repeat(80).trim()}. Second.`;
    const out = firstSentence(long);
    expect(out.length).toBeLessThanOrEqual(EXCERPT_MAX);
    expect(out.endsWith('word…')).toBe(true);
  });
});

describe('teaserFileFor', () => {
  it('writes key, version, teaser and the excerpt of "In love", nothing else', () => {
    const file = teaserFileFor({
      key: '6-0-INFP',
      version: 3,
      teaser: 'The opening.',
      love: 'First of love. Second of love.',
      // The rest of a Reading never reaches the free file.
      ...{ number: 'secret', pull: 'secret' },
    } as Parameters<typeof teaserFileFor>[0]);
    expect(file).toEqual({ key: '6-0-INFP', version: 3, teaser: 'The opening.', excerpt: 'First of love.' });
  });
});

describe('the teaser files on disk', () => {
  const readings = index as Record<string, { love: string }>;
  const files = Object.values(TEASER_FILES);

  it('each carry the first sentence of their "In love" section', () => {
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const reading = readings[file.key];
      if (!reading) continue;
      expect(file.excerpt, file.key).toBe(firstSentence(reading.love));
    }
  });
});
