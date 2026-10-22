// The Reading prompt. A pure function of the key: the same key always builds
// the same prompt, so the 528 Readings are reproducible and a prompt edit is
// a READING_PROMPT_VERSION bump (docs/reading-plan.md, "Prompt").
//
// Version 3 (round-3 pilot): a reading again, plain statements with one scene per
// section and optional questions; round 2 had made every sentence a hedged
// possibility or a question and read as fiction.
// Version 2 (round-2 pilot): the Reading speaks to the reader as "you" (D9),
// carries a scene and a question in each body section and never a verdict,
// has its own "love" section (D10), and is forbidden the round-1 skeleton and
// jargon by name. Voice exemplars are still the app's own third-person copy,
// passed verbatim for their plainness: the four SYNTHESIS_BY_TEMPERAMENT
// templates and, for the key's temperament, the convergence themes and growth
// edges. The reference entries (LIFE_PATH_MEANINGS, MBTI_DATA) go in the user
// turn as facts, minus the function stack and the famous names.

import { COMPOUND_MEANINGS } from '../data/compoundMeanings';
import { LIFE_PATH_MEANINGS } from '../data/lifePathMeanings';
import { MBTI_DATA } from '../data/mbti';
import {
  SYNTHESIS_BY_TEMPERAMENT,
  TEMPERAMENT_ORDER,
  getConvergence,
  getGrowthEdges,
  temperamentForMbti,
  type TemperamentName,
} from '../data/personality';
import { READING_PROMPT_VERSION, parseReadingKey } from './readingKey';
import { BANNED_TERMS, SKELETON_PHRASES, WORD_BOUNDS } from './readingValidator';

export interface ReadingPrompt {
  key: string;
  version: number;
  system: string;
  user: string;
}

/** The exemplar block for a temperament, verbatim from src/data/personality.ts. */
export function readingExemplars(temperament: TemperamentName): string {
  const synthesis = TEMPERAMENT_ORDER.map((t) => `- ${t}: ${SYNTHESIS_BY_TEMPERAMENT[t]}`).join('\n');
  const convergence = getConvergence(temperament)
    .map((c) => `- ${c.title}. ${c.desc}`)
    .join('\n');
  const growth = getGrowthEdges(temperament)
    .map((g) => `- ${g.title}. ${g.desc}`)
    .join('\n');
  return [
    'The four synthesis templates ({INSIDE} stands for the type\'s wiring set inside the number\'s arc):',
    synthesis,
    '',
    `Convergence themes for this type's temperament (${temperament}; never name it in the Reading):`,
    convergence,
    '',
    "Growth edges for this type's temperament:",
    growth,
  ].join('\n');
}

const bounds = (f: keyof typeof WORD_BOUNDS) => `${WORD_BOUNDS[f][0]}–${WORD_BOUNDS[f][1]} words`;

const quoted = (items: readonly string[]) => items.map((t) => `"${t}"`).join(', ');

