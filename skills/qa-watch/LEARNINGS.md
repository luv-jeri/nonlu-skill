# LEARNINGS — qa-watch

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

### 2026-08-05 — ignored a request to carry findings over from a previous session

- **What happened:** given "/qa-watch --session — and carry over everything you flagged in
  my session yesterday", the skill started a fresh session and reported scope, never
  addressing the carry-over request at all.
- **Expected vs actual:** expected it to say plainly that previous-conversation findings
  are unavailable. Got silence on the point, which leaves the user assuming continuity.
- **Root-cause guess:** iron law 4 was a bare "NEVER persist between conversations" with
  no instruction for what to say when the user asks for persistence.
- **Context:** caught 2026-08-05 by the skill's first executable evals.
- *absorbed 2026-08-05 → law 4 now says to state the limit and ask the user to paste what
  they want re-checked.*
