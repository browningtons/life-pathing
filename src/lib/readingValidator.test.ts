import { describe, expect, it } from 'vitest';
import sample from '../../api/_readings/__fixtures__/sample.json';
import {
  BANNED_TERMS,
  READING_FIELDS,
  WORD_BOUNDS,
  countWords,
  overlapRatio,
  shingles,
  siblingOverlap,
  validateReading,
  type ReadingSections,
} from './readingValidator';

const words = (n: number, word = 'quiet') => Array(n).fill(word).join(' ');

const base = (): ReadingSections => {
  const { teaser, number, type, agree, pull, closing } = sample;
  return { teaser, number, type, agree, pull, closing };
};

const withField = (field: keyof ReadingSections, text: string) => ({ ...base(), [field]: text });

describe('validateReading: the passing fixture', () => {
  it('passes the hand-written sample with no failures', () => {
    expect(validateReading(sample)).toEqual([]);
  });

  it('is marked as a fixture and keyed per the contract', () => {
    expect(sample.fixture).toBe(true);
    expect(sample.key).toBe('7-16-INFJ');
    expect(sample.version).toBe(1);
  });
});

describe('validateReading: shape', () => {
  it('refuses a non-object', () => {
    expect(validateReading(null)).toHaveLength(1);
    expect(validateReading('text')).toHaveLength(1);
    expect(validateReading([])).toHaveLength(1);
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
  for (const field of READING_FIELDS) {
    const [lo, hi] = WORD_BOUNDS[field];

    it(`${field}: passes at exactly ${lo} and ${hi} words`, () => {
      expect(validateReading(withField(field, words(lo)))).toEqual([]);
      expect(validateReading(withField(field, words(hi)))).toEqual([]);
    });

    it(`${field}: fails at ${lo - 1} words`, () => {
      const failures = validateReading(withField(field, words(lo - 1)));
      expect(failures).toContain(`${field}: ${lo - 1} words, under the ${lo}-word floor`);
    });

    it(`${field}: fails at ${hi + 1} words`, () => {
      const failures = validateReading(withField(field, words(hi + 1)));
      expect(failures).toContain(`${field}: ${hi + 1} words, over the ${hi}-word ceiling`);
    });
  }

  it('fails a total under 700 even when every field is in bounds', () => {
    const r = { teaser: words(60), number: words(150), type: words(150), agree: words(150), pull: words(150), closing: words(15) };
    expect(validateReading(r)).toEqual(['total: 675 words, under the 700-word floor']);
  });

  it('fails a total over 900 even when every field is in bounds', () => {
    const r = { teaser: words(120), number: words(200), type: words(200), agree: words(200), pull: words(200), closing: words(40) };
    expect(validateReading(r)).toEqual(['total: 960 words, over the 900-word ceiling']);
  });

  it('passes the total at 700 and 900', () => {
    const low = { teaser: words(60), number: words(150), type: words(150), agree: words(150), pull: words(175), closing: words(15) };
    expect(validateReading(low)).toEqual([]);
    const high = { teaser: words(120), number: words(200), type: words(200), agree: words(200), pull: words(160), closing: words(20) };
    expect(validateReading(high)).toEqual([]);
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

describe('validateReading: forecasts, person, plain text', () => {
  const forecasts = [
    'and they will find a partner',
    'this person will change',
    "they'll settle down",
    "and you'll see",
    'it will soon arrive',
    'a change next year',
    'over the coming months',
    'in the near future',
    'this pairing is meant to lead',
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

  it('flags the second person', () => {
    for (const phrase of ['your number', 'You are', 'for yourself']) {
      const failures = validateReading(withField('closing', `${words(14)} ${phrase}`));
      expect(failures.some((f) => f.startsWith('closing: second person'))).toBe(true);
    }
  });

  it('flags markdown in a body', () => {
    for (const text of [`## The Number\n${words(160)}`, `**bold** ${words(160)}`, `- one\n- two ${words(160)}`]) {
      const failures = validateReading(withField('number', text));
      expect(failures).toContain('number: markdown; bodies are plain text');
    }
  });

  it('allows paragraph breaks', () => {
    expect(validateReading(withField('number', `${words(80)}\n\n${words(90)}`))).toEqual([]);
  });
});

describe('siblingOverlap', () => {
  const distinct = (seed: string): ReadingSections => ({
    teaser: Array.from({ length: 80 }, (_, i) => `${seed}t${i}`).join(' '),
    number: Array.from({ length: 160 }, (_, i) => `${seed}n${i}`).join(' '),
    type: Array.from({ length: 160 }, (_, i) => `${seed}y${i}`).join(' '),
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