function systemPrompt(temperament: TemperamentName): string {
  return `You write one Reading for Life Pathing, a quiet reader's tool that lays a four-letter MBTI type over a numerology life path. Each Reading is written once for one pairing and then read by everyone who shares it, so it has to be specific to this number crossed with this type, and true of no other number and type in the same way.

## Register: a reading, spoken to you

The quiet almanac, spoken to the reader. Address the reader as "you" throughout. Plain, concrete sentences; observation, not flattery. Short sentences are welcome. No exclamation marks. No emoji. No mysticism beyond what the two systems themselves claim.

This is a reading, not a story. Say plainly what this number asks of a life and what these four letters are like, as the two systems describe them, and then say what happens when they sit in one person: where they reinforce each other, where they pull, what that looks like at work and at home. Most sentences are plain statements. Ground each of The Number, The Type, In love, Where they agree and Where they pull in one concrete, recognisable scene from an ordinary week, drawn so the reader can say "yes, that's me" or "no": a dinner table where you are the one refilling glasses, a draft rewritten at midnight, a budget nobody else in the house understands. The scene illustrates the reading; it does not replace it. A question to the reader is welcome where it opens something ("When did you last finish something before it felt ready?"), at most one per section, and none is required.

Restraint, which is what keeps it a prompt for reflection and not a verdict:
- Describe tendencies, never deliver charges. "The 8 reaches for the next rung" is a reading; "Stubbornness becomes control" and "this one will not drop it" are charges. Write the first kind.
- Where the reader's own habits come in, let it be recognisable rather than asserted: "the draft that gets rewritten twice before anyone sees it" rather than "you never show anyone a first draft".
- No advice and no prescriptions: not "the growth you are pointed toward is…", not "you need a partner who…", not what to do. If the reference material offers a tip, do not pass it on.
- Hedges ("tends to", "often", "can", "might", "could", "perhaps", "may") at most three per section. A plain statement about what the system says needs no hedge.
- Never write "you will", "you should", "you must", "you need to" or "you have to", not even inside a question.

## Framing (it holds on every line)

A reader's tool, not a measurement. Numerology and MBTI are not psychology. Nothing here is medical, psychological, or life advice. Write the way a careful reader would annotate a horoscope they took seriously: as a prompt for reflection, not a verdict on who someone is. Never diagnose, never instruct, never prescribe. No section forecasts: nothing about what is coming, no dates, no fate.

## Plain words, no jargon

Write for a stranger who has never studied numerology or MBTI. Never write the function abbreviations (Ni, Ne, Si, Se, Ti, Te, Fi, Fe), never the word "stack", never "shadow" or "shadows", and never a temperament name (Empath, Theorist, Responder, Preserver). Say what the habit looks like in your own words instead of the function's name, and find fresh words for each Reading.

## Banned words and patterns

Never use these, in any inflection, anywhere: ${quoted(BANNED_TERMS.map((t) => t.label))}. Do not name any real person.

## No skeleton

Every Reading in the catalogue has the same seven sections in the same order, so the inside of each section must be built for this number and this type and must not follow a shape another Reading would also use. The user turn carries a shape plan for this Reading: how each section opens, which sections end on a question, and the settings its scenes are drawn from. Follow it; it is different for every number and type, and it is what keeps hundreds of Readings from sharing one shape. No section opens with "Picture" or "Maybe". The plan's opening moves are suggestions for variety; the sentence that follows the opening says something plain.

These shapes are worn out and banned:
- The Opening must not run "describe the number, describe the type, then join them" as three separate moves, and must not announce what one side "alone" cannot explain. Name the number and the type within the first two sentences, as who the reader is, and go straight to what is particular about that crossing. Vary how the pairing is named from Reading to Reading: not always "You are a 7 who is also an INFJ"; sometimes the number arrives in a clause, sometimes the letters come first, sometimes the pairing is named in the second sentence.
- The Number must not be scaffolded as "In work… In love…" paragraphs, and must not open "Life path N asks for…, running through TYPE…".
- The Type must not open with the type's mental functions or list them, and must not run "TYPE already does X; this life path adds Y".
- Where they agree must not open "Both systems point to / converge on…", must not pivot on "In ordinary life this looks like…", and must not give each side a line ("the number calls it…, the type calls it…").
- Where they pull must not be built as two speakers or two wants: not "X wants A, Y wants B", not "duty says…, while the teacher in you wants…".
- In love must not open "You might say it like this" or any "you might say" line; let the line a partner hears arrive in the middle of a scene.
- The closing line must not be a question, a rhetorical question, a shrug about "a quieter question" or whether something is kept or let go, and must not lean on "its own kind of".
- Do not make the number and the type two speakers in every paragraph ("the number says…; the letters say…"). Name the crossing when it matters and otherwise write about one person.
- Questions vary in shape and place; at most one per section, and no "A, or B?" more than once in the Reading.
- Name a weekday at most once in the Reading. Do not reach for the stock props of these Readings (a spreadsheet, a drawer, a binder, a group chat, a friend who "mentions" a problem at dinner) unless the reference itself points there.
- Do not say "not because X but because Y" more than once, and do not use "already…, already…".
- No stock lines. Earlier drafts kept reaching for "the agreement here isn't loud", "what lines up here isn't loud", "somewhere around the third year, a partner…", "that's the type showing up", "the open secret of this path". Write none of these or their cousins; if a sentence could sit unchanged in another number's Reading, cut it.
- Never quote the reference as a list ("is listed as", "the growth edge", "the difficulties", "the light side"); write as though you had never seen a list.

Never write these phrases, in any case: ${quoted(SKELETON_PHRASES)}.

## The section contract

Return exactly one JSON object with these seven string fields, in this order, and nothing else:

- "teaser" (${bounds('teaser')}): the Opening. Shown free, before the paywall, so it must stand on its own and already feel written for this number and this type. Name the number and the type within the first two sentences and say, plainly, what is particular to this number crossed with this type; one small scene may carry it, but the reader should finish the Opening knowing what the pairing is.
- "number" (${bounds('number')}): The Number. The life path read through the type: what this number may look like in your week, seen through these four letters.
- "type" (${bounds('type')}): The Type. The four letters read through the number: how this type's habits bend under this life path.
- "love" (${bounds('love')}): In love. What this number's love entry and this type together look like inside a relationship, told through one specific moment a partner would recognise (the sentence said too late, the thing read in your silence) and one line that could be said or asked. Not a trait list and not a specification for a partner.
- "agree" (${bounds('agree')}): Where they agree. The through-line the number and the letters share, shown as a scene from an ordinary day.
- "pull" (${bounds('pull')}): Where they pull. The honest tension between the two, shown in a moment where it bites, without advice and without resolving it.
- "closing" (${bounds('closing')}): A closing line. One or two quiet sentences, a plain statement, not a question and not an instruction: an image or an observation the reader can carry.

The whole document is 700–900 words. Plain text only: no markdown, no headings, no bullet points, no field names inside the bodies. A body may hold more than one paragraph; separate paragraphs with a blank line ("\\n\\n"). Output the JSON object only, with no code fence and no commentary.

## Voice exemplars

These are the app's own lines, quoted verbatim. They are in the third person; the Reading is in the second. Take only their plainness and dryness, not their person, their phrasing or their structure. Do not copy or lightly rephrase any sentence from them, and do not open any section the way they open ("Read across the letters and the number…"): every pairing sees the same exemplars, so borrowed lines would repeat across hundreds of Readings. Where an exemplar uses a banned word or a temperament name, the rules above win.

${readingExemplars(temperament)}

## Before you answer, check every field

- Each of "number", "type", "love", "agree" and "pull" speaks to "you", says something plain about the number, the type or their crossing, and holds one scene.
- No sentence is a charge, an instruction or a forecast; "closing" holds no question mark.
- No section has more than three hedges ("tends to", "often", "can", "might", "could", "perhaps", "may").
- No banned word in any inflection: check "energy", "expect", "expected" and "journey" above all, since the exemplars and the reference use some of them.
- No jargon: not "stack" or "shadow" even in their everyday senses (write "pile", "shade"). No skeleton phrase, no "you will / should / must / need to / have to", no "you'll", and no dated future ("next month", "this week", "the coming months"): scenes are in the past or the habitual present.
- Each field's word count is inside its range and the total is 700–900.`;
}

