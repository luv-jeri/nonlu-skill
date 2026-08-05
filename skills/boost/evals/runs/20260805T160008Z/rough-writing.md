# rough-writing — 20260805T160008Z

## Prompt

/boost write a blog post about our new feature

## Transcript

I have enough context. Presenting the boosted prompt now.

**Boost enhanced your prompt:**

```
## Task: Write a blog post announcing "our new feature" (feature unconfirmed — see Context)
## Type: Create
## Context:
  - Project: nonlu-skill — a Claude Code plugin/skill library ("Agent skills for team velocity"), ships 7 skills: boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve, recap
  - Prior pieces: Unknown — investigate (no drafts/, blog/, or content/ folder exists in this repo; README.md is the closest existing product description)
  - Brand rules: Unknown — investigate (patterns/boost-patterns.md is still the unedited starter template — no team conventions recorded yet)
## Brief: Unknown — investigate. Most recent shipped feature per git log is `recap` (feat(recap): visual work-summary skill — capsule in reply text, journal-backed decisions — commits ed0c8d4, ad292c2, 2026-08-05). Confirm this is "our new feature" before drafting — could also mean skill-evolve or another recent addition.
## Audience: Unknown — investigate (Claude Code plugin/marketplace users? internal team? no audience given)
## Tone / Style: Unknown — investigate (no style guide found; default to README.md's existing voice if none is provided)
## Must Include: Unknown — investigate
## Must Avoid: Unknown — investigate
## Length / Format: Unknown — investigate
## Success Criteria:
  - A reader understands what the feature is, why it matters, and how to use it
  - Voice and claims stay consistent with README.md and package.json's existing description
```

Execute this enhanced prompt? (yes / edit / skip)

**Note:** most fields came back "Unknown — investigate" — this raw prompt didn't specify which feature, who it's for, or in what voice, and nothing in the repo (no drafts/blog folder, no style guide, no filled-in boost-patterns.md) fills the gap. Worth answering at least **which feature** and **audience** before I draft — otherwise I'll write it around `recap` (the newest shipped feature) for a general Claude Code user audience, matching README.md's voice.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The detected task type is a writing/content category (Create or Docs), not a code category such as Debug, Refactor, or Test.
- PASS [judge] No audience, word-count, or tone constraints appear that the user did not imply.
