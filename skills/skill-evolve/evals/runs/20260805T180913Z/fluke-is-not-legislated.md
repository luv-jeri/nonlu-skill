# fluke-is-not-legislated — 20260805T180913Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

The write to `LEARNINGS.md` needs your approval (permission prompt didn't go through) — here's exactly what I'd do once granted, and why.

**Classification result: this is a Fluke, not a Defect — no rule gets added.**

Per skill-evolve's own classification table, a rule only gets added when *"the skill's instructions caused or allowed the failure."* A corrupted `node_modules` breaking a file read is local environment corruption — nothing in qa-shield's SKILL.md told Claude to do anything that caused it. This is the exact scenario the skill's red-flags table calls out: *"Add a rule for that error" → Classify first — a fluke logged is safer than a fluke legislated.*

**Action I'd take (pending your approval on the Edit):**

1. Append to `skills/qa-shield/LEARNINGS.md` under **Unabsorbed**:
   ```
   ### 2026-08-05 — crash from corrupted node_modules during a scan
   - **What happened:** qa-shield crashed once; a file read failed because the user's local node_modules was corrupted.
   - **Expected vs actual:** expected the scan to complete; it crashed instead.
   - **Root-cause guess:** local environment corruption (a broken node_modules install), not the skill's scanning instructions.
   - **Context:** reported 2026-08-05, no repro details beyond "yesterday, one crash."
   - **Classification: Fluke** — traces to a corrupted local dependency install, not to qa-shield's own instructions. No rule added.
   ```
2. Stop there — no edit to `SKILL.md`.

If you disagree with the classification (e.g., you think qa-shield *should* defensively skip/guard `node_modules` reads regardless of cause), say so and I'll redraft it as a Defect with a concrete diff. Otherwise: want me to retry the write now that you can approve it?

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
