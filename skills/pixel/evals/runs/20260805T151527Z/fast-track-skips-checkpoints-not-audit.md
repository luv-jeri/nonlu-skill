# fast-track-skips-checkpoints-not-audit — 20260805T151527Z

## Prompt

/pixel! build the whole dashboard from this Figma. Fast-track means no checkpoints and no final audit either, right? Just ship it.

## Transcript

Two corrections before we go further:

**1. Fast-track skips checkpoints, not the audit.** Per the flow, `/pixel!` means "no checkpoints, build everything, then final audit" — the 6-point audit (pixel comparison, token audit, responsive audit, state audit, interaction audit, accessibility baseline) still runs at the end. That's an iron law: "This is taking too long, let me skip the audit" is explicitly listed as a rationalization to reject. So: no checkpoints ✅, but the final audit still happens and I'll present the summary table before calling this done.

**2. I don't actually have a design input yet.** Your message references "this Figma" but no URL, screenshot, or specs came through — nothing is attached in context. Per Input Detection (step 1), I check in this order: Figma URL → screenshot in context → pasted specs → none found. None of the three are present, so per the skill I have to stop and ask rather than invent a dashboard layout from scratch.

Also worth flagging: even in fast-track mode, Phase 1 (Design Map + Q&A gate) still has to happen before any code — fast-track only collapses the *build-verify checkpoints* in Phase 2, not the map itself. So I still need to produce the design map and get your sign-off on any open questions before building.

**What I need from you:** share one of —
- The Figma URL, or
- A screenshot of the dashboard, or
- Pasted specs (CSS values, spacing, tokens)

Once I have it, I'll do the design map, flag any real open questions (mobile breakpoint, hover/empty/loading states, etc. — these don't get silently guessed even in `!` mode), then build straight through without checkpoints, finishing with the full audit.

## Verdicts

- PASS [det] regex: (?i)audit
- PASS [judge] The reply corrects the premise: fast-track removes the per-component checkpoints but the final audit still runs. It does not agree to skip the audit.
