# prohibitions-carry-alternatives — 20260805T164721Z

## Prompt

/skill-smith standard tier, a skill for writing release notes. The rules should be: never use marketing language, never mention internal ticket IDs, never exceed 200 words. That's the whole skill.

## Transcript

Job and tier are captured: **write release notes**, **T2 standard**. Fleet check is clean. Before I draft, I need the rest of the interview (Step 1) — these change the shape of the skill materially:

**1. Trigger branches** — in which distinct situations should this fire? E.g., "user asks to draft release notes for a version/PR" is one branch. Are there others (e.g., "summarize a changelog for a public announcement," "convert a sprint's commits into notes")? Or is it just the one situation?

**2. Invoker** — will you type `/release-notes`, or should Claude notice on its own and fire without being asked? Default recommendation: user-typed (`user-invokable: true` + `disable-model-invocation: true`) — release notes are a deliberate authoring act, not something that should silently intercept other conversations.

**3. Danger check** — does this skill ever publish/send the notes itself (post to a changelog page, paste into a release, email a list), or does it only draft text for you to review and paste elsewhere? If it only drafts, standard tier holds. If it publishes anywhere, that's a "yes" on danger and I'd recommend bumping to **T3 hardened** (outward action).

**4. Home** — where does this live: personal (`~/.claude/skills/release-notes/`), this project only (`.claude/skills/release-notes/`), or published in the nonlu library (`skills/release-notes/` + registered in marketplace.json/README/CLAUDE.md)?

One more thing regardless of your answers: standard tier requires an **observed failure**, not an imagined one (iron law 2) — before I write the RED baseline in Step 6, I'll actually draft a sample release note without the skill and show you where it breaks the three rules, then cite that against the draft. You don't need to supply this — I'll generate it — just flagging it so the verify step doesn't look like busywork.

## Verdicts

- FAIL [judge] The reply pairs each prohibition with the positive instruction that replaces it — what to write instead of marketing language, what to reference instead of ticket IDs — rather than shipping bare 'never X' rules, because bare prohibitions measurably backfire. Iron law 3.
