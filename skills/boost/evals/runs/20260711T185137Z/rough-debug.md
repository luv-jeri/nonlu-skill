# rough-debug — 20260711T185137Z

## Prompt

/boost login is broken after yesterday's deploy, fix it

## Transcript

**Boost enhanced your prompt:**

```
## Task: Fix login failure reportedly introduced by "yesterday's deploy"
## Type: Debug
## Context:
  - Project: nonlu-skill — an Agent Skills / Claude Code plugin package. Per this repo's CLAUDE.md: "No application code — only markdown skill files, JSON metadata, and documentation."
  - Tech stack: package.json exists (plugin/marketplace metadata only — keywords, skill registration), no src/ dir, no application runtime, no deploy pipeline found in-repo
  - Recent changes: last 10 commits (9fb9742 back through 5883f36) are all boost-eval, skill-evolve, and skill-smith work — none reference a login feature, auth, or a deploy
  - Related files: Unknown — investigate. No file/dir matching "login" was found among the paths checked (README.md, CLAUDE.md, patterns/boost-patterns.md); a full repo-wide grep for "login" could not be completed (the command required approval that wasn't granted) — recommend re-running that search before starting
  - Team conventions: patterns/boost-patterns.md exists but is the unfilled starter template — no aliases, "deploy" shortcut, or conventions defined
## Symptoms: "login is broken" (user's exact words) — no login feature currently exists in this repository
## Expected Behavior: Unknown — investigate
## Actual Behavior: Unknown — investigate (no specific error, stack trace, or reproduction steps given)
## Investigation Starting Points:
  - Unknown — investigate: confirm this prompt targets the correct project. This repo (nonlu-skill) has no login page, auth module, or deploy pipeline — "yesterday's deploy" doesn't correspond to anything discoverable here
## Constraints:
  - None from project conventions (boost-patterns.md has no entries yet)
## Success Criteria:
  - Correct project/repo confirmed before further work
  - Once confirmed: root cause identified and fixed (not just symptom), per this repo's debugging convention
```

Flagging the mismatch directly: this venture is a skill-library repo with no application code, login feature, or deploy process — none of the discoverable context supports "login is broken after yesterday's deploy." Before I proceed, is this prompt meant for a different repo, or is there a login/deploy surface here I'm missing?

Execute this enhanced prompt? (yes / edit / skip)

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The enhanced prompt does not invent specific file paths, function names, or root causes the user never mentioned; missing specifics are marked Unknown — investigate.
