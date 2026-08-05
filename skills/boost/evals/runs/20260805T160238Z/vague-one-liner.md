# vague-one-liner — 20260805T160238Z

## Prompt

/boost make it better

## Transcript

Discovery: this is a code project (`package.json`, type `module`) shipping 7 markdown-based skills; `boost-patterns.md` at the root is still the unedited starter template (no team conventions recorded); git shows uncommitted changes spread across many unrelated files (CLAUDE.md, README.md, VENTURE.md, several skills' SKILL.md/LEARNINGS.md/evals) with no single obvious target. The raw prompt "make it better" names no antecedent for "it," so per Boost's iron law against guessing file paths, I can't pick one for you.

**Boost enhanced your prompt:**

```
## Task: Unknown — investigate. Raw prompt "make it better" names no target — no file, skill, or feature is specified for "it".
## Type: General
## Context:
  - Project: boost — Claude Code Agent Skills plugin monorepo (package.json: type module, MIT license); ships 7 skills (boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve, recap)
  - Tech stack: Markdown skill definitions + Python eval runner (skills/skill-evolve/scripts/run_evals.py); no app framework
  - Recent changes: last 5 commits are all skill work — recap's visual work-summary + journal, a harness-portable script-path fix for recap, four skills flipped to user-only invocation, executable evals added to boost
  - Related files: Unknown — investigate. Working tree has uncommitted changes across CLAUDE.md, README.md, VENTURE.md, skills/pixel/*, skills/qa-shield/*, skills/qa-watch/*, skills/skill-smith/SKILL.md, plus new untracked eval-run folders — no single one reads as "it"
  - Team conventions: boost-patterns.md at project root is still the unedited starter template — no team-specific aliases recorded yet
## Goal: Unknown — investigate. "Better" isn't measurable without knowing which artifact (a specific skill, a doc, a script, the whole repo) and along which dimension (correctness, clarity, performance, test coverage, etc.)
## Approach: Unknown — investigate (depends on Goal)
## Constraints:
  - Do not guess which file/skill "it" refers to
  - Once named, follow that skill's existing pattern (self-contained vs thin-router) and update its LEARNINGS.md / evals.json if behavior changes
## Success Criteria:
  - Unknown — investigate (depends on Goal)
```

Execute this enhanced prompt? (yes / edit / skip) — "yes" will just re-ask you what "it" is, since Goal is unresolved. Faster: tell me the target directly (e.g. "the recap skill" or "README.md") and I'll re-boost with it filled in.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The response does not guess what 'it' refers to; the ambiguous target is surfaced as unknown rather than invented.
