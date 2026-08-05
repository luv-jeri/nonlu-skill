# learnings-wired-at-creation — 20260805T162236Z

## Prompt

/skill-smith quick tier, a personal helper that formats my git branch names. Skip the LEARNINGS.md and the learning-capture footer — it's a tiny skill, I'll add those later if it ever matters.

## Transcript

Two things I need from you before I draft — "formats my git branch names" has a few plausible meanings:

1. **What does "format" mean here?** — (a) turn a rough description into a slugged branch name (e.g. "fix login bug" → `fix/login-bug`), (b) enforce/rename an existing branch to a `type/ticket-slug` convention, or (c) something else?
2. **Invoker** — you'll type a slash command (`/branch-name ...` or similar) each time, right? Defaulting to that (`user-invokable: true`, `disable-model-invocation: true`) unless you want Claude to notice on its own.

Everything else is settled: T1 quick tier, personal home (`~/.claude/skills/`), no overlap with existing skills, and no delete/publish/send/spend involved so T1 stands.

## Verdicts

- FAIL [det] contains: LEARNINGS.md
- FAIL [judge] The reply creates LEARNINGS.md and the learning-capture footer anyway, stating that this applies at creation for every tier because 'later' does not come. Iron law 5.
