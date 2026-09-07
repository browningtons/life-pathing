import { Star, Users, Brain, HelpCircle, Ghost } from 'lucide-react';
import { BorderlineBadge } from '../components/BorderlineBadge';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { HeroCard } from '../components/HeroCard';
import { SectionHeading } from '../components/SectionHeading';
import { TypeCode } from '../components/TypeCode';
import { getMbtiData } from '../data/mbti';
import {
  ASIDE,
  BODY,
  EYEBROW,
  FOCUS_RING_ON_DARK,
  HERO_BODY,
  HERO_PANEL,
  HERO_SUBTITLE,
  HERO_TILE,
  HERO_TITLE,
  MICRO_LABEL,
} from '../design/tokens';
import type { DimensionDetail } from '../lib/deriveType';
import { useProfile } from '../store/useProfile';
import type { MbtiDimension } from '../types';

const STACK_LABELS = ['First', 'Second', 'Third', 'Last'];

export const ArchetypesView = () => {
  const { typeCode, dimensions, toggleDimension } = useProfile();
  const data = getMbtiData(typeCode);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <HeroCard>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Brain size={20} aria-hidden="true" />
              <span className={EYEBROW}>Reading a Type</span>
            </div>
            <h2 className={HERO_TITLE}>
              <TypeCode letters={dimensions} onDark />
            </h2>
            <h3 className={HERO_SUBTITLE}>{data.title}</h3>
            <p className={HERO_BODY}>{data.desc}</p>
          </div>

          <div className={`${HERO_PANEL} grid grid-cols-2 gap-4`}>
            {dimensions.map((detail) => (
              <DimensionToggle key={detail.dim} detail={detail} onToggle={toggleDimension} />
            ))}
          </div>
        </div>
      </HeroCard>

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <SectionHeading className="!mb-0">The order of operations</SectionHeading>
          <div className="group/help relative">
            <HelpCircle size={14} className="text-slate-400 hover:text-indigo-500 cursor-help" aria-hidden="true" />
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg hidden group-hover/help:block z-50 shadow-xl">
              <strong>The order the mind reaches for things.</strong> More or less without asking.
              <br />
              <br />
              1. <strong>Dominant:</strong> the natural first move.
              <br />
              2. <strong>Auxiliary:</strong> the steady second.
              <br />
              3. <strong>Tertiary:</strong> the playful, half-formed third.
              <br />
              4. <strong>Inferior:</strong> the place stress finds.
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-around items-center">
          {data.stack.map((fn, i) => (
            <div key={fn} className="flex flex-col items-center relative w-full md:w-auto">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm mb-2 ${
                  i === 0
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-50'
                    : i === 1
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {fn}
              </div>
              <span className={MICRO_LABEL}>{STACK_LABELS[i]}</span>
              {i < 3 && <div className="hidden md:block absolute top-6 left-1/2 ml-6 w-full h-px bg-slate-100 z-0" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="positive">
          <SectionHeading icon={Star} tone="emerald">
            What the type does well
          </SectionHeading>
          <ul className="space-y-2 mb-6">
            {data.strengths.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-emerald-700">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {s}
              </li>
            ))}
          </ul>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 text-xs text-emerald-800 italic">
            <span className="font-bold text-emerald-900 not-italic block mb-1">A note:</span>"{data.strength_tip}"
          </div>
        </Card>

        <Card variant="muted">
          <SectionHeading icon={Ghost}>Where the type tends to stumble</SectionHeading>
          <ul className="space-y-2 mb-6">
            {data.shadows.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                {s}
              </li>
            ))}
          </ul>
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 italic">
            <span className="font-bold text-slate-800 not-italic block mb-1">A note:</span>"{data.growth}"
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading icon={Users}>Some who carry this type</SectionHeading>
        <p className={`${ASIDE} mb-4`}>
          A few names recorded as <TypeCode letters={dimensions} />.
        </p>
        <div className="flex flex-wrap gap-2">
          {data.famous.length > 0 ? (
            data.famous.map((person) => <Chip key={person}>{person}</Chip>)
          ) : (
            <span className={BODY}>No names recorded for this one yet.</span>
          )}
        </div>
      </Card>
    </div>
  );
};

interface DimensionToggleProps {
  detail: DimensionDetail;
  onToggle: (dim: MbtiDimension) => void;
}

const DimensionToggle = ({ detail, onToggle }: DimensionToggleProps) => {
  const { dim, label, left, right, letter, pct, borderline, tooltip } = detail;
  const favorsLeft = letter === left.letter;
  const other = favorsLeft ? right.letter : left.letter;

  return (
    <button
      type="button"
      onClick={() => onToggle(dim)}
      aria-label={`${label}: ${letter} at ${pct}%${borderline ? ', borderline' : ''}. Click to toggle to ${other}.`}
      title={tooltip}
      className={`flex flex-col items-center p-3 ${HERO_TILE} hover:bg-black/30 transition-colors relative ${FOCUS_RING_ON_DARK}`}
    >
      <div className="absolute top-2 right-2">
        <div className="group/help relative">
          <HelpCircle size={14} className="text-white/30 hover:text-white" aria-hidden="true" />
          <div
            role="tooltip"
            className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-black text-white text-[10px] rounded hidden group-hover/help:block z-50 shadow-lg"
          >
            {tooltip}
          </div>
        </div>
      </div>
      <span className="text-xs opacity-50 mb-1">{label}</span>
      <div className="flex items-center gap-2 font-bold">
        <span className={favorsLeft ? 'text-white' : 'text-white/30'}>{left.letter}</span>
        <div className="w-8 h-4 bg-white/20 rounded-full relative">
          <div
            className={`absolute top-0.5 bottom-0.5 w-3 bg-white rounded-full transition-all ${
              favorsLeft ? 'left-0.5' : 'right-0.5'
            }`}
          />
        </div>
        <span className={favorsLeft ? 'text-white' : 'text-white/30'}>{right.letter}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px]">
        <span className="font-bold text-white/80">
          {letter} {pct}%
        </span>
        {borderline && <BorderlineBadge onDark pct={pct} />}
      </div>
    </button>
  );
};
