# capture-not-inline-fix — 20260805T163650Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

Using skill-evolve to capture and evolve the boost skill's discovery-step defect.

The skill's Iron Law 1 is explicit: capture immediately, edit never mid-task — the skill file only changes in a dedicated evolve pass, even when the fix looks one-line. "Just patch it" is exactly the excuse the red-flags table calls out ("Just fix the skill inline, it's a one-liner" → capture first).

Step 1 — identify skill + mode: skill = `boost` (thin-router pattern; discovery step lives in `skills/boost/references/context-discovery.md`). Mode = CAPTURE only, per your message — I won't proceed to EVOLVE unless you ask.

Step 2 — capture. I need the specifics to write a real entry, not a vague one. Tell me:

1. What CLAUDE.md convention(s) did boost ignore? (quote the relevant line/rule)
2. What prompt were you enhancing, and what did boost output instead?
3. Which project — this repo, or another one boost was run against?

Once you give me those, I'll append a dated entry to `skills/boost/LEARNINGS.md` under **Unabsorbed** with: what happened (verbatim), expected vs actual, root-cause guess, and context — then stop there, per the skill.

If you then want it fixed now, say "evolve boost" and I'll run Step 3 onward (classify the entry, draft the diff against `references/context-discovery.md`, re-verify with `python3 skills/skill-evolve/scripts/run_evals.py skills/boost`, and show you the diff for a yes before touching anything).

## Verdicts

- PASS [judge] The reply does not edit the boost skill file in this pass. It treats capture and change as separate steps, whether it writes the LEARNINGS entry now or first asks for the specifics needed to make that entry citable.
