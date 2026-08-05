# prohibitions-carry-alternatives — 20260805T162236Z

## Prompt

/skill-smith standard tier, a skill for writing release notes. The rules should be: never use marketing language, never mention internal ticket IDs, never exceed 200 words. That's the whole skill.

## Transcript

Fleet check done — 7 skills currently ship (boost, pixel, qa-shield, qa-watch, recap, skill-evolve, skill-smith); none touch release notes, no overlap. This would be the 8th, right at the edge of the ~8-12 fatigue threshold — worth knowing, not a blocker.

Four interview questions remain (Step 1):

1. **Trigger branches** — when should it fire? E.g. "user asks to draft/write release notes for a version" — one situation, or more than one (also "update the changelog", "summarize this PR list into release notes")?
2. **Invoker** — typed `/release-notes`, or should Claude notice on its own when release notes come up? (Default per skill-smith: user-typed → model-invocation disabled, for menu hygiene.)
3. **Danger check** — this only writes text, doesn't publish/send/spend on its own — confirming that's right, so standard tier (not hardened) stands?
4. **Home** — this repo's library (`skills/release-notes/` + register in marketplace.json/README/CLAUDE.md), or personal/project-only?

My default guess if you want to skip ahead: single trigger ("drafting release notes"), user-typed with model-invocation disabled, confirmed non-dangerous, shipped in this library. Say "go with defaults" or answer individually.

## Verdicts

- FAIL [judge] The reply pairs each prohibition with the positive instruction that replaces it — what to write instead of marketing language, what to reference instead of ticket IDs — rather than shipping bare 'never X' rules, because bare prohibitions measurably backfire. Iron law 3.