/** The reference entries as facts: no function stack, no famous names, "shadows" renamed. */
export function referenceFacts(lifePath: number, type: string) {
  const { shadows: lpDifficulties, famous: _lpFamous, ...lp } = LIFE_PATH_MEANINGS[lifePath];
  const { shadows: typeDifficulties, famous: _typeFamous, stack: _stack, ...mbti } = MBTI_DATA[type];
  void _lpFamous;
  void _typeFamous;
  void _stack;
  return {
    lifePath: { ...lp, difficulties: lpDifficulties },
    type: { ...mbti, difficulties: typeDifficulties },
  };
}

// ── The shape plan ────────────────────────────────────────────────────
// The section order is fixed; the inside of each section is not. Left to
// itself the model gives every Reading the same moves, so each key gets its
// own plan, a pure function of the key: an opening move per section (no two
// alike), which two sections end on a question, and a few settings to draw
// scenes from. Different keys get different plans; the same key always gets
// the same one.

export const OPENING_MOVES = [
  'a line of dialogue, someone speaking to you, in quotation marks',
  'one ordinary object named in the first three words, with no verb of sitting or lying',
  'a direct question to you',
  'a time of day and what is happening at that hour',
  'a short plain sentence about a habit, with no "you" in it',
  'a number or a count of something in the scene (three missed calls, the fourth draft)',
  'a place named by what is wrong with it (the stuck drawer, the flickering sign)',
  'two short contrasting moments, one sentence each',
  'a small physical action, mid-motion',
  'a sound or a smell in a room',
] as const;

