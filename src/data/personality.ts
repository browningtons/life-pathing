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
  traits: '23 Facets',
  descriptors: 'How Others See You',
  temperament: 'Temperament',
  types: 'Type Matches',
  convergence: 'Where Systems Converge',
  personas: 'Inner Architecture',
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
  Empath: 'Creative, compassionate, focused on possibilities for people',
  Theorist: 'Analytical, questioning, focused on innovative ideas',
  Responder: 'Adaptable, practical, focused on living in the moment',
  Preserver: 'Sensible, organized, focused on upholding traditions',
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
    { title: 'Empathy + Idealism', desc: "Your through-line is heart-first. You're motivated not just by what works but by what feels aligned with integrity and care.", color: '#9E6B9B' },
    { title: 'Meaning-Making', desc: 'You instinctively see story in events. Turning chaos into narrative is your superpower — in relationships, work, or the way you describe your own life.', color: '#CD8245' },
    { title: 'Imagination + People', desc: 'You combine visionary thinking with deep attunement to others. Few people hold both together — most pick one and lose the other.', color: '#4A7FB5' },
    { title: 'Selective Intensity', desc: 'Context-dependent energy. Around the right people you light up; in draining environments you need withdrawal. Honor both.', color: '#5E9E58' },
  ],
  Theorist: [
    { title: 'Pattern Recognition', desc: 'Your through-line is seeing systems. You spot the structure under the surface — in code, conversations, conflicts, markets.', color: '#4A7FB5' },
    { title: 'Independence + Curiosity', desc: 'You learn by going deep, not wide. The people who try to manage you usually misread this as resistance to authority.', color: '#9E6B9B' },
    { title: 'Long-View Calibration', desc: "You trade short-term comfort for long-term clarity. Most people can't tell the difference between you being patient and you being detached.", color: '#CD8245' },
    { title: 'Skeptical Builder', desc: "You believe in things by interrogating them. Your faith in something is earned, not given — and that's why what you build tends to last.", color: '#5E9E58' },
  ],
  Responder: [
    { title: 'Present-Moment Mastery', desc: 'Your through-line is responsiveness. You read the room faster than people who plan; you adjust faster than people who think.', color: '#CD8245' },
    { title: 'Action as Thinking', desc: "You don't fully understand a thing until you've done it. Theory bores you; experience teaches you.", color: '#5E9E58' },
    { title: 'Practical Optimism', desc: "You assume things will work out — and you make them work out. Less faith, more momentum.", color: '#9E6B9B' },
    { title: 'Reading the Field', desc: 'You notice what others miss because you watch instead of plan. Your decisions feel improvised but they rest on sharp observation.', color: '#4A7FB5' },
  ],
  Preserver: [
    { title: 'Stewardship', desc: 'Your through-line is care for what matters. You build the structures other people depend on, often without being seen doing it.', color: '#5E9E58' },
    { title: 'Trust + Reliability', desc: "You earn trust by showing up the same way every time. People who don't notice you doing this notice immediately when you stop.", color: '#4A7FB5' },
    { title: 'Lineage + Continuity', desc: "You see yourself as a link in a chain — receiving from before, passing on. That's a perspective most modern frameworks miss.", color: '#9E6B9B' },
    { title: 'Quiet Competence', desc: 'You don\'t advertise effort. The work speaks; the credit follows when it follows. You\'re fine either way.', color: '#CD8245' },
  ],
};

export function getConvergenceForMbti(mbti: string): ConvergenceTheme[] {
  return CONVERGENCE_BY_TEMPERAMENT[temperamentForMbti(mbti)];
}

const GROWTH_BY_TEMPERAMENT: Record<TemperamentName, GrowthEdge[]> = {
  Empath: [
    { title: 'Freedom vs. Structure', desc: "Big vision, messy trail. Don't impose heavy systems — use lightweight guardrails and one sticky ritual at a time." },
    { title: 'Authenticity vs. Visibility', desc: "You're doing deep, meaningful work — but others won't see it unless you translate it into artifacts: decision logs, demos, shared updates." },
  ],
  Theorist: [
    { title: 'Insight vs. Execution', desc: 'You see further than you ship. The bottleneck is rarely understanding — it\'s converting understanding into something other people can use.' },
    { title: 'Detachment vs. Connection', desc: "Your strength is critical distance, but the people in your life don't need a critic. They need a witness. Practice presence without analysis." },
  ],
  Responder: [
    { title: 'Now vs. Later', desc: "You move on instinct, which is your gift — but big decisions sometimes need the slower track. When stakes are high, force yourself to wait one more day." },
    { title: 'Activity vs. Reflection', desc: "You think by doing. That works until it doesn't. Schedule explicit pauses; without them you can run hard in the wrong direction." },
  ],
  Preserver: [
    { title: 'Tradition vs. Innovation', desc: "Continuity is your gift, but the world keeps changing under your feet. Hold the structures lightly enough to update them." },
    { title: 'Service vs. Self', desc: "You give first, often. The risk is forgetting what you'd want if no one was counting on you. Ask the question anyway." },
  ],
};

export function getGrowthEdgesForMbti(mbti: string): GrowthEdge[] {
  return GROWTH_BY_TEMPERAMENT[temperamentForMbti(mbti)];
}

// ── Personas (generic framework, no names) ───────────────────────────

export const personasFramework = {
  intro: 'Three named internal personas — a framework for self-awareness and role clarity. Most people have at least three distinct modes they slip into. Naming them gives you a vocabulary for which one is showing up.',
  archetypes: [
    {
      label: 'The Empathic Leader',
      role: 'Holds space',
      desc: 'Listens to people. Creates emotional safety for others. Knows when to lean in.',
      color: '#5E9E58',
    },
    {
      label: 'The Illumined Architect',
      role: 'Builds the frame',
      desc: 'Listens to patterns. Makes freedom sustainable through structure. Sees the long arc.',
      color: '#4A7FB5',
    },
    {
      label: 'The Shieldmate Monk',
      role: 'Holds the center',
      desc: 'Transforms reactivity into right action. The still point inside motion. Says no when needed.',
      color: '#9E6B9B',
    },
  ],
  prompt: "These are starter archetypes. Your three personas may have different names — and they should. Naming them yourself is part of the work.",
};
