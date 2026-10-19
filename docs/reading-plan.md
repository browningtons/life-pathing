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

All six fields present and strings; teaser 60–120 words; `number`, `type`, `agree`, `pull` 150–200 words each; `closing` 15–40 words; no banned word or pattern (case-insensitive, word-boundary); no second-person forecast patterns. Returns a list of failures. The script retries a failing key once with the failures appended to the prompt, then marks it failed. **No fallback text ships.** A failed key fails the script.

### Route (`api/reading.ts`)

- `GET /api/reading?key=<key>&session_id=<cs_…>`; or header `x-reading-admin: <READING_ADMIN_TOKEN>`.
- Verifies with `verifySession(sessionId)` from the new `api/_lib/entitlement.ts` (the price-id / product-id match extracted from `verify-purchase.ts`, which keeps its behaviour).
- Responses: `200 { key, version, reading }` · `402 { error: 'not verified' }` · `404 { error: 'no reading for this key' }` · `405` · `502 { error: 'verification failed' }` when Stripe throws.
- The full set is imported into the function (`api/_readings/index.json`, built by the script); nothing reads the filesystem at runtime.
- `verify-purchase.ts` POST now returns `{ verified, sessionId }` so the email-restore path can store the session id the Reading route needs.

### Client

- **Reading tab** (`src/views/ReadingView.tsx`), fourth tab after Profile. States: no own birthdate → ask for one; own birthdate, sample letters → the letters ask (same component as the Life Path tab); own letters → pills (type, life path, temperament from `temperamentForMbti`), teaser from `public/readings/<key>.json`, then `ProGate('reading')` with button label "Read the whole thing"; Pro → fetch full text (cache hit first), render five sections, Print / Save as PDF; Pro with no stored session → "Restore purchase" control; admin without token → one prompt.
- `ProGate` gains an optional `buttonLabel` and a `surface` so the analytics source reads `reading_reading`.
- `src/data/tiers.ts`: `GateKey` gains `'reading'` with copy naming the five sections.
- `useAuth`: `#session_id` activation switches to the Reading tab on the false→true transition of `justPurchased` only; restore saves the returned session id; the post-purchase banner names the Reading.
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
| B. entitlement extraction + reading route + verify-purchase POST | `api/` | A's JSON shape only (a fixture suffices) |
| C. ReadingView + ProGate label + tiers copy + print stylesheet + funnel event + tab switch + restore | `src/views/`, `src/components/`, `src/data/tiers.ts`, `src/kit/auth/`, `src/index.css` | A's key module and B's route shape (both are small contracts; stub them) |
| D. kit.config $19 + roadmap + README | `kit.config.ts`, `docs/` | Paul creates the $19 price and Payment Link |
| E. privacy and refund page | `src/views/` or `public/` | — |

Launch A, B, C, E in parallel worktrees against agreed contracts (key format, JSON shape, route responses); D after Paul's Stripe step; merge A → B → C → E → D.

## Dependencies on Paul

- A new $19 price and Payment Link under the existing product; `STRIPE_PRICE_ID` updated; the $29 price archived; the Payment Link success URL set to `https://life-pathing.vercel.app/#session_id={CHECKOUT_SESSION_ID}`.
- `READING_ADMIN_TOKEN` env in Vercel.
- `ANTHROPIC_API_KEY` locally to run the script.
- Read the 20-sample review file before the price goes live.
