# eval-log — boost

RUN-mode iteration log (`/skill-evolve` Step 7). Baseline 2026-07-12: 15/16 asserts (rough-writing missed the Present header — model dropped the `**` bold markers).

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-07-12 | 15/16 → 16/16 | flow.md Present step: header restated as a literal string — `**` markers are content, copy verbatim | yes |
| 2 | 2026-08-05 | 16/16 → 15/16 | **no change made — judge variance.** `rough-writing` failed the "no un-implied constraints" assert on a run where boost's SKILL.md and `references/` were byte-identical to the 16/16 baseline (`git status` clean for both). The flagged constraint traced to a real project document that context discovery had read, which iron law 7 explicitly permits ("infer from project conventions"). Recorded, not chased | n/a |

**Standing note:** this assert is judge-graded and its wording ("constraints the user did
not imply") cannot distinguish an invented constraint from one correctly inherited from a
project convention. If it flaps again, rewrite it deterministically rather than editing
boost — the skill was not the thing that changed.

Also added this pass: `tests/eval-triggers.md` and `tests/eval-quality.md`, which the
skill had been shipping without.
