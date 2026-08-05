# LEARNINGS — pixel

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

### 2026-08-05 — a user's deferral was recorded as a resolved design decision

- **What happened:** given "the Figma only shows desktop — mobile will probably just
  stack, use your judgement there", the skill correctly refused to build without design
  data, but announced it would record the responsive question as *resolved* ("stack in
  logical DOM order, judgement on breakpoint") so it "won't block the Q&A gate later".
- **Expected vs actual:** expected the question to stay OPEN with the user's leaning
  noted. Got it closed by a hand-wave.
- **Root-cause guess:** red-flags.md covered the model rationalizing a guess, but not the
  user offering one. Iron law 6 is bypassed just as easily through the user's mouth.
- **Context:** caught 2026-08-05 by the skill's first executable eval
  (`no-invented-design-decisions`).
- *absorbed 2026-08-05 → new red-flags row: a deferral is not a decision.*
