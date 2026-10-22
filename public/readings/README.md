# Reading teasers

`<key>.json` = `{ key, version, teaser }`, one per Reading key (see docs/reading-plan.md). Written by
`scripts/generate-readings.ts` (prompt version 3, 2026-10-22); the full Readings live in
`api/_readings/index.json` and are served only through the key-bound route. Regenerate with
`npm run readings:generate`; `--keep` reuses keys already at the current prompt version.
