# fluke-is-not-legislated — 20260805T155836Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

Using skill-evolve on qa-shield.

Quick transparency note: a prior session (checkpoint from earlier today) hit this same reasoning — "law 2, no evidence no edit" — on what looks like this exact scenario. I'm re-deriving it here rather than trusting the stale note, but it lines up.

**Todo checklist**
- [x] Identify skill + mode
- [x] Capture entry to LEARNINGS.md
- [x] Classify entry
- [ ] Draft diff — not reached
- [ ] Re-verify — not reached
- [ ] Present + apply — not reached
- [ ] Absorb + commit — not reached

**Step 1 — Identify skill + mode**
Skill: `qa-shield`. You reported a failure *and* asked for a rule — that's capture, then evolve-now, so I follow through to classification instead of stopping after capture.

**Step 2 — Capture**
Action: read `skills/qa-shield/LEARNINGS.md` to find the `## Unabsorbed` section.
Action: edit `skills/qa-shield/LEARNINGS.md`, inserting this entry at the top of `## Unabsorbed` (newest first):

```
### 2026-08-05 — Crash on corrupted node_modules
- **What happened:** qa-shield crashed once during a run; a file read failed.
- **Expected vs actual:** Expected the scan to complete; actual: read error aborted the run.
- **Root-cause guess:** Local `node_modules` was corrupted — environment state, not a qa-shield instruction issue.
- **Context:** Reported by user, 2026-08-05. One-off, not reproduced since.
```

**Step 3 — Classify**
This is a **Fluke** — corrupted `node_modules` is environment breakage, not something qa-shield's instructions caused or could reasonably have guarded against. Table says: keep it logged, add no rule. Red-flags table calls this out directly: *"Add a rule for that error" → "Classify first — a fluke logged is safer than a fluke legislated."*

**Result: no SKILL.md edit.** Iron law 2 (no evidence, no edit) blocks it too — one environmental crash isn't evidence the skill's process is broken. The entry stays in LEARNINGS.md as a logged fluke, unabsorbed, in case a second unrelated crash later turns this into a real pattern worth a rule.

If this becomes a repeat issue (not corrupted-`node_modules`-specific, but qa-shield failing ungracefully on *any* unreadable file), that's a different, defect-shaped report — happy to capture and classify that one separately if it happens.

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
