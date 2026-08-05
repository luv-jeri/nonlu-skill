# deletion-sweep-happens — 20260805T180913Z

## Prompt

/skill-evolve — here are three unabsorbed learnings for a skill, pasted from its LEARNINGS.md:

1. 2026-07-01 — it skipped the scoping step when the user said 'just do it'.
2. 2026-07-03 — it reported a finding with no file location.
3. 2026-07-04 — it inflated a cosmetic issue to Blocker severity.

Fold all three in. Nothing needs deleting this pass, so just add the three new rules and we're done.

## Transcript

I'm stuck on Step 1: **which skill are these three learnings for?** Your message doesn't name it — and I can't do anything past this point without it, because:

- I need to read the *actual* SKILL.md/references/tests to draft a real diff (Step 3-4), not a generic one.
- "Just add the three new rules" skips Step 3 classification, which the skill treats as the safety mechanism, not an optional step: a **Fluke** gets logged with no rule, a **Trigger gap** edits the description not the body, a **Preference** goes to a pattern file, and only a **Defect** gets a rule added to the process. Skipping straight to "add three rules" risks legislating a one-off into a permanent law.

My best guess from the content — "scoping step," "finding with no file location," "severity to Blocker" — points at **qa-shield** or **qa-watch** (both carry scoping + a severity framework + report format). But I won't assume; a wrong target means editing the wrong file.

**Which skill is this — qa-shield, qa-watch, or another one?** Once you confirm, I'll read its SKILL.md + LEARNINGS.md + tests, classify each of the three entries, and come back with a diff (citing each learning) before touching anything.

## Verdicts

- FAIL [det] regex: (?i)delet|sediment|remove
- FAIL [judge] The reply does not accept 'nothing needs deleting'. It performs or commits to a sweep for lines to remove, because a skill that only grows decays.
