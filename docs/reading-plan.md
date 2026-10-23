# Plan: The Reading (Phase 2)

Engineering plan from `/plan-eng-review` on 2026-10-18 against [`reading-design.md`](reading-design.md) (approved 2026-09-12). The design's intent, voice, contract and SKU stand. One architecture decision changed in review and is recorded here with the reason.

**Done is:** a stranger who arrived with only a birthdate buys a Reading and prints it.

## Decisions made in review

| # | Decision | Why |
|---|---|---|
| D1 | **Generate all Readings offline into the repo.** No runtime generation route, no store, no per-session cap, no daily counter, no kill switch, no waiting state, no regenerate control. | Every birthdate from 1900 to 2026 reduces to 33 life path + compound pairs; times 16 types is **528 Readings**. That is a one-time script (about $10–15 of Sonnet tokens), not a service. The design's open question (which store) disappears. The server stores nothing. |
| D2 | **The paid text is served by a thin route that re-verifies the Stripe session on each fetch; the client then caches the text locally** keyed by Reading key + prompt version. | One Stripe round trip per device per Reading; re-opens and printing work offline, which matches "saved to this browser". A prompt-version bump invalidates every cached copy. |
| D3 | **Admin door:** `READING_ADMIN_TOKEN` env; the route accepts it as a header in place of a session id; admin mode asks for it once and keeps it in sessionStorage. | Paul can walk the live Reading page for any key before launch without buying. |
| D4 | **Each Reading is structured JSON**, not markdown: `{ teaser, number, type, agree, pull, closing }` with plain-text bodies. | No markdown dependency; the page renders with the app's own Card and SectionHeading; the validator checks named fields; every formatting failure happens in the script, never in a buyer's browser. |
| T1 | **Each purchase is bound to its Reading key.** The Payment Link gets `client_reference_id = <key>__<utm>`; the route serves only the bound key; the payment intent's latest charge is expanded and a refunded session is refused; the session id travels in a request header, never the query string. A session with no key (a pre-Phase-2 $29 buyer) may read any one key. Buying requires the reader's own letters, so every new session carries a key. | Outside voice: with no store and no cap, one paid session id read the whole catalogue, and Stripe keeps `payment_status: paid` after a refund. Binding needs no server state and makes the offer exact: "The Reading for 7 · INFJ". A buyer who changes letters later is told, before paying, that a new pairing is a new Reading. |
| T2 | **Four personal-ness checks before the full run:** a cross-sibling overlap test in the validator (the 16 Readings of one number, the 33 of one type, flagged above a shared-n-gram threshold); a side-by-side review file (same type, different numbers); the document shows "Written for a 7 born 14 March 1991" from the device; and a 5-persona read of 3 pilot Readings before the 528 are generated. | Everyone who is a 7 and INFJ gets the same text and the inputs are the free pills. A reader of one document cannot see that it matches its 32 siblings. |
| T3 | **`VITE_READING_ENABLED` flag, off by default.** The tab, the Reading gate copy, the $19 modal and the Profile gates' "Included with the Reading" copy flip on together in the final PR after Paul signs `docs/readings-review.md`. The modal header names the Reading. | main auto-deploys; without a flag the live offer would mix $29 "whole profile" copy with a $19 Reading page for as long as the Stripe step takes. The sign-off becomes a mechanism. |
| T4 | **Fix email restore in lane B.** The POST scans sessions by email and checks line items on each match until one is this product (the Stripe account is shared with another app); `prompt()` becomes a small email form in the modal so the harness can test restore. | A bug on main today; the Reading makes restore the only path to a second device. |
| D5 | **Launch gate:** all 528 pass the validator (script exits 1 otherwise) **and** Paul reads a stratified sample of 20 (`docs/readings-review.md`) before the $19 price goes live. | The panel's loudest complaint about the paid tier was generic prose. Rules cannot catch "correct and dull". |

## Architecture

```
offline (Paul's machine, ANTHROPIC_API_KEY in .env.local)        production (Vercel)
┌──────────────────────────────────────────────┐                ┌─────────────────────────────────────────────┐
│ scripts/generate-readings.ts  (tsx)          │                │ public/readings/<key>.json   teaser only     │◄─ free fetch (CDN)
│   keys = every (lifePath, compoundKey)       │   git commit   │                                             │
│          × 16 types   → 528                  │ ─────────────► │ api/reading.ts                              │
│   for each key:                              │                │   GET ?key=&session_id=   | x-reading-admin │
│     prompt = buildReadingPrompt(key)         │                │   verifySession (api/_lib/entitlement.ts)   │◄─ paid fetch
│     reply  = claude-sonnet-5 (JSON)          │                │   → api/_readings/<key>.json → 200 text     │
│     validateReading(reply) → retry once      │                │   402 unverified · 404 unknown key · 405    │
│     write teaser + full                      │                └─────────────────────────────────────────────┘
│   exit 1 if any key failed                   │                client
│   --sample 20 → docs/readings-review.md      │                ReadingView: pills → teaser → ProGate('reading')
└──────────────────────────────────────────────┘                  → after unlock: fetch full → localStorage → print
```

