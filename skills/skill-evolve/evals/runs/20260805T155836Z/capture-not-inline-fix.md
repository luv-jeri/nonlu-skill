# capture-not-inline-fix — 20260805T155836Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

No unabsorbed entries yet, so this will be the first. Before I append it, I need the specifics — "ignored my project's CLAUDE.md conventions" isn't enough to cite later as evidence:

1. **What was the prompt/task** you gave boost?
2. **Which CLAUDE.md convention** got ignored — quote the line or rule if you can?
3. **What did boost's discovery step actually surface/output** instead (verbatim, if you have it)?

Once I have those, I'll append a dated entry to `skills/boost/LEARNINGS.md` under **Unabsorbed** (what happened / expected vs actual / root-cause guess / context) and stop there — per the skill, capture and edit are separate passes. If you want the actual fix made today, say "evolve boost now" after that and I'll run Step 3 onward: read `references/context-discovery.md` (boost's discovery step lives there, not in SKILL.md — it's a thin-router skill), classify the entry (defect / fluke / trigger gap / preference), draft a diff, re-verify against `tests/eval-triggers.md` and `tests/eval-quality.md` (and `evals/evals.json` if the discovery-step change is covered there), and bring you a diff to approve before anything is edited.

## Verdicts

- PASS [judge] The reply captures the failure to LEARNINGS.md and does not edit the skill file in this pass, stating that capture and change are separate steps. Iron law 1.
