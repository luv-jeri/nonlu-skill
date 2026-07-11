# rough-debug — 20260711T184129Z

## Prompt

/boost login is broken after yesterday's deploy, fix it

## Transcript

Passthrough check: the raw prompt is a single unstructured sentence — no type, context, or success criteria — so it needs full enhancement.

Detection: domain hint is **code project** (`package.json` present), keyword scan matches **Debug** ("broken", "fix"). Context discovery turned up something important: this repository (`nonlu-skill`) is a Claude Code skills/documentation package — per its own `CLAUDE.md`, "No application code — only markdown skill files, JSON metadata, and documentation." There is no login page, auth module, or deploy pipeline anywhere in it, and the last 10 commits are all skill/eval work (nothing about a deploy or login). `boost-patterns.md` doesn't exist yet, so no team aliases to resolve.

That's a project mismatch, not a fit failure — the Debug category is still correct, but I can't invent file paths for code that doesn't exist here, so those fields are flagged rather than guessed.

**Boost enhanced your prompt:**

```
## Task: Fix login crash/failure introduced by yesterday's deploy
## Type: Debug
## Context:
  - Project: nonlu-skill — a Claude Code Agent Skills package (markdown skill files + JSON metadata only, no application code)
  - Tech stack: N/A — no frameworks/dependencies in package.json beyond plugin metadata
  - Recent changes: last 10 commits are all skill/eval work (evals runner, skill-evolve RUN mode, skill-smith templates); none reference a "deploy" or "login" feature
  - Related files: Unknown — investigate. No login-related file or module exists in this repository.
  - Team conventions: boost-patterns.md not found — no aliases to resolve
## Symptoms: "login is broken after yesterday's deploy" (user's exact words)
## Expected Behavior: Login succeeds
## Actual Behavior: Login fails/errors (exact failure mode not described)
## Investigation Starting Points:
  - Unknown — investigate. This repo has no login feature to inspect; the bug likely belongs to a different project/repo than the current working directory
  - If a different repo is intended, confirm which one before investigating
  - If this repo is intended, ask the user what "login" refers to (there is none in the current codebase)
## Constraints:
  - Do not modify unrelated code
  - Maintain existing test coverage
## Success Criteria:
  - The described login failure no longer occurs
  - All existing tests pass
  - Root cause is identified and fixed (not just symptoms)
```

Execute this enhanced prompt? (yes / edit / skip) — heads up, before you answer: this repo has no login system, so "yes" will just have me ask you which repo you meant. If you meant a different project, tell me which one (or `cd` there) and I'll re-run boost there instead.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The enhanced prompt does not invent specific file paths, function names, or root causes the user never mentioned; missing specifics are marked Unknown — investigate.
