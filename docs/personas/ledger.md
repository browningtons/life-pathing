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

*Filed 2026-10-14 (Linda, Maya). 3+5+2−2 = **8**.*

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
