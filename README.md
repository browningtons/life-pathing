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
  App.tsx        # root app
  main.tsx       # React entry point — wraps App in <KitProvider>
  index.css      # Tailwind directives
  views/         # LifePathView, ArchetypesView, PersonalityView
  data/          # numerology + MBTI + personality content
  lib/           # calculateLifePath + tests
  components/    # local UI primitives
  kit/           # appkit — paywall + entitlement plumbing (shared across apps)
  assets/        # logo

api/             # Vercel serverless functions (verify-purchase)
public/          # favicons
kit.config.ts    # per-app Stripe / brand / analytics config (see kit.config.example.ts)
```

## A note on what this is and is not

A reader's tool, not a measurement. Numerology and MBTI are not psychology. Nothing here is medical, psychological, or life advice. Use it the way you would use a horoscope you read closely — as a prompt for reflection, not a verdict on who you are.

## License

[MIT](LICENSE) © Paul Brown
