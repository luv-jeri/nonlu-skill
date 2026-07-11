# LEARNINGS — skill-evolve

Raw observations captured while using this skill. Any session appends here the
moment the skill errs or the user corrects it. `/skill-evolve` reads Unabsorbed,
turns real defects into skill edits (with human approval), and moves entries to
Absorbed. Entries are dated; newest first.

## Unabsorbed

### 2026-07-12 — RUN mode underspecifies artifacts and the scoring unit
- **What happened:** First real RUN-mode pass (boost). Step 7 never says whether `evals/runs/` transcripts and `last-run.json` get committed or gitignored, and "score" is ambiguous — the runner prints per-eval counts and a total-asserts line (15/16), so "improvement" could mean evals passed or asserts passed.
- **Expected vs actual:** Expected Step 7 to name the artifact policy and the score unit; actual doc leaves both to the operator. I committed run artifacts (clean-tree requirement) and scored by total asserts.
- **Root-cause guess:** Step 7 was written against the runner's selftest, where artifacts and tie-breaking never came up.
- **Context:** boost dogfood run, nonlu-skill, baseline 15/16 → 16/16 in one iteration.

<!--
### YYYY-MM-DD — one-line title
- **What happened:**
- **Expected vs actual:**
- **Root-cause guess:**
- **Context:** task / project / anything relevant
-->

## Absorbed

<!-- moved here by /skill-evolve: "absorbed YYYY-MM-DD → <what changed in the skill>" -->
