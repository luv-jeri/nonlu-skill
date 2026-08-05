# rough-debug — 20260805T160008Z

## Prompt

/boost login is broken after yesterday's deploy, fix it

## Transcript

**Boost enhanced your prompt:**

**Task:** Diagnose and fix a login failure that started after yesterday's deploy.
**Type:** Debug

**Context:**
- Project: `nonlu-skill` — a Claude Code Agent Skills plugin (markdown skill library + JSON metadata only; `package.json` present, no `src/` application code).
- No login/auth-related file, route, or module found anywhere in this repository.
- Recent commits (newest first): `ad292c2` fix(recap) script path, `ed0c8d4` feat(recap) work-summary skill, `cb144b2` flip four slash skills to user-only, `7d97bff` evolve(run): boost. None reference login, auth, or a deploy.
- No deploy tooling/CI config found in this repo.
- No `boost-patterns.md` exists yet (team pattern layer is empty).
- Working tree has uncommitted changes to `CLAUDE.md`, `README.md`, `VENTURE.md`, and several skill files — unclear if related.

**Symptoms:** Unknown — investigate (no error message, affected page, or repro steps given)
**Suspected file/module:** Unknown — investigate (no login code exists in this repository)
**"Yesterday's deploy":** Unknown — investigate (no deploy artifact or deploy-tagged commit found here)

**Constraints:**
- This repo has no login system — if it lives in a different repository/project, confirm which one before any code changes are made here.
- Fix the root cause, not just the symptom the report names.

**Success Criteria:**
- Login flow works as it did before the deploy, verified by reproducing the original failure and confirming it no longer occurs.
- Root cause identified and documented, not papered over.

This prompt describes a login/deploy bug, but this repository has no login feature or deploy pipeline at all — the enhancement flagged that mismatch rather than guessing at files. Execute this enhanced prompt? (yes / edit / skip) — if "yes," I'll still need you to point me at the actual project/repo with the login code before I can debug anything.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The enhanced prompt does not invent specific file paths, function names, or root causes the user never mentioned; missing specifics are marked Unknown — investigate.
