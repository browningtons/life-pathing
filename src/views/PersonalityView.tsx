import { useState, useMemo } from 'react';
import {
  Sparkles,
  Eye,
  Flame,
  Users,
  Layers,
  Drama,
  Brain,
  Zap,
  Heart,
  Compass,
  ChevronDown,
  Star,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../components/Card';
import {
  categories,
  categoryMeta,
  getConvergenceForMbti,
  getDescriptorsForMbti,
  getGrowthEdgesForMbti,
  getMbtiLetterDetails,
  getSynthesisForMbti,
  getTemperamentForMbti,
  getTraitsForMbti,
  getTypeMatchesForMbti,
  personasFramework,
  sections,
  sectionLabels,
  temperamentForMbti,
  type ConvergenceTheme,
  type GrowthEdge,
  type Section,
  type TemperamentEntry,
  type TemperamentName,
  type Trait,
  type TraitCategory,
  type TypeMatch,
} from '../data/personality';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import { getMbtiData } from '../data/mbti';

interface PersonalityViewProps {
  mbtiType: string;
  lifePathNumber: number;
}

interface CategoryStyle {
  text: string;
  bg: string;
  track: string;
  bar: string;
  muted: string;
}

const CATEGORY_STYLES: Record<TraitCategory, CategoryStyle> = {
  Cognitive: {
    text: 'text-sky-700',
    bg: 'bg-sky-600',
    track: 'bg-sky-100',
    bar: 'bg-sky-500',
    muted: 'bg-sky-200',
  },
  Energy: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-600',
    track: 'bg-emerald-100',
    bar: 'bg-emerald-500',
    muted: 'bg-emerald-200',
  },
  Values: {
    text: 'text-purple-700',
    bg: 'bg-purple-600',
    track: 'bg-purple-100',
    bar: 'bg-purple-500',
    muted: 'bg-purple-200',
  },
  Lifestyle: {
    text: 'text-amber-700',
    bg: 'bg-amber-600',
    track: 'bg-amber-100',
    bar: 'bg-amber-500',
    muted: 'bg-amber-200',
  },
};

const CATEGORY_ICONS: Record<TraitCategory, LucideIcon> = {
  Cognitive: Brain,
  Energy: Zap,
  Values: Heart,
  Lifestyle: Compass,
};

const SECTION_ICONS: Record<Section, LucideIcon> = {
  traits: Sparkles,
  descriptors: Eye,
  temperament: Flame,
  types: Users,
  convergence: Layers,
  personas: Drama,
};

interface PaletteEntry {
  text: string;
  bar: string;
  track: string;
  borderL: string;
}

const PALETTE: Record<string, PaletteEntry> = {
  '#9E6B9B': {
    text: 'text-purple-700',
    bar: 'bg-purple-500',
    track: 'bg-purple-100',
    borderL: 'border-l-purple-400',
  },
  '#4A7FB5': {
    text: 'text-sky-700',
    bar: 'bg-sky-500',
    track: 'bg-sky-100',
    borderL: 'border-l-sky-400',
  },
  '#CD8245': {
    text: 'text-amber-700',
    bar: 'bg-amber-500',
    track: 'bg-amber-100',
    borderL: 'border-l-amber-400',
  },
  '#5E9E58': {
    text: 'text-emerald-700',
    bar: 'bg-emerald-500',
    track: 'bg-emerald-100',
    borderL: 'border-l-emerald-400',
  },
};

const FALLBACK_PALETTE: PaletteEntry = {
  text: 'text-slate-700',
  bar: 'bg-slate-500',
  track: 'bg-slate-100',
  borderL: 'border-l-slate-400',
};

const paletteFor = (hex: string) => PALETTE[hex] ?? FALLBACK_PALETTE;

