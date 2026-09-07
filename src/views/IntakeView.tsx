import { useMemo, useState } from 'react';
import { Calendar, ClipboardPaste, RotateCcw, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Brain, Zap, Heart, Compass } from 'lucide-react';
import { BorderlineBadge } from '../components/BorderlineBadge';
import { Card } from '../components/Card';
import { HeroCard } from '../components/HeroCard';
import { SectionHeading } from '../components/SectionHeading';
import { TypeCode } from '../components/TypeCode';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import { DIMENSION_ORDER, DIMENSIONS, getMbtiData } from '../data/mbti';
import { categories, categoryMeta, FACET_CATALOG, type TraitCategory } from '../data/personality';
import {
  ASIDE,
  BODY,
  EYEBROW,
  FOCUS_RING,
  FOCUS_RING_ON_DARK,
  HERO_BODY,
  HERO_PANEL,
  HERO_SUBTITLE,
  HERO_TILE,
  HERO_TITLE,
  MICRO_LABEL,
  toneFor,
  type Tone,
} from '../design/tokens';
import { isBorderline, rawScore } from '../lib/deriveType';
import { parseReport } from '../lib/parseReport';
import { useProfile } from '../store/useProfile';
import type { MbtiDimension } from '../types';

const CATEGORY_ICONS: Record<TraitCategory, LucideIcon> = {
  Cognitive: Brain,
  Energy: Zap,
  Values: Heart,
  Lifestyle: Compass,
};

const DIM_KEY: Record<MbtiDimension, 'e' | 'n' | 'f' | 'p'> = { ie: 'e', sn: 'n', tf: 'f', jp: 'p' };

const INPUT =
  'rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-bold text-slate-800 tabular-nums ' + FOCUS_RING;

