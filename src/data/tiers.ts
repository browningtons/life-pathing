// The free / paid split — the one place it is decided.
//
// The rule: the *systems* are free, the *reading of you* is paid.
//
//   Free   Life Path by birthdate, all twelve numbers. Archetypes, all
//          sixteen types. The intake. The Profile hero, "The read", and
//          the five facets that show up loudest.
//   Paid   Everything on the Profile below that line: the full facet
//          breakdown by category, how others read you, temperament,
//          adjacent types, where the systems agree, the inner cast.
//
// Views ask `isPaidSection(section)` and wrap the answer in <ProGate>.
// They never carry their own idea of what is locked. The copy on each
// gate lives here too so the gates read in one voice.

import type { Section } from './personality';

export const PAID_SECTIONS: readonly Section[] = ['descriptors', 'temperament', 'types', 'convergence', 'personas'];

/**
 * The facets section is split: the signature (top five, where you split)
 * is free; the per-category breakdown of all twenty-three is paid. This
 * key names the paid half so it can carry gate copy like the others.
 */
export const FACET_DETAIL_GATE = 'traits_detail' as const;

/**
 * The Reading tab's gate (Phase 2). Used only while the Reading flag is on;
 * see src/lib/readingFlag.ts.
 */
export const READING_GATE = 'reading' as const;

export type GateKey = Section | typeof FACET_DETAIL_GATE | typeof READING_GATE;

/**
 * The five sections behind the Reading's line, in order, as the page heads
 * them. The free opening (the teaser) comes before them. Field names follow
 * the Reading JSON contract.
 */
export const READING_SECTIONS = [
  { field: 'number', title: 'The Number' },
  { field: 'type', title: 'The Type' },
  { field: 'agree', title: 'Where they agree' },
  { field: 'pull', title: 'Where they pull' },
  { field: 'closing', title: 'A closing line' },
] as const;

/** Shown on the Profile's gates while the Reading flag is on: one purchase opens both. */
export const INCLUDED_WITH_READING = 'Included with the Reading.';

export interface GateCopy {
  /** What is behind the gate, as a heading. */
  title: string;
  /** One or two sentences in the almanac voice. */
  blurb: string;
  /**
   * True when the section reads the facet scores, which only a pasted
   * report supplies. The blurb must then say so, so a letters-only reader
   * knows before buying (tested in tiers.test.ts).
   */
  needsReport?: boolean;
}

export const GATE_COPY: Record<GateKey, GateCopy> = {
  traits: { title: 'The facets', blurb: 'The five that show up loudest are above. The rest are behind the line.' },
  traits_detail: {
    title: 'All twenty-three facets, by category',
    blurb:
      'How you think, how you recharge, what you prioritize, how you move. Each facet with a reading of how strongly it runs, from a tension to the way the wiring goes. Read from a pasted TypeFinder or 16personalities report; four letters alone do not carry the facets.',
    needsReport: true,
  },
  descriptors: {
    title: 'How others tend to read you',
    blurb:
      'Twenty-five words, each a blend of a few facets, ranked by how much of you they catch. The top three are above. The full ranking is the interesting part. Like the facets, it needs a pasted TypeFinder or 16personalities report.',
    needsReport: true,
  },
  temperament: {
    title: 'The four temperaments',
    blurb: 'The leading one is above. The full split, all four summing to a hundred, shows how much of the others is in the mix.',
  },
  types: {
    title: 'Types that sit closest',
    blurb:
      'The nearest neighbour is above. The full set shows which letters you would have to lean on to become each of the others, and by how much.',
  },
  convergence: {
    title: 'Where the systems agree',
    blurb:
      'The four letters and the Life Path laid over each other, and the places they happen to point the same way. Then the two places this combination tends to ask more of you.',
  },
  personas: {
    title: 'The inner cast',
    blurb: 'An old practice: name three internal figures. Starter names, and the prompt to find your own.',
  },
  reading: {
    title: 'Five more sections, written for this number and this type',
    blurb: `${READING_SECTIONS.slice(0, 4)
      .map((s) => s.title)
      .join(', ')}, and ${READING_SECTIONS[4].title.toLowerCase()}. Seven to nine hundred words in all, kept in this browser and ready to print.`,
  },
};

export function isPaidSection(section: Section): boolean {
  return PAID_SECTIONS.includes(section);
}
