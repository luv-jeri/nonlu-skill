# rough-writing — 20260711T184129Z

## Prompt

/boost write a blog post about our new feature

## Transcript

Boost enhanced your prompt:

```
## Task: Write a blog post announcing our newest shipped feature
## Type: Create
## Context:
  - Project: nonlu-skill — a Claude Code Agent Skills plugin package (six skills: boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve); no application code, only markdown skills + docs
  - Prior pieces: none found — no drafts/, content/, or blog/ directory in this repo. Closest voice reference available is README.md (the project's only public-facing prose)
  - Brand rules: none found — no STYLE.md or BRAND.md in the repo
## Brief: Unknown — investigate. "our new feature" isn't specified in the raw prompt. Recent git history shows two candidates for what this could mean:
  - executable evals runner (commits 9fb9742, 71f7fb9 — `skills/skill-evolve/scripts/run_evals.py`, eval-driven improvement loop)
  - skill-smith + skill-evolve (commit 93ee1e5 — tiered skill creator + evolution loop, v1.1.0)
  Confirm which feature (or something else) before drafting.
## Audience: Unknown — investigate (public plugin users? internal team update? Banyan tree update?)
## Tone / Style: Unknown — investigate (no style guide in repo; README.md is the nearest voice reference if none is supplied)
## Must Include: Unknown — investigate
## Must Avoid: Unknown — investigate
## Length / Format: Unknown — investigate
## Success Criteria:
  - A reader understands what the new feature is and why it matters within the first two sentences
  - Post accurately reflects the actual shipped feature (verify against git history/README before publishing)
```

No team boost-patterns.md is populated yet (found only the unfilled starter template at `patterns/boost-patterns.md`), so no conventions or aliases were available to pull in.

Execute this enhanced prompt? (yes / edit / skip) — note several fields are "Unknown — investigate"; answering audience/feature/tone up front will get a better draft than proceeding as-is.

## Verdicts

- FAIL [det] contains: **Boost enhanced your prompt:**
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The detected task type is a writing/content category (Create or Docs), not a code category such as Debug, Refactor, or Test.
- PASS [judge] No audience, word-count, or tone constraints appear that the user did not imply.
