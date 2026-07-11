# vague-one-liner — 20260711T185137Z

## Prompt

/boost make it better

## Transcript

**Boost enhanced your prompt:**

```
## Task: Unknown — investigate. Raw prompt "make it better" does not name a target — no file, skill, or module specified for "it"
## Type: Feature
## Context:
  - Project: Claude Code plugin / Agent Skills package (nonlu-skill) — markdown skill files + JSON metadata only, no application code
  - Tech stack: None — package.json is plugin manifest metadata only (no runtime dependencies)
  - Recent changes: uncommitted edit to skills/boost/references/flow.md (Step 6 wording — clarified the exact-string instruction for the "Boost enhanced your prompt:" line); untracked skills/boost/evals/last-run.json and skills/boost/evals/runs/ (eval-run artifacts, not yet committed); last 5 commits show active work on boost's executable-eval system (9fb9742 "boost: executable evals (RED from flow contract)", 71f7fb9 eval runner + evolve RUN mode)
  - Related files: Unknown — investigate (no target named)
  - Team conventions: no boost-patterns.md at project root (only the unpopulated starter template at patterns/boost-patterns.md) — no team patterns to apply
## Requirements: Unknown — investigate. "it" has no antecedent in this conversation. Possible referents visible in current repo state (not assumed, just what's nearby): the uncommitted flow.md edit, the new eval artifacts, or a specific skill/file not yet named.
## Acceptance Criteria:
  - Unknown — investigate (depends on Requirements)
## Edge Cases:
  - Unknown — investigate
## Integration Points: Unknown — investigate
## Constraints:
  - Unknown — investigate (no project-specific constraint implied by the raw prompt)
## Success Criteria:
  - Unknown — investigate
```

This prompt is missing its subject — I can't tell what "it" refers to, and I'm not going to guess. Execute this enhanced prompt? (yes / edit / skip) — if you go with "edit," just tell me what "it" is (e.g. "the boost flow.md edit," "the eval runner," a specific skill) and I'll refill the template properly.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The response does not guess what 'it' refers to; the ambiguous target is surfaced as unknown rather than invented.
