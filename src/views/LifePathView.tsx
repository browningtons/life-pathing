import { Layers, Star, Users, Gem, Briefcase, Target, Heart, ArrowRight, ShieldAlert, Calendar, Compass } from 'lucide-react';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { HeroCard } from '../components/HeroCard';
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
import { useProfile } from '../store/useProfile';
import type { LifePathEntry } from '../types';

const FALLBACK_MEANING: LifePathEntry = {
  title: 'Unknown Path',
  keywords: '',
  description: 'Enter a birth date to reveal the path.',
  purpose: '',
  love: '',
  career: '',
  light: [],
  shadows: [],
  famous: [],
};

export const LifePathView = () => {
  const { profile, lifePath, setBirthDate } = useProfile();
  const meaning = LIFE_PATH_MEANINGS[lifePath.number] ?? FALLBACK_MEANING;
  const { breakdown, compound } = lifePath;
  const compoundMeaning = COMPOUND_MEANINGS[compound] ?? null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HERO */}
      <HeroCard>
        <div className="grid md:grid-cols-5 gap-8 items-start">
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
                  type="date"
                  aria-label="Birth date"
                  value={profile.birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`bg-white/10 border border-white/10 rounded-md px-2 py-1 text-white font-bold text-base cursor-pointer [color-scheme:dark] ${FOCUS_RING_ON_DARK}`}
                />
              </span>
            </label>

            <div aria-live="polite" aria-atomic="true">
              <h2 className={HERO_TITLE}>Life Path {lifePath.number}</h2>
              <h3 className={HERO_SUBTITLE}>{meaning.title}</h3>
            </div>
            {compoundMeaning && (
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-indigo-100">
                <Gem size={14} className="text-indigo-300" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {compound} / {lifePath.number}: {compoundMeaning}
                </span>
              </div>
            )}
            <p className={HERO_BODY}>{meaning.description}</p>
          </div>

          <div className={`${HERO_PANEL} md:col-span-2`}>
            <h3 className={`${EYEBROW} text-indigo-200/80 mb-2 flex items-center gap-2`}>
              <Layers size={14} aria-hidden="true" /> How the number is found
            </h3>
            <p className="text-[10px] text-indigo-100/60 mb-6">
              A birthdate. Added together. Reduced to a single digit. That is the whole of the math.
            </p>

            <div className="flex flex-col gap-4">
              <div className={`flex justify-between items-center ${MICRO_LABEL} !text-indigo-100/60 px-2`}>
                <span>Input</span>
                <span>Reduction</span>
                <span>Final</span>
              </div>

              <div className="space-y-3">
                <ReductionRow raw={breakdown.rawY} sum={breakdown.ySum} final={breakdown.y} tone="indigo" />
                <ReductionRow raw={breakdown.rawM} sum={breakdown.mSum} final={breakdown.m} tone="purple" />
                <ReductionRow raw={breakdown.rawD} sum={breakdown.dSum} final={breakdown.d} tone="emerald" />
              </div>

              <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs text-indigo-100/70">
                  {breakdown.y} + {breakdown.m} + {breakdown.d} ={' '}
                  <span className="text-white font-bold">{breakdown.y + breakdown.m + breakdown.d}</span>
                </div>
                <div className="bg-indigo-600 px-4 py-2 rounded-lg shadow-lg shadow-indigo-950/50">
                  <span className="text-2xl font-bold text-white">{lifePath.number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeroCard>

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
    </div>
  );
};

interface ReductionRowProps {
  raw: string;
  sum: number;
  final: number;
  tone: Tone;
}

/** One line of the reduction: raw digits → digit sum → reduced value. */
const ReductionRow = ({ raw, sum, final, tone }: ReductionRowProps) => {
  const value = parseInt(raw, 10);
  const needsSum = Number.isNaN(value) || value >= 10;
  const t = toneFor(tone);
  return (
    <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
      <div className={`text-sm font-mono ${t.textOnDark} w-12`}>{raw}</div>
      <ArrowRight size={12} className="text-indigo-100/40" aria-hidden="true" />
      <div className="text-xs text-indigo-100/70">
        {needsSum ? (
          <>
            {raw.split('').join('+')} = <span className="text-white font-bold">{sum}</span>
          </>
        ) : (
          value
        )}
      </div>
      <ArrowRight size={12} className="text-indigo-100/40" aria-hidden="true" />
      <div className={`text-xl font-bold ${t.textOnDark} w-6 text-right`}>{final}</div>
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
