import { describe, expect, it } from 'vitest';
import sample from '../../api/_readings/__fixtures__/sample.json';
import {
  BANNED_TERMS,
  BODY_FIELDS,
  HEDGE_CAP,
  READING_FIELDS,
  SKELETON_PHRASES,
  WORD_BOUNDS,
  countHedges,
  countWords,
  overlapRatio,
  shingles,
  siblingOverlap,
  validateReading,
  type ReadingField,
  type ReadingSections,
} from './readingValidator';

const words = (n: number, word = 'quiet') => Array(n).fill(word).join(' ');

/** n words that address the reader and ask a question, as a body section must. */
const body = (n: number) => `Do you ${words(n - 3)} see?`;

/** n words that pass the field's own rules. */
const fill = (field: ReadingField, n: number) => (BODY_FIELDS.includes(field) ? body(n) : words(n));

const base = (): ReadingSections => {
  const { teaser, number, type, love, agree, pull, closing } = sample;
  return { teaser, number, type, love, agree, pull, closing };
};

const withField = (field: keyof ReadingSections, text: string) => ({ ...base(), [field]: text });

/** A whole Reading from per-field word counts. */
const sized = (counts: Record<ReadingField, number>): ReadingSections =>
  Object.fromEntries(READING_FIELDS.map((f) => [f, fill(f, counts[f])])) as ReadingSections;

describe('validateReading: the passing fixture', () => {
  it('passes the sample with no failures', () => {
    expect(validateReading(sample)).toEqual([]);
  });

  it('is marked as a fixture and keyed per the contract', () => {
    expect(sample.fixture).toBe(true);
    expect(sample.key).toBe('7-16-INFJ');
    expect(sample.version).toBe(2);
  });
});

describe('validateReading: shape', () => {
  it('refuses a non-object', () => {
    expect(validateReading(null)).toHaveLength(1);
    expect(validateReading('text')).toHaveLength(1);
    expect(validateReading([])).toHaveLength(1);
  });

  it('has seven fields, love between the type and where they agree', () => {
    expect(READING_FIELDS).toEqual(['teaser', 'number', 'type', 'love', 'agree', 'pull', 'closing']);
  });

  for (const field of READING_FIELDS) {
    it(`reports ${field} missing`, () => {
      const r: Record<string, unknown> = { ...base() };
      delete r[field];
      expect(validateReading(r)).toContain(`${field}: missing`);
    });

    it(`reports ${field} not a string`, () => {
      expect(validateReading({ ...base(), [field]: 42 })).toContain(`${field}: not a string`);
    });

    it(`reports ${field} empty`, () => {
      expect(validateReading(withField(field, '   '))).toContain(`${field}: empty`);
    });
  }
});

describe('validateReading: word bounds', () => {
  it('sets the round-2 bounds', () => {
    expect(WORD_BOUNDS).toEqual({
      teaser: [60, 120],
      number: [130, 180],
      type: [130, 180],
      love: [80, 120],
      agree: [130, 180],
      pull: [130, 180],
      closing: [15, 40],
    });
  });

  for (const field of READING_FIELDS) {
    const [lo, hi] = WORD_BOUNDS[field];

    it(`${field}: passes at exactly ${lo} and ${hi} words`, () => {
      // The field's own checks only: swapping one field can move the sample's total.
      const own = (n: number) => validateReading(withField(field, fill(field, n))).filter((f) => !f.startsWith('total:'));
      expect(own(lo)).toEqual([]);
      expect(own(hi)).toEqual([]);
    });

    it(`${field}: fails at ${lo - 1} words`, () => {
      const failures = validateReading(withField(field, fill(field, lo - 1)));
      expect(failures).toContain(`${field}: ${lo - 1} words, under the ${lo}-word floor`);
    });

    it(`${field}: fails at ${hi + 1} words`, () => {
      const failures = validateReading(withField(field, fill(field, hi + 1)));
      expect(failures).toContain(`${field}: ${hi + 1} words, over the ${hi}-word ceiling`);
    });
  }

  it('fails a total under 700 even when every field is in bounds', () => {
    const r = sized({ teaser: 60, number: 130, type: 130, love: 80, agree: 130, pull: 130, closing: 15 });
    expect(validateReading(r)).toEqual(['total: 675 words, under the 700-word floor']);
  });

  it('fails a total over 900 even when every field is in bounds', () => {
    const r = sized({ teaser: 120, number: 180, type: 180, love: 120, agree: 180, pull: 180, closing: 40 });
    expect(validateReading(r)).toEqual(['total: 1000 words, over the 900-word ceiling']);
  });

  it('passes the total at 700 and 900', () => {
    expect(validateReading(sized({ teaser: 60, number: 130, type: 130, love: 80, agree: 130, pull: 155, closing: 15 }))).toEqual([]);
    expect(validateReading(sized({ teaser: 100, number: 180, type: 180, love: 100, agree: 180, pull: 140, closing: 20 }))).toEqual([]);
  });

  it('counts words, not punctuation', () => {
    expect(countWords('One — two, three.  \n\n Four')).toBe(4);
  });
});

