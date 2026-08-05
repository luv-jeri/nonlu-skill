# eval-log — recap

Build-time iteration log. Baseline 2026-08-05: 14/17 asserts on first run.

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | 14/17 → 16/17 | `never-routes-through-stdout` prompt described no work at all, so the model correctly stayed silent per Law 3 while the assert demanded a capsule — eval defect, not skill defect; prompt rewritten to describe real work | yes |
| 2 | 2026-08-05 | 16/17 → 16/17 | strengthened the silence instruction inside Step 3 | no — model still announced "No recap — that was just a question" |
| 3 | 2026-08-05 | 16/17 → 17/17 | promoted the same rule to Iron law 3 with its positive alternative ("reply as though this skill did not exist") | yes — mid-body rules lose to the model's urge to explain; laws hold |
| 4 | 2026-08-05 | 17/17 → 17/18 | added a no-preamble assert; it went RED, correctly catching narration the suite had been blind to | yes (RED on purpose) |
| 5 | 2026-08-05 | 17/18 → 18/18 | made no-preamble structural in Step 4 ("your closing section starts with the `━━━` line; nothing goes above it") | yes |
| 6 | 2026-08-05 | 18/18 → 20/21 | eval prompts made tool-faithful (harness has no tools, so the model wrote out commands it could not run) + deterministic `not_contains: recap.py` guard | yes — narration eliminated |
| 7 | 2026-08-05 | 20/21 → 21/22 | replaced the ambiguous glyph judge assert with two regex asserts | yes |
| 8 | 2026-08-05 | 21/22 → **22/22** | replaced the no-preamble judge assert with `regex (?s)^.{0,200}📋 RECAP` after the judge passed a reply with five lines of narration and then failed a reply with none | yes |

**Stability:** 22/22 on three consecutive runs after change 8.
**Verification tiers:** 18 of 22 asserts deterministic, 4 judge-graded.
**Measured cost:** mean 192 tokens per generated recap (tiktoken, cl100k_base, four samples).

**Standing lesson:** two of the eight iterations were fixing the *test*, not the skill, and
one was fixing a judge that graded the same rule wrongly in both directions. Read the
transcript before changing the skill — a red assert is not automatically a skill defect,
and a green one is not automatically proof.
