import {
  Layers,
  Star,
  Users,
  Gem,
  Briefcase,
  Target,
  Heart,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Compass,
} from 'lucide-react';
import { useEffect } from 'react';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { HeroCard } from '../components/HeroCard';
import { LettersAsk } from '../components/LettersAsk';
import { SectionHeading } from '../components/SectionHeading';
import { COMPOUND_MEANINGS } from '../data/compoundMeanings';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import {
  BODY,
  EYEBROW,
  FOCUS_RING_ON_DARK,
  HERO_BODY,
  HERO_PANEL,
  HERO_SUBTITLE,
  HERO_TITLE,
  MICRO_LABEL,
  toneFor,
  type Tone,
} from '../design/tokens';
import { birthDateNote, reductionSteps } from '../lib/calculateLifePath';
import { trackLifePathShown } from '../lib/funnel';
import { useProfile } from '../store/useProfile';
import type { LifePathEntry } from '../types';

const FALLBACK_MEANING: LifePathEntry = {
  title: '',
  keywords: '',
  description: 'Add a birthdate above and the path appears here.',
  purpose: '',
  love: '',
  career: '',
  light: [],
  shadows: [],
  famous: [],
};

/** The hero's date input, so the sample banner can send a reader straight to it. */
export const BIRTHDATE_INPUT_ID = 'lifepath-birthdate';

