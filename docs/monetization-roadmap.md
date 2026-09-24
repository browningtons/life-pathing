# Monetization roadmap

The phased path from "free reader's tool" to "one stranger has paid." Update it as phases land; delete lines, do not let them rot. The approved design behind phases 1 and 2 is [`reading-design.md`](reading-design.md).

**Done is:** a stranger who arrived with only a birthdate buys a Reading.

## Why the first paywall failed

The April 2026 paywall gated strengths, shadows, and famous names on the Life Path and Archetypes tabs. That is content 16personalities and every numerology site give away, so nobody paid to uncover a tile. The rule now: **the systems are free, the reading of you is paid, and the paid thing should be an artifact you keep.**

## Who pays

The birthdate-only reader: arrives from a search ("life path 7 meaning") or a shared link, with a date and nothing else. Not the Truity report owner, whose facet scores the first paid tier needed. They get free life-path pages everywhere; when they want something kept, they buy a $17 to $57 numerology PDF. Nothing they can buy crosses their number with their type. That crossing is the product.

## Phases

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Free / paid split | **Shipped 2026-09-10** | `src/data/tiers.ts` decides it; `<ProGate>` enforces it; teasers are real slices, not blurs. `#pro=1` unlock token removed. |
| 1 | The funnel | **Built 2026-09-23, not yet deployed** | The letters ask under a reader's own Life Path: a twelve-question quiz or typed letters, no trip to another site. `dimensionSource` / `facetSource` on the profile so the app knows whose numbers it is showing. A "no facet scores yet" state so a quiz-only reader never sees the sample's facets. Funnel events (below). Then seven days of measurement before phase 2. |
| 2 | The Reading | Not started | One document from life path + compound + four letters, generated once per combination, cached, printable with a print stylesheet (no jsPDF). Free opening paragraph, then the gate. $19, one SKU that also unlocks the facet Profile. Full contract in the design doc. Run `/plan-eng-review` first: the store and the generation route are the open questions. |
| 3 | Pair read | Not started | Two birthdates and two sets of letters. Where they converge and pull apart. Compatibility is the category's biggest search term. |
| 4 | Prerender free pages | Not started | `/life-path/7`, `/type/enfp` as static routes so the free tier can be found. Today the app is one URL. |
| 5 | Shareable result card | Not started | Type × life path as an image. Free. The acquisition loop, not a paid feature. |

## Phase 1: what to measure

Turn on Vercel Web Analytics in the project settings first. The `<Analytics />` component is mounted, but with the setting off every event is discarded.

| Event | Fires when | What it answers |
|---|---|---|
| `lp_lifepath_shown` `{ number }` | A non-sample birthdate produces a Life Path. Once per session. | Top of the funnel: how many strangers got their own number. |
| `lp_quiz_started` | The reader opens the quiz. Once per session. | Whether the ask is seen and clicked at all. |
| `lp_letters_entered` `{ method: quiz \| typed }` | Letters arrive by either route. | The step the design flagged as the leak. |
| `lp_tab_view` `{ tab }` | Any tab change. | Whether readers reach the Profile after the handoff. |
| `lp_gate_shown` `{ gate }` | A paid section's gate renders for a free reader. | Gate exposure, by section. |
| `lp_upgrade_shown`, `lp_pro_purchase` | The modal opens; a verified purchase lands. | The money end, unchanged. |

Record for seven days before changing anything. The ratio that decides phase 2 is `letters_entered / lifepath_shown`. If most readers who get a number also give letters, the Reading is the bottleneck and phase 2 starts. If they do not, the ask or the quiz is, and that gets fixed first.

Events are fired from `src/lib/funnel.ts` (app-specific) and the kit's `trackEvent`, which adds the `lp_` prefix and any captured UTMs.

## Before taking real money

- [ ] Payment Link success URL set to `https://<domain>/#session_id={CHECKOUT_SESSION_ID}` in the Stripe dashboard, or buyers land locked and have to restore by hand.
- [ ] A new $19 price and Payment Link under the existing product. In `kit.config.ts`, change `upgrade.price`, `upgrade.features`, `stripe.paymentUrl`, and `stripe.priceIdHint` together, or the modal shows $19 and charges $29.
- [ ] Privacy and refund page. The trust line promises a 30-day refund; it needs somewhere to live.
- [ ] Replace `buy_btn_REPLACE_ME` with a real Buy Button, or keep the Payment Link fallback deliberately.
- [ ] `/launch-checklist` on the money path once phase 2 exists.
- [ ] Port the `#pro=1` removal back to the shared `appkit` repo so the next app does not reinherit the hole.

## Pricing notes

Keep it one-time, one SKU, $19. The comparable purchase for this buyer is a numerology report: $17 to $57 one-time (Numerologist.com), about $35 for a bundle (World Numerology), about $56 hand-written on Etsy. Astrology apps charge $8 to $22 a month, but they sell a daily habit this app does not have. Raise the price once refunds and reviews come in, not before.
