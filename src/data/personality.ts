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

export const traitsData: Trait[] = [
  { facet: 'Relaxed vs Orderly', category: 'Lifestyle', left: 'Relaxed', right: 'Orderly', leftPct: 66, rightPct: 34, dominant: 'Relaxed', dominantPct: 66 },
  { facet: 'Spontaneous vs Scheduled', category: 'Lifestyle', left: 'Spontaneous', right: 'Scheduled', leftPct: 70, rightPct: 30, dominant: 'Spontaneous', dominantPct: 70 },
  { facet: 'Casual vs Conscientious', category: 'Lifestyle', left: 'Casual', right: 'Conscientious', leftPct: 58, rightPct: 42, dominant: 'Casual', dominantPct: 58 },
  { facet: 'Impulsive vs Disciplined', category: 'Lifestyle', left: 'Impulsive', right: 'Disciplined', leftPct: 62, rightPct: 38, dominant: 'Impulsive', dominantPct: 62 },
  { facet: 'Easygoing vs Ambitious', category: 'Lifestyle', left: 'Easygoing', right: 'Ambitious', leftPct: 56, rightPct: 44, dominant: 'Easygoing', dominantPct: 56 },
  { facet: 'Objective vs Subjective', category: 'Values', left: 'Objective', right: 'Subjective', leftPct: 57, rightPct: 43, dominant: 'Objective', dominantPct: 57 },
  { facet: 'Rational vs Compassionate', category: 'Values', left: 'Rational', right: 'Compassionate', leftPct: 48, rightPct: 52, dominant: 'Compassionate', dominantPct: 52 },
  { facet: 'Challenging vs Agreeable', category: 'Values', left: 'Challenging', right: 'Agreeable', leftPct: 27, rightPct: 73, dominant: 'Agreeable', dominantPct: 73 },
  { facet: 'Individualist vs Helpful', category: 'Values', left: 'Individualist', right: 'Helpful', leftPct: 56, rightPct: 44, dominant: 'Individualist', dominantPct: 56 },
  { facet: 'Self-Reliant vs Cooperative', category: 'Values', left: 'Self-Reliant', right: 'Cooperative', leftPct: 40, rightPct: 60, dominant: 'Cooperative', dominantPct: 60 },
  { facet: 'Tough vs Tolerant', category: 'Values', left: 'Tough', right: 'Tolerant', leftPct: 68, rightPct: 32, dominant: 'Tough', dominantPct: 68 },
  { facet: 'Realistic vs Imaginative', category: 'Cognitive', left: 'Realistic', right: 'Imaginative', leftPct: 46, rightPct: 54, dominant: 'Imaginative', dominantPct: 54 },
  { facet: 'Concrete vs Conceptual', category: 'Cognitive', left: 'Concrete', right: 'Conceptual', leftPct: 24, rightPct: 76, dominant: 'Conceptual', dominantPct: 76 },
  { facet: 'Traditional vs Progressive', category: 'Cognitive', left: 'Traditional', right: 'Progressive', leftPct: 30, rightPct: 70, dominant: 'Progressive', dominantPct: 70 },
  { facet: 'Factual vs Insightful', category: 'Cognitive', left: 'Factual', right: 'Insightful', leftPct: 6, rightPct: 94, dominant: 'Insightful', dominantPct: 94 },
  { facet: 'Practical vs Aesthetic', category: 'Cognitive', left: 'Practical', right: 'Aesthetic', leftPct: 10, rightPct: 90, dominant: 'Aesthetic', dominantPct: 90 },
  { facet: 'Habitual vs Adventurous', category: 'Cognitive', left: 'Habitual', right: 'Adventurous', leftPct: 48, rightPct: 52, dominant: 'Adventurous', dominantPct: 52 },
  { facet: 'Placid vs Energetic', category: 'Energy', left: 'Placid', right: 'Energetic', leftPct: 40, rightPct: 60, dominant: 'Energetic', dominantPct: 60 },
  { facet: 'Reserved vs Expressive', category: 'Energy', left: 'Reserved', right: 'Expressive', leftPct: 50, rightPct: 50, dominant: 'Expressive', dominantPct: 50 },
  { facet: 'Private vs Prominent', category: 'Energy', left: 'Private', right: 'Prominent', leftPct: 59, rightPct: 41, dominant: 'Private', dominantPct: 59 },
  { facet: 'Calm vs Joyful', category: 'Energy', left: 'Calm', right: 'Joyful', leftPct: 44, rightPct: 56, dominant: 'Joyful', dominantPct: 56 },
  { facet: 'Aloof vs Friendly', category: 'Energy', left: 'Aloof', right: 'Friendly', leftPct: 22, rightPct: 78, dominant: 'Friendly', dominantPct: 78 },
  { facet: 'Solitary vs Engaged', category: 'Energy', left: 'Solitary', right: 'Engaged', leftPct: 87, rightPct: 13, dominant: 'Solitary', dominantPct: 87 },
];

