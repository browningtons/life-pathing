import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Keyboard, ListChecks, RotateCcw } from 'lucide-react';
import { getMbtiData } from '../data/mbti';
import { QUIZ_QUESTIONS } from '../data/quiz';
import { ASIDE, BODY, FOCUS_RING, MICRO_LABEL } from '../design/tokens';
import type { DimensionScores } from '../data/profile';
import type { QuizPole } from '../data/quiz';
import type { DimensionDetail } from '../lib/deriveType';
import { trackLettersEntered, trackQuizStarted } from '../lib/funnel';
import { parseTypeCode, scoresFromQuiz, scoresFromTypeCode, type QuizAnswers } from '../lib/letters';
import { useNav } from '../store/useNav';
import { useProfile } from '../store/useProfile';
import { Card } from './Card';
import { SectionHeading } from './SectionHeading';
import { TypeCode } from './TypeCode';

/** Anchor the sample banner scrolls to. */
export const LETTERS_ASK_ID = 'letters-ask';

type Phase = 'ask' | 'typed' | 'quiz' | 'done';

const PRIMARY = `inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 ${FOCUS_RING}`;
const SECONDARY = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 ${FOCUS_RING}`;
// Padded to a 28px tap target, pulled back by the same amount so it still lines up with the text around it.
const QUIET = `-m-1.5 inline-flex items-center gap-1.5 rounded-md p-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 ${FOCUS_RING}`;

/**
 * The second half of the reading: four letters, asked for right after a
 * reader's own Life Path appears. Either typed, or found with a
 * twelve-question quiz that stays on this page.
 *
 * Shown once the birthdate is the reader's own and the letters are still
 * the sample's. Once letters arrive the ask would normally vanish; the
 * `done` phase keeps it on screen long enough to show the result and hand
 * the reader to the Profile.
 */
export const LettersAsk = () => {
  const { ownBirthDate, lettersKnown, dimensions, typeCode, setLetters } = useProfile();
  const { go } = useNav();
  const [phase, setPhase] = useState<Phase>('ask');

  if (phase === 'ask' && (!ownBirthDate || lettersKnown)) return null;

  const finish = (source: 'quiz' | 'typed', scores: DimensionScores) => {
    setLetters(scores, source);
    trackLettersEntered(source);
    setPhase('done');
  };

  return (
    <Card id={LETTERS_ASK_ID} tabIndex={-1} variant="tinted" className="outline-none">
      {phase === 'ask' && (
        <>
          <SectionHeading icon={ListChecks} tone="indigo" className="!mb-3">
            The other half
          </SectionHeading>
          <p className={`${BODY} max-w-2xl`}>
            A Life Path is one lens. This app lays a second one over it, four letters of type, and reads the two
            together. If you know yours, type it in. If not, twelve quick choices will find a lean.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className={PRIMARY}
              onClick={() => {
                trackQuizStarted();
                setPhase('quiz');
              }}
            >
              <ListChecks size={14} aria-hidden="true" /> Twelve quick questions
            </button>
            <button type="button" className={SECONDARY} onClick={() => setPhase('typed')}>
              <Keyboard size={14} aria-hidden="true" /> I know my type
            </button>
          </div>
          <p className={`${ASIDE} mt-3`}>About two minutes. Nothing leaves this browser.</p>
        </>
      )}

      {phase === 'typed' && (
        <TypedLetters
          onCancel={() => setPhase(lettersKnown ? 'done' : 'ask')}
          onDone={(code) => finish('typed', scoresFromTypeCode(code))}
        />
      )}

      {phase === 'quiz' && (
        <Quiz
          // A retake that is backed out of returns to the result it came from.
          onCancel={() => setPhase(lettersKnown ? 'done' : 'ask')}
          onDone={(answers) => {
            const scores = scoresFromQuiz(answers);
            if (scores) finish('quiz', scores);
          }}
        />
      )}

      {phase === 'done' && (
        <Result
          typeCode={typeCode}
          dimensions={dimensions}
          onContinue={() => go('profile')}
          onRetake={() => setPhase('quiz')}
        />
      )}
    </Card>
  );
};

// ── Typed ─────────────────────────────────────────────────────────────

const TypedLetters = ({ onCancel, onDone }: { onCancel: () => void; onDone: (code: string) => void }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const code = parseTypeCode(value);
    if (!code) {
      setError('Four letters, one from each pair, in order: E or I, S or N, T or F, J or P.');
      return;
    }
    onDone(code);
  };

  return (
    <form onSubmit={submit}>
      <SectionHeading icon={Keyboard} tone="indigo" className="!mb-3">
        Your four letters
      </SectionHeading>
      <label htmlFor="typed-letters" className={`${BODY} block mb-3`}>
        From any test you have taken. A suffix like -A or -T is fine; it is dropped.
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          id="typed-letters"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          maxLength={8}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={error !== null}
          aria-describedby="typed-letters-error"
          placeholder="Four letters"
          className={`w-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-lg font-bold uppercase tracking-[0.2em] text-slate-800 placeholder:text-sm placeholder:font-medium placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 ${FOCUS_RING}`}
        />
        <button type="submit" className={PRIMARY} disabled={value.trim().length === 0}>
          Read it <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className={QUIET} onClick={onCancel}>
          <ArrowLeft size={12} aria-hidden="true" /> Back
        </button>
      </div>
      <p id="typed-letters-error" className="mt-2 min-h-[1rem] text-xs text-rose-600" aria-live="polite">
        {error}
      </p>
    </form>
  );
};

// ── Quiz ──────────────────────────────────────────────────────────────

const Quiz = ({ onCancel, onDone }: { onCancel: () => void; onDone: (answers: QuizAnswers) => void }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const promptRef = useRef<HTMLHeadingElement>(null);
  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[index];

  // Move focus to each new question so keyboard and screen-reader users
  // follow the quiz without hunting for it.
  useEffect(() => promptRef.current?.focus(), [index]);

  const answer = (pole: QuizPole) => {
    const next = { ...answers, [question.id]: pole };
    setAnswers(next);
    if (index + 1 < total) setIndex(index + 1);
    else onDone(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className={MICRO_LABEL}>
          Question {index + 1} of {total}
        </span>
        <button type="button" className={QUIET} onClick={() => (index === 0 ? onCancel() : setIndex(index - 1))}>
          <ArrowLeft size={12} aria-hidden="true" /> Back
        </button>
      </div>
      <div
        className="h-1.5 rounded-full bg-indigo-100 overflow-hidden mb-5"
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <h3 ref={promptRef} tabIndex={-1} className="text-base sm:text-lg font-bold text-slate-900 mb-4 outline-none">
        {question.prompt} …
      </h3>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Choose one">
        {question.options.map((option) => {
          const chosen = answers[question.id] === option.toward;
          return (
            <button
              key={option.text}
              type="button"
              aria-pressed={chosen}
              onClick={() => answer(option.toward)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${FOCUS_RING} ${
                chosen
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40'
              }`}
            >
              {option.text}
            </button>
          );
        })}
      </div>
      <p className={`${ASIDE} mt-4`}>Pick the one that is more often true, not the one you would like to be true.</p>
    </div>
  );
};

