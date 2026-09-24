import { describe, expect, it } from 'vitest';
import { MBTI_TYPES } from '../data/mbti';
import { QUIZ_QUESTIONS } from '../data/quiz';
import { deriveTypeCode, isBorderline } from './deriveType';
import { parseTypeCode, QUIZ_PCT, scoresFromQuiz, scoresFromTypeCode, TYPED_PCT, type QuizAnswers } from './letters';

describe('parseTypeCode', () => {
  it('accepts a plain code in any case', () => {
    expect(parseTypeCode('INFJ')).toBe('INFJ');
    expect(parseTypeCode('estp')).toBe('ESTP');
    expect(parseTypeCode('  e n f p ')).toBe('ENFP');
  });

  it('drops the 16personalities identity suffix', () => {
    expect(parseTypeCode('INFJ-T')).toBe('INFJ');
    expect(parseTypeCode('entp-a')).toBe('ENTP');
    expect(parseTypeCode('ISFJ A')).toBe('ISFJ');
  });

  it('rejects anything that is not one letter from each pair, in order', () => {
    for (const bad of ['', 'INF', 'INFJX', 'NIFJ', 'IXFJ', 'INFJ-Q', 'INFJ--T', '1234']) {
      expect(parseTypeCode(bad), bad).toBeNull();
    }
  });
});

describe('scoresFromTypeCode', () => {
  it('round-trips all sixteen types', () => {
    for (const code of MBTI_TYPES) {
      expect(deriveTypeCode(scoresFromTypeCode(code))).toBe(code);
    }
  });

  it('writes a clear lean, never a borderline one', () => {
    for (const code of MBTI_TYPES) {
      for (const pct of Object.values(scoresFromTypeCode(code))) {
        expect([TYPED_PCT, 100 - TYPED_PCT]).toContain(pct);
        expect(isBorderline(pct)).toBe(false);
      }
    }
  });
});

describe('the quiz', () => {
  it('has three questions per dimension, twelve in all, with unique ids', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(12);
    const perDim = QUIZ_QUESTIONS.reduce<Record<string, number>>(
      (acc, q) => ({ ...acc, [q.dim]: (acc[q.dim] ?? 0) + 1 }),
      {},
    );
    expect(perDim).toEqual({ ie: 3, sn: 3, tf: 3, jp: 3 });
    expect(new Set(QUIZ_QUESTIONS.map((q) => q.id)).size).toBe(12);
  });

  it('never asks the same dimension twice in a row', () => {
    for (let i = 1; i < QUIZ_QUESTIONS.length; i++) {
      expect(QUIZ_QUESTIONS[i].dim).not.toBe(QUIZ_QUESTIONS[i - 1].dim);
    }
  });

  it('offers one option toward each pole on every question', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options.map((o) => o.toward).sort(), q.id).toEqual(['left', 'right']);
    }
  });

  it('does not produce a type when the reader always picks the first option', () => {
    const firsts: QuizAnswers = Object.fromEntries(QUIZ_QUESTIONS.map((q) => [q.id, q.options[0].toward]));
    const scores = scoresFromQuiz(firsts)!;
    // Some dimension must come out split 2-1, not swept, or position alone would decide it.
    expect(Object.values(scores).some((pct) => isBorderline(pct))).toBe(true);
  });
});

describe('scoresFromQuiz', () => {
  const all = (pole: 'left' | 'right'): QuizAnswers => Object.fromEntries(QUIZ_QUESTIONS.map((q) => [q.id, pole]));

  it('scores a clean sweep at 80 / 20', () => {
    expect(scoresFromQuiz(all('right'))).toEqual({ e: 80, n: 80, f: 80, p: 80 });
    expect(scoresFromQuiz(all('left'))).toEqual({ e: 20, n: 20, f: 20, p: 20 });
    expect(deriveTypeCode(scoresFromQuiz(all('right'))!)).toBe('ENFP');
    expect(deriveTypeCode(scoresFromQuiz(all('left'))!)).toBe('ISTJ');
  });

  it('scores a 2-1 split inside the borderline band, resolving to the majority letter', () => {
    const answers = all('left');
    // Two of three Energy answers toward E.
    answers.ie1 = 'right';
    answers.ie2 = 'right';
    // One of three Mind answers toward N.
    answers.sn1 = 'right';
    const scores = scoresFromQuiz(answers)!;
    expect(scores.e).toBe(QUIZ_PCT[2]);
    expect(scores.n).toBe(QUIZ_PCT[1]);
    expect(isBorderline(scores.e)).toBe(true);
    expect(isBorderline(scores.n)).toBe(true);
    expect(deriveTypeCode(scores)).toBe('ESTJ');
  });

  it('returns null until every question is answered', () => {
    const answers = all('right');
    delete answers.jp3;
    expect(scoresFromQuiz(answers)).toBeNull();
    expect(scoresFromQuiz({})).toBeNull();
  });
});