export const descriptors = [
  { word: 'Curious', pct: 85 }, { word: 'Gentle', pct: 78 }, { word: 'Creative', pct: 72 },
  { word: 'Introspective', pct: 72 }, { word: 'Clever', pct: 72 }, { word: 'Tolerant', pct: 71 },
  { word: 'Sociable', pct: 69 }, { word: 'Warm', pct: 65 }, { word: 'Adaptable', pct: 64 },
  { word: 'Innovative', pct: 62 }, { word: 'Skeptical', pct: 61 }, { word: 'Outgoing', pct: 61 },
  { word: 'Idealistic', pct: 58 }, { word: 'Whimsical', pct: 57 }, { word: 'Enthusiastic', pct: 55 },
  { word: 'Pragmatic', pct: 50 }, { word: 'Driven', pct: 49 }, { word: 'Sympathetic', pct: 46 },
  { word: 'Dominant', pct: 45 }, { word: 'Competitive', pct: 40 }, { word: 'Assertive', pct: 39 },
  { word: 'Cautious', pct: 35 }, { word: 'Conservative', pct: 34 }, { word: 'Reliable', pct: 32 },
  { word: 'Organized', pct: 26 },
];

export type TemperamentName = 'Empath' | 'Theorist' | 'Responder' | 'Preserver';

export const temperaments: { name: TemperamentName; pct: number; desc: string }[] = [
  { name: 'Empath', pct: 35, desc: 'Creative, compassionate, focused on possibilities for people' },
  { name: 'Theorist', pct: 35, desc: 'Analytical, questioning, focused on innovative ideas' },
  { name: 'Responder', pct: 19, desc: 'Adaptable, practical, focused on living in the moment' },
  { name: 'Preserver', pct: 10, desc: 'Sensible, organized, focused on upholding traditions' },
];

export const typeMatches = [
  { code: 'ENFP', name: 'Champion', pct: 70 },
  { code: 'INFP', name: 'Healer', pct: 69 },
  { code: 'ENTP', name: 'Inventor', pct: 69 },
  { code: 'INTP', name: 'Architect', pct: 68 },
  { code: 'ENFJ', name: 'Teacher', pct: 52 },
  { code: 'ENTJ', name: 'Commander', pct: 52 },
];

export const convergenceThemes = [
  { title: 'Novelty + Exploration', desc: 'You thrive in environments that allow iteration, creativity, and ongoing exploration. Your learning style is try, adjust, try again.', color: '#4A7FB5' },
  { title: 'Empathy + Idealism', desc: "Your through-line is a heart-first approach. You're motivated not just by what works but by what feels aligned with integrity and care.", color: '#9E6B9B' },
  { title: 'Ambivert Energy', desc: 'Context-dependent. With your kids or close friends, you light up. In draining environments, you need withdrawal. Selective intensity.', color: '#5E9E58' },
  { title: 'Meaning-Making', desc: 'You have an instinct for seeing story in events. Your superpower is turning chaos into narrative — in parenting, dashboards, or essays.', color: '#CD8245' },
];

export const growthEdges = [
  { title: 'Freedom vs. Structure', desc: "Big vision, messy trail. Don't impose heavy systems — use lightweight guardrails and single sticky rituals." },
  { title: 'Authenticity vs. Visibility', desc: "You're doing deep, meaningful work, but others don't see it unless it's translated into artifacts — decision logs, demos, updates." },
];

export const personas = [
  { name: 'Carl Brown', role: 'The Empathic Leader', desc: 'Listens to people. Holds space. Creates emotional safety for others.', color: '#5E9E58' },
  { name: 'Lucius Brown', role: 'The Illumined Architect', desc: 'Listens to patterns. Builds frameworks. Makes freedom sustainable through order.', color: '#4A7FB5' },
  { name: 'Vega Brown', role: 'The Shieldmate Monk', desc: 'Transforms emotional reactivity into right action. The still center within the storm.', color: '#9E6B9B' },
];

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
