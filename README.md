# Life Path Numbering

A small web app that combines two self-reflection lenses:

- **Life Path number** — derived from your birth date using Pythagorean numerology, with a breakdown of the compound digits and master-number handling (11, 22, 33).
- **MBTI archetype** — pick a type and see the archetype, cognitive function stack, and elemental flavor.

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

## Disclaimer

This is a personal project for fun and self-reflection. Numerology and MBTI are not science, and nothing here is medical, psychological, or life advice. Use it as a journaling prompt, not a decision-making tool.

## License

[MIT](LICENSE) © Paul Brown
