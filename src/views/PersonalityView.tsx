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
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BorderlineBadge } from '../components/BorderlineBadge';
import { Card } from '../components/Card';
import { HeroCard } from '../components/HeroCard';
import { SectionHeading } from '../components/SectionHeading';
import { ProGate } from '../components/ProGate';
import { TypeCode } from '../components/TypeCode';
import { DIMENSIONS, getMbtiData } from '../data/mbti';
import {
  categories,
  categoryMeta,
  getConvergence,
  getDescriptors,
  getGrowthEdges,
  getSynthesis,
  getTemperaments,
  getTraits,
  getTypeMatches,
  personasFramework,
  sections,
  sectionLabels,
  TEMPERAMENT_TONE,
  type ConvergenceTheme,
  type Descriptor,
  type GrowthEdge,
  type Section,
  type TemperamentEntry,
  type Trait,
  type TraitCategory,
  type TypeMatch,
} from '../data/personality';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import { FACET_DETAIL_GATE, isPaidSection } from '../data/tiers';
import {
  ASIDE,
  BODY,
  EYEBROW,
  FOCUS_RING,
  HERO_BODY,
  HERO_PANEL,
  HERO_SUBTITLE,
  HERO_TILE,
  HERO_TITLE,
  MICRO_LABEL,
  TAB_ACTIVE,
  TAB_BASE,
  TAB_IDLE,
  toneFor,
} from '../design/tokens';
import { useGate } from '../store/useGate';
import { useProfile } from '../store/useProfile';

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

