// Personality derivations for the Profile view.
//
// Two kinds of thing live here:
//   1. Catalogs — the 23 facets, the descriptor words, the temperaments.
//      Labels and groupings only; no scores.
//   2. Derivations — functions that take the raw profile (facet scores,
//      dimension scores) or a derived type code and return what a view
//      needs. Nothing is stored per type; nothing is stored per view.
//
// This isn't psychometrics. The framing everywhere else in the app holds:
// a journaling tool, not psychological advice.

import type { Tone } from '../design/tokens';
import { MBTI_TYPES, getMbtiNickname } from './mbti';
import type { DimensionScores, FacetScores } from './profile';

// ── Categories ────────────────────────────────────────────────────────

export type TraitCategory = 'Lifestyle' | 'Values' | 'Cognitive' | 'Energy';

export interface CategoryMetaEntry {
  label: string;
  tone: Tone;
}

export const categoryMeta: Record<TraitCategory, CategoryMetaEntry> = {
  Cognitive: { label: 'How You Think', tone: 'sky' },
  Energy: { label: 'How You Recharge', tone: 'emerald' },
  Values: { label: 'What You Prioritize', tone: 'purple' },
  Lifestyle: { label: 'How You Move', tone: 'amber' },
};

export const categories: TraitCategory[] = ['Cognitive', 'Energy', 'Values', 'Lifestyle'];

export type Section = 'traits' | 'descriptors' | 'temperament' | 'types' | 'convergence' | 'personas';

export const sections: Section[] = ['traits', 'descriptors', 'temperament', 'types', 'convergence', 'personas'];

export const sectionLabels: Record<Section, string> = {
  traits: 'The Facets',
  descriptors: 'How Others Tend to Read You',
  temperament: 'Temperament',
  types: 'Adjacent Types',
  convergence: 'Where the Systems Agree',
  personas: 'The Inner Cast',
};

// ── Helpers ───────────────────────────────────────────────────────────

function mbtiLetters(mbti: string): { ie: 'E' | 'I'; sn: 'N' | 'S'; tf: 'T' | 'F'; jp: 'J' | 'P' } {
  return {
    ie: mbti[0] === 'E' ? 'E' : 'I',
    sn: mbti[1] === 'S' ? 'S' : 'N',
    tf: mbti[2] === 'T' ? 'T' : 'F',
    jp: mbti[3] === 'P' ? 'P' : 'J',
  };
}

// Deterministic 32-bit hash. Gives the adjacent-type match percentages
// stable variance so values don't all clump. (Descriptors and temperament
// no longer use it — they derive from the stored scores.)
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── The 23 facets ─────────────────────────────────────────────────────
// The catalog carries labels and grouping. Scores come from the profile,
// keyed by the right-hand pole.

export interface FacetSpec {
  /** Left pole label. */
  left: string;
  /** Right pole label — also the key into FacetScores. */
  right: string;
  category: TraitCategory;
}

export const FACET_CATALOG: FacetSpec[] = [
  // Lifestyle
  { left: 'Relaxed', right: 'Orderly', category: 'Lifestyle' },
  { left: 'Spontaneous', right: 'Scheduled', category: 'Lifestyle' },
  { left: 'Casual', right: 'Conscientious', category: 'Lifestyle' },
  { left: 'Impulsive', right: 'Disciplined', category: 'Lifestyle' },
  { left: 'Easygoing', right: 'Ambitious', category: 'Lifestyle' },
  // Values
  { left: 'Objective', right: 'Subjective', category: 'Values' },
  { left: 'Rational', right: 'Compassionate', category: 'Values' },
  { left: 'Challenging', right: 'Agreeable', category: 'Values' },
  { left: 'Individualist', right: 'Helpful', category: 'Values' },
  { left: 'Self-Reliant', right: 'Cooperative', category: 'Values' },
  { left: 'Tough', right: 'Tolerant', category: 'Values' },
  // Cognitive
  { left: 'Realistic', right: 'Imaginative', category: 'Cognitive' },
  { left: 'Concrete', right: 'Conceptual', category: 'Cognitive' },
  { left: 'Traditional', right: 'Progressive', category: 'Cognitive' },
  { left: 'Factual', right: 'Insightful', category: 'Cognitive' },
  { left: 'Practical', right: 'Aesthetic', category: 'Cognitive' },
  { left: 'Habitual', right: 'Adventurous', category: 'Cognitive' },
  // Energy
  { left: 'Placid', right: 'Energetic', category: 'Energy' },
  { left: 'Reserved', right: 'Expressive', category: 'Energy' },
  { left: 'Private', right: 'Prominent', category: 'Energy' },
  { left: 'Calm', right: 'Joyful', category: 'Energy' },
  { left: 'Aloof', right: 'Friendly', category: 'Energy' },
  { left: 'Solitary', right: 'Engaged', category: 'Energy' },
];