export const LifePathView = () => {
  const { profile, lifePath, ownBirthDate, setBirthDate } = useProfile();
  const meaning = LIFE_PATH_MEANINGS[lifePath.number] ?? FALLBACK_MEANING;
  const { breakdown, compound } = lifePath;
  const compoundMeaning = COMPOUND_MEANINGS[compound] ?? null;
  const isEmpty = lifePath.number === 0;
  const dateNote = birthDateNote(profile.birthDate);
  const totalSteps = reductionSteps(compound);

  // The top of the funnel: a reader's own birthdate produced a number.
  useEffect(() => {
    if (ownBirthDate && lifePath.number > 0) trackLifePathShown(lifePath.number);
  }, [ownBirthDate, lifePath.number]);

  // A reader's own birthdate puts the letters ask first: the reduction table
  // drops out of the hero to sit under the ask, so the ask lands on the first
  // screen. The sample profile keeps the table beside the number.
  const panelBelow = ownBirthDate && !isEmpty;
  const reductionPanel = (
          <div className={`${HERO_PANEL} ${panelBelow ? '' : 'md:col-span-2'}`}>
            <h3 className={`${EYEBROW} text-indigo-200/80 mb-2 flex items-center gap-2`}>
              <Layers size={14} aria-hidden="true" /> How the number is found
            </h3>
            <p className="text-[10px] text-indigo-100/60 mb-6">
              Year, month and day are each reduced to a single digit, added, and reduced again. The master numbers 11,
              22 and 33 are kept as they are.
            </p>

            {isEmpty ? (
              <p className="text-sm text-indigo-100/80">Add a birthdate and every step shows here.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className={`flex justify-between items-center ${MICRO_LABEL} !text-indigo-100/60 px-2`}>
                  <span>Input</span>
                  <span>Reduction</span>
                  <span>Final</span>
                </div>

                <div className="space-y-3">
                  <ReductionRow raw={breakdown.rawY} final={breakdown.y} tone="indigo" />
                  <ReductionRow raw={breakdown.rawM} final={breakdown.m} tone="purple" />
                  <ReductionRow raw={breakdown.rawD} final={breakdown.d} tone="emerald" />
                </div>

                <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="text-xs text-indigo-100/70">
                    {breakdown.y} + {breakdown.m} + {breakdown.d} ={' '}
                    <span className="text-white font-bold">{compound}</span>
                    {totalSteps.steps.length > 0 && (
                      <span className="block mt-1">
                        {compound} → {totalSteps.steps.join(' → ')}
                      </span>
                    )}
                    {totalSteps.keptMaster && (
                      <span className="block mt-1">
                        {compound} is a master number, kept as {compound}.
                      </span>
                    )}
                  </div>
                  <div className="bg-indigo-600 px-4 py-2 rounded-lg shadow-lg shadow-indigo-950/50">
                    <span className="text-2xl font-bold text-white">{lifePath.number}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HERO */}
      <HeroCard>
        <div className={`grid md:grid-cols-5 ${panelBelow ? 'gap-4 md:gap-8' : 'gap-8'} items-start`}>
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 mb-3 opacity-80">
              <Compass size={20} aria-hidden="true" />
              <span className={EYEBROW}>Reading a Life Path</span>
            </div>

            <label className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`${EYEBROW} text-indigo-200/80 flex items-center gap-1`}>
                Enter a birthdate <ArrowRight size={12} aria-hidden="true" />
              </span>
              <span className="flex items-center gap-2">
                <Calendar size={18} className="text-indigo-300" aria-hidden="true" />
                <input
                  id={BIRTHDATE_INPUT_ID}
                  type="date"
                  aria-label="Birth date"
                  value={profile.birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`bg-white/10 border border-white/10 rounded-md px-2 py-1 text-white font-bold text-base cursor-pointer [color-scheme:dark] ${FOCUS_RING_ON_DARK}`}
                />
              </span>
            </label>
            {dateNote && (
              <p className="-mt-3 mb-4 text-xs text-amber-200" role="status">
                {dateNote}
              </p>
            )}

            <div aria-live="polite" aria-atomic="true">
              <h2 className={HERO_TITLE}>{isEmpty ? 'Add a birthdate' : `Life Path ${lifePath.number}`}</h2>
              {!isEmpty && <h3 className={HERO_SUBTITLE}>{meaning.title}</h3>}
            </div>
            {!isEmpty && compound >= 10 && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-indigo-100">
                <Gem size={14} className="text-indigo-300" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {compound} / {lifePath.number}
                  {compoundMeaning ? `: ${compoundMeaning}` : ''}
                </span>
              </div>
            )}
            {!panelBelow && <p className={HERO_BODY}>{meaning.description}</p>}
          </div>

          {panelBelow ? (
            <p className={`${HERO_BODY} md:col-span-2 md:self-end`}>{meaning.description}</p>
          ) : (
            reductionPanel
          )}
        </div>
      </HeroCard>

      {/* THE OTHER HALF — four letters, asked for right after the number */}
      <LettersAsk />

      {/* HOW THE NUMBER IS FOUND: under the ask when the ask is the next thing to do */}
      {panelBelow && <HeroCard>{reductionPanel}</HeroCard>}

      {isEmpty ? null : (
        <>
          {/* WHAT THE NUMBER ASKS */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Facet icon={Target} tone="indigo" title="What the number asks of you" body={meaning.purpose} />
              <Facet icon={Heart} tone="purple" title="How the number sits in love" body={meaning.love} />
              <Facet icon={Briefcase} tone="emerald" title="How the number sits in work" body={meaning.career} />
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="tinted">
              <SectionHeading icon={Star} tone="indigo">
                When the number is well-met
              </SectionHeading>
              <ul className="space-y-3">
                {meaning.light.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card variant="muted">
              <SectionHeading icon={ShieldAlert}>Where the number breaks</SectionHeading>
              <ul className="space-y-3">
                {meaning.shadows.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <SectionHeading icon={Users}>Some who walked this path</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {meaning.famous.length > 0 ? (
                  meaning.famous.map((person) => <Chip key={person}>{person}</Chip>)
                ) : (
                  <span className={BODY}>No names recorded for this one yet.</span>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

interface ReductionRowProps {
  raw: string;
  final: number;
  tone: Tone;
}

/** One line of the reduction: raw digits → every step → reduced value. */
const ReductionRow = ({ raw, final, tone }: ReductionRowProps) => {
  const t = toneFor(tone);
  const { steps, keptMaster } = reductionSteps(raw);
  return (
    <div className="flex items-center justify-between gap-2 bg-white/5 p-2 rounded-lg">
      <div className={`text-sm font-mono ${t.textOnDark} w-12 shrink-0`}>{raw}</div>
      <ArrowRight size={12} className="text-indigo-100/40 shrink-0" aria-hidden="true" />
      <div className="text-xs text-indigo-100/70 flex-1 min-w-0">
        {steps.length > 0 ? (
          <>
            {steps.join(' → ')}
            {keptMaster && <span className="text-white font-bold">, kept as {final}</span>}
          </>
        ) : (
          final
        )}
      </div>
      <ArrowRight size={12} className="text-indigo-100/40 shrink-0" aria-hidden="true" />
      <div className={`text-xl font-bold ${t.textOnDark} w-8 text-right shrink-0`}>{final}</div>
    </div>
  );
};

interface FacetProps {
  icon: typeof Target;
  tone: Tone;
  title: string;
  body: string;
}

const Facet = ({ icon: Icon, tone, title, body }: FacetProps) => (
  <div className="flex gap-3">
    <div className={`mt-1 ${toneFor(tone).text}`}>
      <Icon size={18} aria-hidden="true" />
    </div>
    <div>
      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">{title}</h4>
      <p className={BODY}>{body}</p>
    </div>
  </div>
);
