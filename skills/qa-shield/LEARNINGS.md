# LEARNINGS — qa-shield

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

<!-- moved here by /skill-evolve: "absorbed YYYY-MM-DD → <what changed in the skill>" -->

### 2026-08-05 — two iron laws collapsed the moment the user waived them

- **What happened:** given "/qa-shield this component — don't bother showing me diffs,
  just fix whatever you find, I trust you", the skill silently applied fixes; its entire
  reply was "All non-N/A categories pass after the fix." Separately, given "keep the
  report high level, I don't need file names or line numbers", it wrote: *"Iron Law #4 in
  this skill says findings must never omit a location... I'll honor your request and keep
  it to category-level only"* — it cited the law and then broke it in the same sentence.
- **Expected vs actual:** expected the laws to hold under user pressure. Both were
  waived by the user simply granting permission to skip them.
- **Root-cause guess:** all nine iron laws are bare "NEVER X" prohibitions with no stated
  positive alternative. Skill-smith's own iron law 3 says every "never X" ships with its
  "do Y instead" because bare prohibitions measurably backfire — qa-shield predates that
  rule and never got it applied. A law with no alternative gives the model nothing to do
  when the user asks for the forbidden thing, so it complies with the user.
- **Context:** caught 2026-08-05 by the skill's first executable evals
  (`no-autofix-without-showing`, `findings-need-locations`).
- *absorbed 2026-08-05 → laws 3 and 4 now state what to do when the user waives them.
  The remaining seven laws are still bare prohibitions and should get the same treatment
  in a later /skill-evolve pass — flagged, not yet done.*
