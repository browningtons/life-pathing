# Life Path Numbering

A small reader's tool for two old self-reflection systems. Numerology by birthdate. MBTI by type. Both are made up. Both are useful, in the way a good question is useful.

- **Life Path number** — derived from a birthdate by Pythagorean numerology, with a breakdown of the compound digits and the older master numbers (11, 22, 33) preserved.
- **MBTI archetype** — pick a type and see the archetype, the function stack in its usual order, and a few notes on where it tends to do well and where it tends to stumble.
- **A reader's profile** — a small derived dashboard. Twenty-three facets, a temperament, adjacent types, and the places these old systems happen to point the same way.

Built by someone who keeps going back to this stuff.

## Local development

```bash
npm install
npm run dev      # start Vite dev server
npm run build    # production build to dist/
npm run lint     # run ESLint
npm run preview  # preview the production build locally
```

Requires Node 20+.

## Tech stack

- [Vite 7](https://vitejs.dev/) + [React 19](https://react.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/) for styling
- [lucide-react](https://lucide.dev/) for icons
- ESLint 9 (flat config)
- Vitest for unit tests
- Deployed to Vercel; CI gate (lint/typecheck/test/build) via [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
- Monetization plumbing shared with other apps via the **appkit** starter (see `src/kit/`)

## Project layout

```
src/
  App.tsx        # root app — mounts <ProfileProvider> and the three tabs
  main.tsx       # React entry point — wraps App in <KitProvider>
  index.css      # Tailwind directives
  views/         # LifePathView, ArchetypesView, PersonalityView (read from useProfile)
  store/         # ProfileProvider + useProfile — the shared profile store
  data/
    profile.ts       # THE source of truth: birthdate, 4 dimension %, 23 facet %
    mbti.ts          # type → nickname / stack / description / famous lookup tables
    personality.ts   # facet catalog + derivations for the Profile view
    lifePathMeanings.ts, compoundMeanings.ts
  lib/           # calculateLifePath, deriveType (+ tests)
  design/        # tokens.ts — shared colours, typography, card + badge recipes
  components/    # Card, HeroCard, SectionHeading, Chip, TypeCode, BorderlineBadge
  kit/           # appkit — paywall + entitlement plumbing (shared across apps)
  assets/        # logo

api/             # Vercel serverless functions (verify-purchase)
public/          # favicons
kit.config.ts    # per-app Stripe / brand / analytics config (see kit.config.example.ts)
```

## Data model

One profile, raw inputs only, in `src/data/profile.ts`:

- `birthDate` — ISO date.
- `dimensions` — `{ e, n, f, p }` as percentages toward E / N / F / P. Letters are never stored.
- `facets` — the 23 TypeFinder facet scores, keyed by the right-hand pole.
- `dimensionSource` — where the dimensions came from: `sample`, `quiz`, `typed`, or `report`.
- `facetSource` — where the facets came from: `sample` or `report`.

The two sources exist because the sample's numbers look like anyone else's. Without them the app cannot tell a reader who gave their letters from one who typed a birthdate while the letters are still the builder's. Profiles saved before the fields existed are migrated in `normalizeProfile`: anything that differs from the sample reads as `report`.

Everything else is derived at render time and looked up, never stored:

- **Type code** from `dimensions` (`deriveTypeCode`), with a **borderline** flag on any dimension inside 45–55%. Borderline letters are marked everywhere a type code appears.
- **Nickname, function stack, description, famous names** from the type code via `MBTI_DATA`.
- **Life Path number** and its reduction from `birthDate` via `calculateLifePath`.
- **Descriptors** ("How others tend to read you") as weighted blends of facet poles, so they move with the reader's facets.
- **Temperament** as the N×F / N×T / S×P / S×J split of the dimension scores, four whole numbers summing to 100. The leading temperament drives convergence, growth edges, and the synthesis.
- **Adjacent types** as 100 minus the reader's decisiveness (distance from 50, doubled) on every letter a type differs on. A dead-even letter costs nothing, so borderline splits surface as near-100 neighbours.

Change a number in the profile and all views follow. A test (`src/views/noHardcodedPersonality.test.ts`) fails if a view ever grows a hardcoded type code, nickname, stack, or name.

### Your Data (intake)

The bundled profile is a sample. The **Your Data** tab lets a reader replace it with their own:

- **Paste a report** — any text with "Label 94%" pairs. `src/lib/parseReport.ts` recognises TypeFinder facet poles and TypeFinder / 16personalities dimension words (`Extraverted 51%`, `Observant 40%`, `E 51`), reading each percentage toward the label it sits beside.
- **Per-field controls** — birthdate, the four dimensions, and the 23 facets, each as a pole picker plus a percentage.

Both mark what they touched as the reader's own (`report`). A paste onto values that are still the sample's fills anything it did not carry with an even 50, so a three-facet paste never leaves twenty of the builder's facets standing in for the reader's (`pastePatch` in `parseReport.ts`).

### The letters ask (Life Path tab)

The reader most likely to arrive has a birthdate and nothing else. Once their own birthdate is in and the letters are still the sample's, a card under the Life Path asks for four letters, two ways:

- **Typed** — any code from any test, suffixes like `-T` dropped. Stored as 70 / 30 toward each letter: a stated type is a clear lean, never borderline.
- **Twelve quick questions** — `src/data/quiz.ts`, three forced choices per dimension. A 3-to-0 answer stores 80 / 20; a 2-to-1 stores 55 / 45, inside the borderline band, so it is flagged like any near-even score. Letters only, never facets.

Either way the reader is handed to the Profile, which then reads their number and their type together. A reader with letters but no facets sees "No facet scores yet" in place of the two facet sections, never the sample's facets.

The profile persists to localStorage through the kit's namespaced `load`/`save` (key `lp_profile`), only once it differs from the sample. Anything loaded back is run through `src/lib/normalizeProfile.ts`, so a stale or hand-edited entry cannot break a render. A banner marks whose numbers are showing: the whole sample, or the reader's number with the sample's type. Its button goes to the next missing input.

## Free and paid

The split is decided in one place, `src/data/tiers.ts`, and the rule is: **the systems are free, the reading of you is paid.**

| | Free | Paid (one-time, via Stripe) |
|---|---|---|
| Life Path by birthdate, all twelve numbers, compound meanings | ✓ | |
| Archetypes, all sixteen types, stack, strengths, shadows | ✓ | |
| Your Data intake, saved on device | ✓ | |
| The letters ask: typed letters or the twelve-question quiz | ✓ | |
| Profile hero, "The read", the five facets that show up loudest | ✓ | |
| All twenty-three facets by category | | ✓ |
| How others read you, temperament, adjacent types, convergence, the inner cast | | ✓ |

Views wrap paid content in `<ProGate>` (`src/components/ProGate.tsx`). Free readers see an honest teaser — the real component fed a slice of the data — and a card naming what is behind the line. The gate's copy lives beside the split in `tiers.ts`; the modal's sales copy lives in `kit.config.ts` and only promises what ships.

Entitlement is a local flag set by `/api/verify-purchase` after a Stripe Checkout redirect (`#session_id=cs_…`), or by email restore. There is no client-side unlock token. Admin preview: tap the logo five times, then toggle **Free User** in the bar to see the free experience.

## A note on what this is and is not

A reader's tool, not a measurement. Numerology and MBTI are not psychology. Nothing here is medical, psychological, or life advice. Use it the way you would use a horoscope you read closely — as a prompt for reflection, not a verdict on who you are.

## License

[MIT](LICENSE) © Paul Brown
