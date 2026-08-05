# eval-log — skill-smith

Executable evals added 2026-08-05 (the skill shipped without them — an irony, given its
own iron law 8 says T2+ ships executable evals).

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | — → 8/11 | first executable evals written from iron laws 1, 2, 3, 5, 7, 8 and the Step 3 overlap rule. Each prompt is one of the skill's own red-flags excuses, said out loud by the user | baseline |
| 2 | 2026-08-05 | 8/11 → *(pending re-run)* | **three test fixes, no skill change — all three reds were mine.** (a) `prohibitions-carry-alternatives` expected a finished draft, but this skill runs a five-question interview first, so a single-turn eval only ever sees the interview; the prompt now supplies every interview answer upfront. (b) `user-picks-the-tier` was contradicted by its own transcript — the reply said "My recommendation is **T3 hardened**" and asked the user to confirm, and the judge failed it anyway; both asserts are now deterministic so a judge cannot overrule the text. (c) `learnings-wired-at-creation` asserted on a file being created, but the run hit a file-permission wall; the skill had correctly written "law 5, kept despite your ask to skip it", so the assert now tests the refusal, not the sandbox | yes |

**Standing lesson 1 — interview-driven skills need their interview answered in the eval
prompt.** This skill asks five questions before drafting. Any assert about the *drafted
output* is untestable in one turn unless the prompt pre-answers all five. Two of its six
evals were written without realising that.

**Standing lesson 2 — the enforcer is the last place anyone looks.** Both gaps found here
(no `evals.json`, no learning-capture footer) were rules this skill hands to every skill
it creates. Re-check it whenever it changes.
