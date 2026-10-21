// The Reading prompt. A pure function of the key: the same key always builds
// the same prompt, so the 528 Readings are reproducible and a prompt edit is
// a READING_PROMPT_VERSION bump (docs/reading-plan.md, "Prompt").
//
// Voice exemplars are the app's own third-person copy, passed verbatim: the
// four SYNTHESIS_BY_TEMPERAMENT templates and, for the key's temperament, the
// convergence themes and growth edges. The second-person copy elsewhere in
// the app (LIFE_PATH_MEANINGS, MBTI_DATA) goes in the user turn as reference
// facts, never as an exemplar of the voice.

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
import { BANNED_TERMS, WORD_BOUNDS } from './readingValidator';

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
    `Convergence themes for the ${temperament} temperament:`,
    convergence,
    '',
    `Growth edges for the ${temperament} temperament:`,
    growth,
  ].join('\n');
}

const bounds = (f: keyof typeof WORD_BOUNDS) => `${WORD_BOUNDS[f][0]}–${WORD_BOUNDS[f][1]} words`;

function systemPrompt(temperament: TemperamentName): string {
  return `You write one Reading for Life Pathing, a quiet reader's tool that lays a four-letter MBTI type over a numerology life path. Each Reading is written once for one pairing and then read by everyone who shares it, so it has to be specific to this number crossed with this type, and true of nobody else's pairing in the same way.

## Register

The quiet almanac. Third person throughout: "a 7 who is also an INFJ", "this pairing", "those who carry it", "they". Never "you", "your" or "yourself". Plain, concrete sentences; observation, not flattery. Short sentences are welcome. No exclamation marks. No emoji. No mysticism beyond what the two systems themselves claim.

## Framing (it holds on every line)

A reader's tool, not a measurement. Numerology and MBTI are not psychology. Nothing here is medical, psychological, or life advice. Write the way a careful reader would annotate a horoscope they took seriously: as a prompt for reflection, not a verdict on who someone is. Describe tendencies ("tends to", "often", "is drawn to"); never diagnose, never instruct, never prescribe. No section forecasts: nothing about what is coming, no dates, no "will" attached to the reader, no fate.

## Banned words and patterns

Never use these, in any inflection, anywhere: ${BANNED_TERMS.map((t) => `"${t.label}"`).join(', ')}. Do not name any real person.

## The section contract

Return exactly one JSON object with these six string fields and nothing else:

- "teaser" (${bounds('teaser')}): the Opening. Shown free, before the paywall, so it must stand on its own and already feel written for this pairing: name the number and the type in the first two sentences, and say the one thing about the pairing that neither system says alone.
- "number" (${bounds('number')}): The Number. The life path read through the type: what this number tends to look like when it lives in this particular wiring. Touch on love or work as the reference describes them.
- "type" (${bounds('type')}): The Type. The four letters read through the number: how this type's habits bend under this life path.
- "agree" (${bounds('agree')}): Where they agree. The through-line both systems point at, with a concrete picture of it in ordinary life.
- "pull" (${bounds('pull')}): Where they pull. The honest tension between the two, named plainly, without advice and without resolving it.
- "closing" (${bounds('closing')}): A closing line. One or two sentences, quiet, that leave the reader with a thought rather than an instruction.

The whole document is 700–900 words. Plain text only: no markdown, no headings, no bullet points, no field names inside the bodies. A body may hold more than one paragraph; separate paragraphs with a blank line ("\\n\\n"). Output the JSON object only, with no code fence and no commentary.

## Voice exemplars

These are the app's own lines, quoted verbatim. They set the register: third person, short, plain, a little dry. They are not text to reuse. Do not copy or lightly rephrase any sentence from them, and do not open any section the way they open ("Read across the letters and the number…"): every pairing sees the same exemplars, so borrowed lines would repeat across hundreds of Readings. Where an exemplar uses a banned word, the banned list wins.

${readingExemplars(temperament)}`;
}

function userPrompt(lifePath: number, compoundKey: number, type: string): string {
  const lp = LIFE_PATH_MEANINGS[lifePath];
  const mbti = MBTI_DATA[type];
  const temperament = temperamentForMbti(type);
  const lines = [
    `Write the Reading for life path ${lifePath} and type ${type}.`,
    '',
    'The reference below is the app\'s own entry for each system. It is written in the second person and is source material only: take its facts, rewrite everything in the third person and the register above, and do not copy its phrasing.',
    '',
    `Life path ${lifePath}:`,
    JSON.stringify(lp, null, 2),
  ];
  if (compoundKey !== 0) {
    lines.push(
      '',
      `This life path is reached through the compound number ${compoundKey}, "${COMPOUND_MEANINGS[compoundKey]}". Let that label colour the Reading where it fits, in The Number above all, and name it once.`,
    );
  }
  lines.push(
    '',
    `Type ${type}:`,
    JSON.stringify(mbti, null, 2),
    '',
    `Temperament (from the letters): ${temperament}.`,
  );
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
    user: userPrompt(parts.lifePath, parts.compoundKey, parts.type),
  };
}

/** The second attempt: the original user turn plus the validator's failures. */
export function buildRetryUser(prompt: ReadingPrompt, failures: string[]): string {
  return `${prompt.user}

A previous draft of this Reading failed these checks:
${failures.map((f) => `- ${f}`).join('\n')}

Write the whole Reading again from the start, as one JSON object with the six fields, fixing every item above. Count the words in each field before answering.`;
}
