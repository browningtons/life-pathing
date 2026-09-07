// Guard: no view (or the app shell) may carry a hardcoded type code,
// nickname, function stack, or famous-people name. Those live in the data
// tables and are derived from the profile at render time.

import { describe, expect, it } from 'vitest';
import { MBTI_DATA } from '../data/mbti';

// Raw source of every view plus the app shell, via Vite's glob import.
const SOURCES = import.meta.glob(['./*View.tsx', '../App.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const FILES = Object.keys(SOURCES).sort();

const read = (file: string) => SOURCES[file];

const TYPE_CODES = Object.keys(MBTI_DATA);
const NICKNAMES = Object.values(MBTI_DATA).map((e) => e.title);
const FAMOUS = Object.values(MBTI_DATA).flatMap((e) => e.famous);
const FUNCTIONS = ['Fi', 'Fe', 'Ti', 'Te', 'Ni', 'Ne', 'Si', 'Se'];

describe('source files under guard', () => {
  it('covers the three views and the app shell', () => {
    expect(FILES).toEqual([
      '../App.tsx',
      './ArchetypesView.tsx',
      './IntakeView.tsx',
      './LifePathView.tsx',
      './PersonalityView.tsx',
    ]);
  });
});

describe.each(FILES)('%s', (file) => {
  const src = read(file);

  it('contains no MBTI type code', () => {
    for (const code of TYPE_CODES) {
      expect(src, `found "${code}"`).not.toMatch(new RegExp(`\\b${code}\\b`));
    }
  });

  it('contains no type nickname', () => {
    for (const name of NICKNAMES) {
      expect(src, `found "${name}"`).not.toContain(name);
    }
  });

  it('contains no cognitive-function literal', () => {
    for (const fn of FUNCTIONS) {
      expect(src, `found "${fn}" as a string literal`).not.toMatch(new RegExp(`['"\`]${fn}['"\`]`));
    }
  });

  it('contains no famous-person name', () => {
    for (const person of FAMOUS) {
      expect(src, `found "${person}"`).not.toContain(person);
    }
  });

  it('contains no hardcoded birthdate', () => {
    expect(src).not.toMatch(/\b\d{4}-\d{2}-\d{2}\b/);
  });
});
