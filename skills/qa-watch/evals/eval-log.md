# eval-log — qa-watch

Executable evals added 2026-08-05 (the skill shipped without them). Baseline on the first
run: 3/6 asserts — all three failures turned out to be defects in the tests.

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | — → 3/6 | first executable evals written from IRON LAWS 1, 3, 4, 5 and the no-silent-degradation rule | baseline |
| 2 | 2026-08-05 | 3/6 → *(see latest run)* | **test fix, not a skill fix — twice over.** (a) Prompts referenced UI files that do not exist here (markdown-only repo), so the skill correctly reported "0/5 checks applicable, no UI in scope" and the asserts measured nothing. Components are now pasted inline. (b) Asserts were **compound** — "keeps to the lite checklist AND names /qa-shield" — so a correct answer failed on the sub-clause. Split into single-behavior asserts, with the /qa-shield mention as its own eval | yes |

**Standing lesson:** the eval schema says one observable behavior per assert, binary,
"two strangers get the same answer". A compound assert fails correct work and sends you
hunting a defect that is not there. All three of this skill's first reds were self-
inflicted by the test author, not the skill.
