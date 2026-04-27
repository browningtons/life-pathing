// Personality data — derivation functions keyed off the user's MBTI type
// and Life Path number. Originally a hand-tuned snapshot of one user's
// profile; now generates "good-enough-for-journaling" content for any of
// the 16 MBTI types via a small deterministic model.
//
// This isn't psychometrics. The disclaimer in the upgrade modal already
// names the framing: a journaling tool, not psychological advice.

// ── Static types & catalog ────────────────────────────────────────────

export type TraitCategory = 'Lifestyle' | 'Values' | 'Cognitive' | 'Energy';

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

export interface CategoryMetaEntry {
  label: string;
  color: string;
  muted: string;
  track: string;
  icon: string;
}

export const categoryMeta: Record<TraitCategory, CategoryMetaEntry> = {
  Cognitive: { label: 'How You Think', color: '#4A7FB5', muted: '#B8D0E4', track: '#E4EDF5', icon: '✦' },
  Energy: { label: 'How You Recharge', color: '#5E9E58', muted: '#BCD9B8', track: '#E2F0E0', icon: '❋' },
  Values: { label: 'What You Prioritize', color: '#9E6B9B', muted: '#D4B8D2', track: '#EDE0EC', icon: '✿' },
  Lifestyle: { label: 'How You Move', color: '#CD8245', muted: '#E6C4A5', track: '#F5E6D5', icon: '❖' },
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

export type TemperamentName = 'Empath' | 'Theorist' | 'Responder' | 'Preserver';

// ── MBTI helpers ──────────────────────────────────────────────────────

type MbtiLetter = 'E' | 'I' | 'N' | 'S' | 'T' | 'F' | 'J' | 'P';

function mbtiLetters(mbti: string): { ie: 'E' | 'I'; sn: 'N' | 'S'; tf: 'T' | 'F'; jp: 'J' | 'P' } {
  return {
    ie: mbti[0] === 'E' ? 'E' : 'I',
    sn: mbti[1] === 'S' ? 'S' : 'N',
    tf: mbti[2] === 'T' ? 'T' : 'F',
    jp: mbti[3] === 'P' ? 'P' : 'J',
  };
}

export function temperamentForMbti(mbti: string): TemperamentName {
  const { sn, tf, jp } = mbtiLetters(mbti);
  if (sn === 'N' && tf === 'F') return 'Empath';
  if (sn === 'N' && tf === 'T') return 'Theorist';
  if (sn === 'S' && jp === 'P') return 'Responder';
  return 'Preserver'; // SJ
}

// Deterministic 32-bit hash. Used to give each (facet, mbti) pair stable
// pseudo-random variance so percentages don't all clump on the same value.
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

// ── 23 facets ─────────────────────────────────────────────────────────

interface FacetSpec {
  facet: string;
  category: TraitCategory;
  left: string;
  right: string;
  /** The MBTI letter that aligns with the LEFT side. */
  leftLetter: MbtiLetter;
}

const FACET_SPECS: FacetSpec[] = [
  // Lifestyle (J/P-driven)
  { facet: 'Relaxed vs Orderly', category: 'Lifestyle', left: 'Relaxed', right: 'Orderly', leftLetter: 'P' },
  { facet: 'Spontaneous vs Scheduled', category: 'Lifestyle', left: 'Spontaneous', right: 'Scheduled', leftLetter: 'P' },
  { facet: 'Casual vs Conscientious', category: 'Lifestyle', left: 'Casual', right: 'Conscientious', leftLetter: 'P' },
  { facet: 'Impulsive vs Disciplined', category: 'Lifestyle', left: 'Impulsive', right: 'Disciplined', leftLetter: 'P' },
  { facet: 'Easygoing vs Ambitious', category: 'Lifestyle', left: 'Easygoing', right: 'Ambitious', leftLetter: 'P' },
  // Values (T/F-driven)
  { facet: 'Objective vs Subjective', category: 'Values', left: 'Objective', right: 'Subjective', leftLetter: 'T' },
  { facet: 'Rational vs Compassionate', category: 'Values', left: 'Rational', right: 'Compassionate', leftLetter: 'T' },
  { facet: 'Challenging vs Agreeable', category: 'Values', left: 'Challenging', right: 'Agreeable', leftLetter: 'T' },
  { facet: 'Individualist vs Helpful', category: 'Values', left: 'Individualist', right: 'Helpful', leftLetter: 'T' },
  { facet: 'Self-Reliant vs Cooperative', category: 'Values', left: 'Self-Reliant', right: 'Cooperative', leftLetter: 'T' },
  { facet: 'Tough vs Tolerant', category: 'Values', left: 'Tough', right: 'Tolerant', leftLetter: 'T' },
  // Cognitive (S/N-driven)
  { facet: 'Realistic vs Imaginative', category: 'Cognitive', left: 'Realistic', right: 'Imaginative', leftLetter: 'S' },
  { facet: 'Concrete vs Conceptual', category: 'Cognitive', left: 'Concrete', right: 'Conceptual', leftLetter: 'S' },
  { facet: 'Traditional vs Progressive', category: 'Cognitive', left: 'Traditional', right: 'Progressive', leftLetter: 'S' },
  { facet: 'Factual vs Insightful', category: 'Cognitive', left: 'Factual', right: 'Insightful', leftLetter: 'S' },
  { facet: 'Practical vs Aesthetic', category: 'Cognitive', left: 'Practical', right: 'Aesthetic', leftLetter: 'S' },
  { facet: 'Habitual vs Adventurous', category: 'Cognitive', left: 'Habitual', right: 'Adventurous', leftLetter: 'S' },
  // Energy (E/I-driven)
  { facet: 'Placid vs Energetic', category: 'Energy', left: 'Placid', right: 'Energetic', leftLetter: 'I' },
  { facet: 'Reserved vs Expressive', category: 'Energy', left: 'Reserved', right: 'Expressive', leftLetter: 'I' },
  { facet: 'Private vs Prominent', category: 'Energy', left: 'Private', right: 'Prominent', leftLetter: 'I' },
  { facet: 'Calm vs Joyful', category: 'Energy', left: 'Calm', right: 'Joyful', leftLetter: 'I' },
  { facet: 'Aloof vs Friendly', category: 'Energy', left: 'Aloof', right: 'Friendly', leftLetter: 'I' },
  { facet: 'Solitary vs Engaged', category: 'Energy', left: 'Solitary', right: 'Engaged', leftLetter: 'I' },
];

export function getTraitsForMbti(mbti: string): Trait[] {
  const letters = mbtiLetters(mbti);
  return FACET_SPECS.map((spec) => {
    // Pick the user's letter on this spec's dimension.
    let userLetter: MbtiLetter;
    if (spec.leftLetter === 'P') userLetter = letters.jp;
    else if (spec.leftLetter === 'T') userLetter = letters.tf;
    else if (spec.leftLetter === 'S') userLetter = letters.sn;
    else userLetter = letters.ie;

    const userFavorsLeft = userLetter === spec.leftLetter;
    // ±15 deterministic variance per (facet, mbti), centered at 65/35.
    const variance = (hash(spec.facet + ':' + mbti) % 31) - 15;
    const leftPct = clamp(userFavorsLeft ? 65 + variance : 35 + variance, 18, 88);
    const rightPct = 100 - leftPct;
    const leftDominant = leftPct >= rightPct;
    return {
      facet: spec.facet,
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
// Each descriptor leans toward one or two MBTI letters. We compute a
// percentage by summing the weighted matches against the user's letters,
// then add a tiny per-(descriptor, mbti) variance so types don't tie.

interface DescriptorSpec {
  word: string;
  favors: { letter: MbtiLetter; weight: number }[];
}

const DESCRIPTOR_SPECS: DescriptorSpec[] = [
  { word: 'Curious', favors: [{ letter: 'N', weight: 1.0 }, { letter: 'P', weight: 0.4 }] },
  { word: 'Gentle', favors: [{ letter: 'F', weight: 1.0 }] },
  { word: 'Creative', favors: [{ letter: 'N', weight: 0.9 }, { letter: 'P', weight: 0.5 }] },
  { word: 'Introspective', favors: [{ letter: 'I', weight: 0.9 }, { letter: 'N', weight: 0.4 }] },
  { word: 'Clever', favors: [{ letter: 'N', weight: 0.7 }, { letter: 'T', weight: 0.4 }] },
  { word: 'Tolerant', favors: [{ letter: 'F', weight: 0.7 }, { letter: 'P', weight: 0.5 }] },
  { word: 'Sociable', favors: [{ letter: 'E', weight: 1.0 }, { letter: 'F', weight: 0.3 }] },
  { word: 'Warm', favors: [{ letter: 'F', weight: 0.9 }, { letter: 'E', weight: 0.3 }] },
  { word: 'Adaptable', favors: [{ letter: 'P', weight: 0.9 }] },
  { word: 'Innovative', favors: [{ letter: 'N', weight: 0.8 }, { letter: 'T', weight: 0.4 }] },
  { word: 'Skeptical', favors: [{ letter: 'T', weight: 0.7 }, { letter: 'N', weight: 0.3 }] },
  { word: 'Outgoing', favors: [{ letter: 'E', weight: 1.0 }] },
  { word: 'Idealistic', favors: [{ letter: 'N', weight: 0.6 }, { letter: 'F', weight: 0.7 }] },
  { word: 'Whimsical', favors: [{ letter: 'N', weight: 0.6 }, { letter: 'P', weight: 0.6 }] },
  { word: 'Enthusiastic', favors: [{ letter: 'E', weight: 0.7 }, { letter: 'F', weight: 0.4 }] },
  { word: 'Pragmatic', favors: [{ letter: 'S', weight: 0.7 }, { letter: 'T', weight: 0.5 }] },
  { word: 'Driven', favors: [{ letter: 'J', weight: 0.7 }, { letter: 'T', weight: 0.4 }] },
  { word: 'Sympathetic', favors: [{ letter: 'F', weight: 0.8 }] },
  { word: 'Dominant', favors: [{ letter: 'E', weight: 0.5 }, { letter: 'T', weight: 0.5 }, { letter: 'J', weight: 0.4 }] },
  { word: 'Competitive', favors: [{ letter: 'T', weight: 0.6 }, { letter: 'J', weight: 0.4 }] },
  { word: 'Assertive', favors: [{ letter: 'E', weight: 0.5 }, { letter: 'T', weight: 0.5 }] },
  { word: 'Cautious', favors: [{ letter: 'I', weight: 0.5 }, { letter: 'J', weight: 0.4 }, { letter: 'S', weight: 0.4 }] },
  { word: 'Conservative', favors: [{ letter: 'S', weight: 0.6 }, { letter: 'J', weight: 0.5 }] },
  { word: 'Reliable', favors: [{ letter: 'J', weight: 0.7 }, { letter: 'S', weight: 0.4 }] },
  { word: 'Organized', favors: [{ letter: 'J', weight: 1.0 }, { letter: 'S', weight: 0.3 }] },
];

export function getDescriptorsForMbti(mbti: string): { word: string; pct: number }[] {
  const userLetters = new Set<MbtiLetter>([
    mbti[0] === 'E' ? 'E' : 'I',
    mbti[1] === 'S' ? 'S' : 'N',
    mbti[2] === 'T' ? 'T' : 'F',
    mbti[3] === 'P' ? 'P' : 'J',
  ]);
  return DESCRIPTOR_SPECS.map((spec) => {
    const matched = spec.favors.filter((f) => userLetters.has(f.letter));
    const score = matched.reduce((sum, f) => sum + f.weight, 0);
    const totalWeight = spec.favors.reduce((sum, f) => sum + f.weight, 0);
    // Match ratio in [0, 1], shifted to ~30–85% range.
    const ratio = totalWeight === 0 ? 0.5 : score / totalWeight;
    const variance = ((hash(spec.word + ':' + mbti) % 13) - 6) / 100; // ±6%
    const pct = clamp(Math.round((30 + ratio * 55 + variance * 100) * 1) / 1, 20, 92);
    return { word: spec.word, pct };
  }).sort((a, b) => b.pct - a.pct);
}

// ── Temperament ───────────────────────────────────────────────────────

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

export function getTemperamentForMbti(mbti: string): TemperamentEntry[] {
  const dominant = temperamentForMbti(mbti);
  // Dominant temperament gets ~40%, secondaries split the rest with a
  // small lean toward the user's other tendencies.
  const allNames: TemperamentName[] = ['Empath', 'Theorist', 'Responder', 'Preserver'];
  const dominantPct = 38 + ((hash(mbti + ':temp') % 11) - 5); // 33–48
  const remaining = 100 - dominantPct;
  const others = allNames.filter((n) => n !== dominant);
  // Distribute remaining across the other three with small variance.
  const base = remaining / 3;
  const slots = others.map((name, i) => {
    const v = ((hash(mbti + ':t' + i) % 11) - 5);
    return { name, pct: Math.round(base + v) };
  });
  // Normalize so all four sum to exactly 100.
  const slotTotal = slots.reduce((s, x) => s + x.pct, 0);
  const adjust = remaining - slotTotal;
  if (slots[0]) slots[0].pct += adjust;

  const entries: TemperamentEntry[] = [
    { name: dominant, pct: dominantPct, desc: TEMPERAMENT_DESC[dominant] },
    ...slots.map((s) => ({ name: s.name, pct: clamp(s.pct, 3, 35), desc: TEMPERAMENT_DESC[s.name] })),
  ];
  return entries.sort((a, b) => b.pct - a.pct);
}

// ── MBTI letter percentages (header detail) ───────────────────────────

const LETTER_LABEL: Record<MbtiLetter, string> = {
  E: 'Extraversion', I: 'Introversion',
  N: 'Intuition',    S: 'Sensing',
  F: 'Feeling',      T: 'Thinking',
  P: 'Perceiving',   J: 'Judging',
};
const LETTER_COLOR: Record<MbtiLetter, string> = {
  E: '#5E9E58', I: '#5E9E58',
  N: '#4A7FB5', S: '#4A7FB5',
  F: '#9E6B9B', T: '#9E6B9B',
  P: '#CD8245', J: '#CD8245',
};

export function getMbtiLetterDetails(mbti: string): { letter: MbtiLetter; pct: number; label: string; color: string }[] {
  const letters = [
    mbti[0] === 'E' ? 'E' : 'I',
    mbti[1] === 'S' ? 'S' : 'N',
    mbti[2] === 'T' ? 'T' : 'F',
    mbti[3] === 'P' ? 'P' : 'J',
  ] as MbtiLetter[];
  return letters.map((letter, i) => ({
    letter,
    // 55–80% lean toward the dominant letter, deterministic per (mbti, slot)
    pct: 55 + (hash(mbti + ':L' + i) % 26),
    label: LETTER_LABEL[letter],
    color: LETTER_COLOR[letter],
  }));
}

// ── Type matches ──────────────────────────────────────────────────────
// Distance is the number of letters that differ. Closer types get higher
// match scores. Self is excluded so users see neighbors, not themselves.

const ARCHETYPE_NAMES: Record<string, string> = {
  ENFP: 'Champion', INFP: 'Healer', ENFJ: 'Teacher', INFJ: 'Counselor',
  ENTP: 'Inventor', INTP: 'Architect', ENTJ: 'Commander', INTJ: 'Mastermind',
  ESFP: 'Performer', ISFP: 'Composer', ESFJ: 'Provider', ISFJ: 'Protector',
  ESTP: 'Promoter', ISTP: 'Crafter', ESTJ: 'Supervisor', ISTJ: 'Inspector',
};

export interface TypeMatch {
  code: string;
  name: string;
  pct: number;
}

export function getTypeMatchesForMbti(mbti: string): TypeMatch[] {
  const all = Object.keys(ARCHETYPE_NAMES);
  return all
    .filter((code) => code !== mbti)
    .map((code) => {
      const distance =
        (mbti[0] !== code[0] ? 1 : 0) +
        (mbti[1] !== code[1] ? 1 : 0) +
        (mbti[2] !== code[2] ? 1 : 0) +
        (mbti[3] !== code[3] ? 1 : 0);
      // 0=skip, 1→70-78, 2→48-58, 3→28-38, 4→14-22
      const base = distance === 1 ? 74 : distance === 2 ? 53 : distance === 3 ? 33 : 18;
      const variance = (hash(code + ':' + mbti) % 9) - 4;
      return { code, name: ARCHETYPE_NAMES[code] ?? code, pct: clamp(base + variance, 12, 84) };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);
}

// ── Convergence themes & growth edges (per temperament) ──────────────

export interface ConvergenceTheme {
  title: string;
  desc: string;
  color: string;
}

export interface GrowthEdge {
  title: string;
  desc: string;
}

const CONVERGENCE_BY_TEMPERAMENT: Record<TemperamentName, ConvergenceTheme[]> = {
  Empath: [
    { title: 'Empathy and Idealism', desc: 'The through-line is heart-first. The motive is rarely only what works — it is what feels right alongside.', color: '#9E6B9B' },
    { title: 'Meaning-Making', desc: 'A natural instinct for finding story in events. Chaos rendered as narrative — in love, in work, in the telling of one\'s own life.', color: '#CD8245' },
    { title: 'Imagination and People', desc: 'Visionary thinking paired with attunement to others. Most who reach for one let the other fall away. This temperament tends to keep both.', color: '#4A7FB5' },
    { title: 'Selective Intensity', desc: 'Energy that depends on company. Among the right people, the lights come on. In draining rooms, retreat is medicine. Both are true.', color: '#5E9E58' },
  ],
  Theorist: [
    { title: 'Pattern Recognition', desc: 'The through-line is seeing the structure under the surface — in code, in conflict, in markets, in conversation.', color: '#4A7FB5' },
    { title: 'Independence and Curiosity', desc: 'Learning happens by going deep before going wide. Those who try to manage this temperament often mistake the depth for resistance.', color: '#9E6B9B' },
    { title: 'The Long View', desc: 'Short-term comfort is traded for longer clarity. The patient and the detached can look the same from outside; the difference matters from within.', color: '#CD8245' },
    { title: 'The Skeptical Builder', desc: 'Belief comes through interrogation. Faith is earned, not given — which is why what gets built tends to last.', color: '#5E9E58' },
  ],
  Responder: [
    { title: 'The Present Moment', desc: 'The through-line is responsiveness. Reading the room faster than the planners. Adjusting faster than the thinkers.', color: '#CD8245' },
    { title: 'Action as Thinking', desc: 'A thing isn\'t fully understood until it has been done. Theory tires this temperament; experience teaches it.', color: '#5E9E58' },
    { title: 'Practical Optimism', desc: 'Things will work out — and the work to make them work out is part of the assumption. Less faith. More momentum.', color: '#9E6B9B' },
    { title: 'Reading the Field', desc: 'Things others miss are noticed, because watching comes before planning. Decisions look improvised. They rest on sharper observation than they appear to.', color: '#4A7FB5' },
  ],
  Preserver: [
    { title: 'Stewardship', desc: 'The through-line is care for what matters. The structures others depend on get built quietly, often without notice.', color: '#5E9E58' },
    { title: 'Trust and Reliability', desc: 'Trust is earned by showing up the same way every time. Those who fail to notice it while it lasts always notice when it stops.', color: '#4A7FB5' },
    { title: 'Lineage and Continuity', desc: 'A sense of being a link in a chain — receiving from those before, passing to those after. A perspective most modern frameworks lose track of.', color: '#9E6B9B' },
    { title: 'Quiet Competence', desc: 'Effort is not advertised. The work speaks; the credit follows when it follows. Either is fine.', color: '#CD8245' },
  ],
};

export function getConvergenceForMbti(mbti: string): ConvergenceTheme[] {
  return CONVERGENCE_BY_TEMPERAMENT[temperamentForMbti(mbti)];
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

export function getGrowthEdgesForMbti(mbti: string): GrowthEdge[] {
  return GROWTH_BY_TEMPERAMENT[temperamentForMbti(mbti)];
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

export function getSynthesisForMbti(
  mbti: string,
  mbtiTitle: string,
  lpTitle: string | null,
): string {
  const wiring = stripThe(mbtiTitle);
  const arc = lpTitle ? stripThe(lpTitle) : null;
  const inside = arc
    ? `The ${wiring} wiring set inside the ${arc} arc`
    : `The ${wiring} wiring`;
  return SYNTHESIS_BY_TEMPERAMENT[temperamentForMbti(mbti)].replace('{INSIDE}', inside);
}

// ── Personas (generic framework, no names) ───────────────────────────

export const personasFramework = {
  intro: 'An old practice: name three internal figures. Most of us slip between at least that many distinct modes; giving them names gives us language for which one is in the room.',
  archetypes: [
    {
      label: 'The Listener',
      role: 'Holds space',
      desc: 'Hears people. Builds quiet safety. Knows when to lean in and when to wait.',
      color: '#5E9E58',
    },
    {
      label: 'The Architect',
      role: 'Holds the frame',
      desc: 'Hears patterns. Makes freedom sustainable through structure. Watches the long arc.',
      color: '#4A7FB5',
    },
    {
      label: 'The Steady One',
      role: 'Holds the center',
      desc: 'Turns reactivity into right action. The still point inside motion. Says no when no is the work.',
      color: '#9E6B9B',
    },
  ],
  prompt: 'These are starter names — an offering. Your three figures will have other names, and they should. Naming them yourself is part of the work.',
};
