# Quality evals — boost

## RED baseline (observed failures without the skill)

Recorded from the flow contract when the executable evals were written (commit
`9fb9742`, "RED from flow contract"). Each is a failure the skill's own promises exist to
prevent.

1. **Invented specifics.** Given a rough debug prompt, an unenhanced attempt names file
   paths, function names and root causes the user never mentioned.
   → answered by `references/red-flags.md` iron law 6 ("NEVER guess file paths") and the
   "Unknown — investigate" marker required by `references/flow.md` Step 5.

2. **Dropped the Present header.** The enhanced prompt was emitted without the exact
   `**Boost enhanced your prompt:**` line, so downstream tooling and the user lost the
   signal that enhancement happened. Observed 2026-07-12 at 15/16 asserts.
   → answered by `references/flow.md` Step 6, which now restates the header as a literal
   string and says the `**` markers are content to copy verbatim (commit `7d97bff`,
   15/16 → 16/16).

3. **Invented constraints.** An unenhanced attempt adds restrictions the project never
   stated, on the reasoning that more constraints are safer.
   → answered by iron law 7 ("NEVER add constraints the user didn't imply") and the
   red-flags row "I should add more constraints to be safe".

## Grading rubric

A good enhanced prompt **must**:
- open with the literal line `**Boost enhanced your prompt:**`, bold markers included
- fill every template field, using `Unknown — investigate` where a value is not known
- name the detected Type and a one-line Task
- carry constraints traceable to project conventions or task-type defaults
- state measurable success criteria

A good enhanced prompt **must never**:
- invent file paths, module names, function names or root causes
- add constraints the user did not imply
- merge two distinct tasks into one enhanced prompt (offer to boost them separately)
- be re-announced when execution begins (flow Step 8)
- restructure a prompt that is already well-structured (passthrough, flow Step 2)

## Verification status

| Check | Method | Result |
|---|---|---|
| Executable evals | `python3 skills/skill-evolve/scripts/run_evals.py skills/boost` | 16/16 asserts |
| Iteration history | `evals/eval-log.md` | 1 RUN-mode iteration, kept |

Executable `evals/evals.json` is the source of truth; this file records why each assert
exists and what failure it descends from.
