// The letters quiz — twelve forced choices, three per dimension, that turn
// a birthdate-only reader into a reader with four letters without sending
// them to another site's sixty-question test.
//
// It is a rough instrument on purpose. It produces letters and a lean, not
// facets, and it says so. Scoring lives in lib/letters.ts.
//
// Rules the tests hold this to:
//   - exactly three questions per dimension, interleaved, never two in a row
//   - every question has one option toward each pole
//   - which pole is listed first varies, so "always pick the top one" does
//     not produce a type

import type { MbtiDimension } from '../types';

/** Which pole of the dimension an option leans toward (right = E, N, F, P). */
export type QuizPole = 'left' | 'right';

export interface QuizOption {
  text: string;
  toward: QuizPole;
}

export interface QuizQuestion {
  id: string;
  dim: MbtiDimension;
  prompt: string;
  options: [QuizOption, QuizOption];
}

const q = (id: string, dim: MbtiDimension, prompt: string, a: QuizOption, b: QuizOption): QuizQuestion => ({
  id,
  dim,
  prompt,
  options: [a, b],
});
const toward =
  (pole: QuizPole) =>
  (text: string): QuizOption => ({ text, toward: pole });
const L = toward('left');
const R = toward('right');

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  q(
    'ie1',
    'ie',
    'After a long week, the evening that puts you back together is spent',
    R('with other people'),
    L('mostly on your own'),
  ),
  q(
    'sn1',
    'sn',
    'When someone gives you directions, you want',
    R('the general lay of the land'),
    L('the turns and the landmarks'),
  ),
  q(
    'tf1',
    'tf',
    'When a friend brings you a problem, your first move is to work out',
    L('what would fix it'),
    R('how it sits with them'),
  ),
  q('jp1', 'jp', 'A free Saturday is better', R('left open'), L('with a plan for it')),
  q('ie2', 'ie', 'You tend to find out what you think', L('before you say it'), R('by saying it')),
  q('sn2', 'sn', 'You put more trust in', L('what has already happened'), R('what could happen next')),
  q(
    'tf2',
    'tf',
    'A hard call is settled, in the end, by',
    R('the people it will land on'),
    L('the principle that applies'),
  ),
  q(
    'jp2',
    'jp',
    'With a deadline a month away, the work',
    L('starts early and runs steady'),
    R('gathers speed near the end'),
  ),
  q('ie3', 'ie', 'At a gathering, you drift toward', L('one or two people at the edge'), R('wherever the talk is')),
  q('sn3', 'sn', 'A good explanation starts with', R('the idea behind it'), L('an example')),
  q('tf3', 'tf', 'The decision that bothers you more is one that', L('makes no sense'), R('leaves someone out')),
  q('jp3', 'jp', 'You rest easier when the question is', L('decided'), R('still open')),
];