describe('validateReading: banned words', () => {
  const cases: Record<string, string> = {
    journey: 'The Journey of a seeker',
    energy: 'a quiet ENERGY in the room',
    universe: 'the universe answers',
    vibration: 'the vibration of the number',
    manifest: 'it tends to manifest slowly',
    destiny: 'a sense of destiny',
    'you will': 'and so you will notice',
    expect: 'friends expect it',
    'this year': 'a turn This Year',
  };

  it('has a case for every banned term', () => {
    expect(Object.keys(cases).sort()).toEqual(BANNED_TERMS.map((t) => t.label).sort());
  });

  for (const [label, phrase] of Object.entries(cases)) {
    it(`flags "${label}" case-insensitively`, () => {
      const failures = validateReading(withField('closing', `${words(14)} ${phrase}`));
      expect(failures.some((f) => f.startsWith(`closing: banned "${label}"`))).toBe(true);
    });
  }

  it('flags inflections that carry the same meaning', () => {
    for (const phrase of ['journeys', 'energies', 'manifested', 'destined', 'expected']) {
      const failures = validateReading(withField('closing', `${words(14)} ${phrase}`));
      expect(failures.some((f) => f.includes('banned'))).toBe(true);
    }
  });

  it('respects word boundaries', () => {
    for (const phrase of ['unexpectedly', 'energetic', 'universal', 'expectations', 'sojourner']) {
      const failures = validateReading(withField('closing', `${words(14)} ${phrase}`));
      expect(failures.filter((f) => f.includes('banned'))).toEqual([]);
    }
  });
});

describe('validateReading: the round-1 skeleton', () => {
  it('bans every phrase the persona readers quoted', () => {
    for (const phrase of [
      'both systems',
      'neither system',
      'put together,',
      'paired, the',
      'in ordinary life',
      'this pairing',
      'this combination',
      'the risk particular',
      'a separate, quieter',
      'is a separate question',
      'the question is only',
    ]) {
      expect(SKELETON_PHRASES).toContain(phrase);
    }
  });

  for (const phrase of SKELETON_PHRASES) {
    it(`flags "${phrase}" in any case`, () => {
      const upper = phrase.toUpperCase();
      const failures = validateReading(withField('agree', `${body(150)} ${upper} quiet`));
      expect(failures).toContain(`agree: skeleton phrase "${phrase}"`);
    });
  }

  it('flags a closing that is a question', () => {
    expect(validateReading(withField('closing', `${words(14)} or is it?`))).toContain('closing: a question; the closing is a statement');
  });
});

describe('validateReading: jargon', () => {
  for (const phrase of ['the Ni', 'Fe first', 'Ni-Fe', 'the whole stack', 'the shadow side', 'its shadows', 'an Empath', 'Theorists', 'a Responder', 'the Preserver']) {
    it(`flags "${phrase}"`, () => {
      const failures = validateReading(withField('type', `${body(150)} ${phrase}`));
      expect(failures.some((f) => f.startsWith('type: jargon'))).toBe(true);
    });
  }

  it('matches function abbreviations by case only', () => {
    for (const phrase of ['ni', 'se', 'fine', 'Nine', 'Sea', 'Tie']) {
      const failures = validateReading(withField('type', `${body(150)} ${phrase}`));
      expect(failures.filter((f) => f.includes('jargon'))).toEqual([]);
    }
  });

  it('requires a gloss where "compound number" first appears', () => {
    const plain = sized({ teaser: 80, number: 150, type: 150, love: 100, agree: 150, pull: 150, closing: 20 });
    const bare = `${body(150)} The compound number 16 sits under it.`;
    expect(validateReading({ ...plain, number: bare }).some((f) => f.startsWith('compound number: not glossed'))).toBe(true);
    const glossed = `${body(140)} The compound number 16, the number your date adds up to before it is reduced, sits under it.`;
    expect(validateReading({ ...plain, number: glossed }).filter((f) => f.startsWith('compound'))).toEqual([]);
  });
});

describe('validateReading: verdicts, advice and hedges', () => {
  for (const phrase of ['you should rest', 'you must choose', 'you need to stop', 'you have to say it', 'You Will see', 'the growth you are pointed toward', 'the lesson here is', 'the work is to listen']) {
    it(`flags the advice "${phrase}"`, () => {
      const failures = validateReading(withField('pull', `${body(150)} ${phrase}`));
      expect(failures.some((f) => f.startsWith('pull: advice'))).toBe(true);
    });
  }

  it('counts hedges', () => {
    expect(countHedges('It tends to rain. They tend to stay. Often, you can. You cannot. You can’t.')).toBe(4);
  });

  it(`passes ${HEDGE_CAP} hedges in a section and fails ${HEDGE_CAP + 1}`, () => {
    expect(HEDGE_CAP).toBe(3);
    const three = `${body(150)} it tends to, often, and can`;
    expect(validateReading(withField('agree', three))).toEqual([]);
    const four = `${body(150)} it tends to, often, can, and often`;
    expect(validateReading(withField('agree', four))).toContain('agree: 4 hedges ("tends to", "often", "can"), over the cap of 3');
  });

  for (const field of BODY_FIELDS) {
    it(`${field}: needs a question and "you"`, () => {
      const [lo] = WORD_BOUNDS[field];
      expect(validateReading(withField(field, `${words(lo + 5)}.`))).toEqual(
        expect.arrayContaining([`${field}: no "you"; address the reader in the second person`, `${field}: no question to the reader`]),
      );
    });
  }

  it('allows the second person anywhere', () => {
    expect(validateReading(withField('closing', `${words(14)} your number and you`))).toEqual([]);
  });
});