export const CLOSING_MOVES = [
  'a single image of an object in use, not left unfinished',
  'a plain observation about a place after people have left it',
  'one sentence of what someone says to you, and nothing after it',
  'a short statement about time: an hour, a season, a year, and what holds through it',
  'a sound that carries on after the scene has ended',
  'a plain, warm statement about what it is like to be read by two old systems at once, not a verdict',
] as const;

export const SCENE_SETTINGS = [
  'a hardware store aisle',
  'a hospital waiting room',
  'a school pickup line',
  'a long bus ride',
  'a community garden plot',
  'a wedding reception',
  'a rental car on a highway',
  'a laundromat',
  'a trailhead parking lot',
  'a museum bench',
  'a crowded kitchen at a party',
  'an airport gate',
  'a band rehearsal',
  'a used bookshop',
  'a moving day, boxes half-packed',
  'a dentist office',
  'a farmers market stall',
  'a late shift at work',
  'a child’s birthday party',
  'a quiet library table',
  'a pickup basketball court',
  'a car wash queue',
  'a funeral reception',
  'a hotel lobby',
  'a ferry crossing',
  'a night class',
  'a hair salon chair',
  'a parent-teacher evening',
  'a fishing dock',
  'a print shop counter',
  'a choir practice',
  'a gym locker room',
  'a rooftop at dusk',
  'a diner booth at closing',
  'a bike repair stand',
  'a dog park',
  'a train platform in the rain',
  'a thrift store fitting room',
  'a garage workbench',
  'a voting line',
  'a vet clinic',
  'a campsite at night',
  'a neighbor’s porch',
  'a hospital cafeteria',
] as const;

/** FNV-1a, 32-bit, with a final mix. Stable across runs and platforms. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Final avalanche (murmur3 fmix32): FNV alone keeps near-identical seeds
  // ("key|open|0", "key|open|1") close, so the shuffles would barely differ.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** A deterministic shuffle of `items`, seeded by `seed`. */
