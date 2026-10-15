import { describe, expect, it } from 'vitest';
import {
  TYPED_MATCHES_NOTE,
  TYPED_TEMPERAMENT_NOTE,
  resultLeanCopy,
  resultRetakeLabel,
  showsDimensionPercent,
} from './letterSource';

describe('showsDimensionPercent', () => {
  it('hides percentages only for typed letters', () => {
    expect(showsDimensionPercent('typed')).toBe(false);
    expect(showsDimensionPercent('quiz')).toBe(true);
    expect(showsDimensionPercent('report')).toBe(true);
    expect(showsDimensionPercent('sample')).toBe(true);
  });
});

describe('resultLeanCopy', () => {
  it('never claims a lean for typed letters', () => {
    const copy = resultLeanCopy('typed', 0);
    expect(copy).not.toContain('A clear lean');
    expect(copy).not.toMatch(/\d+%/);
    expect(copy).toContain('typed');
    expect(copy).toContain('twelve questions');
    expect(copy).toContain('report');
  });

  it('a clean quiz sweep reads as a clear lean', () => {
    expect(resultLeanCopy('quiz', 0)).toBe('A clear lean on all four letters.');
  });

  it('borderline quiz letters are named, singular and plural', () => {
    expect(resultLeanCopy('quiz', 1)).toContain('underlined letter is');
    expect(resultLeanCopy('quiz', 3)).toContain('underlined letters are');
    expect(resultLeanCopy('quiz', 2)).not.toContain('A clear lean');
  });
});

describe('resultRetakeLabel', () => {
  it('offers the questions to a typed reader, a retake to a quiz reader', () => {
    expect(resultRetakeLabel('typed')).toBe('Take the twelve questions');
    expect(resultRetakeLabel('quiz')).toBe('Take the questions again');
  });
});

describe('typed notes', () => {
  it('say the numbers come from the letters, not scores, and carry no number', () => {
    for (const note of [TYPED_TEMPERAMENT_NOTE, TYPED_MATCHES_NOTE]) {
      expect(note).toContain('not scored');
      expect(note).not.toMatch(/\d/);
    }
    expect(TYPED_MATCHES_NOTE).toContain('tie');
  });
});