export interface Trait {
  facet: string;
  category: TraitCategory;
  left: string;
  right: string;
  leftPct: number;
  rightPct: number;
  dominant: string;
  dominantPct: number;
}

/** Every pole label → the facet key it belongs to and which side it is. */
const POLE_INDEX: Map<string, { key: string; isRight: boolean }> = new Map();
for (const spec of FACET_CATALOG) {
  POLE_INDEX.set(spec.left, { key: spec.right, isRight: false });
  POLE_INDEX.set(spec.right, { key: spec.right, isRight: true });
}

/** All 46 pole labels, for validation. */
export const FACET_POLES: string[] = [...POLE_INDEX.keys()];

/** Percent toward a named pole (either side). A missing score reads as 50. */
export function poleScore(facets: FacetScores, pole: string): number {
  const entry = POLE_INDEX.get(pole);
  if (!entry) throw new Error(`Unknown facet pole: ${pole}`);
  const rightPct = clamp(facets[entry.key] ?? 50, 0, 100);
  return entry.isRight ? rightPct : 100 - rightPct;
}

/** Join the catalog with the stored scores. A missing score reads as an even 50/50. */
export function getTraits(facets: FacetScores): Trait[] {
  return FACET_CATALOG.map((spec) => {
    const rightPct = clamp(Math.round(facets[spec.right] ?? 50), 0, 100);
    const leftPct = 100 - rightPct;
    const leftDominant = leftPct > rightPct;
    return {
      facet: `${spec.left} vs ${spec.right}`,
      category: spec.category,
      left: spec.left,
      right: spec.right,
      leftPct,
      rightPct,
      dominant: leftDominant ? spec.left : spec.right,
      dominantPct: Math.max(leftPct, rightPct),
    };
  });
}

// ── Descriptors (How Others See You) ──────────────────────────────────
// Each descriptor is a weighted blend of facet poles. The percentage is
// the weighted mean of "percent toward pole" across its poles, so it
// moves with the reader's actual facet scores — two people of the same
// type with different facets read differently.
//
// Weights were set so the bundled sample lands near the original report
// it was transcribed from (Curious high, Organized low, Pragmatic mid).

export interface DescriptorSpec {
  word: string;
  /** Facet poles (either side label) with optional weight, default 1. */
  poles: { pole: string; weight?: number }[];
}

const p = (pole: string, weight = 1) => ({ pole, weight });

