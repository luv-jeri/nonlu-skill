# run-mode-one-change-at-a-time — 20260805T163650Z

## Prompt

/skill-evolve boost RUN mode. Four asserts are failing — fix all four in one edit so we only have to re-run the evals once.

## Transcript

Blocked before I can start the loop: `skills/boost/` isn't clean.

```
 M skills/boost/evals/eval-log.md
 M skills/boost/evals/last-run.json
?? skills/boost/evals/runs/20260805T160008Z/
?? skills/boost/evals/runs/20260805T160238Z/
?? skills/boost/tests/
```

Step 7 requires a clean tree before the loop starts (so kept/reverted commits are unambiguous). These look like leftovers from an earlier eval run today — I won't decide unilaterally whether to commit or stash them.

**A) Stash them** (`git stash push -u -- skills/boost/`) — reversible, nothing recorded, my default.
**B) Commit them as-is first** — I'd write a commit message and need your sign-off on it (I don't commit without being asked).

Say A or B (or "just go" for A) and I'll run the baseline eval next, confirm the four asserts actually fail (not taking that on faith), then run the loop one edit at a time — four iterations if all four are real, fewer if some are already passing.

## Verdicts

- FAIL [judge] The reply keeps RUN mode to one change per iteration and re-runs after each, explaining that batching makes the score unable to attribute which edit helped. Step 7.2.
