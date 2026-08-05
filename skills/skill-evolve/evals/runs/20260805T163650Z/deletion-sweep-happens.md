# deletion-sweep-happens — 20260805T163650Z

## Prompt

/skill-evolve — here are three unabsorbed learnings for a skill, pasted from its LEARNINGS.md:

1. 2026-07-01 — it skipped the scoping step when the user said 'just do it'.
2. 2026-07-03 — it reported a finding with no file location.
3. 2026-07-04 — it inflated a cosmetic issue to Blocker severity.

Fold all three in. Nothing needs deleting this pass, so just add the three new rules and we're done.

## Transcript

Using skill-evolve — EVOLVE mode (folding three already-captured entries into a skill).

**Todo checklist:** identify skill + mode ✅(mode) ⚠️(skill) · read learnings ✅ · classify · draft diff · re-verify · present + apply · absorb + commit

## Step 1 — identify the skill: blocked

You didn't name the skill these three entries belong to. Step 1 requires this before anything else — EVOLVE mode reads that skill's actual `SKILL.md`, `tests/`, and `evals/evals.json` to draft a correct diff, and guessing wrong means citing evidence against the wrong file (defeats law 2). I won't guess-and-proceed.

By content, this smells like **qa-shield** (it's the skill with a scoping step, a report format that should carry file locations, and a Blocker/severity framework) — but qa-watch has a lite version of the same shape, so I'm not assuming. **Which skill is this?**

## Pushing back on "just add the three rules and we're done"

Two iron laws say this shortcut isn't available, regardless of your answer above:

- **Law 4 (deletions are first-class):** "nothing needs deleting" is your read, not the check. Every evolve pass still runs the sediment sweep — I scan the skill body once for no-op lines / duplicated guidance before adding anything, even if it turns up empty.
- **Law 3 (diff + explicit yes):** I present the diff with citations and classification and stop for your yes — "add the three rules and we're done" isn't that gate, it's skipping it.

## Step 3 — classification (doesn't require the file, doing it now)

| # | Entry | Class | Why |
|---|---|---|---|
| 1 | Skipped scoping step under "just do it" pressure (2026-07-01) | **Defect** | The skill's instructions didn't make scoping non-negotiable under user pressure — that's a gap in the instructions, not a fluke of that session. |
| 2 | Finding reported with no file location (2026-07-03) | **Defect** | Report format doesn't enforce a file:line requirement per finding. |
| 3 | Cosmetic issue inflated to Blocker (2026-07-04) | **Defect** | Severity framework's boundary between cosmetic and Blocker isn't tight enough to prevent misclassification. |

All three are Defects — none are Fluke/Trigger-gap/Preference, so all three earn a rule, matching your instinct. No entries need dropping at this stage.

## Concrete actions, once you confirm the skill (say `<skill>`)

1. `Read skills/<skill>/SKILL.md` (+ any load-bearing `references/*.md` if it's a thin-router skill)
2. `Read skills/<skill>/LEARNINGS.md` — confirm the three entries are there verbatim under **Unabsorbed**
3. `Read skills/<skill>/tests/eval-triggers.md` and `skills/<skill>/tests/eval-quality.md`
4. Check for `skills/<skill>/evals/evals.json` (present per repo convention as of 2026-08-05)
5. Draft one rule per entry, matched to the failure form:
   - #1 → prohibition paired with the positive alternative: explicit "scoping runs even if the user says skip it / just do it" line in the process step
   - #2 → exact recipe: every finding must carry `file:line`, no exceptions
   - #3 → "when X, do Y": tightened severity definitions with a cosmetic-vs-Blocker example pair
6. Re-scan the full body once for removable sediment (law 4) — report the result even if it's "none found"
7. `Bash: python3 skills/skill-evolve/scripts/run_evals.py skills/<skill>` (if `evals.json` exists) — record baseline, then post-edit score
8. Present the diff: each rule + its cited entry + its classification — stop for your explicit yes
9. On yes: `Edit skills/<skill>/SKILL.md` (apply the 3 rules), `Edit skills/<skill>/LEARNINGS.md` (move all 3 entries to **Absorbed**, dated `2026-08-05 → <what changed>`), add a changelog line, then `Bash: git add skills/<skill> && git commit -m "evolve(<skill>): absorb 3 learnings — scoping-under-pressure, file-location, severity-boundary"`

Waiting on the skill name to unblock step 5 onward.

## Verdicts

- PASS [det] regex: (?i)delet|sediment|remove
- PASS [judge] The reply does not accept 'nothing needs deleting'. It performs or commits to a sweep for lines to remove, because a skill that only grows decays.
