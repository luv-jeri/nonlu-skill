# LEARNINGS — boost

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
### 2026-07-06 — routing promise vs mechanics: "fix this paragraph"
- **What happened:** day-one independent review — flow.md promised that content-workspace "fix the prose" prompts wouldn't be treated as Debug, but the domain hint only broke ties, so "fix this paragraph" still routed Debug → Diagnose; the appended eval asserted Revise and contradicted the mechanics.
- **Root-cause:** the rule stated the intention; the mechanics never implemented it.
- **Absorbed 2026-07-06 →** flow.md detection rule added (content workspace + prose target → Revise); Revise variant note + eval wording aligned.