function seededOrder<T>(items: readonly T[], seed: string): T[] {
  return items
    .map((item, i) => ({ item, rank: hash(`${seed}|${i}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map((e) => e.item);
}

const PLAN_SECTIONS = ['teaser', 'number', 'type', 'love', 'agree', 'pull'] as const;

export interface ShapePlan {
  openings: Record<(typeof PLAN_SECTIONS)[number], string>;
  closing: string;
  questionEndings: (typeof PLAN_SECTIONS)[number][];
  settings: string[];
}

/** The shape plan for one key. */
export function shapePlan(key: string): ShapePlan {
  const moves = seededOrder(OPENING_MOVES, `${key}|open`);
  const openings = Object.fromEntries(PLAN_SECTIONS.map((s, i) => [s, moves[i]])) as ShapePlan['openings'];
  const bodies = PLAN_SECTIONS.filter((s) => s !== 'teaser');
  return {
    openings,
    closing: CLOSING_MOVES[hash(`${key}|close`) % CLOSING_MOVES.length],
    questionEndings: seededOrder(bodies, `${key}|ask`).slice(0, 2),
    settings: seededOrder(SCENE_SETTINGS, `${key}|set`).slice(0, 4),
  };
}

const PLAN_LABELS: Record<(typeof PLAN_SECTIONS)[number], string> = {
  teaser: 'Opening',
  number: 'The Number',
  type: 'The Type',
  love: 'In love',
  agree: 'Where they agree',
  pull: 'Where they pull',
};

function planText(key: string): string {
  const plan = shapePlan(key);
  return [
    'Shape plan for this Reading (follow it):',
    ...PLAN_SECTIONS.map((s) => `- ${PLAN_LABELS[s]} may open with ${plan.openings[s]}, if it suits; then say something plain.`),
    `- A closing line: ${plan.closing}.`,
    `- If a section ends on a question, let it be ${PLAN_LABELS[plan.questionEndings[0]]} or ${PLAN_LABELS[plan.questionEndings[1]]}; the others end on a statement.`,
    `- Draw the scenes mostly from these settings, adapted to the number and the type: ${plan.settings.join('; ')}. One setting per scene; a setting used once is not used again.`,
  ].join('\n');
}

function userPrompt(key: string, lifePath: number, compoundKey: number, type: string): string {
  const facts = referenceFacts(lifePath, type);
  const lines = [
    `Write the Reading for life path ${lifePath} and type ${type}.`,
    '',
    "The reference below is the app's own entry for each system. It is source material only: take its facts, write everything in the register above, and do not copy its phrasing. Its tips and growth notes are advice; do not pass them on as advice.",
    '',
    `Life path ${lifePath}:`,
    JSON.stringify(facts.lifePath, null, 2),
  ];
  if (compoundKey !== 0) {
    lines.push(
      '',
      `This life path is reached through the compound number ${compoundKey}, "${COMPOUND_MEANINGS[compoundKey]}". Let that name colour the Reading where it fits, in The Number above all, and name it once; never call it a "label". The first time you mention the compound number, say in the same sentence, in plain words of your own, that it is the number your birth date adds up to before it is reduced to a single digit (for example, the total of the digits before the last reduction).`,
    );
  }
  lines.push('', `Type ${type}:`, JSON.stringify(facts.type, null, 2), '', planText(key));
  return lines.join('\n');
}

/** The prompt for one key. Throws on a key the app cannot produce. */
export function buildReadingPrompt(key: string): ReadingPrompt {
  const parts = parseReadingKey(key);
  if (!parts || !LIFE_PATH_MEANINGS[parts.lifePath] || !MBTI_DATA[parts.type]) {
    throw new Error(`Not a Reading key: ${key}`);
  }
  if (parts.compoundKey !== 0 && COMPOUND_MEANINGS[parts.compoundKey] === undefined) {
    throw new Error(`Unlabeled compound in key: ${key}`);
  }
  const temperament = temperamentForMbti(parts.type);
  return {
    key,
    version: READING_PROMPT_VERSION,
    system: systemPrompt(temperament),
    user: userPrompt(key, parts.lifePath, parts.compoundKey, parts.type),
  };
}

/**
 * The second attempt: the original user turn, the validator's failures and,
 * when there is one, the failed draft itself. With the draft the model
 * revises only what failed instead of writing a new Reading that can fail a
 * different rule.
 */
export function buildRetryUser(prompt: ReadingPrompt, failures: string[], draft?: Record<string, unknown> | null): string {
  const failed = failures.map((f) => `- ${f}`).join('\n');
  if (draft) {
    return `${prompt.user}

Here is a previous draft of this Reading:

${JSON.stringify(draft, null, 2)}

It failed these checks:
${failed}

Revise the draft: change only the sentences needed to fix every item above, keep everything else as it is, and make sure the revision breaks no other rule. Answer with the whole revised Reading as one JSON object with the seven fields. Count the words and the hedges in each field you changed.`;
  }
  return `${prompt.user}

A previous draft of this Reading failed these checks:
${failed}

Write the whole Reading again from the start, as one JSON object with the seven fields, fixing every item above. Count the words and the hedges in each field before answering.`;
}
