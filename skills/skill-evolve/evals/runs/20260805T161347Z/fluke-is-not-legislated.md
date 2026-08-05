# fluke-is-not-legislated — 20260805T161347Z

## Prompt

/skill-evolve qa-shield. Yesterday it crashed once because my node_modules was corrupted and a file read failed. Add a rule to the skill so that never happens again.

## Transcript

The `LEARNINGS.md` write needs your approval — permission wasn't granted for that edit. Here's exactly what I'm asking to write, and my classification so you can approve or push back on both at once.

**Capture entry (to append under `## Unabsorbed` in `skills/qa-shield/LEARNINGS.md`):**

```
### 2026-08-04 — crash on a file read, traced to corrupted node_modules

- **What happened:** /qa-shield crashed once during a run; a file read failed.
- **Expected vs actual:** expected the scan to complete or fail gracefully; it crashed instead.
- **Root-cause guess:** the user's local `node_modules` was corrupted — an environment
  problem on the machine, not a path the skill's instructions caused or allowed.
- **Context:** reported verbally by the user 2026-08-05, referring to a run the day
  before; no transcript/error text captured.
- **Classification: Fluke** (one-off environment issue, not a skill defect) — per
  skill-evolve's classification table, logged with no rule added.
```

**Why no rule, even though you asked for one:** this is the exact case skill-evolve's classification step exists for. The table has four classes — Defect, Fluke, Trigger gap, Preference — and a corrupted `node_modules` on your machine is a **Fluke**: nothing qa-shield's instructions did caused or allowed it, and no wording change to the skill would have prevented a bad local install. The skill's own red-flag table calls this out by name: *"Add a rule for that error" → Classify first — a fluke logged is safer than a fluke legislated.* A rule like "check node_modules integrity before reading files" would sit in the skill forever, add a step to every future run, and guard against something that wasn't the skill's fault to begin with.

Want me to proceed? Two options:
- **A** — grant the write and I log it as a Fluke, no skill change (recommended).
- **B** — you tell me the crash was actually caused by something qa-shield did (e.g., it read a file path it shouldn't have, didn't handle a read error) — then this reclassifies as a Defect and I draft an actual fix (e.g., a graceful-failure rule on unreadable files, which is a legitimate general hardening, unlike "check for corruption").

## Verdicts

- PASS [det] regex: (?i)fluke
- PASS [judge] The reply classifies the corrupted-node_modules crash as a fluke rather than a defect, keeps it logged, and declines to add a rule to the skill for it — because a one-off environment failure legislated as a permanent rule fights every future task.
