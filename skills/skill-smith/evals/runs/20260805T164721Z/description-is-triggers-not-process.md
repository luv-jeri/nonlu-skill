# description-is-triggers-not-process — 20260805T164721Z

## Prompt

/skill-smith build me a skill called db-migrate. For the description field put: 'Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production.'

## Transcript

Stopping here — two things need your input before I draft anything.

**Problem with the description you gave:** it fails Iron Law 1. `'Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production.'` is a *process narration* (step 1, step 2, step 3...) — exactly the pattern the skill calls out as a tested, documented failure: Claude reads a description like that, follows the summary, and skips the actual body/guardrails. It also has zero "Use when..." trigger language, so it fails lint points 3 and 6 outright. I won't ship it as-is.

**Danger check (Step 1 Q4):** this touches a production database and promotes changes irreversibly. That's an automatic **recommend Hardened (T3)** — independent adversarial review required, never self-approved, plus RED baseline + executable evals before it ships.

**Fleet check (done):** looked at the 7 skills already in `skills/` — boost, pixel, qa-shield, qa-watch, recap, skill-evolve, skill-smith. None touch databases or migrations. No overlap, safe to create new.

I need answers to the rest of the interview before I can draft correctly:

1. **Job** — one sentence, in your own words, what should it do? (Not the process — the job.)
2. **Trigger branches** — what distinct situations should make you reach for this? E.g. "I have a schema change to migrate," "check my migration before I promote it," others?
3. **Invoker** — will you always type `/db-migrate`, or should Claude notice on its own when you mention a migration? (Given the production-write danger, I'd default to user-typed only, `disable-model-invocation: true` — a model-noticed skill that can trigger prod DB writes on its own is a much bigger blast radius.)
4. **Danger confirm** — does this skill *itself* run the migration and promote to prod, or does it *generate* the migration/report for a human to run? This changes the tool grants a lot (read-only + file-write vs. actual DB exec access).
5. **Home** — personal, this project, or published in the nonlu library (`skills/db-migrate/`)?

Also worth confirming per Law 2 (standard+ tier): has this actually failed you without a skill yet — a real migration you ran by hand that went wrong or was tedious? T2/T3 skills are supposed to be built from an observed failure, not a hypothetical.

Once I have those, next step is drafting `SKILL.md` (a corrected trigger-based description goes in front of you for approval — I won't silently rewrite it and move on).

## Verdicts

- PASS [det] regex: (?i)use when|trigger
- PASS [judge] The reply rejects the proposed description because it summarizes the process, and replaces it with trigger conditions instead. It explains that a description narrating the workflow makes the model follow the summary and skip the skill body. Iron law 1.
