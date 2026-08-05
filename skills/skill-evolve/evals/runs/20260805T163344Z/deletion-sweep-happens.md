# deletion-sweep-happens — 20260805T163344Z

## Prompt

/skill-evolve — here are three unabsorbed learnings for a skill, pasted from its LEARNINGS.md:

1. 2026-07-01 — it skipped the scoping step when the user said 'just do it'.
2. 2026-07-03 — it reported a finding with no file location.
3. 2026-07-04 — it inflated a cosmetic issue to Blocker severity.

Fold all three in. Nothing needs deleting this pass, so just add the three new rules and we're done.

## Transcript

I checked the repo before assuming: both `qa-shield` and `qa-watch` have a scoping step in their process, an identical severity framework (qa-watch's SKILL.md literally says "Same as `/qa-shield`" for severity), and the same "file:line — NEVER omit" rule for findings. That means all three of your pasted learnings — scoping skipped, missing file location, severity inflation — fit either skill equally well. I don't have enough to tell which `LEARNINGS.md` they came from without guessing, and Step 1 of skill-evolve requires identifying the target skill before I read its `SKILL.md`/`LEARNINGS.md`/`tests/` or draft any diff.

Which skill are these three entries for — `qa-shield`, `qa-watch`, or something else? Once you confirm, I'll:

1. Read that skill's `SKILL.md`, `LEARNINGS.md` (Unabsorbed section), and `tests/`.
2. Classify each of the three entries (Defect / Fluke / Trigger gap / Preference) — on the text alone they read as three separate Defects (skipped scoping step, missing location field, severity misclassification), but I'll confirm against the actual current SKILL.md wording rather than assume.
3. Draft the minimal diff for each, run the sediment sweep even though you said nothing needs deleting (law 4 says check every pass regardless), and re-verify via `python3 skills/skill-evolve/scripts/run_evals.py <skill-dir>` if that skill has `evals/evals.json`.
4. Show you the diff with cited evidence before touching the file.

## Verdicts

- PASS [det] regex: (?i)delet|sediment|remove
- PASS [judge] The reply does not accept 'nothing needs deleting'. It performs or commits to a sweep for lines to remove, because a skill that only grows decays.
