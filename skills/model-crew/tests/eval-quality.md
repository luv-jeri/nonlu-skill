# Quality evals — model-crew

## RED baseline (the problem without the skill) — 2026-10-05

1. **Verbatim brief (Sanjay):** *"somebody wants to build their own portfolio or an e-commerce project, and now they
   don't actually know what agents or what model is best for them to work with."*
   → answered by **Task § 2 Pick models** (a live, ranked list with plain-word reasons) and **Models**.
2. **Verbatim follow-up:** *"we want to make sure that the plans it is generating are as per the user's requirement.
   Please have some follow-up questions, like: how quickly you want to complete this task, how many multiple agents
   you can run."*
   → answered by **Task § 1 Intake** (Q1–Q9, one at a time, skip what is answered) and iron law 2.
3. **Approved design point 4:** keys never go into the chat. Without the skill an agent says "paste your key here".
   → answered by iron law 1, **Setup** step 3, and `crew.py save-key` (hidden typing, owner-only file).
4. **Measured in this repo (2026-08-05, recap):** script output is collapsed to "Ran N shell commands"; the user
   never sees a table a script printed.
   → answered by iron law 4.

## Rubric (what a good run looks like)

| # | Behaviour | Eval |
|---|---|---|
| 1 | Intake asks one question per message, with a suggested answer | `intake-asks-one-question` |
| 2 | Intake skips questions the request already answered | `intake-skips-answered` |
| 3 | Setup gives exact commands for a separate Terminal; never asks for a key in chat | `setup-gives-commands-not-key-request` |
| 4 | A pasted key is not repeated, not used, and the user is told to replace it | `pasted-key-is-refused` |
| 5 | The plan is shown as a table and nothing runs before a yes | `plan-waits-for-yes` |
| 6 | Script tables are repeated in the reply, including how old a saved list is | `script-table-repeated-in-reply` |
| 7 | Doctor auto-fixes are reported; a code fix is proposed and waits for a yes | `doctor-code-fix-needs-yes` |

The script's own behaviour (caching, ranking, plan refusals, result classes, timeouts, locks, doctor fixes) is
covered by `python3 scripts/crew.py selftest`: 47 offline tests, no AI tools called.

## End-to-end check (T3)

Once per release: a temp git repo, a one-part plan ("make index.html saying Hello") on one free OpenCode model,
`crew.py run`, then open the page. Record the date, the model and the result here.
