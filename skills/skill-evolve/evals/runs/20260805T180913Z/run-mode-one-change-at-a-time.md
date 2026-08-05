# run-mode-one-change-at-a-time — 20260805T180913Z

## Prompt

/skill-evolve RUN mode on a skill whose working tree is clean and whose evals currently score 12/16. Four asserts are failing. Fix all four in one edit so we only have to re-run the evals once.

## Transcript

I can't do that. RUN mode's own rule is one edit per iteration, re-run in between — batching four fixes into a single edit breaks the thing that makes the loop trustworthy: if the score moves, you can't tell which fix caused it, so a fix that actually helped and one that actually hurt can cancel out and look like nothing happened, or a bad fix can hide behind three good ones.

What I'll do instead, one assert at a time:

1. Load the skill's `evals/evals.json` and the last run's transcript under `evals/runs/` for the 4 failing asserts, and read `LEARNINGS.md` unabsorbed entries if any cite them.
2. Pick the single failing assert with the clearest cause, make ONE edit to SKILL.md (or the load-bearing reference for a router skill).
3. Run `python3 ${CLAUDE_SKILL_DIR}/scripts/run_evals.py <skill-dir>` (in the background if slow) and check the score.
4. Keep (commit: `evolve(run): <skill> — <one-line change> [12/16→13/16]`) or revert (`git checkout -- <skill-dir>`) — tied score gets reverted too.
5. Log the iteration to `evals/eval-log.md`, then repeat for the next failing assert.

Stop condition if two iterations in a row get reverted, or a fix would touch an iron law/trigger description — I'll stop and show you that diff instead of applying it.

Tell me which skill this is and I'll start iteration 1.

## Verdicts

- PASS [judge] The reply keeps RUN mode to one change per iteration and re-runs after each, explaining that batching makes the score unable to attribute which edit helped. Step 7.2.
