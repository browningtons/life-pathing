// Generate the Readings offline. Run with tsx:
//
//   npm run readings:generate -- --dry-run              enumerate keys, print one prompt, call nothing
//   npm run readings:generate -- --only 7-16-INFJ,3-0-ESFP [--review]
//   npm run readings:generate -- --sample 20            stratified 20, writes docs/readings-review.md
//   npm run readings:generate                           all 528
//
// Options: --concurrency N (default 4), --model ID (default claude-sonnet-5),
// --threshold R (sibling overlap, default 0.15), --key K (which prompt --dry-run prints).
//
// Needs ANTHROPIC_API_KEY in the environment or in this repo's .env.local. A key that is
// not scoped to a workspace also needs ANTHROPIC_WORKSPACE_ID (the Console's wrkspc_… id).
// Writes public/readings/<key>.json (teaser only, served free) and merges the
// full Readings into api/_readings/index.json (imported by the route). A key
// whose index entry has "locked": true is never regenerated (ledger L8). A
// key that fails the validator twice is reported and the script exits 1.
// There is no fallback text: a failed key ships nothing.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { LIFE_PATH_MEANINGS } from '../src/data/lifePathMeanings';
import { MBTI_DATA } from '../src/data/mbti';
import { COMPOUND_MEANINGS } from '../src/data/compoundMeanings';
import { temperamentForMbti } from '../src/data/personality';
import {
  READING_PROMPT_VERSION,
  enumerateLifePathPairs,
  enumerateReadingKeys,
  parseReadingKey,
} from '../src/lib/readingKey';
import { buildReadingPrompt, buildRetryUser, type ReadingPrompt } from '../src/lib/readingPrompt';
import {
  READING_FIELDS,
  countWords,
  siblingOverlap,
  validateReading,
  type Reading,
  type ReadingSections,
} from '../src/lib/readingValidator';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public', 'readings');
const INDEX_PATH = path.join(ROOT, 'api', '_readings', 'index.json');
const REVIEW_PATH = path.join(ROOT, 'docs', 'readings-review.md');

const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 16000;

// ── Arguments ─────────────────────────────────────────────────────────

interface Options {
  dryRun: boolean;
  only: string[] | null;
  sample: number | null;
  review: boolean;
  concurrency: number;
  model: string;
  threshold: number;
  key: string | null;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    dryRun: false,
    only: null,
    sample: null,
    review: false,
    concurrency: 4,
    model: DEFAULT_MODEL,
    threshold: 0.15,
    key: null,
  };
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--review':
        opts.review = true;
        break;
      case '--only':
        opts.only = value(i, arg).split(',').map((k) => k.trim()).filter(Boolean);
        i++;
        break;
      case '--sample':
        opts.sample = Number(value(i, arg));
        i++;
        break;
      case '--concurrency':
        opts.concurrency = Number(value(i, arg));
        i++;
        break;
      case '--model':
        opts.model = value(i, arg);
        i++;
        break;
      case '--threshold':
        opts.threshold = Number(value(i, arg));
        i++;
        break;
      case '--key':
        opts.key = value(i, arg);
        i++;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (opts.sample !== null && (!Number.isInteger(opts.sample) || opts.sample < 1)) throw new Error('--sample needs a positive whole number');
  if (!Number.isInteger(opts.concurrency) || opts.concurrency < 1) throw new Error('--concurrency needs a positive whole number');
  if (!(opts.threshold >= 0 && opts.threshold <= 1)) throw new Error('--threshold needs a ratio between 0 and 1');
  return opts;
}

// ── Files ─────────────────────────────────────────────────────────────

function readIndex(): Record<string, Reading> {
  if (!existsSync(INDEX_PATH)) return {};
  return JSON.parse(readFileSync(INDEX_PATH, 'utf8')) as Record<string, Reading>;
}

