# Reading teasers

`<key>.json` = `{ key, version, teaser, excerpt }`, one per Reading key (see docs/reading-plan.md). `excerpt` is the
first sentence of the Reading's "In love" section, quoted in the upgrade modal (rule in `src/lib/readingExcerpt.ts`). Written by
`scripts/generate-readings.ts` (prompt version 3, 2026-10-22); the full Readings live in
`api/_readings/index.json` and are served only through the key-bound route. Regenerate with
`npm run readings:generate`; `--keep` reuses keys already at the current prompt version; `--teasers-only` rewrites these
files from the index without calling the API.
