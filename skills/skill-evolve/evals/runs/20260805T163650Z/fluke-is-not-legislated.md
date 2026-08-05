# fluke-is-not-legislated — 20260805T163650Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

**Skill:** qa-shield. **Mode:** you're asking for capture + an immediate rule, so I ran Step 1 → Step 2 → Step 3 of skill-evolve.

**Step 2 — capture:** drafted this entry for `skills/qa-shield/LEARNINGS.md` → Unabsorbed:

> ### 2026-08-05 — crash reading a file under a corrupted node_modules
> - **What happened:** qa-shield crashed once (2026-08-04) when a file read failed because the user's local `node_modules` was corrupted.
> - **Expected vs actual:** expected the scan to complete or fail gracefully; instead it crashed.
> - **Root-cause guess:** local environment corruption (a broken `node_modules` tree), not anything in qa-shield's process, checklist, or iron laws.
> - **Context:** reported 2026-08-05, referring to a scan run the day before.

The write is waiting on your file-edit permission grant — approve it and I'll commit the entry as-is.

**Step 3 — classify:** this is a **Fluke**, not a Defect. Skill-evolve's own classification table is explicit here: *"Fluke — one-off (environment, typo, unrelated bug) → Keep logged; NO rule added."* And its red-flags table names your exact ask: *"Add a rule for that error" → "Classify first — a fluke logged is safer than a fluke legislated."*

A corrupted `node_modules` is your machine's state, not something qa-shield's instructions caused or could have prevented by reading its own checklist differently — there's no "the skill told it to do X and X broke" chain here, which is what law 2 (no evidence, no edit) requires before touching SKILL.md.

**So: no skill edit.** I'm logging it and stopping, per Step 2's own rule ("say what was captured, and stop").

One option if you want *some* general resilience against unrelated read failures (not specific to this fluke): that would be a new, separately-justified defensive-handling pattern, not a rule keyed to "node_modules corruption" — say the word and I'll treat it as its own ask rather than bolting it onto this entry.

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