### Key

`src/lib/readingKey.ts`: `readingKey(lifePath, compound, typeCode)` → `"<lp>-<compoundKey>-<TYPE>"` where `compoundKey` is the compound number when `COMPOUND_MEANINGS` has a label for it (10–33), else `0`. `READING_PROMPT_VERSION = 1` lives beside it; the client's cache key is `${version}|${key}`. The script enumerates keys by walking every date from 1900-01-01 to today through `calculateLifePath`, so the set is exactly what the app can produce (33 pairs today).

### Prompt (`src/lib/readingPrompt.ts`, pure function of the key)

System: the almanac register, third person, the disclaimer framing, the fixed section contract, the banned list (journey, energy, universe, vibration, manifest, destiny, "you will", "expect", "this year"), and the exemplars passed verbatim: the four `SYNTHESIS_BY_TEMPERAMENT` templates, the convergence themes and growth edges from `src/data/personality.ts`. User turn: the life-path entry (`LIFE_PATH_MEANINGS[n]`), the compound label when present, the type entry (`MBTI_DATA[type]`), the temperament from `temperamentForMbti(type)`. Output: JSON `{ teaser, number, type, agree, pull, closing }`. Model: `claude-sonnet-5`; `claude-opus-5` if the voice sample reads flat.

### Validator (`src/lib/readingValidator.ts`, pure, tested)

All six fields present and strings; teaser 60–120 words; `number`, `type`, `agree`, `pull` 150–200 words each; `closing` 15–40 words; total 700–900 words; no banned word or pattern (case-insensitive, word-boundary); no second-person forecast patterns. Returns a list of failures. A second pass over the whole set flags sibling pairs (same number, or same type) whose shared 6-gram ratio exceeds a threshold set from the pilot. The script retries a failing key once with the failures appended to the prompt, then marks it failed. **No fallback text ships.** A failed key fails the script.

### Route (`api/reading.ts`)

- `GET /api/reading?key=<key>` with header `x-reading-session: cs_…`, or header `x-reading-admin: <READING_ADMIN_TOKEN>`.
- `verifySession(sessionId, key)` in the new `api/_lib/entitlement.ts` (the price-id / product-id match extracted from `verify-purchase.ts`, which keeps its behaviour): retrieves the session with `line_items` and `payment_intent.latest_charge` expanded; requires `payment_status === 'paid'`, a product match, `latest_charge.refunded !== true`, and that `client_reference_id` is absent (legacy) or starts with `<key>__` / equals `<key>`.
- Responses: `200 { key, version, reading }` · `402 { error: 'not verified' | 'refunded' | 'other reading' }` · `404 { error: 'no reading for this key' }` · `405` · `502 { error: 'verification failed' }` when Stripe throws. The `other reading` case tells the client which key the session is bound to, so the page can say so.
- The full set is imported into the function (`api/_readings/index.json`, built by the script); nothing reads the filesystem at runtime.
- `verify-purchase.ts` POST now returns `{ verified, sessionId }` so the email-restore path can store the session id the Reading route needs, and it scans every session matching the email until one carries this product (T4).
- The kit's `stripeUrlWithUtm` becomes `stripeUrlWithRef(baseUrl, { key, utm })` and encodes `client_reference_id = <key>__<utm_source>_<utm_medium>_<utm_campaign>` (Stripe allows `[A-Za-z0-9_-]`, 200 chars). The modal needs the key, so buying is only offered once the reader has their own letters; otherwise the modal points to the letters ask.

### Client

