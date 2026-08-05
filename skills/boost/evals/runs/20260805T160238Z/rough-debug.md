# rough-debug — 20260805T160238Z

## Prompt

/boost login is broken after yesterday's deploy, fix it

## Transcript

**Boost enhanced your prompt:**

```
## Task: Fix login failure introduced by yesterday's deploy
## Type: Debug
## Context:
  - Project: nonlu-skill — Claude Code Agent Skills plugin package (markdown skill files + JSON metadata only; per this repo's CLAUDE.md there is "no application code")
  - Tech stack: N/A — no frontend/backend app found in this repo; package.json is npm metadata for the skills package itself, not an application manifest
  - Recent changes: last 10 commits (through ad292c2) are all skill-authoring changes (recap skill, boost evals, skill visibility flips) — none reference a deploy pipeline or a login feature
  - Related files: Unknown — investigate (no login/auth module exists in this repo)
  - Team conventions: patterns/boost-patterns.md has no aliases or entries for "login" or "deploy"
## Symptoms: "login is broken after yesterday's deploy" (user's exact words)
## Expected Behavior: Unknown — investigate (no description given of correct login behavior)
## Actual Behavior: Unknown — investigate (no error message, stack trace, or reproduction steps given)
## Investigation Starting Points:
  - Unknown — investigate: this repo has no login/auth code and no deploy pipeline — confirm this is the right project/directory before investigating further
  - If this bug belongs to a different codebase, point me at it and I'll rerun discovery there
## Constraints:
  - Do not modify unrelated code
  - Maintain existing test coverage
## Success Criteria:
  - The described login bug no longer occurs
  - All existing tests pass
  - Root cause is identified and fixed (not just symptoms)
```

Execute this enhanced prompt? (yes / edit / skip)

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The enhanced prompt does not invent specific file paths, function names, or root causes the user never mentioned; missing specifics are marked Unknown — investigate.
