# Quality evals — skill-smith

## RED baseline (observed failures without this skill — from the 2026-07-06 research, `docs/research/2026-07-06-skill-creation-research.md`)
1. Official skill-creator plugin forces a full eval lab (2×N subagent runs, benchmark stats, browser review app) on every skill — no short exit for a 40-line helper → answered by Step 2's tiers (T1 exists precisely for this).
2. skill-forge imposes ONE fixed shape (4–8 laws, mandatory diagrams/tables) on every skill regardless of size → answered by Step 4's mechanical-but-scaling structure rules + Step 2 tiering.
3. write-a-skill never verifies the skill works at all → answered by Step 6 (every tier verifies something; T1's floor is one adversarial walkthrough).
4. Community-wide: descriptions written as process summaries make skills never fire → answered by iron law 1 + Step 5's 8-point lint.
5. Skills can't learn from their mistakes; the same error repeats forever → answered by law 5 + Step 7 (LEARNINGS.md + footer wired at birth).

## Grading rubric — a good skill-smith run produces
- A tier stated and confirmed by the user BEFORE drafting.
- A description that passes all 8 lint checks (spot-check: single line, "Use when", no process words).
- Generated skill ≤100 lines single-file, or references one level deep with TOCs.
- `LEARNINGS.md` + learning-capture footer present in the generated skill — automatic fail if missing.
- tests/eval-triggers.md contains the 3+2 prompts from the lint dry-run (T2+).
- A ship report naming: home, tier, what was verified, how it evolves.
- Never: secrets in the skill, broad allowed-tools "for flexibility", shipped without the user seeing the final draft.
