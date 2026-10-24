# Field Guide — Life Pathing

> **The math is the credibility. The tone is the relief.**

This app inherits Paul Brown's portable design system. The canonical Field Guide lives in `~/.claude/skills/app-design-port/references/field-guide.md`. This doc is the per-app surface.

**Status: started 2026-10-24 with the brand mark.** The full port has not been done: there is no `theme.ts`, no dark mode, and no cast persona. Colours and type still live as Tailwind classes in `src/design/tokens.ts`. Run `/app-design-port` to finish the port; until then, the sections below marked _not set_ are open.

---

## The Five Principles

These hold across every app in the portfolio. The palette and persona change. The principles do not.

1. **Lead with relief before education.** Every landing screen states the outcome first ("you are not stuck", "you have a path"). Education comes only after the user can breathe.
2. **One question per screen.** A screen earns its place by answering exactly one of: _what is my first win?_ · _what do I do next?_ · _how do I keep this alive?_
3. **The math is credibility. The tone is relief.** Charts, numbers, dates — all true and load-bearing. Voice — warm, plainspoken, never preachy. Neither replaces the other.
4. **Estimates first, real numbers next.** Don't gate the first useful answer behind perfect data. Let the user start rough and tighten over time.
5. **Private by default.** Local-first storage. Sharing is opt-in and progress-shaped, never raw-amount disclosure.

---

## This App

| | |
|---|---|
| **Domain** | A Life Path number and an MBTI type, read together; the written Reading is $19, once |
| **Persona** | _not set_ |
| **Primary** | `#4338CA` (indigo 700) for lines and small marks · `#312E81` (indigo 900) for grounds, same as the hero card |
| **Accent** | `#FB7AAE` (pink): one element per mark, never text |
| **Background** | `#F8FAFC` |
| **Hero outcome** | Your Life Path number and your four letters, read together |
| **Brief** | The essay "When Numbers Are Alive" (The Rebel's Notebook, 2026-01-27): numbers carried meaning across Greece, Egypt, Babylon, the Maya, Baghdad and China. "The value here isn't belief. It's recognition." |

---

## The mark

A wheel. Each ring is one tradition from the essay, read from the outside in:

| Ring | Tradition | What is drawn |
|---|---|---|
| Dial | Babylon | 60 ticks, every fifth one long: the base-60 count still on our clocks |
| Numbers | The Maya | The twelve Life Paths (1–9, 11, 22, 33) in bar-and-dot, one at each hour. A dot is one, a bar is five; 22 and 33 stack a second, base-20 level |
| Trigrams | The I Ching | The eight trigrams in Fu Xi order, Qian at the top, bottom line toward the center |
| Center | Pythagoras | The tetractys: ten dots in rows of 1, 2, 3, 4. The top dot is the pink one |

The whole reads as an astrolabe, the instrument the essay credits to the House of Wisdom.

### Cuts

One drawing does not work at every size, so there are four. Use the one made for the size.

| Cut | File | Use at | Notes |
|---|---|---|---|
| Full | `src/assets/brand/mark.svg` | 200 px and up on screen; half an inch and up on paper | Line art on white. The printed Reading's masthead |
| Full, reversed | `mark-reversed.svg` | 200 px and up on indigo 900 | The share image |
| Badge | `mark-badge.svg` | 40–199 px | The reversed wheel on a solid indigo 900 disk. The site header (56 px) |
| Small | `mark-small.svg`, `public/favicon.svg` | 24–39 px | Disk, one ring, the first three rows of the tetractys |
| 16 | `mark-16.svg` | 16 px only | The small cut without the ring, dots enlarged |
| App icon | `app-icon.svg`, `app-icon-maskable.svg` | Phones | Wheel on a square indigo 900 ground. The maskable one keeps the wheel inside Android's 80% safe circle |
| Per number | `life-paths/life-path-{n}.svg` | Share cards, the Reading's cover | That number pink on the ring and drawn large at the center |

### Rules

- **Clear space:** an eighth of the wheel's diameter on every side.
- **Pink is one element.** The tetractys apex, or a highlighted number. Never a ring, never text.
- **No line-art wheel under 200 px on screen.** Below that its rings blur; use the badge.
- Don't rotate it, outline it, add a drop shadow, or set it on a photo.
- The wordmark is "Life Pathing" in the app's extrabold sans until a typeface is chosen.

### Files and regenerating

The SVGs are generated, never hand-edited. Change `scripts/brand/generate.ts`, then:

```bash
npm run brand:generate
scripts/brand/rasterize.sh
```

`rasterize.sh` needs Google Chrome and Python 3 with Pillow. It writes `public/favicon.ico` (16, 32, 48), `apple-touch-icon.png` (180, opaque), `android-chrome-192x192.png`, `android-chrome-512x512.png`, `icon-maskable-512.png`, and `og.png`, which it screenshots from `scripts/brand/og.html`. When the homepage headline changes, change it in `og.html` too and rerun. `src/brandAssets.test.ts` fails if a linked icon goes missing, a phone icon has a clear corner, or the share image stops matching its tags.

### Legacy

The sun stone (January 2026 to October 2026) is kept in `docs/brand/legacy/`: the logo and the share image. It stays on the essay.

---

## Tokens

_Not set as tokens yet._ Today they are Tailwind classes in `src/design/tokens.ts`: page `#F8FAFC`, text slate 800, hero card indigo 900, tabs and focus indigo 600, tones sky, emerald, purple, amber, indigo and slate. The port moves these to CSS variables with a dark set.

## Typography

_Not set._ The app uses the system font stack; the share image and canvas studies use Hanken Grotesk as a stand-in.

## Voice

_Not set._ See the tower's VOICE.md when the persona is cast.

---

## Spine Rules (inherited)

The following come from the canonical Field Guide and are not relitigated here. See `~/.claude/skills/app-design-port/references/field-guide.md` for the full text:

- Spacing: multiples of 4 or 8. No `gap-[5px]`. No nested cards.
- Composition: anchor every block to two edges, group long lists, icons over explanations (never over accessible names), emphasis by difference, lines before boxes.
- State coverage: buttons define 5 states; inputs define 5 states. Focus rings always visible.
- Light + dark: hand-tuned, never mechanically inverted.
- Lucide React for icons. `font-mono` for money / dates / counts.
- Accessibility: WCAG AA contrast, action-oriented button labels.

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-10-24 | Retire the sun stone for the wheel (direction B) | The essay's argument spans six traditions; the stone showed one, and it was Aztec where the essay discusses the Maya. The raster drawing also had no vector source and no small-size cut |
| 2026-10-24 | Two indigos: 700 for lines and small marks, 900 for grounds | 900 matches the hero card; 700 stays bright enough in a dark browser tab |
| 2026-10-24 | Manifest `display: browser` | `standalone` would give a home-screen copy its own storage on iOS, and a Reading bought in Safari would not show there |
