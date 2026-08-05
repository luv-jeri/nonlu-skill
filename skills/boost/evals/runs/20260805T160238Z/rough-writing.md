# rough-writing — 20260805T160238Z

## Prompt

/boost write a blog post about our new feature

## Transcript

**Boost enhanced your prompt:**

```
## Task: Write a blog post announcing recap — the newest skill shipped in the nonlu-skill plugin (assumption: "our new feature" = recap, the most recent feat commit; confirm before drafting)
## Type: Create
## Context:
  - Project: nonlu-skill — a Claude Code Agent Skills plugin (npm package "boost" v1.1.0, MIT, 7 skills total). No blog/content directory exists in the repo yet.
  - Feature in question: /recap, shipped 2026-08-05 (commit ed0c8d4). It closes a unit of work with a visual capsule (what was done, what architecture was touched, what decisions were made and why) rendered directly in the assistant's reply text — plus a journal-backed decision log. Built for users who dislike reading walls of text and want to *see* the summary, not read it.
  - Design rationale (from docs/superpowers/specs/2026-08-05-recap-skill-design.md): every prior candidate (script stdout, a TUI, a file written to disk) fails silently in at least one harness (Claude Code, Codex CLI, desktop app) — only the assistant's own reply text is reliably visible everywhere. That constraint drove the whole design.
  - Prior pieces: none found — no existing blog posts or content/ folder in this repo to match voice against.
  - Brand rules: none — patterns/boost-patterns.md at the project root is still the unfilled starter template (no team conventions recorded).
## Brief: Announce /recap: what it does, the problem it solves (no end-of-work summary today, output is a wall of text), and why the design lives in reply text rather than a script or file. Goal: drive awareness/trial of the newest skill in the plugin.
## Audience: Unknown — investigate (candidates: developers evaluating Claude Code plugins, existing users of the other 6 skills in this repo, or a general dev-tools/AI-agent audience — not specified)
## Tone / Style: Unknown — investigate (no STYLE.md/BRAND.md and no prior posts to match against)
## Must Include: Unknown — investigate (likely: what /recap does, the capsule format, how to invoke it, a link to the repo — not confirmed)
## Must Avoid: Unknown — investigate
## Length / Format: Unknown — investigate
## Success Criteria: Unknown — investigate (draft: a reader unfamiliar with the plugin understands what /recap does and how to try it within the first two lines)
```

Two things need your input before I draft: (1) confirm "our new feature" means `/recap` and not something else, (2) audience + tone — no style guide or prior posts exist in this repo to infer them from.

Execute this enhanced prompt? (yes / edit / skip)

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The detected task type is a writing/content category (Create or Docs), not a code category such as Debug, Refactor, or Test.
- FAIL [judge] No audience, word-count, or tone constraints appear that the user did not imply.
