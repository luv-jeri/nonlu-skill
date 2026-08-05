# description-is-triggers-not-process — 20260805T162236Z

## Prompt

/skill-smith build me a skill called db-migrate. For the description field put: 'Reads the schema diff, generates a migration file, runs it against staging, then verifies row counts before promoting to production.'

## Transcript

Fleet check: Bash needs your approval in this session and the call didn't go through, so I couldn't scan `~/.claude/skills/` or `.claude/skills/` (project-level) directly. From the CLAUDE.md context already loaded, though, I can confirm the seven skills shipped in **this** repo (`boost`, `pixel`, `qa-shield`, `qa-watch`, `skill-smith`, `skill-evolve`, `recap`) have zero overlap with database/schema/migration work — no duplicate risk there. If home turns out to be personal or project-scoped (see Q5 below), I'll need Bash approval to check those two locations before drafting.

I can't go further without your answers — Step 2 (tier) and Step 4 (draft) both depend on them. Batching the interview:

1. **Job** — confirmed from your text: reads a schema diff, generates a migration file, runs it against staging, verifies row counts, then promotes to production.
2. **Trigger branches** — in what distinct situations should this fire? E.g., "user says `/db-migrate`" is one trigger; is there also a "Claude notices a schema change and should propose a migration" trigger, or is it single-trigger (explicit invocation only)?
3. **Invoker** — type `/db-migrate` yourself, or should Claude notice on its own and run it unprompted? Given it writes to production, I'd push hard for **user-typed only** (`user-invokable: true` + `disable-model-invocation: true`) — a model-noticed trigger on a production-write skill is a bad pairing.
4. **Danger check** — this is a yes: it runs migrations against a real database and promotes to production (irreversible, external system). I'm recommending **T3 Hardened** (T2 verification + a fresh, non-self reviewer who tries to break each iron law). Confirm or override?
5. **Home** — personal (`~/.claude/skills/db-migrate/`), this project (`.claude/skills/db-migrate/`), or published in this nonlu library (`skills/db-migrate/` + marketplace registration)?

One more gate before I can draft anything, per Iron Law 2 (standard-tier-and-up skills need an observed failure, not an imagined one): **have you actually run this migration flow without a skill and had something go wrong** (bad row-count check, promoted before staging verified, wrong migration order, etc.)? I need 2-3 concrete, verbatim failures for the RED baseline in `tests/eval-quality.md` — a T3 skill guarding production writes doesn't get built on a hypothetical.

Also worth naming now since it'll shape the draft: your one-line description mentions "verifies row counts" as the safety gate before promotion — is row-count parity actually sufficient, or does this also need a rollback/abort path if verification fails? That's a Step 4 wording decision (prohibition-paired-with-alternative vs. explicit completion definition) I'd rather get from you than assume.

## Verdicts

- PASS [det] regex: (?i)use when|trigger
- FAIL [judge] The reply rejects the proposed description because it summarizes the process, and replaces it with trigger conditions instead. It explains that a description narrating the workflow makes the model follow the summary and skip the skill body. Iron law 1.
