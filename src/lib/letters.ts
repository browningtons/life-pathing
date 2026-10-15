// Turning letters into stored dimension scores.
//
// The profile stores percentages, never letters, so both ways a reader can
// supply a type — typing four letters, or taking the quiz — have to pick a
// percentage. The numbers are chosen against the app's borderline band
// (45–55, see deriveType):
//
//   typed         70 / 30   a stated type is a clear lean, never borderline
//   quiz 3 of 3   80 / 20   a clean sweep
//   quiz 2 of 3   55 / 45   inside the band, so it is flagged the way a
//                           near-even report score is
//
// Three questions cannot tie, so the quiz never produces a dead-even 50.

import type { DimensionScores } from '../data/profile';
import { QUIZ_QUESTIONS, type QuizPole, type QuizQuestion } from '../data/quiz';
import type { MbtiDimension } from '../types';

export const TYPED_PCT = 70;

/** Percent toward the right-hand pole, by how many of three answers leaned right. */
export const QUIZ_PCT: Record<number, number> = { 3: 80, 2: 55, 1: 45, 0: 20 };

const SCORE_KEY: Record<MbtiDimension, keyof DimensionScores> = { ie: 'e', sn: 'n', tf: 'f', jp: 'p' };

/** Four letters, optionally followed by the A/T identity suffix 16personalities adds. */
const TYPE_CODE = /^([EI][SN][TF][JP])(?:-?[AT])?$/;

/**
 * A four-letter type from whatever the reader typed, or null. Accepts
 * lower case, stray spaces, and the identity suffix ("INFJ-T", "infj a").
 */
export function parseTypeCode(input: string): string | null {
  const match = input.toUpperCase().replace(/\s+/g, '').match(TYPE_CODE);
  return match ? match[1] : null;
}

const POSITIONS = [
  { name: 'First', pair: 'E or I', ok: /^[EI]$/ },
  { name: 'Second', pair: 'S or N', ok: /^[SN]$/ },
  { name: 'Third', pair: 'T or F', ok: /^[TF]$/ },
  { name: 'Fourth', pair: 'J or P', ok: /^[JP]$/ },
];

export interface TypeCodeCheck {
  /** The four-letter code, when the input is a complete valid type. */
  code: string | null;
  /** What is wrong so far, naming the first bad position; null while valid or merely unfinished. */
  error: string | null;
}

/**
 * Check what the reader has typed so far. Wrong letters are named as soon
 * as they appear ("Second letter: S or N, not X."); a short but so-far
 * valid entry has no error and no code, so the form just waits.
 */
export function checkTypeCode(input: string): TypeCodeCheck {
  const cleaned = input.toUpperCase().replace(/\s+/g, '');
  for (let i = 0; i < Math.min(4, cleaned.length); i++) {
    const pos = POSITIONS[i];
    if (!pos.ok.test(cleaned[i])) {
      return { code: null, error: `${pos.name} letter: ${pos.pair}, not ${cleaned[i]}.` };
    }
  }
  if (cleaned.length < 4) return { code: null, error: null };
  const code = parseTypeCode(cleaned);
  if (code) return { code, error: null };
  return { code: null, error: 'After the four letters only a -A or -T suffix is allowed.' };
}

/** Stored scores for a typed type code: 70 toward each named letter. */
export function scoresFromTypeCode(code: string): DimensionScores {
  const lean = (letter: string, right: string) => (letter === right ? TYPED_PCT : 100 - TYPED_PCT);
  return {
    e: lean(code[0], 'E'),
    n: lean(code[1], 'N'),
    f: lean(code[2], 'F'),
    p: lean(code[3], 'P'),
  };
}

export type QuizAnswers = Record<string, QuizPole>;

/**
 * Stored scores from a finished quiz, or null if any question is
 * unanswered. Each dimension's score comes from how many of its three
 * answers leaned toward the right-hand pole.
 */
export function scoresFromQuiz(
  answers: QuizAnswers,
  questions: QuizQuestion[] = QUIZ_QUESTIONS,
): DimensionScores | null {
  const rightCounts: Record<MbtiDimension, number> = { ie: 0, sn: 0, tf: 0, jp: 0 };
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer !== 'left' && answer !== 'right') return null;
    if (answer === 'right') rightCounts[question.dim] += 1;
  }
  const out = { e: 50, n: 50, f: 50, p: 50 } as DimensionScores;
  for (const dim of Object.keys(rightCounts) as MbtiDimension[]) {
    out[SCORE_KEY[dim]] = QUIZ_PCT[rightCounts[dim]];
  }
  return out;
}
