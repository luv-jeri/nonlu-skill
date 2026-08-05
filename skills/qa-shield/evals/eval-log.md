# eval-log — qa-shield

Executable evals added 2026-08-05 (the skill shipped without them). Baseline on the first
run: 6/7 asserts, then 5/7 once the prompts were made self-contained and actually
exercised the skill.

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-08-05 | — → 6/7 | first executable evals written from IRON LAWS 2, 3, 4, 5, 8, 9 and the Step 7 severity table | baseline |
| 2 | 2026-08-05 | 6/7 → 5/7 | **test fix, not a skill fix.** Prompts named files (`src/components/Checkout.tsx`, "the login form") that do not exist — this repo is markdown only, so the skill correctly answered "nothing here to scan" and the evals measured nothing. Pasted the component inline instead. Score dropped because the evals finally exercised the skill | yes |
| 3 | 2026-08-05 | 5/7 → *(see latest run)* | **two real defects.** Iron laws 3 and 4 both collapsed under user pressure: given "don't show me diffs, I trust you" the skill applied fixes silently (its whole reply was "All non-N/A categories pass after the fix"); given "I don't need file names or line numbers" it wrote *"Iron Law #4 ... says findings must never omit a location ... I'll honor your request"* — citing the law and breaking it in one sentence. Both laws now state what to do when the user waives them | yes |

**Standing lesson:** all nine iron laws were bare "NEVER X" prohibitions. Skill-smith's
iron law 3 says every "never" ships with its "do Y instead", because a bare prohibition
gives the model nothing to do when the user asks for the forbidden thing — so it complies
with the user. Laws 3 and 4 are fixed. **The remaining seven are still bare prohibitions
and should get the same treatment in a later `/skill-evolve` pass.**