describe('validateReading: forecasts and plain text', () => {
  const forecasts = [
    'and they will find a partner',
    'this person will change',
    'this one will not drop it',
    "they'll settle down",
    "and you'll see",
    'it will soon arrive',
    'a change next year',
    'over the coming months',
    'in the near future',
    'it is meant to lead',
    'it was written in the stars',
  ];

  for (const phrase of forecasts) {
    it(`flags the forecast "${phrase}"`, () => {
      const failures = validateReading(withField('closing', `${words(14)} ${phrase}`));
      expect(failures.some((f) => f.startsWith('closing: forecast'))).toBe(true);
    });
  }

  it('does not flag a timeless "will" that names no one', () => {
    const failures = validateReading(withField('closing', `${words(14)} the number will wait`));
    expect(failures).toEqual([]);
  });

  it('flags markdown in a body', () => {
    for (const text of [`## The Number\n${body(160)}`, `**bold** ${body(160)}`, `- one\n- two ${body(160)}`]) {
      const failures = validateReading(withField('number', text));
      expect(failures).toContain('number: markdown; bodies are plain text');
    }
  });

  it('flags exclamation marks and emoji', () => {
    expect(validateReading(withField('closing', `${words(14)} quiet!`))).toContain('closing: exclamation mark; the register has none');
    expect(validateReading(withField('closing', `${words(14)} quiet \u{2728}`))).toContain('closing: emoji; the register has none');
  });

  it('allows paragraph breaks', () => {
    expect(validateReading(withField('number', `${words(70)}\n\n${body(80)}`))).toEqual([]);
  });
});

describe('siblingOverlap', () => {
  const distinct = (seed: string): ReadingSections => ({
    teaser: Array.from({ length: 80 }, (_, i) => `${seed}t${i}`).join(' '),
    number: Array.from({ length: 160 }, (_, i) => `${seed}n${i}`).join(' '),
    type: Array.from({ length: 160 }, (_, i) => `${seed}y${i}`).join(' '),
    love: Array.from({ length: 100 }, (_, i) => `${seed}l${i}`).join(' '),
    agree: Array.from({ length: 160 }, (_, i) => `${seed}a${i}`).join(' '),
    pull: Array.from({ length: 160 }, (_, i) => `${seed}p${i}`).join(' '),
    closing: Array.from({ length: 20 }, (_, i) => `${seed}c${i}`).join(' '),
  });

  it('is 1 for identical text and 0 for disjoint text', () => {
    const a = shingles(distinct('a'));
    expect(overlapRatio(a, a)).toBe(1);
    expect(overlapRatio(a, shingles(distinct('b')))).toBe(0);
  });

  it('flags a same-number pair above the threshold', () => {
    const flags = siblingOverlap({ '7-16-INFJ': sample, '7-16-ENTP': sample });
    expect(flags).toEqual([{ a: '7-16-ENTP', b: '7-16-INFJ', sibling: 'number', ratio: 1 }]);
  });

  it('flags a same-type pair above the threshold', () => {
    const flags = siblingOverlap({ '7-16-INFJ': sample, '3-0-INFJ': sample });
    expect(flags).toEqual([{ a: '3-0-INFJ', b: '7-16-INFJ', sibling: 'type', ratio: 1 }]);
  });

  it('ignores pairs that share neither number nor type', () => {
    expect(siblingOverlap({ '7-16-INFJ': sample, '3-0-ESFP': sample })).toEqual([]);
  });

  it('treats a different compound as a different number', () => {
    expect(siblingOverlap({ '7-16-INFJ': sample, '7-25-ESFP': sample })).toEqual([]);
  });

  it('passes distinct siblings', () => {
    expect(siblingOverlap({ '7-16-INFJ': distinct('a'), '7-16-ENTP': distinct('b') })).toEqual([]);
  });

  it('takes the threshold as a parameter', () => {
    const half = distinct('a');
    const partial = { ...distinct('b'), number: half.number, type: half.type };
    const readings = { '7-16-INFJ': half, '7-16-ENTP': partial };
    const ratio = overlapRatio(shingles(half), shingles(partial));
    expect(ratio).toBeGreaterThan(0.15);
    expect(ratio).toBeLessThan(0.9);
    expect(siblingOverlap(readings)).toHaveLength(1);
    expect(siblingOverlap(readings, 0.9)).toEqual([]);
    expect(siblingOverlap(readings, 0.15)[0].ratio).toBeCloseTo(ratio);
  });
});
