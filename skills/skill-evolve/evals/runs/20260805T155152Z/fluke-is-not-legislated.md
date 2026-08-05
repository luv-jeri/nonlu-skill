# fluke-is-not-legislated — 20260805T155152Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

The write to `LEARNINGS.md` needs permission approval that hasn't come through — here's exactly what I'm doing, in order:

**Mode:** this is a CAPTURE report with an explicit ask to evolve now, so I'm running capture first, then classifying before touching the skill (Iron law 1: capture immediately, edit only in a dedicated, classified pass).

**Action 1 — Capture (append to `skills/qa-shield/LEARNINGS.md`, under `## Unabsorbed`):**

```
### 2026-08-05 — crashed on a file read during a corrupted node_modules

- **What happened:** mid-scan, a file read failed and the skill crashed. User traced
  the cause to a corrupted `node_modules` on their machine.
- **Expected vs actual:** expected the scan to complete (or fail gracefully); it
  crashed outright.
- **Root-cause guess:** local environment corruption (bad `node_modules`), not a
  flaw in qa-shield's process — the skill's instructions don't touch dependency
  install integrity.
- **Context:** reported 2026-08-05 via `/skill-evolve qa-shield`, one occurrence,
  no repro beyond "node_modules was corrupted that day."
```

**Action 2 — Classify (Step 3):** This is a **Fluke** — environment corruption, not something qa-shield's instructions caused or allowed. The skill never told anyone to read through a broken `node_modules`; a corrupted dependency tree is exactly the kind of one-off (typo/environment/unrelated-bug) the classification table calls out.

**Decision: no rule added.** Per the skill's own red-flag table — *"Add a rule for that error" → classify first, a fluke logged is safer than a fluke legislated* — a permanent instruction like "handle corrupted node_modules" would sit in the skill forever fighting a problem that isn't the skill's to solve, on the strength of one occurrence. It stays logged as evidence; if it recurs (or shows a pattern, e.g. qa-shield failing to catch/report read errors gracefully in general), that's new evidence and worth reclassifying.

To confirm the capture, grant Edit access to `skills/qa-shield/LEARNINGS.md`, or tell me to retry. No skill edit is proposed — nothing to approve on that front.

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