- **Reading tab** (`src/views/ReadingView.tsx`), fourth tab after Profile. States: no own birthdate → ask for one; own birthdate, sample letters → the letters ask (same component as the Life Path tab); own letters → pills (type, life path, temperament from `temperamentForMbti`), teaser from `public/readings/<key>.json`, then `ProGate('reading')` with button label "Read the whole thing"; Pro → fetch full text (cache hit first), render five sections, Print / Save as PDF; Pro with no stored session → "Restore purchase" control; admin without token → one prompt.
- `ProGate` gains an optional `buttonLabel` and a `surface` so the analytics source reads `reading_reading`.
- `src/data/tiers.ts`: `GateKey` gains `'reading'` with copy naming the five sections.
- `useAuth`: `#session_id` activation switches to the Reading tab on the false→true transition of `justPurchased` only; restore saves the returned session id; the post-purchase banner names the Reading.
- The document header reads "Written for a 7 born 14 March 1991", rendered from the device's profile (never sent anywhere).
- `VITE_READING_ENABLED` (T3) gates the tab, the Reading gate key, the modal copy variant and the Profile gates' "Included with the Reading" line. Off by default; `.env.example` documents it; the final PR sets it in Vercel.
- Admin mode with no token entered shows the token prompt in place of the gate, never a 402 card.
- Restore is a small email form in the upgrade modal (kit), not `prompt()`.
- Print stylesheet in `src/index.css` under `@media print`: only the Reading article prints; nav, banners, gates and buttons hidden.
- Funnel: `reading_teaser_shown` (once per session) in `src/lib/funnel.ts`.
- `kit.config.ts`: `upgrade.price` `$19`, `upgrade.features` leading with the Reading, `stripe.paymentUrl` the new $19 link, `stripe.priceIdHint` (all four together); `STRIPE_PRICE_ID` env updated by Paul.

## NOT in scope (deferred, with reason)

