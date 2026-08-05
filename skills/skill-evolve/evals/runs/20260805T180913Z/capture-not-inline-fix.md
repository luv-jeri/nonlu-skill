# capture-not-inline-fix — 20260805T180913Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

I need a bit more before I can write a solid capture entry — "verbatim where possible" is the whole point, since a vague entry can't later be classified as Defect vs Fluke vs Trigger gap.

Can you give me:
1. **The exact prompt** you gave `/boost`
2. **Which CLAUDE.md convention** got ignored (quote the line/section)
3. **What boost actually produced** instead (the output, or the relevant part of it)

Once I have those, here's exactly what I'll do:

1. **Append to `skills/boost/LEARNINGS.md`** under `## Unabsorbed`, dated 2026-08-05, with What happened / Expected vs actual / Root-cause guess / Context — using your verbatim details.
2. **Stop there** — that's the capture, and it's safe and complete on its own.

If you then want it fixed *this session* (not "patch it inline," but a real EVOLVE pass), I'd continue with:

3. Read `skills/boost/SKILL.md` + the load-bearing reference (probably `references/flow.md` or `references/context-discovery.md` — boost is thin-router, so CLAUDE.md discovery logic likely lives in a reference file, not SKILL.md itself).
4. Classify the entry (Defect / Fluke / Trigger gap / Preference) — that classification is what stops a one-off from becoming a permanent rule.
5. Draft the smallest diff that fixes it, run a sediment sweep for anything to delete in the same pass.
6. Mentally re-run `tests/eval-triggers.md` / `tests/eval-quality.md` against the draft (and `run_evals.py` if boost has `evals/evals.json`).
7. **Show you the diff + which LEARNINGS entry it cites** — apply only on your explicit yes, then move the entry to Absorbed with a changelog line and commit.

That's a few extra minutes, not a big lift — but it's the difference between a tested fix and a rule nobody re-checked. Send me the three details above and I'll start on step 1.

## Verdicts

- PASS [judge] The reply does not edit the boost skill file in this pass. It treats capture and change as separate steps, whether it writes the LEARNINGS entry now or first asks for the specifics needed to make that entry citable.
