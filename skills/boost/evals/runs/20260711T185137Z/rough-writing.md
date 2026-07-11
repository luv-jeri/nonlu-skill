# rough-writing — 20260711T185137Z

## Prompt

/boost write a blog post about our new feature

## Transcript

I ran the boost process: stripped the trigger (`/boost`, not `/boost!` → confirmation required, not fast-track), checked passthrough (0/7 criteria met — not structured, full enhancement needed), detected category **Create** (keywords "write"/"post", no ties), and discovered context from `package.json`, `git log`, and `patterns/boost-patterns.md`.

Two things came out of discovery that matter: there's no blog/drafts content or style guide anywhere in this repo, and "our new feature" doesn't resolve to one specific thing — multiple features shipped or landed recently. Per the skill's rules I can't guess which one, so I've marked it for you to confirm rather than picking for you.

**Boost enhanced your prompt:**

```
## Task: Write a blog post announcing a new feature of the nonlu-skill Claude Code plugin (which feature is unspecified — see Brief)
## Type: Create
## Context:
  - Project: `nonlu-skill` — npm package `boost` v1.1.0, a Claude Code plugin shipping 6 Agent Skills (boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve); MIT licensed, repo github.com/luv-jeri/nonlu-skill
  - Prior pieces: no blog/drafts folder exists in this repo; README.md (repo root) is the closest existing description of features and could anchor facts/tone
  - Brand rules: none found — patterns/boost-patterns.md exists but is still the unedited generic starter template (Next.js/Prisma examples), not applicable to this markdown-only skill package
## Brief: Unknown — investigate. "Our new feature" is ambiguous; candidates from recent repo history:
  - Executable evals for skills (most recent commit 9fb9742 "boost: executable evals (RED from flow contract)"; uncommitted work in progress in skills/boost/evals/)
  - skill-evolve RUN mode + executable eval runner (commit 71f7fb9)
  - The skill-smith / skill-evolve pair itself — tiered skill creator + evolution loop (commit 93ee1e5, called out in package.json's description)
  Confirm which one before drafting.
## Audience: Unknown — investigate (not stated; likely Claude Code plugin users/developers based on README framing, but unconfirmed)
## Tone / Style: Unknown — investigate (no STYLE.md or prior blog content found to anchor voice)
## Must Include: Unknown — investigate
## Must Avoid: Unknown — investigate
## Length / Format: Unknown — investigate (blog post assumed; publish target — README section, GitHub Discussions, dev.to, etc. — not stated)
## Success Criteria:
  - Reader understands what the new feature does and why it matters within the first paragraph
  - Every claim about the feature is verified against the actual skill files/code, not invented
```

Execute this enhanced prompt? (yes / edit / skip)

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The detected task type is a writing/content category (Create or Docs), not a code category such as Debug, Refactor, or Test.
- PASS [judge] No audience, word-count, or tone constraints appear that the user did not imply.
