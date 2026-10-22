import { describe, expect, it } from 'vitest';
import {
  READING_PROMPT_VERSION,
  compoundKeyFor,
  enumerateLifePathPairs,
  enumerateReadingKeys,
  normalizeType,
  parseReadingKey,
  readingKey,
} from './readingKey';
import { calculateLifePath } from './calculateLifePath';

const TODAY = new Date(2026, 9, 18);

const EXPECTED_PAIRS = [
  '1-0', '1-10', '1-19', '1-28', '2-20', '3-0', '3-12', '3-21', '3-30', '4-0', '4-13',
  '4-31', '5-0', '5-14', '5-23', '5-32', '6-0', '6-15', '6-24', '7-0', '7-16', '7-25',
  '8-0', '8-17', '8-26', '9-0', '9-18', '9-27', '11-0', '11-11', '11-29', '22-22', '33-33',
];

describe('readingKey', () => {
  it('is version 2', () => {
    expect(READING_PROMPT_VERSION).toBe(2);
  });

  it('keeps a labeled compound', () => {
    expect(readingKey(7, 16, 'INFJ')).toBe('7-16-INFJ');
    expect(readingKey(8, 26, 'ISTJ')).toBe('8-26-ISTJ');
  });

  it('writes 0 for an unlabeled compound', () => {
    expect(readingKey(3, 3, 'ESFP')).toBe('3-0-ESFP');
    expect(readingKey(7, 34, 'INFJ')).toBe('7-0-INFJ');
    expect(compoundKeyFor(9)).toBe(0);
    expect(compoundKeyFor(43)).toBe(0);
  });

  it('keeps master numbers 11, 22 and 33', () => {
    expect(readingKey(11, 11, 'ENFP')).toBe('11-11-ENFP');
    expect(readingKey(22, 22, 'INTJ')).toBe('22-22-INTJ');
    expect(readingKey(33, 33, 'ESFJ')).toBe('33-33-ESFJ');
  });

  it('uppercases and trims suffixed types', () => {
    expect(readingKey(7, 16, 'infj')).toBe('7-16-INFJ');
    expect(readingKey(7, 16, 'INFJ-T')).toBe('7-16-INFJ');
    expect(normalizeType(' enfp-a ')).toBe('ENFP');
  });

  it('refuses an unknown type or life path 0', () => {
    expect(readingKey(7, 16, 'XXXX')).toBeNull();
    expect(readingKey(0, 0, 'INFJ')).toBeNull();
  });

  it('agrees with calculateLifePath for a real date', () => {
    const lp = calculateLifePath('1991-03-14');
    expect(readingKey(lp.number, lp.compound, 'INFJ')).toBe(`${lp.number}-${compoundKeyFor(lp.compound)}-INFJ`);
  });

  it('parses its own output', () => {
    expect(parseReadingKey('7-16-INFJ')).toEqual({ lifePath: 7, compoundKey: 16, type: 'INFJ' });
    expect(parseReadingKey('7-16-infj')).toBeNull();
    expect(parseReadingKey('7-16-XXXX')).toBeNull();
    expect(parseReadingKey('../7-16-INFJ')).toBeNull();
  });
});

describe('enumerateReadingKeys', () => {
  it('walks 1900 to today into exactly 33 (lifePath, compoundKey) pairs', () => {
    const pairs = enumerateLifePathPairs(TODAY).map((p) => `${p.lifePath}-${p.compoundKey}`);
    expect(pairs).toHaveLength(33);
    expect(pairs).toEqual(EXPECTED_PAIRS);
  });

  it('gives 528 unique keys, 16 per pair', () => {
    const keys = enumerateReadingKeys(TODAY);
    expect(keys).toHaveLength(528);
    expect(new Set(keys).size).toBe(528);
    expect(keys).toContain('7-16-INFJ');
    expect(keys).toContain('3-0-ESFP');
    expect(keys).toContain('8-26-ISTJ');
    for (const key of keys) expect(parseReadingKey(key)).not.toBeNull();
  });
});