- Personal year, birthday number, name numbers, facets in the Reading (v2 per the design; they would grow the key space and reopen D1).
- Streaming or a waiting state (nothing generates at runtime).
- Store, cap, counter, kill switch, regenerate control (D1).
- Pair read, share card, prerendered free pages (phases 3–5).
- Hand-editing the 528 (starts with the 20-sample review; the rest is a ledger item).
- The privacy and refund page is required before real money but is its own PR, in a parallel lane.
- Stripe Buy Button (the Payment Link stays, deliberately).
- Pre-rendered PDFs served as a download (outside voice: phone Save-as-PDF is buried). Ledger L10; the print stylesheet ships first.
- A birthday-number paragraph (31 static blocks). Paul's call after the pilot read.
- Prerendered free pages and the "post the link" assignment (phase 4 and the design's Assignment) are not engineering work in this phase; analytics are on as of 2026-10-18.

## What already exists (reused, not rebuilt)

`verify-purchase.ts` (Stripe match → extracted and reused), `ProGate` + `GATE_COPY`, `dimensionSource`, `temperamentForMbti`, `getSynthesis` / convergence / growth blocks (exemplars), `LIFE_PATH_MEANINGS`, `COMPOUND_MEANINGS`, `MBTI_DATA`, `calculateLifePath`, the kit's `trackEvent` and UTM capture, the post-purchase banner and `justPurchased` flag, the persona harness (`docs/personas/`) for E2E.

## Tests (every path; see the coverage map in the review)

- `readingKey.test.ts`: labeled and unlabeled compounds, 11/22/33, lowercase and suffixed types, the enumerated set equals 33 pairs.
- `readingPrompt.test.ts`: pure function of key (same key → same prompt), exemplars and banned list present, compound clause omitted for key `0`.
- `readingValidator.test.ts`: each field missing, each length bound (low and high), each banned word, forecast patterns, a passing fixture.
- `api/_lib/entitlement.test.ts`: price match, product match, neither, Stripe throws. **Regression:** `verify-purchase` GET and POST unchanged except POST's added `sessionId`.
- `api/reading.test.ts` (Stripe mocked): 200 verified, 200 admin token, 402, 404, 405, 502.
- `funnel.test.ts`: teaser event once per session.
- `noHardcodedPersonality.test.ts` covers `ReadingView`.
- Script: `--dry-run` enumerates keys and prompts without calling the API; `--sample 20` writes the review file.
- E2E via the persona harness (`{"buy": true}`, `{"pdf": true}`): free teaser, gate, unlock lands on the tab, reload uses the cache, print PDF has five sections and no chrome, restore path, unknown key card. [→EVAL] all 528 pass the validator; Paul reads 20.

## Failure modes

| Path | Failure | Test | Handling | What the user sees |
|---|---|---|---|---|
| teaser fetch | CDN 404 (key not generated) | E2E | honest card | "No reading written for this pairing yet" + the gate hidden |
| full fetch | Stripe 5xx | route test | 502 → retry card | teaser stays, "Try again" |
| full fetch | session not verified | route test | 402 → Restore control | "Restore purchase" |
| cache | prompt version bump | unit | version in cache key | re-fetch once |
| script | model returns bad JSON | validator test | retry once, then fail | Paul sees the key in the failure list; nothing ships |
| print | nav or gate in the PDF | E2E pdf | print stylesheet | five sections only |

No critical gaps: every failure has a test and a visible state.

## Parallel lanes

| Step | Modules | Depends on |
|---|---|---|
| A. key + prompt + validator + script + the 528 JSON | `src/lib/`, `scripts/`, `public/readings/`, `api/_readings/` | — (needs `ANTHROPIC_API_KEY` locally) |
| B. entitlement extraction (+ key binding, refund check) + reading route + verify-purchase POST (product-aware email scan) + kit restore form + `stripeUrlWithRef` | `api/`, `src/kit/` | A's JSON shape only (fixture in `api/_readings/__fixtures__/`) |
| C. ReadingView + ProGate label + tiers copy + print stylesheet + funnel event + tab switch + restore | `src/views/`, `src/components/`, `src/data/tiers.ts`, `src/kit/auth/`, `src/index.css` | A's key module and B's route shape (both are small contracts; stub them) |
| D. kit.config $19 + modal copy + flag on + roadmap + README | `kit.config.ts`, `docs/`, Vercel env | Paul creates the $19 price and Payment Link, signs the review file |
| E. privacy and refund page | `src/views/` or `public/` | — |

Sequence: A runs the 3-key pilot first and the 5-persona read decides whether the prompt goes another round; B, C and E start in parallel against the contracts below; A's full run lands when the pilot passes. Merge A → B → C → E, then D (with the flag flip) last. C and E both touch the shell nav: E adds a footer link only, after C.

**Contracts:** key `"<lifePath>-<compoundKey>-<TYPE>"`; Reading JSON `{ key, version, teaser, number, type, love, agree, pull, closing }` (since prompt version 2: `love` is "In love", 80–120 words, rendered between The Type and Where they agree; `number`, `type`, `agree`, `pull` 130–180 words each; second person, D9 and D10); teaser file `public/readings/<key>.json` = `{ key, version, teaser }`; route as above; `verify-purchase` POST `{ verified, sessionId }`; flag `import.meta.env.VITE_READING_ENABLED === '1'`.

## Dependencies on Paul

- A new $19 price and Payment Link under the existing product; `STRIPE_PRICE_ID` updated; the $29 price archived; the Payment Link success URL set to `https://life-pathing.vercel.app/#session_id={CHECKOUT_SESSION_ID}`.
- `READING_ADMIN_TOKEN` env in Vercel; `VITE_READING_ENABLED=1` only in the final PR.
- `ANTHROPIC_API_KEY` locally to run the script.
- Read the 20-sample review file before the price goes live.

## Status (2026-10-19)

| Lane | PR | State |
|---|---|---|
| A key, prompt, validator, script | [#13](https://github.com/browningtons/life-pathing/pull/13), [#16](https://github.com/browningtons/life-pathing/pull/16) (round 2, superseded), [#18](https://github.com/browningtons/life-pathing/pull/18) (prompt v3 + the 528) | Merged to main 2026-10-22 (`9044a6a`). Three prompt rounds: v1 read as a template (5-persona pilot, 0 of 5 would pay), v2 as hedged vignettes, v3 as a reading. All 528 validated, no sibling overlap flagged. |
| B entitlement, route, restore fix, Stripe link | [#12](https://github.com/browningtons/life-pathing/pull/12) | Merged. Verified on the combined build. |
| C Reading tab, gate, cache, print, funnel | [#14](https://github.com/browningtons/life-pathing/pull/14) | Merged. Verified on the combined build with the flag on. |
| E privacy and refund page | [#11](https://github.com/browningtons/life-pathing/pull/11) | Merged to main 2026-10-21 after Paul approved the wording. |
| D $19 price, modal copy, roadmap | lane D PR | Stripe: new product `prod_VUXnrnuSvEozxE`, $19 Payment Link with the success URL, done 2026-10-22. Modal sells the Reading under the flag. **The flag flip waits on Paul's sign-off of `docs/readings-review.md`** and on `STRIPE_PRICE_ID`, `STRIPE_PRODUCT_ID`, `READING_ADMIN_TOKEN` in Vercel. |

Combined walk of `e28bf75` with `VITE_READING_ENABLED=1` (phone): every Reading state, the Buy link with `client_reference_id=7-16-INFJ`, the full text after a simulated purchase, a reload from cache with no fetch, a print PDF, `/privacy`. 392 tests pass.

**Next, in order:** (1) Paul approves the privacy wording → this branch merges to main with the flag off; (2) `ANTHROPIC_API_KEY` in `.env.local` → the 3-key pilot → a 5-persona read → the 528 run and the 20-sample review; (3) Paul's Stripe price and link, `READING_ADMIN_TOKEN` → lane D flips the flag.
