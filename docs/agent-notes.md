# Agent notes: Life Pathing

Durable lessons for agents working in this repo. Add a dated line; delete lines that stop being true.

## Known failure modes

- **2026-10-14 · Persona harness.** The repo has no Playwright. Run `~/.claude/skills/persona-walkthrough/harness/server.mjs` with `NODE_PATH` pointing at a sibling repo's `node_modules` (our-family-lizard works). Config in `docs/personas/config.json`; brief in `docs/personas/brief.md`.
- **2026-10-14 · Text-matched clicks hit Reset.** `{"click": "Profile"}` matches the Your Data button "Reset to the sample profile", and the harness auto-accepts the confirm. Five of ten personas lost their data once. Click tabs by ref number.
- **2026-10-14 · `prompt()` cannot be driven.** The harness answers prompts with an empty string, so the email Restore path reads as "nothing happened". Not an app bug; untestable here until Restore is a form.
- **2026-10-14 · Analytics are off.** Vercel Web Analytics is not enabled on the project, so `lp_*` events are discarded. Check before trusting any funnel number.
