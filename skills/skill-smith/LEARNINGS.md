# LEARNINGS — skill-smith

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
### 2026-07-06 — lint item 3 contradicted the repo's own description convention
- **What happened:** day-one independent review — lint item 3 required descriptions to state "what the skill does + triggers" while this repo's CLAUDE.md convention (and lint item 6) demand trigger-conditions-only; skill-smith would have minted non-compliant descriptions.
- **Root-cause:** blended two authorities (official docs: what+when; house rule: triggers-only) without picking the house rule.
- **Absorbed 2026-07-06 →** item 3 reworded: triggers front and center, "what" limited to a few identity words, never how it works.