function writeIndex(index: Record<string, Reading>): void {
  const sorted: Record<string, Reading> = {};
  for (const key of Object.keys(index).sort(compareKeys)) sorted[key] = index[key];
  mkdirSync(path.dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
}

function writeTeaser(reading: Reading): void {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  const teaser = { key: reading.key, version: reading.version, teaser: reading.teaser };
  writeFileSync(path.join(PUBLIC_DIR, `${reading.key}.json`), `${JSON.stringify(teaser, null, 2)}\n`);
}

/** A value from the environment, else from this repo's .env.local. Never printed. */
function loadEnv(name: string): string | null {
  if (process.env[name]) return process.env[name] ?? null;
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) return null;
  const re = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*(.*)\\s*$`);
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = re.exec(line);
    if (m) return m[1].replace(/^['"]|['"]$/g, '') || null;
  }
  return null;
}

/** The API key from the environment, else from this repo's .env.local. Never printed. */
function loadApiKey(): string | null {
  return loadEnv('ANTHROPIC_API_KEY');
}

/** Life path, then compound, then type, numerically. */
function compareKeys(a: string, b: string): number {
  const x = parseReadingKey(a);
  const y = parseReadingKey(b);
  if (!x || !y) return a.localeCompare(b);
  return x.lifePath - y.lifePath || x.compoundKey - y.compoundKey || x.type.localeCompare(y.type);
}

// ── Sample selection ──────────────────────────────────────────────────
// One per life path first, then repeats, laid out so each sample type sees
// several different numbers: the side-by-side review Paul reads (D5, T2).

/** One type per temperament, so every exemplar set is read. */
const SAMPLE_TYPES = ['INFJ', 'INTP', 'ESFP', 'ISTJ'];

function sampleKeys(n: number, today: Date = new Date()): string[] {
  const pairs = enumerateLifePathPairs(today);
  const lifePaths = [...new Set(pairs.map((p) => p.lifePath))];
  const perType = Math.ceil(n / SAMPLE_TYPES.length);
  const keys: string[] = [];
  for (let slot = 0; slot < n; slot++) {
    const lifePath = lifePaths[slot % lifePaths.length];
    const options = pairs.filter((p) => p.lifePath === lifePath);
    const pair = options[(slot + Math.floor(slot / lifePaths.length)) % options.length];
    const type = SAMPLE_TYPES[Math.min(Math.floor(slot / perType), SAMPLE_TYPES.length - 1)];
    keys.push(`${pair.lifePath}-${pair.compoundKey}-${type}`);
  }
  return [...new Set(keys)];
}

// ── Generation ────────────────────────────────────────────────────────

/** The model's text as a Reading, or the reason it is not one. */
function parseReply(text: string): { sections: ReadingSections | null; error: string | null } {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return { sections: null, error: 'reply held no JSON object' };
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    const sections = {} as ReadingSections;
    for (const f of READING_FIELDS) sections[f] = parsed[f] as string;
    const extra = Object.keys(parsed).filter((k) => !(READING_FIELDS as readonly string[]).includes(k));
    if (extra.length) return { sections: null, error: `unexpected fields: ${extra.join(', ')}` };
    return { sections, error: null };
  } catch (e) {
    return { sections: null, error: `reply was not valid JSON (${(e as Error).message})` };
  }
}

async function ask(client: Anthropic, model: string, prompt: ReadingPrompt, user: string): Promise<{ sections: ReadingSections | null; failures: string[] }> {
  const response = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: prompt.system,
    messages: [{ role: 'user', content: user }],
  });
  if (response.stop_reason === 'refusal') return { sections: null, failures: ['the model declined (stop_reason refusal)'] };
  if (response.stop_reason === 'max_tokens') return { sections: null, failures: ['the reply hit max_tokens and was cut off'] };
  const text = response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  const { sections, error } = parseReply(text);
  if (!sections) return { sections: null, failures: [error ?? 'unreadable reply'] };
  return { sections, failures: validateReading(sections) };
}

interface Outcome {
  key: string;
  reading: Reading | null;
  failures: string[];
  attempts: number;
}

async function generateOne(client: Anthropic, model: string, key: string): Promise<Outcome> {
  const prompt = buildReadingPrompt(key);
  let attempt = 1;
  let result: { sections: ReadingSections | null; failures: string[] };
  try {
    result = await ask(client, model, prompt, prompt.user);
    if (result.failures.length) {
      attempt = 2;
      result = await ask(client, model, prompt, buildRetryUser(prompt, result.failures));
    }
  } catch (e) {
    const status = e instanceof Anthropic.APIError ? ` (HTTP ${e.status})` : '';
    return { key, reading: null, failures: [`API error${status}: ${(e as Error).message}`], attempts: attempt };
  }
  if (result.failures.length || !result.sections) return { key, reading: null, failures: result.failures, attempts: attempt };
  const reading: Reading = { key, version: READING_PROMPT_VERSION, ...result.sections };
  return { key, reading, failures: [], attempts: attempt };
}

async function runPool<T, R>(items: T[], concurrency: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await work(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ── Review file ───────────────────────────────────────────────────────

const SECTION_LABELS: Record<(typeof READING_FIELDS)[number], string> = {
  teaser: 'Opening (free)',
  number: 'The Number',
  type: 'The Type',
  agree: 'Where they agree',
  pull: 'Where they pull',
  closing: 'A closing line',
};

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n\n+/g, '<br><br>').replace(/\n/g, ' ');

function heading(key: string): string {
  const p = parseReadingKey(key)!;
  const lp = LIFE_PATH_MEANINGS[p.lifePath];
  const compound = p.compoundKey ? ` via ${p.compoundKey} (${COMPOUND_MEANINGS[p.compoundKey]})` : '';
  return `**${key}**<br>${p.lifePath} ${lp.title}${compound}<br>${p.type} ${MBTI_DATA[p.type].title} · ${temperamentForMbti(p.type)}`;
}

function table(keys: string[], index: Record<string, Reading>): string {
  const rows = [`| | ${keys.map(heading).join(' | ')} |`, `|---|${keys.map(() => '---').join('|')}|`];
  for (const f of READING_FIELDS) {
    rows.push(`| ${SECTION_LABELS[f]} | ${keys.map((k) => `${cell(index[k][f])}<br><br>*${countWords(index[k][f])} words*`).join(' | ')} |`);
  }
  rows.push(`| Total | ${keys.map((k) => `${READING_FIELDS.reduce((s, f) => s + countWords(index[k][f]), 0)} words`).join(' | ')} |`);
  return rows.join('\n');
}

function writeReview(keys: string[], index: Record<string, Reading>, model: string, title: string): void {
  const present = keys.filter((k) => index[k]);
  const missing = keys.filter((k) => !index[k]);
  // Group by type so each table reads one type across different numbers.
  const byType = new Map<string, string[]>();
  for (const k of present) {
    const t = parseReadingKey(k)!.type;
    byType.set(t, [...(byType.get(t) ?? []), k]);
  }
  const groups = present.length === 0 ? [] : [...byType.values()].every((g) => g.length === 1) ? [present] : [...byType.values()];
  const flags = siblingOverlap(Object.fromEntries(present.map((k) => [k, index[k]])));

  const out = [
    `# Readings review: ${title}`,
    '',
    `Prompt version ${READING_PROMPT_VERSION} · model \`${model}\` · ${present.length} Readings · written by \`scripts/generate-readings.ts\`.`,
    '',
    'Every Reading below passed the validator (word bounds, banned words, forecasts, third person, plain text). The validator cannot catch "correct and dull"; that is what this file is for (docs/reading-plan.md D5, T2). Read across each row: the same section for different pairings should not read as the same paragraph with the number swapped.',
    '',
    flags.length
      ? `**Sibling overlap above 0.15:** ${flags.map((f) => `${f.a} / ${f.b} (${f.sibling}, ${f.ratio.toFixed(2)})`).join('; ')}.`
      : 'Sibling overlap (shared 6-grams between Readings that share a number or a type): none above 0.15 within this file.',
    '',
  ];
  if (missing.length) out.push(`Not generated: ${missing.join(', ')}.`, '');
  groups.forEach((g, i) => {
    const type = parseReadingKey(g[0])!.type;
    out.push(groups.length > 1 ? `## ${type} across ${g.length} numbers` : `## ${g.length === 1 ? 'The Reading' : 'Side by side'}`, '', table(g, index), '');
    if (i < groups.length - 1) out.push('');
  });
  out.push('## Sign-off', '', 'Read by: ______ · date: ______ · verdict (ship / another prompt round): ______', '');
  mkdirSync(path.dirname(REVIEW_PATH), { recursive: true });
  writeFileSync(REVIEW_PATH, out.join('\n'));
  console.log(`Wrote ${path.relative(ROOT, REVIEW_PATH)} (${present.length} Readings).`);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2));
  const all = enumerateReadingKeys();

  if (opts.dryRun) {
    const pairs = enumerateLifePathPairs();
    console.log(`${all.length} keys from ${pairs.length} (lifePath, compoundKey) pairs × 16 types.`);
    console.log(`Pairs: ${pairs.map((p) => `${p.lifePath}-${p.compoundKey}`).join(' ')}`);
    const targets = opts.only ?? (opts.sample ? sampleKeys(opts.sample) : null);
    if (targets) console.log(`Would generate: ${targets.join(', ')}`);
    const key = opts.key ?? targets?.[0] ?? '7-16-INFJ';
    const prompt = buildReadingPrompt(key);
    console.log(`\n── Prompt for ${key} (version ${prompt.version}, model ${opts.model}) ──\n`);
    console.log('[system]\n');
    console.log(prompt.system);
    console.log('\n[user]\n');
    console.log(prompt.user);
    return 0;
  }

  const keys = opts.only ?? (opts.sample ? sampleKeys(opts.sample) : all);
  const unknown = keys.filter((k) => !all.includes(k));
  if (unknown.length) {
    console.error(`Not keys the app can produce: ${unknown.join(', ')}`);
    return 1;
  }

  const index = readIndex();
  const locked = keys.filter((k) => index[k]?.locked === true);
  // --sample reuses Readings already generated at this prompt version.
  const reuse = opts.sample ? keys.filter((k) => index[k] && index[k].version === READING_PROMPT_VERSION) : [];
  const todo = keys.filter((k) => !locked.includes(k) && !reuse.includes(k));
  if (locked.length) console.log(`Locked, skipped: ${locked.join(', ')}`);
  if (reuse.length) console.log(`Already generated, reused: ${reuse.join(', ')}`);

  const failed: Outcome[] = [];
  if (todo.length) {
    const apiKey = loadApiKey();
    if (!apiKey) {
      console.error('No ANTHROPIC_API_KEY in the environment or in .env.local. Nothing generated.');
      return 1;
    }
    // A key that is not scoped to a workspace must name one per request.
    const workspaceId = loadEnv('ANTHROPIC_WORKSPACE_ID');
    const client = new Anthropic({
      apiKey,
      ...(workspaceId ? { defaultHeaders: { 'anthropic-workspace-id': workspaceId } } : {}),
    });
    console.log(`Generating ${todo.length} Readings with ${opts.model}, concurrency ${opts.concurrency}.`);
    let done = 0;
    await runPool(todo, opts.concurrency, async (key) => {
      const outcome = await generateOne(client, opts.model, key);
      done += 1;
      if (outcome.reading) {
        index[key] = outcome.reading;
        writeTeaser(outcome.reading);
        writeIndex(index); // after each key, so an interrupted run keeps its work
        console.log(`[${done}/${todo.length}] ${key} ok${outcome.attempts > 1 ? ' (second attempt)' : ''}`);
      } else {
        failed.push(outcome);
        console.log(`[${done}/${todo.length}] ${key} FAILED: ${outcome.failures.join('; ')}`);
      }
      return outcome;
    });
  }
  writeIndex(index);

  // Sibling overlap over the whole set on disk (generated Readings only).
  const generated = Object.fromEntries(Object.entries(index).filter(([, r]) => !r.fixture));
  const flags = siblingOverlap(generated, opts.threshold);
  console.log(`\nSibling overlap over ${Object.keys(generated).length} Readings (threshold ${opts.threshold}): ${flags.length} pair(s) flagged.`);
  for (const f of flags.slice(0, 50)) console.log(`  ${f.a} / ${f.b}  ${f.sibling}  ${f.ratio.toFixed(3)}`);
  if (flags.length > 50) console.log(`  … and ${flags.length - 50} more`);

  if (opts.sample) writeReview(keys, index, opts.model, `stratified sample of ${keys.length}`);
  else if (opts.review && opts.only) writeReview(keys, index, opts.model, `${keys.join(', ')}`);

  if (failed.length) {
    console.error(`\n${failed.length} key(s) failed and shipped nothing:`);
    for (const f of failed) console.error(`  ${f.key}: ${f.failures.join('; ')}`);
    return 1;
  }
  console.log(`\nDone: ${todo.length - failed.length} generated, ${locked.length} locked, ${reuse.length} reused.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error((e as Error).message);
    process.exit(1);
  },
);
