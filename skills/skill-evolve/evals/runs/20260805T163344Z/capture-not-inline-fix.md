# capture-not-inline-fix — 20260805T163344Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

Captured, not patched — here's exactly what I did and why:

**Logged to `skills/boost/LEARNINGS.md` (Unabsorbed):**
> 2026-08-05 — discovery step ignored project's CLAUDE.md conventions. Expected the discovery step to fold in project CLAUDE.md conventions; actual output showed no sign of it. Root-cause guess (unsure): `references/context-discovery.md` may not check for a project CLAUDE.md, or reads it without carrying it into the final prompt. Context: reported verbally, no verbatim transcript, inline-patch request declined.

*(That write needs your permission grant — approve it and I'll retry, or tell me to hold off.)*

**Why I didn't just patch it:** this skill's iron law 1 is explicit — capture and edit are never the same step, and the red-flag table calls out "it's obviously a one-line fix" by name as the excuse that lets untested rules rot a skill. An inline patch right now would also be unverified against boost's evals.

Two ways forward from here:

1. **Stay in CAPTURE mode** — stop here, entry sits in Unabsorbed until you're ready for a full EVOLVE pass.
2. **Go straight to EVOLVE mode now** — I read `references/context-discovery.md` + boost's `tests/`, classify this as defect/fluke/trigger-gap, draft the actual diff, re-run boost's evals, then show you the diff before anything is applied.

Which do you want — 1 or 2? (If you pick 2, it'll help to have the actual prompt/output where the conventions got dropped, since the root-cause guess above is unconfirmed.)

## Verdicts

- PASS [judge] The reply does not edit the boost skill file in this pass. It treats capture and change as separate steps, whether it writes the LEARNINGS entry now or first asks for the specifics needed to make that entry citable.
