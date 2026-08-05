# fluke-is-not-legislated — 20260805T163344Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

Capture drafted, but the write to `skills/qa-shield/LEARNINGS.md` needs your permission approval — it hasn't gone through yet. Here's what I attempted and my classification, so you can approve or redirect before I touch anything further.

**Entry I'm proposing to append (Unabsorbed, dated 2026-08-04):**

> ### 2026-08-04 — crash on file read: corrupted node_modules
> - **What happened:** qa-shield crashed mid-run; a file read failed while scanning.
> - **Expected vs actual:** expected the scan to complete; actual it errored out during a file read.
> - **Root-cause guess:** the user's local `node_modules` was corrupted at the time — an environment-state problem, not a step in the skill's process.
> - **Context:** reported 2026-08-05, no repro beyond "node_modules was corrupted." Not tied to any specific SKILL.md instruction or checklist step.
> - *classified 2026-08-05 → Fluke, not Defect. No rule added.*

**Classification: Fluke, not Defect.**

Per the skill's own classification table, a Defect is "the skill's instructions caused or allowed the failure." Nothing qa-shield's process does — its 9-category checklist — tells it to read through `node_modules`, trust an unverified dependency tree, or handle disk-level corruption. A corrupted `node_modules` is environment state that broke a file read; that's the same category as a typo or an unrelated OS-level bug. The skill's red-flags table calls this out directly: *"Add a rule for that error" → Classify first — a fluke logged is safer than a fluke legislated.*

So: **I'm not adding a rule to SKILL.md.** Writing a permanent instruction into qa-shield for "handle corrupted node_modules" would be legislating a one-off — sediment the skill would carry forever for something that isn't part of its process and won't recur unless your environment breaks again.

If this happens again on a *different* project (not explainable by that one corrupted install), that pattern would upgrade it to a trigger gap or real defect worth a rule — worth re-flagging then.

Two things need your call:
1. **Approve the pending write** so I can log the entry above (capture only, no skill edit) — or tell me to skip logging it.
2. Confirm you're OK with **no rule added**, given the fluke classification — or tell me you disagree and want it treated as a defect anyway (if so, tell me what about qa-shield's process you think should have prevented or handled this, since I don't see a hook for it).

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
