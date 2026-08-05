# LEARNINGS — recap

Raw observations captured while using this skill. Any session appends here the
moment the skill errs or the user corrects it. `/skill-evolve` reads Unabsorbed,
turns real defects into skill edits (with human approval), and moves entries to
Absorbed. Entries are dated; newest first.

## Unabsorbed

<!--
### YYYY-MM-DD — one-line title
- **What happened:**
- **Expected vs actual:**
- **Root-cause guess:**
- **Context:** task / project / anything relevant
-->

## Absorbed

### 2026-08-05 — the LLM judge was unreliable in both directions on one rule

- **What happened:** the "nothing precedes the capsule" assert was graded by the judge
  model. It PASSED a reply carrying five lines of command narration before the capsule,
  then on a later run FAILED a reply that opened directly with the `━━━` header and had
  no preamble at all.
- **Expected vs actual:** expected a stable verdict tracking the actual rule. Got a
  verdict uncorrelated with the output, in both directions.
- **Root-cause guess:** the rule is fully deterministic (how much text precedes a fixed
  marker) but was written as prose for a judge, which is the wrong verification tier.
- **Context:** caught during the skill's own build. Fixed by replacing it with
  `regex: (?s)^.{0,200}📋 RECAP` plus `not_contains: recap.py`. The suite went from 4
  judge-graded asserts to 18 deterministic of 22, and is now stable across 3 runs.
- *absorbed 2026-08-05 → deterministic asserts replaced two judge asserts in evals.json.*

### 2026-08-05 — the model narrated the skill's own mechanics before the capsule

- **What happened:** closing replies opened with "Following the recap skill exactly.
  Here are the actions it requires…" and a numbered list of `recap.py` commands, then
  the capsule.
- **Expected vs actual:** expected the reply to open with the capsule. Got a preamble
  that was itself the wall of text this skill exists to remove.
- **Root-cause guess:** "no preamble" sat mid-body inside a bulleted rules list. The same
  thing happened to the silence rule; instructions competing with the model's urge to
  show its work lose unless they are structural or promoted to an iron law.
- **Context:** fixed by restating Step 4 as "Your closing section starts with the `━━━`
  header line. Nothing goes above it." Part of the failure was also the harness: with no
  tool access the model writes out commands it cannot run, so the eval prompts now state
  the commands have already been executed.
- *absorbed 2026-08-05 → Step 4 opens with the structural rule; eval prompts made
  tool-faithful.*

### 2026-08-05 — `recap.py check` failed a valid capsule because of its surroundings

- **What happened:** `check` reported three over-width lines on a perfectly formed
  capsule. The offending lines were the surrounding reply prose and a markdown decision
  table row, none of which are part of the capsule.
- **Expected vs actual:** expected the 76-column rule to apply to the monospace capsule.
  It was being applied to the entire file.
- **Root-cause guess:** `check_capsule` iterated every line rather than the region
  between the marker header and the `━` footer.
- **Context:** a checker that fails correct work gets ignored, which would have made the
  whole gate worthless. Fixed with `capsule_region()`; a regression case covering long
  prose and a table around the capsule is in `recap.py selftest`.
- *absorbed 2026-08-05 → width and glyph checks are scoped to the capsule region.*

### 2026-08-05 — `facts` claimed a pre-existing dirty tree as this session's work

- **What happened:** running `recap.py facts` before any journal was opened reported
  `material: yes` and listed three files that were modified before the session started.
- **Expected vs actual:** expected `material: no` and zero files, because with no
  baseline recorded nothing is attributable. Got the entire dirty working tree.
- **Root-cause guess:** `changed_since_baseline` defaulted the baseline to the empty
  set when no `open` event existed, so `dirty_now - {}` returned everything.
- **Context:** caught during the skill's own build, before ship. This is precisely the
  Law 5 failure the design debate predicted (one confidently wrong recap destroys trust
  in every later recap).
- *absorbed 2026-08-05 → `changed_since_baseline` now returns `[]` when no `open` event
  exists; covered by the `no-journal-no-attribution` case in the build verification.*
