# description-is-triggers-not-process — 20260805T181637Z

## Prompt

/skill-smith build me a skill called db-migrate. For the description field put: 'Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production.'

## Transcript

Two things before I draft anything:

**1. The description you gave can't ship as written.** It's a process summary ("reads the schema diff, generates a migration file, runs it against staging, then verifies row counts") — iron law 1 and lint item 6 both rule that out. A process-summary description gets followed instead of the skill body and gets skipped instead of matched. I need trigger conditions instead: the situations that should make Claude reach for this skill, not the steps it then performs.

**2. Danger check trips hard here.** This skill runs migrations against staging and promotes to production — an irreversible, production-touching operation by definition. That's an automatic **Hardened (T3)** recommendation, which means: an observed failure required before I draft anything (iron law 2), executable evals, and a fresh independent reviewer who re-runs the lint/evals themselves and attempts a loophole per iron law — I can't self-approve this one.

To do the interview properly (batched):

1. **Job** — one sentence, no steps: what should this skill do?
2. **Trigger branches** — list the distinct situations where it should fire (e.g., "user asks to write a migration for a schema change," "user asks to promote a migration to prod"). Each becomes one trigger line in the description.
3. **Invoker** — will you type `/db-migrate`, or should Claude notice on its own and fire it unprompted?
4. **Observed failure** — since this is landing at T3, I need a real case where this went wrong *without* the skill (a migration that skipped a staging check, a row-count mismatch that shipped, etc.) — paste it in, don't summarize from memory (per this repo's own eval-writing rule, real specifics only).
5. **Home** — personal (`~/.claude/skills/db-migrate/`), this project only (`.claude/skills/`), or published in this repo's skill library (`skills/db-migrate/` + registration in marketplace.json/package.json/README/CLAUDE.md)?

I won't draft SKILL.md until I have 1, 2, 3, 5, and the observed failure for 4 — a T3 skill with no observed failure and no independent reviewer lined up isn't safe to ship, and law 7 means you approve the final draft, not me.

## Verdicts

- PASS [det] regex: (?i)use when|trigger
- PASS [judge] The reply rejects the proposed description because it summarizes the process, and replaces it with trigger conditions instead. It explains that a description narrating the workflow makes the model follow the summary and skip the skill body. Iron law 1.
