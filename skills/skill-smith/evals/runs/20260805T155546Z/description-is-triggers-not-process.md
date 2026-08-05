# description-is-triggers-not-process — 20260805T155546Z

## Prompt

/skill-smith build me a skill called db-migrate. For the description field put: 'Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production.'

## Transcript

Using skill-smith to build the `db-migrate` skill.

**Todo checklist for this build:** interview → tier → fleet check → draft → lint description → verify (per tier) → wire evolution → register → ship report.

## Step 1 — Interview

Before drafting anything, two things from your message need to stop me:

**The description you gave violates Iron Law 1.** "Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production" is a *process summary* — it lists workflow steps, not trigger conditions. Iron Law 1 is explicit: if the description narrates the workflow, the model reads the summary and skips the body, and this is a documented, tested failure. I can't ship this description as-is; I'll rewrite it as trigger conditions ("Use when the user asks to generate/run a DB migration...") once I know the actual triggers from Q2 below.

**This skill touches production and is likely irreversible.** Promoting a migration to production is exactly the kind of operation Step 1 Q4 flags. My read: this is heading to **Hardened (T3)**, not Quick or Standard — but I need your answers to confirm, not guess.

Batched questions (please answer all 5):

1. **Job** — confirmed from your description: diff schema → generate migration file → run against staging → verify row counts → promote to production. Anything missing (e.g., rollback path, approval gate before promotion)?
2. **Trigger branches** — in which distinct situations should this fire? E.g.: "user says /db-migrate", "user asks to generate a migration for a schema change", "user asks to promote a staging migration to prod" — are these one skill or does promotion deserve its own trigger/gate?
3. **Invoker** — typed `/db-migrate` only, or should Claude notice on its own mid-conversation? Given the production-promote step, I'd default to user-typed + `disable-model-invocation: true` unless you argue otherwise — a skill that can autonomously notice "let's promote to prod" is a bad idea.
4. **Danger check** — confirming: this deletes/alters production data and promotes without... does anything currently sit between "verifies row counts" and "promotes to production"? A human approval gate, or does the skill promote automatically if counts match?
5. **Home** — personal, project-local, or published in this nonlu library (`skills/<name>/` + marketplace registration)?

One more gate before I can draft, per Iron Law 2 (no T2+ skill without an observed failure): **has this migration workflow actually failed for you without a skill** — a real incident (bad migration shipped, row-count drift missed, wrong env targeted)? I need 2-3 verbatim specifics for the RED baseline in `tests/eval-quality.md`. Building a hardened, production-touching skill from imagined failure modes isn't something I'll do — real evidence only.

I'll hold here — no files created yet — until you answer these.

## Verdicts

- PASS [det] regex: (?i)use when|trigger
- PASS [judge] The reply rejects the proposed description because it summarizes the process, and replaces it with trigger conditions instead. It explains that a description narrating the workflow makes the model follow the summary and skip the skill body. Iron law 1.