const TEMPERAMENT_HEX: Record<TemperamentName, string> = {
  Empath: '#9E6B9B',
  Theorist: '#4A7FB5',
  Responder: '#CD8245',
  Preserver: '#5E9E58',
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500';

function getIntensity(diff: number) {
  if (diff <= 10) return 'balanced';
  if (diff <= 25) return 'leaning';
  if (diff <= 50) return 'strong';
  return 'defining';
}

interface TraitBarProps {
  trait: Trait;
  isExpanded: boolean;
  onToggle: () => void;
}

function TraitBar({ trait, isExpanded, onToggle }: TraitBarProps) {
  const diff = Math.abs(trait.leftPct - trait.rightPct);
  const intensity = getIntensity(diff);
  const leftDominant = trait.leftPct >= trait.rightPct;
  const style = CATEGORY_STYLES[trait.category];

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left py-3 border-b border-slate-100 last:border-b-0 ${FOCUS_RING}`}
      aria-expanded={isExpanded}
    >
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-sm ${
              leftDominant ? 'font-bold text-slate-800' : 'text-slate-400'
            }`}
          >
            {trait.left}
          </span>
          {leftDominant && (
            <span className={`text-xs font-bold ${style.text}`}>{trait.leftPct}%</span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          {!leftDominant && (
            <span className={`text-xs font-bold ${style.text}`}>{trait.rightPct}%</span>
          )}
          <span
            className={`text-sm ${
              !leftDominant ? 'font-bold text-slate-800' : 'text-slate-400'
            }`}
          >
            {trait.right}
          </span>
        </div>
      </div>

      <div className={`flex h-2.5 rounded-full overflow-hidden ${style.track}`}>
        <div
          className={`${leftDominant ? style.bar : style.muted} transition-all duration-500`}
          style={{ width: `${trait.leftPct}%` }}
        />
        <div className="w-px bg-white" />
        <div
          className={`${!leftDominant ? style.bar : style.muted} transition-all duration-500`}
          style={{ width: `${trait.rightPct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
          {intensity}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </div>

      {isExpanded && (
        <div className={`mt-3 p-3 rounded-lg ${style.track} text-xs text-slate-700 leading-relaxed`}>
          <span className={`font-bold ${style.text}`}>{trait.dominant}</span> at {trait.dominantPct}%
          {diff <= 10 && ' — both sides come and go. A tension, not a place to land.'}
          {diff > 10 && diff <= 25 && ' — a clear lean, with the other side available when needed.'}
          {diff > 25 && diff <= 50 && ' — this tends to color the room. People notice.'}
          {diff > 50 && diff <= 70 && ' — a defining trait. It shapes choices, and the company kept.'}
          {diff > 70 && ' — not a preference. The way the wiring runs.'}
        </div>
      )}
    </button>
  );
}

function SignatureTraits({ traits }: { traits: Trait[] }) {
  const sorted = [...traits].sort(
    (a, b) => Math.abs(b.leftPct - b.rightPct) - Math.abs(a.leftPct - a.rightPct),
  );
  const top5 = sorted.slice(0, 5);
  const balanced = sorted.filter((t) => Math.abs(t.leftPct - t.rightPct) <= 10);

  return (
    <Card className="bg-white border-slate-100">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Star size={14} aria-hidden="true" /> What shows up loudest
      </h3>
      <div className="flex flex-wrap gap-2 mb-6">
        {top5.map((t) => {
          const style = CATEGORY_STYLES[t.category];
          return (
            <span
              key={t.facet}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} text-white shadow-sm`}
            >
              {t.dominant}
              <span className="opacity-70 font-normal ml-1.5">{t.dominantPct}%</span>
            </span>
          );
        })}
      </div>

      {balanced.length > 0 && (
        <>
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles size={14} aria-hidden="true" /> Where you split
          </h4>
          <div className="flex flex-wrap gap-2">
            {balanced.map((t) => (
              <span
                key={t.facet}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600"
              >
                {t.left} <span className="text-slate-400">↔</span> {t.right}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function DescriptorBars({ descriptors }: { descriptors: { word: string; pct: number }[] }) {
  return (
    <Card className="bg-white border-slate-100">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Eye size={14} aria-hidden="true" /> How others tend to read you
      </h3>
      <div className="flex flex-col gap-3">
        {descriptors.map((d) => {
          const colorClass =
            d.pct >= 70
              ? 'bg-indigo-500'
              : d.pct >= 50
              ? 'bg-emerald-500'
              : 'bg-slate-300';
          const labelClass =
            d.pct >= 60 ? 'font-bold text-slate-800' : 'font-medium text-slate-500';
          return (
            <div key={d.word} className="flex items-center gap-3">
              <span className={`w-28 text-sm text-right ${labelClass}`}>{d.word}</span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colorClass} transition-all duration-500`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
              <span className="w-8 text-xs font-bold text-slate-500 text-right">{d.pct}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TemperamentSection({ temperaments }: { temperaments: TemperamentEntry[] }) {
  return (
    <Card className="bg-white border-slate-100">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Flame size={14} aria-hidden="true" /> The four temperaments
      </h3>
      <div className="flex flex-col gap-5">
        {temperaments.map((t) => {
          const palette = paletteFor(TEMPERAMENT_HEX[t.name]);
          return (
            <div key={t.name}>
              <div className="flex justify-between items-baseline mb-2">
                <span className={`text-sm font-bold ${palette.text}`}>{t.name}</span>
                <span className={`text-2xl font-light ${palette.text}`}>{t.pct}%</span>
              </div>
              <div className={`h-2.5 rounded-full ${palette.track} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${palette.bar} transition-all duration-500`}
                  style={{ width: `${t.pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">{t.desc}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TypeMatchSection({ matches }: { matches: TypeMatch[] }) {
  return (
    <Card className="bg-white border-slate-100">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
        <Users size={14} aria-hidden="true" /> Types that sit closest
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matches.map((t) => {
          const isTop = t.pct >= 68;
          return (
            <div
              key={t.code}
              className={`p-4 rounded-xl border ${
                isTop
                  ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                  : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div
                className={`text-xl font-bold ${
                  isTop ? 'text-indigo-600' : 'text-slate-600'
                }`}
              >
                {t.code}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{t.name}</div>
              <div
                className={`text-2xl font-light mt-2 ${
                  isTop ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {t.pct}%
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ConvergenceSection({ themes, growth }: { themes: ConvergenceTheme[]; growth: GrowthEdge[] }) {
  return (
    <div className="space-y-4">
      <Card className="bg-white border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers size={14} aria-hidden="true" /> Where the systems agree
        </h3>
        <p className="text-xs text-slate-500 italic mb-5 leading-relaxed">
          Where four old systems — MBTI, Big Five, numerology, Enneagram — happen to point the same way.
        </p>
        <div className="flex flex-col gap-3">
          {themes.map((t) => {
            const palette = paletteFor(t.color);
            return (
              <div
                key={t.title}
                className={`p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-l-4 ${palette.borderL}`}
              >
                <div className={`text-sm font-bold ${palette.text} mb-1`}>{t.title}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="bg-amber-50/40 border-amber-100">
        <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Compass size={14} aria-hidden="true" /> Where it tends to ask more of you
        </h3>
        <div className="flex flex-col gap-3">
          {growth.map((g) => (
            <div
              key={g.title}
              className="p-4 rounded-xl bg-white border border-amber-100"
            >
              <div className="text-sm font-bold text-amber-700 mb-1">{g.title}</div>
              <p className="text-sm text-slate-600 leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PersonaSection({ lifePathNumber }: { lifePathNumber: number }) {
  const lp = LIFE_PATH_MEANINGS[lifePathNumber];

  return (
    <div className="space-y-4">
      <Card className="bg-white border-slate-100">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Drama size={14} aria-hidden="true" /> The inner cast
        </h3>
        <p className="text-xs text-slate-500 italic mb-5 leading-relaxed">
          {personasFramework.intro}
        </p>
        <div className="flex flex-col gap-3">
          {personasFramework.archetypes.map((p) => {
            const palette = paletteFor(p.color);
            return (
              <div
                key={p.label}
                className={`p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-l-4 ${palette.borderL}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base font-bold ${palette.text}`}>{p.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{p.role}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400 italic leading-relaxed">
          {personasFramework.prompt}
        </p>
      </Card>

      {lp && (
        <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-50">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
            Life Path {lifePathNumber}
          </div>
          <div className="text-lg font-bold text-indigo-600 mb-1">{lp.title}</div>
          <p className="text-sm text-slate-600 italic leading-relaxed">{lp.purpose}</p>
        </Card>
      )}
    </div>
  );
}

export const PersonalityView = ({ mbtiType, lifePathNumber }: PersonalityViewProps) => {
  const [activeSection, setActiveSection] = useState<Section>('traits');
  const [activeCategory, setActiveCategory] = useState<'all' | TraitCategory>('all');
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const traits = useMemo(() => getTraitsForMbti(mbtiType), [mbtiType]);
  const descriptors = useMemo(() => getDescriptorsForMbti(mbtiType), [mbtiType]);
  const temperaments = useMemo(() => getTemperamentForMbti(mbtiType), [mbtiType]);
  const typeMatches = useMemo(() => getTypeMatchesForMbti(mbtiType), [mbtiType]);
  const convergence = useMemo(() => getConvergenceForMbti(mbtiType), [mbtiType]);
  const growth = useMemo(() => getGrowthEdgesForMbti(mbtiType), [mbtiType]);
  const letterDetails = useMemo(() => getMbtiLetterDetails(mbtiType), [mbtiType]);
  const mbtiData = useMemo(() => getMbtiData(mbtiType), [mbtiType]);
  const lpMeaning = LIFE_PATH_MEANINGS[lifePathNumber];
  const temperament = temperamentForMbti(mbtiType);
  const synthesis = useMemo(
    () => getSynthesisForMbti(mbtiType, mbtiData.title, lpMeaning?.title ?? null),
    [mbtiType, mbtiData.title, lpMeaning?.title],
  );

  const filtered = activeCategory === 'all' ? traits : traits.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HERO */}
      <Card className="bg-indigo-900 !bg-indigo-900 text-white border-indigo-800 !border-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>
        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Sparkles size={20} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-widest">A Reader's Profile</span>
            </div>
            <h2 className="text-4xl font-bold mb-2">
              {mbtiType} <span className="text-indigo-300 font-light">·</span> Life Path {lifePathNumber}
            </h2>
            <h3 className="text-xl text-indigo-300 font-medium mb-4">
              {mbtiData.title}
              {lpMeaning ? ` · ${lpMeaning.title}` : ''} · {temperament}
            </h3>
            <p className="text-sm text-indigo-100/80 leading-relaxed max-w-md">
              Four lenses laid over each other. MBTI for the wiring, Big Five for the texture, numerology for the
              arc, Enneagram for the inward pull. Read it as a journal prompt, not a measurement.
            </p>
          </div>

          <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10 grid grid-cols-4 gap-3">
            {letterDetails.map((d) => (
              <div
                key={d.letter}
                className="text-center p-3 rounded-lg bg-black/20"
              >
                <div className="text-3xl font-bold leading-none" style={{ color: d.color }}>
                  {d.letter}
                </div>
                <div className="text-xs font-bold text-white/70 mt-2">{d.pct}%</div>
                <div className="text-[10px] text-white/40 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* THE READ — synthesis across all four lenses */}
      <Card className="bg-white border-slate-100">
        <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <BookOpen size={14} aria-hidden="true" /> The read
        </h3>
        <p className="text-sm text-slate-700 leading-relaxed">{synthesis}</p>
      </Card>

      {/* SECTION TABS */}
      <Card className="bg-white border-slate-100 !p-3">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="flex flex-wrap gap-1 sm:gap-2 justify-center"
        >
          {sections.map((s) => {
            const Icon = SECTION_ICONS[s];
            const active = activeSection === s;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSection(s)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${FOCUS_RING} ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {sectionLabels[s]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* CONTENT */}
      <div className="animate-in fade-in duration-300" key={activeSection}>
        {activeSection === 'traits' && (
          <div className="space-y-4">
            <SignatureTraits traits={traits} />

            <Card className="bg-white border-slate-100 !p-3">
              <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${FOCUS_RING} ${
                    activeCategory === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  const style = CATEGORY_STYLES[cat];
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${FOCUS_RING} ${
                        active
                          ? `${style.bg} text-white shadow-sm`
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {categoryMeta[cat].label}
                    </button>
                  );
                })}
              </div>
            </Card>

            {activeCategory === 'all' ? (
              categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                const style = CATEGORY_STYLES[cat];
                const catTraits = filtered.filter((t) => t.category === cat);
                return (
                  <Card key={cat} className="bg-white border-slate-100">
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${style.text}`}
                    >
                      <Icon size={14} aria-hidden="true" /> {categoryMeta[cat].label}
                    </h3>
                    <div>
                      {catTraits.map((trait) => (
                        <TraitBar
                          key={trait.facet}
                          trait={trait}
                          isExpanded={expandedTrait === trait.facet}
                          onToggle={() =>
                            setExpandedTrait(expandedTrait === trait.facet ? null : trait.facet)
                          }
                        />
                      ))}
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="bg-white border-slate-100">
                {(() => {
                  const Icon = CATEGORY_ICONS[activeCategory];
                  const style = CATEGORY_STYLES[activeCategory];
                  return (
                    <h3
                      className={`text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${style.text}`}
                    >
                      <Icon size={14} aria-hidden="true" /> {categoryMeta[activeCategory].label}
                    </h3>
                  );
                })()}
                <div>
                  {filtered.map((trait) => (
                    <TraitBar
                      key={trait.facet}
                      trait={trait}
                      isExpanded={expandedTrait === trait.facet}
                      onToggle={() =>
                        setExpandedTrait(expandedTrait === trait.facet ? null : trait.facet)
                      }
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {activeSection === 'descriptors' && <DescriptorBars descriptors={descriptors} />}
        {activeSection === 'temperament' && <TemperamentSection temperaments={temperaments} />}
        {activeSection === 'types' && <TypeMatchSection matches={typeMatches} />}
        {activeSection === 'convergence' && (
          <ConvergenceSection themes={convergence} growth={growth} />
        )}
        {activeSection === 'personas' && <PersonaSection lifePathNumber={lifePathNumber} />}
      </div>

      <p className="text-center text-xs text-slate-400 italic pt-4">
        A reader's tool. Not a measurement. Read it that way. {mbtiType} · Life Path {lifePathNumber}.
      </p>
    </div>
  );
};