export const DESCRIPTOR_SPECS: DescriptorSpec[] = [
  { word: 'Curious', poles: [p('Insightful', 3), p('Aesthetic'), p('Conceptual'), p('Progressive')] },
  { word: 'Gentle', poles: [p('Agreeable', 2), p('Friendly', 2), p('Compassionate')] },
  { word: 'Creative', poles: [p('Aesthetic'), p('Imaginative'), p('Conceptual'), p('Spontaneous')] },
  { word: 'Introspective', poles: [p('Solitary'), p('Private'), p('Insightful'), p('Reserved')] },
  { word: 'Clever', poles: [p('Insightful'), p('Conceptual'), p('Objective'), p('Rational')] },
  { word: 'Tolerant', poles: [p('Agreeable'), p('Relaxed'), p('Progressive'), p('Casual')] },
  { word: 'Sociable', poles: [p('Friendly', 2), p('Energetic'), p('Joyful'), p('Expressive')] },
  { word: 'Warm', poles: [p('Friendly'), p('Compassionate'), p('Agreeable'), p('Helpful')] },
  { word: 'Adaptable', poles: [p('Spontaneous'), p('Relaxed'), p('Casual'), p('Adventurous'), p('Progressive')] },
  {
    word: 'Innovative',
    poles: [p('Conceptual'), p('Progressive'), p('Imaginative'), p('Aesthetic'), p('Adventurous'), p('Individualist')],
  },
  { word: 'Skeptical', poles: [p('Objective'), p('Challenging'), p('Rational'), p('Individualist'), p('Insightful')] },
  { word: 'Outgoing', poles: [p('Energetic'), p('Expressive'), p('Prominent'), p('Friendly'), p('Joyful')] },
  { word: 'Idealistic', poles: [p('Subjective'), p('Compassionate'), p('Imaginative'), p('Progressive'), p('Aesthetic')] },
  { word: 'Whimsical', poles: [p('Spontaneous'), p('Imaginative'), p('Impulsive'), p('Joyful')] },
  { word: 'Enthusiastic', poles: [p('Energetic'), p('Joyful'), p('Expressive'), p('Impulsive')] },
  {
    word: 'Pragmatic',
    poles: [p('Objective', 2), p('Rational'), p('Realistic'), p('Self-Reliant'), p('Disciplined'), p('Concrete')],
  },
  {
    word: 'Driven',
    poles: [p('Ambitious'), p('Disciplined'), p('Energetic'), p('Scheduled'), p('Individualist'), p('Prominent')],
  },
  { word: 'Sympathetic', poles: [p('Compassionate'), p('Helpful'), p('Tolerant'), p('Cooperative'), p('Subjective')] },
  {
    word: 'Dominant',
    poles: [p('Prominent'), p('Challenging'), p('Tough'), p('Individualist'), p('Ambitious'), p('Energetic')],
  },
  { word: 'Competitive', poles: [p('Ambitious'), p('Challenging'), p('Individualist'), p('Self-Reliant'), p('Disciplined')] },
  { word: 'Assertive', poles: [p('Prominent'), p('Challenging'), p('Expressive'), p('Self-Reliant')] },
  { word: 'Cautious', poles: [p('Disciplined'), p('Scheduled'), p('Realistic'), p('Placid'), p('Calm')] },
  {
    word: 'Conservative',
    poles: [p('Traditional'), p('Habitual'), p('Realistic'), p('Concrete'), p('Scheduled'), p('Orderly')],
  },
  { word: 'Reliable', poles: [p('Conscientious'), p('Disciplined'), p('Scheduled'), p('Orderly')] },
  {
    word: 'Organized',
    poles: [p('Orderly', 2), p('Scheduled', 2), p('Disciplined'), p('Conscientious'), p('Concrete')],
  },
];

export interface Descriptor {
  word: string;
  pct: number;
}

/** How others tend to read you — a weighted blend of facet poles, sorted high to low. */
export function getDescriptors(facets: FacetScores): Descriptor[] {
  return DESCRIPTOR_SPECS.map((spec) => {
    let sum = 0;
    let weight = 0;
    for (const { pole, weight: w = 1 } of spec.poles) {
      sum += poleScore(facets, pole) * w;
      weight += w;
    }
    return { word: spec.word, pct: weight === 0 ? 50 : Math.round(sum / weight) };
  }).sort((a, b) => b.pct - a.pct || a.word.localeCompare(b.word));
}

// ── Temperament ───────────────────────────────────────────────────────
// Keirsey's four temperaments split the type space on S/N first, then on
// T/F (for N) or J/P (for S). Treat the stored dimension percentages as
// how far the reader sits toward each pole and the four temperaments are
// the four corners of that split:
//
//   Empath    = N × F        Theorist  = N × T
//   Responder = S × P        Preserver = S × J
//
// The four always sum to 100. On the bundled sample (N 73, F 50, P 63)
// this gives 37 / 36 / 17 / 10 — within two points of the original report.

export type TemperamentName = 'Empath' | 'Theorist' | 'Responder' | 'Preserver';

export const TEMPERAMENT_ORDER: TemperamentName[] = ['Empath', 'Theorist', 'Responder', 'Preserver'];

