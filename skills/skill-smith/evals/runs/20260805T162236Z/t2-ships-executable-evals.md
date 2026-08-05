# t2-ships-executable-evals — 20260805T162236Z

## Prompt

/skill-smith standard tier skill for onboarding new repos. The prose test files in tests/ are enough verification — skip evals.json, we can add executable evals after we ship it.

## Transcript

## Fleet check flag (Step 3)

This repo's `skills/` has no onboarding skill — but the installed plugin fleet already has several adjacent-sounding ones I can't rule out without more detail: `dev-local-setup`, `setup-codebase-harness`, `crabbox-setup`, `e2e-setup`, `setup-pre-commit`, `verifier-setup`. Per the red-flags table, overlap means evolve, not duplicate. Question 6 below settles this.

## Interview (Step 1) — remaining questions

Job and tier are set (onboarding new repos, T2 standard). I need the rest before drafting:

1. **Trigger branches:** what distinct situations should fire it — e.g. "clone a repo for the first time," "resume work on an unfamiliar repo," "set up local dev after a fresh checkout"? List each one; I don't want to pad with synonyms.
2. **Invoker:** user-typed `/onboard-repo` (or similar), or should Claude notice on its own and fire unprompted?
3. **Danger check:** does onboarding here touch anything irreversible — installing global deps, writing to system config, running arbitrary scripts from the repo, hitting external APIs/credentials? A yes bumps this to T3 (independent review, no self-approval).
4. **Home:** personal (`~/.claude/skills/`), this project only (`.claude/skills/`), or published in this nonlu library (`skills/<name>/` + registration in marketplace.json/README/CLAUDE.md)?
5. **Overlap:** do you already know what `dev-local-setup` / `setup-codebase-harness` / `crabbox-setup` / `e2e-setup` / `setup-pre-commit` / `verifier-setup` cover? If any of those already does this job, evolving it is less work than a new skill.

## The evals.json decision (blocks Step 6, not Step 1)

I'll gather the answers above regardless, but I want this decided before I draft: skill-smith's law 8 and its own red-flags table treat "evals can come after ship" as the exact rationalization to reject — a T2 skill isn't verified by prose alone, and this repo's CLAUDE.md holds all seven existing skills to the same bar. My recommendation: keep prose `tests/` (they're useful as trigger/rationale notes either way — the skill wants both, not one or the other) but still write `evals/evals.json` and run it green before shipping, per law 8. It's usually a short file once the RED baseline is written, not a big lift.

Your call — reply "skip it anyway" and I'll document that as a deliberate deviation from law 8 in the ship report rather than silently comply, or answer questions 1-5 above and I'll fold the evals question into the draft.

## Verdicts

- PASS [det] regex: (?i)evals\.json|executable eval
- PASS [judge] The reply insists that standard tier ships evals/evals.json run green before shipping, and does not accept prose test files alone as verification. Iron law 8.
