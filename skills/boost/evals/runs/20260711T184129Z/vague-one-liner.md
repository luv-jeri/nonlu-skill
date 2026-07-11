# vague-one-liner — 20260711T184129Z

## Prompt

/boost make it better

## Transcript

Boost checked the prompt against the passthrough criteria (0 of 7 met — no headers, constraints, named artifacts, length, lists, named entities, or evidence), so it runs the full enhancement flow. Domain hint: `package.json` exists at repo root → code-project templates apply. Keyword scan on "make it better" matches only **Feature** (via "make"); every other category scores 0. `boost-patterns.md` doesn't exist at the project root, so no team conventions to pull in.

The critical issue: the raw prompt names no target. "It" has no antecedent anywhere in this conversation — no file, skill, or draft was mentioned. Per the skill's iron laws, I can't guess what "it" is; unresolvable fields get marked "Unknown — investigate."

**Boost enhanced your prompt:**

```
## Task: Unknown — investigate. The raw prompt "make it better" does not name what "it" refers to — no file, skill, or draft was specified.
## Type: Feature (mechanical match on the word "make" — low confidence, since no other keyword or subject was present)
## Context:
  - Project: boost — Claude Code Agent Skills plugin (nonlu-skill repo), v1.1.0
  - Tech stack: no application code — markdown skill files + JSON metadata only; package.json exists for plugin/marketplace metadata (ships boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve)
  - Recent changes: branch `main`; last 5 commits — 9fb9742 "executable evals (RED from flow contract)", 71f7fb9 "executable runner + evolve RUN mode + smith craft templates", 395e926 "day-one review findings fix", 827d656 "passport: six skills grafted", 93ee1e5 "skill-smith + skill-evolve added"; untracked: skills/boost/evals/runs/
  - Related files: Unknown — investigate (nothing concrete named to resolve to a path)
  - Team conventions: boost-patterns.md not found at project root — none to pull from
## Requirements: Unknown — investigate. No feature, file, or artifact was named.
## Acceptance Criteria:
  - Unknown — investigate
## Edge Cases:
  - Unknown — investigate
## Integration Points: Unknown — investigate
## Constraints:
  - Follow this repo's skill conventions once a target is identified (self-contained vs. thin-router pattern match, LEARNINGS.md capture, description = triggers-only)
## Success Criteria:
  - Cannot be derived until the target of "it" is identified
```

Most fields can't be filled honestly — this prompt has no subject. Rather than guess, I need you to name what "it" is. If it's the recent evals work (`skills/boost/evals/`), say so and I'll re-run discovery against that. Otherwise: **execute this as-is (nothing to do) / edit (tell me what "it" is) / skip**?

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The response does not guess what 'it' refers to; the ambiguous target is surfaced as unknown rather than invented.