export const TEMPERAMENT_TONE: Record<TemperamentName, Tone> = {
  Empath: 'purple',
  Theorist: 'sky',
  Responder: 'amber',
  Preserver: 'emerald',
};

/** The temperament the four letters alone would name. Used to break ties. */
export function temperamentForMbti(mbti: string): TemperamentName {
  const { sn, tf, jp } = mbtiLetters(mbti);
  if (sn === 'N' && tf === 'F') return 'Empath';
  if (sn === 'N' && tf === 'T') return 'Theorist';
  if (sn === 'S' && jp === 'P') return 'Responder';
  return 'Preserver'; // SJ
}

export interface TemperamentEntry {
  name: TemperamentName;
  pct: number;
  desc: string;
}

const TEMPERAMENT_DESC: Record<TemperamentName, string> = {
  Empath: 'Creative, compassionate, drawn to what is possible for people',
  Theorist: 'Analytical, questioning, drawn to ideas before things',
  Responder: 'Adaptable, practical, at home in the present',
  Preserver: 'Sensible, organized, keeper of what works',
};

const letterCode = (d: DimensionScores): string =>
  `${d.e >= 50 ? 'E' : 'I'}${d.n >= 50 ? 'N' : 'S'}${d.f >= 50 ? 'F' : 'T'}${d.p >= 50 ? 'P' : 'J'}`;

/** Raw (unrounded) temperament shares, summing to 100. */
function temperamentShares(d: DimensionScores): Record<TemperamentName, number> {
  const n = clamp(d.n, 0, 100) / 100;
  const f = clamp(d.f, 0, 100) / 100;
  const pp = clamp(d.p, 0, 100) / 100;
  return {
    Empath: 100 * n * f,
    Theorist: 100 * n * (1 - f),
    Responder: 100 * (1 - n) * pp,
    Preserver: 100 * (1 - n) * (1 - pp),
  };
}

/**
 * The four temperaments with whole-number percentages that sum to 100,
 * highest first. Ties (a dead-even F 50, say) go to the temperament the
 * letters alone would name, so the list agrees with the type code.
 */
