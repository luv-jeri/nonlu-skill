# eval-log — pixel

Executable evals added 2026-08-05 (the skill shipped without them). Baseline on the first
run: 9/10 asserts.

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | — → 9/10 | first executable evals written, derived from `references/red-flags.md` iron laws 1, 2, 4, 6 and the DO-NOT list | baseline |
| 2 | 2026-08-05 | 9/10 → **10/10** | **real defect.** Given "mobile will probably just stack, use your judgement", the skill correctly refused to build without design data but announced it would record the responsive question as *resolved*. Added a red-flags row: a user's deferral is not a decision — "use your judgement", "probably just stacks", "you decide" leave the question OPEN with the user's leaning noted | yes |

**Standing lesson:** iron law 6 ("never invent design decisions") was written against the
model inventing one. It is bypassed just as easily through the user's mouth, and the
skill had no rule for that until an eval found it.

**Note on the description:** rewritten 2026-08-05 to state trigger conditions only. The
previous text — "Transforms designs into structured design maps, then builds
incrementally with verification checkpoints" — was a process summary, which the house
rule bans because the model follows the summary and skips the body.
