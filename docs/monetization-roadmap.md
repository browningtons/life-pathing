# Monetization roadmap

The phased path from "free reader's tool" to "one stranger has paid." Written 2026-09-10 alongside the free / paid split. Update it as phases land; delete lines, do not let them rot.

**Done is:** the Reading is live behind the gate, the free card is shareable, and one stranger has bought it.

## Why the first paywall failed

The April 2026 paywall gated strengths, shadows, and famous names on the Life Path and Archetypes tabs. That is content 16personalities and every numerology site give away, so nobody paid to uncover a tile. The rule now: **the systems are free, the reading of you is paid, and the paid thing should be an artifact you keep.**

## Phases

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Free / paid split | **Shipped 2026-09-10** | `src/data/tiers.ts` decides it; `<ProGate>` enforces it; teasers are real slices, not blurs. `#pro=1` unlock token removed. |
| 1 | Analytics on, first-run intake | Not started | Enable Vercel Web Analytics in the dashboard (the `<Analytics />` component is mounted but the project setting is off, so every kit event goes nowhere). Replace the sample-profile opener with a 30-second intake that lands on Profile. |
| 2 | The Reading | Not started | Make "The read" specific to the profile, not four temperament templates. Options: write the 16 × 12 type-by-life-path pairings by hand, or generate server-side at purchase with one Claude call in the almanac voice, cached by profile hash. This is the headline paid item. Do `/office-hours` on it first. |
| 3 | Reading as PDF | Not started | The old config promised a "Personal Compass PDF" that never existed. OFL's jsPDF pattern applies. |
| 4 | Second profile, pair read | Not started | A capacity gate like OFL's five proposals. Where two profiles converge and pull apart. MBTI compatibility is the category's biggest search term. |
| 5 | Prerender free pages | Not started | `/life-path/7`, `/type/enfp` as static routes so the free tier can be found. Today the app is one URL. |
| 6 | Shareable result card | Not started | Type × life path as an image. Free. This is the acquisition loop, not a paid feature. |

## Before taking real money

- [ ] Payment Link success URL set to `https://<domain>/#session_id={CHECKOUT_SESSION_ID}` in the Stripe dashboard, or buyers land locked and have to restore by hand.
- [ ] Privacy and refund page. The trust line promises a 30-day refund; it needs somewhere to live.
- [ ] Price decision. Config and the live Payment Link say $29. Recommendation is to launch at $19 while the Reading is unproven, which needs a new Stripe price + link, then raise it once refunds and reviews come in.
- [ ] Replace `buy_btn_REPLACE_ME` with a real Buy Button, or keep the Payment Link fallback deliberately.
- [ ] `/launch-checklist` on the money path once phases 1 to 3 exist.
- [ ] Port the `#pro=1` removal back to the shared `appkit` repo so the next app does not reinherit the hole.

## Pricing notes

Keep it one-time. The intake audience has already paid Truity for a TypeFinder report, so they are proven payers in this category at this price point. Comparable paid reports sit between $19 and $29.
