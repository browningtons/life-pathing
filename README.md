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

Everything else is derived at render time and looked up, never stored:

- **Type code** from `dimensions` (`deriveTypeCode`), with a **borderline** flag on any dimension inside 45–55%. Borderline letters are marked everywhere a type code appears.
- **Nickname, function stack, description, famous names** from the type code via `MBTI_DATA`.
- **Life Path number** and its reduction from `birthDate` via `calculateLifePath`.

Change a number in the profile and all three views follow. A test (`src/views/noHardcodedPersonality.test.ts`) fails if a view ever grows a hardcoded type code, nickname, stack, or name.

## A note on what this is and is not

A reader's tool, not a measurement. Numerology and MBTI are not psychology. Nothing here is medical, psychological, or life advice. Use it the way you would use a horoscope you read closely — as a prompt for reflection, not a verdict on who you are.

## License

[MIT](LICENSE) © Paul Brown
