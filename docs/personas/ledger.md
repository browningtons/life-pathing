# Persona ledger: Life Pathing

Findings that were real on `main` but not fixed in the run that found them. Each has evidence, a score (Impact + Confidence + Risk − Effort, each 1–5), the smallest change, and what done looks like. Delete an entry when it ships.

### L1 — Unread facets filled with 50 show as real scores

*Filed 2026-10-14 from the [persona walkthrough](runs/2026-10-14.md) (Priya; re-check B; on `08eb18c`). 3+5+2−2 = **8**.*

A paste that carries three facets sets the other twenty to 50, and those then render as "BALANCED" rows and even in "What shows up loudest" ("Orderly 50%, Scheduled 50%"). An unread value looks like a measured one.

**Smallest change:** a facet whose value came from the fill (not the paste) renders as "not in your report" and is excluded from "loudest".

**Done looks like:** paste `Imaginative 77%` alone; "What shows up loudest" shows Imaginative only, and the 22 other rows say they were not in the report.

### L2 — The letters ask is below the fold

*Filed 2026-10-14 (Maya, Linda; re-check B). 3+5+2−1 = **9**. Paul's call 8 in the run report.*

On a 1366×700 laptop only the edge of "THE OTHER HALF" shows after the reduction table; on a phone the table itself runs past the first screen.

**Smallest change:** once the birthdate is the reader's own, render the ask card above the reduction table.

**Done looks like:** fill a birthdate on a phone; "Twelve quick questions" is visible without scrolling.

### L3 — Jargon with no gloss; the letters are never decoded

*Filed 2026-10-14 (Linda, Maya). Re-hit 2026-10-23 by 5 of 10 (Linda, Maya, Carlos, Dave, Kevin): temperament names as unexplained chips, three labels for one person ("The Debater · The Leader · Theorist"; "Logistician" vs "Preserver"), "BORDERLINE" with no gloss. Raised to 4+5+3−2 = **10**. Linda's exit was this.*

"MBTI", "Big Five", "Enneagram", "Preserver", "1 LETTER APART", "Si FIRST, Fe SECOND" appear with no explanation. The result card says "READ AS ISFJ · The Defender" and never says I = Introversion and so on.

**Smallest change:** a one-line decode under the result heading ("I for introversion, S for sensing, F for feeling, J for judging"), and a short gloss under the first use of each term on the Profile.

**Done looks like:** Linda's list of unexplained terms is empty on the Profile and the result card.

### L4 — The Life Path tab saves silently

*Filed 2026-10-14 (Sam). 2+5+2−1 = **8**.*

Typing a birthdate on the Life Path tab persists it at once. Only Your Data says "Saved automatically, on this device only."

**Smallest change:** the same aside under the birthdate input.

### L5 — The -A/-T suffix is dropped without saying so on the Profile

*Filed 2026-10-14 (Priya, Carlos). 1+5+1−1 = **6**.*

**Smallest change:** none until phase 2; the input already says the suffix is dropped.

### L6 — A borderline-S ISFJ is led by "Empath"

*Filed 2026-10-14 (Kevin; re-check A). 2+5+2−3 = **6**.*

I 60, S 55, F 80, J 55 gives Empath 36% (N×F = 0.45 × 0.80) over Preserver (S×J = 0.55 × 0.55). The product rule is as documented, but a sensing type led by the intuitive temperament reads wrong.

**Smallest change:** none without a rule change; note it in the temperament copy when the leading temperament's letters disagree with the type code.

### L7 — Restore with an empty email returns silently

*Filed 2026-10-14 (Aisha, via a harness quirk). 1+4+1−1 = **5**.*

`handleRestore` returns without a word when the prompt is empty or cancelled. Fine for cancel; for an empty submit a one-line "Enter the email from your receipt" would help. Also blocks the harness from testing restore at all (a `prompt()` cannot be filled).

### L8 — Hand-edit pass over the 528 Readings (the moat)

*Filed 2026-10-18 from the Phase 2 engineering review (D7). Impact 4 + Confidence 4 + Risk 2 − Effort 4 = **6**.*

The design's "Approach B" was hand-written pairings. With the Readings generated offline into the repo, that is an editing job: open the source file the script owns, improve the prose, commit. The 20-sample voice review (`docs/readings-review.md`) starts it; the other 508 are this entry.

**Trap:** a prompt-version bump regenerates every key and would overwrite edits. Before editing beyond the sample, give the script a `locked` marker per key that it never regenerates, and a `--only <key>` flag.

**Smallest change:** the locking rule in `scripts/generate-readings.ts` plus a `docs/readings-review.md` line per edited key.

**Done looks like:** regenerate with a new prompt version; every locked key's text is byte-identical afterwards.

### L9 — v2 inputs for the Reading (personal year, birthday number, facets)

*Filed 2026-10-18 from the Phase 2 engineering review (D8). Impact 3 + Confidence 3 + Risk 2 − Effort 5 = **3**.*

v1 reads from two inputs on purpose. The key space is 33 life path + compound pairs × 16 types = 528, which is why the Readings are generated offline (D1). A personal year makes the key time-varying (9× the set, regenerated every January). Facets make it unbounded and reopen on-demand generation with a store, a cap and a kill switch. Any new input must be derivable from a bounded set or the architecture changes back.

**Trigger:** twenty Readings read for voice, a first buyer, and a panel re-run (same roster) showing the Reading moved the "would pay" count.

**Smallest change:** none until the trigger; then `readingKey.ts` grows a field and `READING_PROMPT_VERSION` bumps.

### L10 — A real PDF download for the Reading

*Filed 2026-10-18 from the Phase 2 outside voice. Impact 3 + Confidence 4 + Risk 2 − Effort 3 = **6**.*

The "kept artifact" is a print stylesheet. On iOS Safari, Save as PDF is buried in the share sheet, and three of the panel's ten were on phones. The content is static (528 documents), so the PDFs can be rendered offline with the same stylesheet and served through the same key-bound route as a download.

**Smallest change:** a script step that prints each Reading to PDF with Playwright; the route serves `application/pdf` when asked.

**Done looks like:** on a phone, "Save the PDF" produces a file without the share sheet.

### L11 — Quiz friction on a phone

*Filed 2026-10-23 from the [persona walkthrough](runs/2026-10-23.md) (Maya, Kevin, Linda; on `a280de3`). 3+4+2−2 = **7**.*

No progress bar beyond "QUESTION n OF 12"; a tap within about 600 ms of an advance is swallowed with no feedback (the double-tap guard), which a fast thumb reads as frozen; a reload mid-quiz starts over; Linda felt forced on four of twelve questions.

**Smallest change:** a thin progress bar; a brief disabled state on the answer buttons during the guard window so the swallowed tap is visible; keep answers in sessionStorage until the result.

**Done looks like:** tap answers as fast as the harness allows with `{"click": N}` twelve times; every tap is either accepted or visibly refused; reload at question 6 resumes at question 6.

### L12 — Your Data shows the builder's facets under the reader's own type

*Filed 2026-10-23 (Aisha, Tom). 2+5+2−1 = **8**.*

After buying with letters only, Your Data lists "Insightful 94%, Friendly 78%, Aesthetic 90%" under the reader's type with the aside "the facets below are still the sample's". Honest, but the numbers read as the reader's at a glance.

**Smallest change:** when `facetSource` is `sample` and the letters are the reader's own, render the facet rows as empty "not in your report" rows (same component L1 needs) instead of the sample values.

**Done looks like:** type INTJ, buy, open Your Data: no percentage from the sample profile is visible.
