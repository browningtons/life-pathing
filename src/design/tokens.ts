// Design tokens — the one place the three views agree on how things look.
//
// Everything here is a Tailwind class string or a lookup from a semantic
// key to one. Views compose these instead of carrying their own colour
// hexes, heading recipes, or focus-ring strings. If the look of the app
// changes, it changes here.

// ── Page ──────────────────────────────────────────────────────────────

export const PAGE_BG = 'bg-[#F8FAFC]';
export const PAGE_TEXT = 'text-slate-800';
export const FONT = 'font-sans';

// ── Focus ─────────────────────────────────────────────────────────────

export const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500';

/** Focus ring for controls sitting on the dark hero surface. */
export const FOCUS_RING_ON_DARK =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-900 focus-visible:ring-indigo-300';

// ── Surfaces ──────────────────────────────────────────────────────────

/** Base card. `Card` applies this; views add a variant on top. */
export const CARD_BASE = 'rounded-2xl shadow-sm border p-6';

export const CARD_VARIANTS = {
  default: 'bg-white border-slate-100',
  muted: 'bg-slate-50 border-slate-200',
  tinted: 'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-50',
  positive: 'bg-emerald-50 border-emerald-100',
  warm: 'bg-amber-50/40 border-amber-100',
  hero: 'bg-indigo-900 text-white border-indigo-800 relative overflow-hidden',
} as const;

export type CardVariant = keyof typeof CARD_VARIANTS;

/** Translucent panel that sits inside the hero card. */
export const HERO_PANEL = 'bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10';

/** Darker inset tile inside a hero panel. */
export const HERO_TILE = 'rounded-lg bg-black/20';

// ── Typography ────────────────────────────────────────────────────────

/** Small caps label above a hero title ("Reading a Type"). */
export const EYEBROW = 'text-xs font-bold uppercase tracking-widest';

/** Main hero title. */
export const HERO_TITLE = 'text-4xl font-bold mb-2';

/** Hero subtitle — the nickname line. */
export const HERO_SUBTITLE = 'text-xl text-indigo-300 font-medium mb-4';

/** Hero body copy. */
export const HERO_BODY = 'text-sm text-indigo-100/80 leading-relaxed max-w-md';

/** Section heading inside a card. Pair with a tone text class. */
export const SECTION_HEADING = 'text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2';

/** Default (quiet) section heading colour. */
export const SECTION_HEADING_MUTED = 'text-slate-400';

/** Tiny label under a value ("First", "Input"). */
export const MICRO_LABEL = 'text-[10px] uppercase font-bold tracking-wider text-slate-400';

/** Body copy inside cards. */
export const BODY = 'text-sm text-slate-600 leading-relaxed';

/** Italic aside. */
export const ASIDE = 'text-xs text-slate-500 italic leading-relaxed';

// ── Chips & badges ────────────────────────────────────────────────────

/** Name chip ("Some who carry this type"). */
export const CHIP =
  'px-3 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-slate-600 rounded-lg text-xs font-bold cursor-default';

/** Pill badge for flagging a near-even split. */
export const BORDERLINE_BADGE =
  'inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-amber-700';

/** Same badge, tuned for the dark hero surface. */
export const BORDERLINE_BADGE_ON_DARK =
  'inline-flex items-center rounded-full border border-amber-300/60 bg-amber-300/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-amber-200';

// ── Tabs ──────────────────────────────────────────────────────────────

export const TAB_BASE =
  'px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap';
export const TAB_ACTIVE = 'bg-indigo-600 text-white shadow-sm';
export const TAB_IDLE = 'text-slate-500 hover:bg-slate-50 hover:text-slate-700';

// ── Semantic tones ────────────────────────────────────────────────────
// Data modules tag things with a tone key; views resolve it here. This
// is what keeps colour hexes out of the content files.

export type Tone = 'sky' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'slate';

export interface ToneClasses {
  text: string;
  /** Lighter text that reads on the indigo hero surface. */
  textOnDark: string;
  bg: string;
  bar: string;
  muted: string;
  track: string;
  borderL: string;
  dot: string;
}

export const TONES: Record<Tone, ToneClasses> = {
  sky: {
    text: 'text-sky-700',
    textOnDark: 'text-sky-300',
    bg: 'bg-sky-600',
    bar: 'bg-sky-500',
    muted: 'bg-sky-200',
    track: 'bg-sky-100',
    borderL: 'border-l-sky-400',
    dot: 'bg-sky-400',
  },
  emerald: {
    text: 'text-emerald-700',
    textOnDark: 'text-emerald-300',
    bg: 'bg-emerald-600',
    bar: 'bg-emerald-500',
    muted: 'bg-emerald-200',
    track: 'bg-emerald-100',
    borderL: 'border-l-emerald-400',
    dot: 'bg-emerald-400',
  },
  purple: {
    text: 'text-purple-700',
    textOnDark: 'text-purple-300',
    bg: 'bg-purple-600',
    bar: 'bg-purple-500',
    muted: 'bg-purple-200',
    track: 'bg-purple-100',
    borderL: 'border-l-purple-400',
    dot: 'bg-purple-400',
  },
  amber: {
    text: 'text-amber-700',
    textOnDark: 'text-amber-300',
    bg: 'bg-amber-600',
    bar: 'bg-amber-500',
    muted: 'bg-amber-200',
    track: 'bg-amber-100',
    borderL: 'border-l-amber-400',
    dot: 'bg-amber-400',
  },
  indigo: {
    text: 'text-indigo-600',
    textOnDark: 'text-indigo-300',
    bg: 'bg-indigo-600',
    bar: 'bg-indigo-500',
    muted: 'bg-indigo-200',
    track: 'bg-indigo-100',
    borderL: 'border-l-indigo-400',
    dot: 'bg-indigo-400',
  },
  slate: {
    text: 'text-slate-700',
    textOnDark: 'text-slate-300',
    bg: 'bg-slate-600',
    bar: 'bg-slate-500',
    muted: 'bg-slate-200',
    track: 'bg-slate-100',
    borderL: 'border-l-slate-400',
    dot: 'bg-slate-400',
  },
};

export const toneFor = (tone: Tone): ToneClasses => TONES[tone];