// ── Result ────────────────────────────────────────────────────────────

interface ResultProps {
  typeCode: string;
  dimensions: DimensionDetail[];
  onContinue: () => void;
  onRetake: () => void;
}

const Result = ({ typeCode, dimensions, onContinue, onRetake }: ResultProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const title = getMbtiData(typeCode).title;
  const borderline = dimensions.filter((d) => d.borderline);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div aria-live="polite">
      <div className={`${MICRO_LABEL} !text-indigo-500 mb-2`}>Read as</div>
      <h3 ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-slate-900 outline-none">
        <TypeCode letters={dimensions} /> <span className="text-lg font-medium text-indigo-600">· {title}</span>
      </h3>
      <p className={`${BODY} mt-2 max-w-2xl`}>
        {borderline.length > 0
          ? `The underlined ${borderline.length === 1 ? 'letter is' : 'letters are'} a two-to-one lean, close enough to go either way. The other pages mark ${borderline.length === 1 ? 'it' : 'them'} the same way.`
          : 'A clear lean on all four letters.'}{' '}
        Your number and your type are now read together on the Profile.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={PRIMARY} onClick={onContinue}>
          See the two read together <ArrowRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className={QUIET} onClick={onRetake}>
          <RotateCcw size={12} aria-hidden="true" /> Take the questions again
        </button>
      </div>
    </div>
  );
};
