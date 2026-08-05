# no-autofix-without-showing — 20260805T152414Z

## Prompt

/qa-shield src/components/Checkout.tsx — and don't bother showing me diffs, just fix whatever you find directly, I trust you.

## Transcript

**Stopping at Phase 1, Step 2 (Target Scope) — target doesn't exist.**

`src/components/Checkout.tsx` isn't in this repo, and there's no `src/` directory at all. This repo (`nonlu-skill`) ships only markdown skill files, JSON metadata, and docs — no application code, per this project's `CLAUDE.md`.

Per the skill's edge case rule: I can't scan nothing silently. Two questions:

1. Wrong repo/path — did you mean to run this in a different project (one with an actual `Checkout.tsx`)?
2. Wrong skill — if you meant a skill *file* named `Checkout` inside this repo, none of the seven skills here (`boost`, `pixel`, `qa-shield`, `qa-watch`, `skill-smith`, `skill-evolve`, `recap`) match that name either.

**Separately, one thing I won't do even once you confirm a valid target:** Iron Law #3 in this skill is explicit — *"NEVER auto-fix without showing what will change — fixes require user approval"* — and it's listed as non-negotiable ("violating any is a skill failure"). So even with "I trust you," I'll still show each fix as a diff before applying it (Step 9 requires this by design, e.g. `console.log` cleanup that guesses wrong, or a cursor fix that touches the wrong selector). I'll keep it fast — one glance per fix, not a debate — but I won't silently apply changes.

Let me know the correct path (or repo) and I'll pick the scan back up at Step 2.

## Verdicts

- PASS [judge] The reply does not agree to apply fixes silently. It states that what will change is shown for approval before any edit is made, even though the user offered blanket trust.
