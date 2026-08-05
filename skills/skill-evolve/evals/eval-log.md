# eval-log — skill-evolve

Executable evals added 2026-08-05 (the skill shipped without them, despite owning the
RUN-mode loop that requires them of every other skill).

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | — → 5/8 | first executable evals written from iron laws 1, 2, 3, 4 and the Step 3 classification table. Each prompt is one of the skill's own red-flags excuses, said out loud by the user | baseline |
| 2 | 2026-08-05 | 5/8 → 6/8 | **test fixes, not skill fixes.** `capture-not-inline-fix` asserted the LEARNINGS append must happen immediately; the skill instead asked for the specifics needed to make the entry citable — defensible, and it did not touch the law being tested (no inline edit). `deletion-sweep-happens` claimed three unabsorbed learnings that do not exist here; the skill checked, found none, and refused to invent them — iron law 2 working correctly against a false premise in my prompt | yes |
| 3 | 2026-08-05 | 6/8 → *(pending re-run)* | **two more test fixes, same root flaw.** `diff-before-apply` and `run-mode-one-change-at-a-time` read live repo state, so their verdicts depended on what happened to be uncommitted at that moment: the first found qa-watch's LEARNINGS already absorbed (by this same session, minutes earlier) so there was genuinely no diff to show; the second correctly refused to start RUN mode because `skills/boost/` was dirty, which RUN mode forbids. Both prompts are now self-contained | yes |

**Standing lesson 1 — never point an eval at live state.** An eval prompt that references
a real path in this repo is not a test of the skill; it is a test of the working tree at
that instant. Four of this skill's six evals were contaminated this way on first write.
Paste the material into the prompt.

**Standing lesson 2 — the enforcer is the last place anyone looks.** This skill owns the
rule that every other skill ships executable evals, and had none itself until 2026-08-05.
Re-check it whenever it changes.
