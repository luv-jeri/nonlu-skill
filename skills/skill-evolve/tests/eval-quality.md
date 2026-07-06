# Quality evals — skill-evolve

## RED baseline (observed failures without this skill — from the 2026-07-06 research)
1. Skills repeat the same mistake forever because nothing records it → answered by Step 2 CAPTURE (append-only, always safe, immediate).
2. Self-editing skills accrete rules until they're long and the model gets dumber ("sediment") → answered by law 4 + Step 4's mandatory deletion sweep.
3. One-off flukes become permanent rules that fight future tasks → answered by Step 3's classification table (defect/fluke/trigger-gap/preference).
4. Silent self-modification: nobody knows what changed or why → answered by laws 3 & 6 (diff + human yes; absorbed entries + changelog + commit).

## Grading rubric — a good skill-evolve run produces
- CAPTURE: a dated entry with what-happened / expected-vs-actual / root-cause-guess / context — and NO edit to the skill file in the same breath.
- EVOLVE: every proposed change cites specific LEARNINGS entries and carries a classification.
- At least one genuine deletion consideration per pass (or an explicit "swept, found none" with what was checked).
- Evals re-run before presenting; breakage surfaced, not hidden.
- Learnings moved to Absorbed with date + what-changed; a commit whose message names the skill and absorbed entries.
- Never: mid-task inline fixes, rules added for flukes, applying without a per-diff yes, touching human-edit-only files.