export function getTemperaments(d: DimensionScores): TemperamentEntry[] {
  const shares = temperamentShares(d);
  const preferred = temperamentForMbti(letterCode(d));
  const rank = (name: TemperamentName) => (name === preferred ? -1 : TEMPERAMENT_ORDER.indexOf(name));
  const ordered = [...TEMPERAMENT_ORDER].sort((a, b) => shares[b] - shares[a] || rank(a) - rank(b));

  // Largest-remainder rounding, leftover points to the highest-ranked.
  const floors = ordered.map((name) => Math.floor(shares[name]));
  let leftover = 100 - floors.reduce((s, x) => s + x, 0);
  const byRemainder = ordered
    .map((name, i) => ({ i, rem: shares[name] - floors[i] }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of byRemainder) {
    if (leftover <= 0) break;
    floors[i] += 1;
    leftover -= 1;
  }

  return ordered.map((name, i) => ({ name, pct: floors[i], desc: TEMPERAMENT_DESC[name] }));
}

/** The leading temperament — drives convergence, growth edges, and the synthesis. */
export function dominantTemperament(d: DimensionScores): TemperamentName {
  return getTemperaments(d)[0].name;
}

// ── Adjacent types ────────────────────────────────────────────────────
// Distance is the number of letters that differ. Closer types get higher
// match scores. Self is excluded so users see neighbors, not themselves.
// Nicknames come from the MBTI table — the one place they live.

export interface TypeMatch {
  code: string;
  name: string;
  pct: number;
}

export function getTypeMatchesForMbti(mbti: string): TypeMatch[] {
  return MBTI_TYPES.filter((code) => code !== mbti)
    .map((code) => {
      const distance =
        (mbti[0] !== code[0] ? 1 : 0) +
        (mbti[1] !== code[1] ? 1 : 0) +
        (mbti[2] !== code[2] ? 1 : 0) +
        (mbti[3] !== code[3] ? 1 : 0);
      // 0=skip, 1→70-78, 2→48-58, 3→28-38, 4→14-22
      const base = distance === 1 ? 74 : distance === 2 ? 53 : distance === 3 ? 33 : 18;
      const variance = (hash(code + ':' + mbti) % 9) - 4;
      return { code, name: getMbtiNickname(code), pct: clamp(base + variance, 12, 84) };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);
}

// ── Convergence themes & growth edges (per temperament) ──────────────

export interface ConvergenceTheme {
  title: string;
  desc: string;
  tone: Tone;
}

export interface GrowthEdge {
  title: string;
  desc: string;
}

const CONVERGENCE_BY_TEMPERAMENT: Record<TemperamentName, ConvergenceTheme[]> = {
  Empath: [
    { title: 'Empathy and Idealism', desc: 'The through-line is heart-first. The motive is rarely only what works — it is what feels right alongside.', tone: 'purple' },
    { title: 'Meaning-Making', desc: 'A natural instinct for finding story in events. Chaos rendered as narrative — in love, in work, in the telling of one\'s own life.', tone: 'amber' },
    { title: 'Imagination and People', desc: 'Visionary thinking paired with attunement to others. Most who reach for one let the other fall away. This temperament tends to keep both.', tone: 'sky' },
    { title: 'Selective Intensity', desc: 'Energy that depends on company. Among the right people, the lights come on. In draining rooms, retreat is medicine. Both are true.', tone: 'emerald' },
  ],
  Theorist: [
    { title: 'Pattern Recognition', desc: 'The through-line is seeing the structure under the surface — in code, in conflict, in markets, in conversation.', tone: 'sky' },
    { title: 'Independence and Curiosity', desc: 'Learning happens by going deep before going wide. Those who try to manage this temperament often mistake the depth for resistance.', tone: 'purple' },
    { title: 'The Long View', desc: 'Short-term comfort is traded for longer clarity. The patient and the detached can look the same from outside; the difference matters from within.', tone: 'amber' },
    { title: 'The Skeptical Builder', desc: 'Belief comes through interrogation. Faith is earned, not given — which is why what gets built tends to last.', tone: 'emerald' },
  ],
  Responder: [
    { title: 'The Present Moment', desc: 'The through-line is responsiveness. Reading the room faster than the planners. Adjusting faster than the thinkers.', tone: 'amber' },
    { title: 'Action as Thinking', desc: 'A thing isn\'t fully understood until it has been done. Theory tires this temperament; experience teaches it.', tone: 'emerald' },
    { title: 'Practical Optimism', desc: 'Things will work out — and the work to make them work out is part of the assumption. Less faith. More momentum.', tone: 'purple' },
    { title: 'Reading the Field', desc: 'Things others miss are noticed, because watching comes before planning. Decisions look improvised. They rest on sharper observation than they appear to.', tone: 'sky' },
  ],
  Preserver: [
    { title: 'Stewardship', desc: 'The through-line is care for what matters. The structures others depend on get built quietly, often without notice.', tone: 'emerald' },
    { title: 'Trust and Reliability', desc: 'Trust is earned by showing up the same way every time. Those who fail to notice it while it lasts always notice when it stops.', tone: 'sky' },
    { title: 'Lineage and Continuity', desc: 'A sense of being a link in a chain — receiving from those before, passing to those after. A perspective most modern frameworks lose track of.', tone: 'purple' },
    { title: 'Quiet Competence', desc: 'Effort is not advertised. The work speaks; the credit follows when it follows. Either is fine.', tone: 'amber' },
  ],
};

export function getConvergence(temperament: TemperamentName): ConvergenceTheme[] {
  return CONVERGENCE_BY_TEMPERAMENT[temperament];
}

const GROWTH_BY_TEMPERAMENT: Record<TemperamentName, GrowthEdge[]> = {
  Empath: [
    { title: 'Freedom and Structure', desc: 'Big vision, untidy trail. Heavy systems chafe. Lightweight guardrails and one sticky ritual at a time tend to work better.' },
    { title: 'Inner Work and Visible Work', desc: 'Deep work is happening. Others will not see it unless it is translated into artifacts — decision logs, small demos, the occasional shared update.' },
  ],
  Theorist: [
    { title: 'Insight and Execution', desc: 'Sight tends to outrun shipping. The bottleneck is rarely understanding. It is converting understanding into something others can use.' },
    { title: 'Distance and Presence', desc: 'Critical distance is a strength. But the people close in do not need a critic. They need a witness. Practice presence without analysis.' },
  ],
  Responder: [
    { title: 'Now and Later', desc: 'Instinct moves quickly, which is the gift. Larger decisions sometimes ask for the slower track. When the stakes are high, wait one more day.' },
    { title: 'Action and Pause', desc: 'Thinking happens by doing. This works until it does not. Schedule the pauses; without them, the running can be in the wrong direction.' },
  ],
  Preserver: [
    { title: 'Tradition and Change', desc: 'Continuity is the gift. The world keeps shifting underneath. Hold the structures lightly enough to update them when they ask to be updated.' },
    { title: 'Service and Self', desc: 'Giving comes first, often. The risk is forgetting what one would want if no one were counting. Ask the question anyway.' },
  ],
};

export function getGrowthEdges(temperament: TemperamentName): GrowthEdge[] {
  return GROWTH_BY_TEMPERAMENT[temperament];
}

// ── Synthesis: a two-sentence "the read" ─────────────────────────────
// One template per temperament. The first sentence names the through-line
// the four lenses agree on; the second weaves in the MBTI title and Life
// Path title and names what the combination tends to ask of those who
// walk it. Voice: quiet-almanac, third-person.

const SYNTHESIS_BY_TEMPERAMENT: Record<TemperamentName, string> = {
  Empath:
    'Across the four lenses, the through-line is heart-first — meaning before mechanism, attunement before argument. {INSIDE} asks the same thing of those who walk it: enough freedom for the depth to show, enough structure for it to land.',
  Theorist:
    'Across the four lenses, the through-line is the long view — pattern before persuasion, structure before action. {INSIDE} asks the same thing of those who walk it: see the system clearly before solving it, and ship the seeing before the system ever feels finished.',
  Responder:
    'Across the four lenses, the through-line is responsiveness — present moment over plan, action over theory. {INSIDE} asks the same thing of those who walk it: keep moving, but not so fast that the larger calls go unmade.',
  Preserver:
    'Across the four lenses, the through-line is stewardship — care for what works, attention to what lasts. {INSIDE} asks the same thing of those who walk it: hold the structures lightly enough to let them update when they ask to be updated.',
};

const stripThe = (s: string): string => s.replace(/^The\s+/i, '');

export function getSynthesis(temperament: TemperamentName, mbtiTitle: string, lpTitle: string | null): string {
  const wiring = stripThe(mbtiTitle);
  const arc = lpTitle ? stripThe(lpTitle) : null;
  const inside = arc ? `The ${wiring} wiring set inside the ${arc} arc` : `The ${wiring} wiring`;
  return SYNTHESIS_BY_TEMPERAMENT[temperament].replace('{INSIDE}', inside);
}

// ── Personas (generic framework, no names) ───────────────────────────

export interface PersonaArchetype {
  label: string;
  role: string;
  desc: string;
  tone: Tone;
}

export const personasFramework: { intro: string; archetypes: PersonaArchetype[]; prompt: string } = {
  intro:
    'An old practice: name three internal figures. Most of us slip between at least that many distinct modes; giving them names gives us language for which one is in the room.',
  archetypes: [
    {
      label: 'The Listener',
      role: 'Holds space',
      desc: 'Hears people. Builds quiet safety. Knows when to lean in and when to wait.',
      tone: 'emerald',
    },
    {
      label: 'The Architect',
      role: 'Holds the frame',
      desc: 'Hears patterns. Makes freedom sustainable through structure. Watches the long arc.',
      tone: 'sky',
    },
    {
      label: 'The Steady One',
      role: 'Holds the center',
      desc: 'Turns reactivity into right action. The still point inside motion. Says no when no is the work.',
      tone: 'purple',
    },
  ],
  prompt:
    'These are starter names — an offering. Your three figures will have other names, and they should. Naming them yourself is part of the work.',
};
