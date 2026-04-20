# Life Path Numbering

A small web app that combines two self-reflection lenses:

- **Life Path number** — derived from your birth date using Pythagorean numerology, with a breakdown of the compound digits and master-number handling (11, 22, 33).
- **MBTI archetype** — pick a type and see the archetype, cognitive function stack, and elemental flavor.

Live at **https://browningtons.github.io/life-pathing/**.

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
- Deployed to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

## Project layout

```
src/
  App.tsx        # root app — views, data, and calc (currently monolithic)
  main.jsx       # React entry point
  index.css      # Tailwind directives
  assets/        # logo
public/          # favicons
```

## Disclaimer

This is a personal project for fun and self-reflection. Numerology and MBTI are not science, and nothing here is medical, psychological, or life advice. Use it as a journaling prompt, not a decision-making tool.

## License

[MIT](LICENSE) © Paul Brown