export const IntakeView = () => {
  const { profile, typeCode, dimensions, lifePath, isSample, setBirthDate, setDimensionScore, setFacetScore, updateProfile, resetProfile } =
    useProfile();
  const mbti = getMbtiData(typeCode);
  const lp = LIFE_PATH_MEANINGS[lifePath.number];

  const [pasted, setPasted] = useState('');
  const [pasteNote, setPasteNote] = useState<string | null>(null);
  const parsed = useMemo(() => parseReport(pasted), [pasted]);
  const parsedDims = Object.keys(parsed.dimensions).length;
  const parsedFacets = Object.keys(parsed.facets).length;

  const applyPaste = () => {
    if (parsed.matched === 0) {
      setPasteNote('Nothing recognised yet. Paste lines like "Insightful 94%" or "Extraverted 51%".');
      return;
    }
    updateProfile({ dimensions: parsed.dimensions, facets: parsed.facets });
    setPasteNote(
      `Read ${parsedDims} of 4 dimensions and ${parsedFacets} of 23 facets. Anything not found kept its current value.`,
    );
    setPasted('');
  };

  const onReset = () => {
    if (window.confirm('Replace your scores with the sample profile? This clears what is saved on this device.')) {
      resetProfile();
      setPasteNote(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HERO */}
      <HeroCard>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <SlidersHorizontal size={20} aria-hidden="true" />
              <span className={EYEBROW}>Your Data</span>
            </div>
            <h2 className={HERO_TITLE}>Enter your own scores</h2>
            <h3 className={HERO_SUBTITLE}>{isSample ? 'You are reading a sample profile' : 'This is your profile'}</h3>
            <p className={HERO_BODY}>
              Bring a TypeFinder or 16personalities result. A birthdate, four dimension percentages, and the twenty-three
              facets are the only inputs. Everything else on the other tabs is read from them.
            </p>
            <p className={`${HERO_BODY} mt-3 flex items-center gap-2 !text-indigo-200/70`}>
              <Save size={14} aria-hidden="true" /> Saved automatically, on this device only.
            </p>
          </div>

          <div className={HERO_PANEL}>
            <div className={`${EYEBROW} text-indigo-200/80 mb-3`}>Live reading</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 ${HERO_TILE}`}>
                <div className={`${MICRO_LABEL} !text-white/40 mb-1`}>Type</div>
                <div className="text-3xl font-bold leading-none">
                  <TypeCode letters={dimensions} onDark />
                </div>
                <div className="text-xs text-indigo-200 mt-2">{mbti.title}</div>
              </div>
              <div className={`p-4 ${HERO_TILE}`}>
                <div className={`${MICRO_LABEL} !text-white/40 mb-1`}>Life Path</div>
                <div className="text-3xl font-bold leading-none">{lifePath.number || '—'}</div>
                <div className="text-xs text-indigo-200 mt-2">{lp?.title ?? 'Enter a birthdate'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onReset}
              className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40 ${FOCUS_RING_ON_DARK}`}
              disabled={isSample}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset to the sample profile
            </button>
          </div>
        </div>
      </HeroCard>

      {/* PASTE */}
      <Card>
        <SectionHeading icon={ClipboardPaste} tone="indigo">
          Paste a report
        </SectionHeading>
        <p className={`${ASIDE} mb-3`}>
          Copy the facet list or trait summary from your results page and paste it here. Lines like "Insightful 94%" or
          "Extraverted 51%" are read; everything else is ignored.
        </p>
        <label htmlFor="report-paste" className="sr-only">
          Pasted report text
        </label>
        <textarea
          id="report-paste"
          value={pasted}
          onChange={(e) => {
            setPasted(e.target.value);
            setPasteNote(null);
          }}
          rows={5}
          placeholder={'Extraverted 51%\nIntuitive 73%\nInsightful 94%\nAesthetic 90%\n…'}
          className={`w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-mono text-slate-700 placeholder:text-slate-400 ${FOCUS_RING}`}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={applyPaste}
            disabled={pasted.trim().length === 0}
            className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 ${FOCUS_RING}`}
          >
            <Sparkles size={14} aria-hidden="true" /> Read it
          </button>
          <span className="text-xs text-slate-500" aria-live="polite">
            {pasteNote ??
              (pasted.trim().length > 0
                ? `Recognised ${parsedDims} dimension${parsedDims === 1 ? '' : 's'} and ${parsedFacets} facet${
                    parsedFacets === 1 ? '' : 's'
                  } so far.`
                : '')}
          </span>
        </div>
      </Card>

      {/* BIRTHDATE */}
      <Card>
        <SectionHeading icon={Calendar} tone="indigo">
          Birthdate
        </SectionHeading>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="date"
            aria-label="Birth date"
            value={profile.birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className={`${INPUT} text-base`}
          />
          <p className={BODY}>
            The Life Path number is reduced from the month, day, and year. The Life Path tab shows the working.
          </p>
        </div>
      </Card>

      {/* DIMENSIONS */}
      <Card>
        <SectionHeading icon={SlidersHorizontal} tone="indigo">
          The four dimensions
        </SectionHeading>
        <p className={`${ASIDE} mb-4`}>
          Pick the side your report names, then enter its percentage. Anything between 45 and 55 is flagged borderline;
          a dead-even 50 is read toward the right-hand letter.
        </p>
        <div className="divide-y divide-slate-100">
          {DIMENSION_ORDER.map((dim) => {
            const meta = DIMENSIONS[dim];
            return (
              <PoleInput
                key={dim}
                id={`dim-${dim}`}
                label={meta.label}
                left={`${meta.poles.left.letter} · ${meta.poles.left.name}`}
                right={`${meta.poles.right.letter} · ${meta.poles.right.name}`}
                rightPct={rawScore(profile.dimensions, dim)}
                onChange={(pct) => setDimensionScore(dim, pct)}
                tone={meta.tone}
                showBorderline
              />
            );
          })}
        </div>
        <p className={`${ASIDE} mt-3 !text-slate-400`}>
          Stored as percentages toward {DIMENSION_ORDER.map((d) => DIMENSIONS[d].poles.right.letter).join(', ')} —{' '}
          {DIMENSION_ORDER.map((d) => `${DIM_KEY[d]} ${rawScore(profile.dimensions, d)}`).join(' · ')}.
        </p>
      </Card>

      {/* FACETS */}
      {categories.map((cat) => {
        const Icon = CATEGORY_ICONS[cat];
        const specs = FACET_CATALOG.filter((f) => f.category === cat);
        return (
          <Card key={cat}>
            <SectionHeading icon={Icon} tone={categoryMeta[cat].tone}>
              {categoryMeta[cat].label}
            </SectionHeading>
            <div className="divide-y divide-slate-100">
              {specs.map((spec) => (
                <PoleInput
                  key={spec.right}
                  id={`facet-${spec.right}`}
                  left={spec.left}
                  right={spec.right}
                  rightPct={profile.facets[spec.right] ?? 50}
                  onChange={(pct) => setFacetScore(spec.right, pct)}
                  tone={categoryMeta[cat].tone}
                />
              ))}
            </div>
          </Card>
        );
      })}

      <p className="text-center text-xs text-slate-400 italic pt-4">
        Nothing leaves this browser. Clear your site data and the sample profile comes back.
      </p>
    </div>
  );
};

interface PoleInputProps {
  id: string;
  /** Optional row label shown above the poles (dimensions only). */
  label?: string;
  left: string;
  right: string;
  /** Stored percent toward the right-hand pole. */
  rightPct: number;
  onChange: (rightPct: number) => void;
  tone: Tone;
  showBorderline?: boolean;
}

/**
 * One row of intake: a two-way pole picker and a percentage for the side
 * picked — the way reports read ("Relaxed 66"). Writes back as the percent
 * toward the right-hand pole, which is what the profile stores.
 */
const PoleInput = ({ id, label, left, right, rightPct, onChange, tone, showBorderline = false }: PoleInputProps) => {
  const t = toneFor(tone);
  const rightDominant = rightPct >= 50;
  const dominantPct = rightDominant ? rightPct : 100 - rightPct;
  const borderline = isBorderline(rightPct);

  const pick = (side: 'left' | 'right') => {
    if (side === 'right') onChange(dominantPct);
    else onChange(100 - dominantPct);
  };

  const onPct = (raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const pct = Math.max(50, Math.min(100, Math.round(n)));
    onChange(rightDominant ? pct : 100 - pct);
  };

  const poleClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${FOCUS_RING} ${
      active ? `${t.bg} text-white shadow-sm` : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
    }`;

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      {label && <div className={`${MICRO_LABEL} mb-2`}>{label}</div>}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex flex-1 min-w-[220px] gap-1" role="group" aria-label={`${left} or ${right}`}>
          <button type="button" onClick={() => pick('left')} aria-pressed={!rightDominant} className={poleClass(!rightDominant)}>
            {left}
          </button>
          <button type="button" onClick={() => pick('right')} aria-pressed={rightDominant} className={poleClass(rightDominant)}>
            {right}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <label htmlFor={id} className="sr-only">
            Percent toward {rightDominant ? right : left}
          </label>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={50}
            max={100}
            value={dominantPct}
            onChange={(e) => onPct(e.target.value)}
            className={`${INPUT} w-16 text-right`}
          />
          <span className="text-xs font-bold text-slate-400">%</span>
          {showBorderline && borderline && <BorderlineBadge pct={dominantPct} />}
        </div>
      </div>
      <div className={`mt-2 flex h-1.5 rounded-full overflow-hidden ${t.track}`} aria-hidden="true">
        <div className={rightDominant ? t.muted : t.bar} style={{ width: `${100 - rightPct}%` }} />
        <div className="w-px bg-white" />
        <div className={rightDominant ? t.bar : t.muted} style={{ width: `${rightPct}%` }} />
      </div>
    </div>
  );
};