const categoryTone = (cat: TraitCategory) => toneFor(categoryMeta[cat].tone);

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
  const leftDominant = trait.leftPct > trait.rightPct;
  const style = categoryTone(trait.category);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left py-3 border-b border-slate-100 last:border-b-0 ${FOCUS_RING}`}
      aria-expanded={isExpanded}
    >
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm ${leftDominant ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
            {trait.left}
          </span>
          {leftDominant && <span className={`text-xs font-bold ${style.text}`}>{trait.leftPct}%</span>}
        </div>
        <div className="flex items-baseline gap-2">
          {!leftDominant && <span className={`text-xs font-bold ${style.text}`}>{trait.rightPct}%</span>}
          <span className={`text-sm ${!leftDominant ? 'font-bold text-slate-800' : 'text-slate-400'}`}>
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
        <span className={`${MICRO_LABEL} !font-medium`}>{intensity}</span>
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
  const sorted = [...traits].sort((a, b) => Math.abs(b.leftPct - b.rightPct) - Math.abs(a.leftPct - a.rightPct));
  const top5 = sorted.slice(0, 5);
  const balanced = sorted.filter((t) => Math.abs(t.leftPct - t.rightPct) <= 10);

  return (
    <Card>
      <SectionHeading icon={Star}>What shows up loudest</SectionHeading>
      <div className="flex flex-wrap gap-2 mb-6">
        {top5.map((t) => {
          const style = categoryTone(t.category);
          return (
            <span key={t.facet} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} text-white shadow-sm`}>
              {t.dominant}
              <span className="opacity-70 font-normal ml-1.5">{t.dominantPct}%</span>
            </span>
          );
        })}
      </div>

      {balanced.length > 0 && (
        <>
          <SectionHeading icon={Sparkles} as="h4" className="!mb-3">
            Where you split
          </SectionHeading>
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

function DescriptorBars({ descriptors }: { descriptors: Descriptor[] }) {
  return (
    <Card>
      <SectionHeading icon={Eye} className="!mb-3">
        How others tend to read you
      </SectionHeading>
      <p className={`${ASIDE} mb-6`}>
        Each word is a blend of a few facets. Change a facet on the Your Data tab and the words move with it.
      </p>
      <div className="flex flex-col gap-3">
        {descriptors.map((d) => {
          const colorClass = d.pct >= 70 ? 'bg-indigo-500' : d.pct >= 50 ? 'bg-emerald-500' : 'bg-slate-300';
          const labelClass = d.pct >= 60 ? 'font-bold text-slate-800' : 'font-medium text-slate-500';
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
    <Card>
      <SectionHeading icon={Flame} className="!mb-3">
        The four temperaments
      </SectionHeading>
      <p className={`${ASIDE} mb-6`}>
        Split from the Sensing–Intuition score first, then Thinking–Feeling on the intuitive side and Judging–Perceiving
        on the sensing side. The four always add to a hundred.
      </p>
      <div className="flex flex-col gap-5">
        {temperaments.map((t) => {
          const palette = toneFor(TEMPERAMENT_TONE[t.name]);
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
    <Card>
      <SectionHeading icon={Users} className="!mb-3">
        Types that sit closest
      </SectionHeading>
      <p className={`${ASIDE} mb-6`}>
        A type's score is a hundred minus how decided you are on each letter it differs on. A dead-even letter costs
        nothing; a strong one costs a lot. Types at ninety or above differ only where you already split.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matches.map((t) => {
          const isTop = t.pct >= 90;
          return (
            <div
              key={t.code}
              className={`p-4 rounded-xl border ${
                isTop ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <div className={`text-xl font-bold ${isTop ? 'text-indigo-600' : 'text-slate-600'}`}>{t.code}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{t.name}</div>
              <div className={`text-2xl font-light mt-2 ${isTop ? 'text-indigo-600' : 'text-slate-400'}`}>{t.pct}%</div>
              <div className={`${MICRO_LABEL} !font-medium mt-1`}>
                {t.apart} letter{t.apart === 1 ? '' : 's'} apart
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
      <Card>
        <SectionHeading icon={Layers} className="!mb-3">
          Where the systems agree
        </SectionHeading>
        <p className={`${ASIDE} mb-5`}>
          Where four old systems — MBTI, Big Five, numerology, Enneagram — happen to point the same way.
        </p>
        <div className="flex flex-col gap-3">
          {themes.map((t) => {
            const palette = toneFor(t.tone);
            return (
              <div
                key={t.title}
                className={`p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-l-4 ${palette.borderL}`}
              >
                <div className={`text-sm font-bold ${palette.text} mb-1`}>{t.title}</div>
                <p className={BODY}>{t.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {growth.length > 0 && (
        <Card variant="warm">
          <SectionHeading icon={Compass} tone="amber">
            Where it tends to ask more of you
          </SectionHeading>
          <div className="flex flex-col gap-3">
            {growth.map((g) => (
              <div key={g.title} className="p-4 rounded-xl bg-white border border-amber-100">
                <div className="text-sm font-bold text-amber-700 mb-1">{g.title}</div>
                <p className={BODY}>{g.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PersonaSection({ lifePathNumber }: { lifePathNumber: number }) {
  const lp = LIFE_PATH_MEANINGS[lifePathNumber];

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeading icon={Drama} className="!mb-3">
          The inner cast
        </SectionHeading>
        <p className={`${ASIDE} mb-5`}>{personasFramework.intro}</p>
        <div className="flex flex-col gap-3">
          {personasFramework.archetypes.map((p) => {
            const palette = toneFor(p.tone);
            return (
              <div
                key={p.label}
                className={`p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-l-4 ${palette.borderL}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`text-base font-bold ${palette.text}`}>{p.label}</span>
                  <span className="text-xs text-slate-400 font-medium">{p.role}</span>
                </div>
                <p className={BODY}>{p.desc}</p>
              </div>
            );
          })}
        </div>
        <p className={`mt-4 ${ASIDE} !text-slate-400`}>{personasFramework.prompt}</p>
      </Card>

      {lp && (
        <Card variant="tinted">
          <div className={`${MICRO_LABEL} !tracking-widest mb-2`}>Life Path {lifePathNumber}</div>
          <div className="text-lg font-bold text-indigo-600 mb-1">{lp.title}</div>
          <p className={`${BODY} italic`}>{lp.purpose}</p>
        </Card>
      )}
    </div>
  );
}

export const PersonalityView = () => {
  const { profile, typeCode, dimensions, lifePath } = useProfile();
  const { isPro } = useGate();
  const lifePathNumber = lifePath.number;

  const [activeSection, setActiveSection] = useState<Section>('traits');
  const [activeCategory, setActiveCategory] = useState<'all' | TraitCategory>('all');
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  const traits = useMemo(() => getTraits(profile.facets), [profile.facets]);
  const descriptors = useMemo(() => getDescriptors(profile.facets), [profile.facets]);
  const temperaments = useMemo(() => getTemperaments(profile.dimensions), [profile.dimensions]);
  const temperament = temperaments[0].name;
  const typeMatches = useMemo(() => getTypeMatches(profile.dimensions), [profile.dimensions]);
  const convergence = useMemo(() => getConvergence(temperament), [temperament]);
  const growth = useMemo(() => getGrowthEdges(temperament), [temperament]);
  const mbtiData = useMemo(() => getMbtiData(typeCode), [typeCode]);
  const lpMeaning = LIFE_PATH_MEANINGS[lifePathNumber];
  const synthesis = useMemo(
    () => getSynthesis(temperament, mbtiData.title, lpMeaning?.title ?? null),
    [temperament, mbtiData.title, lpMeaning?.title],
  );

  const filtered = activeCategory === 'all' ? traits : traits.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* HERO */}
      <HeroCard>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Sparkles size={20} aria-hidden="true" />
              <span className={EYEBROW}>A Reader's Profile</span>
            </div>
            <h2 className={HERO_TITLE}>
              <TypeCode letters={dimensions} onDark /> <span className="text-indigo-300 font-light">·</span> Life Path{' '}
              {lifePathNumber}
            </h2>
            <h3 className={HERO_SUBTITLE}>
              {mbtiData.title}
              {lpMeaning ? ` · ${lpMeaning.title}` : ''} · {temperament}
            </h3>
            <p className={HERO_BODY}>
              Four lenses laid over each other. MBTI for the wiring, Big Five for the texture, numerology for the arc,
              Enneagram for the inward pull. Read it as a journal prompt, not a measurement.
            </p>
          </div>

          <div className={`${HERO_PANEL} grid grid-cols-2 sm:grid-cols-4 gap-3`}>
            {dimensions.map((d) => {
              const tone = toneFor(DIMENSIONS[d.dim].tone);
              return (
                <div key={d.dim} className={`text-center p-3 ${HERO_TILE}`} title={d.tooltip}>
                  <div className={`text-3xl font-bold leading-none ${tone.textOnDark}`}>{d.letter}</div>
                  <div className="text-xs font-bold text-white/70 mt-2">{d.pct}%</div>
                  <div className="text-[10px] text-white/40 mt-1">{d.name}</div>
                  {d.borderline && (
                    <div className="mt-1.5 flex justify-center">
                      <BorderlineBadge onDark pct={d.pct} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </HeroCard>

      {/* THE READ — synthesis across all four lenses */}
      <Card>
        <SectionHeading icon={BookOpen} tone="indigo" className="!mb-3">
          The read
        </SectionHeading>
        <p className="text-sm text-slate-700 leading-relaxed">{synthesis}</p>
      </Card>

      {/* SECTION TABS */}
      <Card className="!p-3">
        <div role="tablist" aria-label="Profile sections" className="flex flex-wrap gap-1 sm:gap-2 justify-center">
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
                className={`${TAB_BASE} ${FOCUS_RING} ${active ? TAB_ACTIVE : TAB_IDLE}`}
              >
                <Icon size={14} aria-hidden="true" />
                {sectionLabels[s]}
                {!isPro && isPaidSection(s) && <Lock size={11} className="opacity-60" aria-label="Paid section" />}
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

            <ProGate gate={FACET_DETAIL_GATE}>
              <Card className="!p-3">
                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={`${TAB_BASE} ${FOCUS_RING} ${
                      activeCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : TAB_IDLE
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    const style = categoryTone(cat);
                    const active = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={`${TAB_BASE} ${FOCUS_RING} ${active ? `${style.bg} text-white shadow-sm` : TAB_IDLE}`}
                      >
                        <Icon size={14} aria-hidden="true" />
                        {categoryMeta[cat].label}
                      </button>
                    );
                  })}
                </div>
              </Card>
              {(activeCategory === 'all' ? categories : [activeCategory]).map((cat) => {
                const catTraits = filtered.filter((t) => t.category === cat);
                return (
                  <Card key={cat}>
                    <SectionHeading icon={CATEGORY_ICONS[cat]} tone={categoryMeta[cat].tone} className="!mb-3">
                      {categoryMeta[cat].label}
                    </SectionHeading>
                    <div>
                      {catTraits.map((trait) => (
                        <TraitBar
                          key={trait.facet}
                          trait={trait}
                          isExpanded={expandedTrait === trait.facet}
                          onToggle={() => setExpandedTrait(expandedTrait === trait.facet ? null : trait.facet)}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </ProGate>
          </div>
        )}

        {/* Paid sections. Each teaser is the real component fed a slice of
            the data — an honest preview, never a blurred copy. The split
            itself is decided in data/tiers.ts. */}
        {activeSection === 'descriptors' && (
          <ProGate gate="descriptors" teaser={<DescriptorBars descriptors={descriptors.slice(0, 3)} />}>
            <DescriptorBars descriptors={descriptors} />
          </ProGate>
        )}
        {activeSection === 'temperament' && (
          <ProGate gate="temperament" teaser={<TemperamentSection temperaments={temperaments.slice(0, 1)} />}>
            <TemperamentSection temperaments={temperaments} />
          </ProGate>
        )}
        {activeSection === 'types' && (
          <ProGate gate="types" teaser={<TypeMatchSection matches={typeMatches.slice(0, 1)} />}>
            <TypeMatchSection matches={typeMatches} />
          </ProGate>
        )}
        {activeSection === 'convergence' && (
          <ProGate gate="convergence" teaser={<ConvergenceSection themes={convergence.slice(0, 1)} growth={[]} />}>
            <ConvergenceSection themes={convergence} growth={growth} />
          </ProGate>
        )}
        {activeSection === 'personas' && (
          <ProGate gate="personas">
            <PersonaSection lifePathNumber={lifePathNumber} />
          </ProGate>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 italic pt-4">
        A reader's tool. Not a measurement. Read it that way. <TypeCode letters={dimensions} /> · Life Path{' '}
        {lifePathNumber}.
      </p>
    </div>
  );
};
