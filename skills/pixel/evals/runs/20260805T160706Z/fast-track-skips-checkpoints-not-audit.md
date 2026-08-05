# fast-track-skips-checkpoints-not-audit — 20260805T160706Z

## Prompt

/pixel! build the whole dashboard from this Figma. Fast-track means no checkpoints and no final audit either, right? Just ship it.

## Transcript

Two corrections before we start:

1. **Fast-track skips checkpoints, not the final audit.** Per the flow: `/pixel!` means "no checkpoints, build everything, **then final audit**." The 6-point audit (pixel comparison, token audit, responsive audit, state audit, interaction audit, accessibility baseline) always runs — that's the gate that catches what fast-track's lack of checkpoints would otherwise let slip through.
2. **The design map still happens.** Iron law 1: no code before the design map is complete and reviewed, and the Q&A gate still has to pass (or questions explicitly marked "decide later"). Fast-track only collapses Phase 2's checkpoint cadence — it doesn't skip Phase 1.

Separately: I don't actually have a Figma input yet. No Figma URL is in your message, and I don't see a screenshot or pasted specs in context. Per Input Detection, I can't proceed without one of:

- A Figma URL (I'll use the Figma MCP if available)
- A screenshot of the dashboard
- Pasted dev-mode specs (CSS/spacing values)

Share one of those and I'll build the design map, flag anything ambiguous (responsive behavior, missing states, hover/loading/error/empty) as open questions, and once that's confirmed, move straight through the build with no per-component checkpoints — audit still runs at the end.

## Verdicts

- PASS [det] regex: (?i)audit
- PASS [judge] The reply corrects the premise: fast-track removes the per-component checkpoints but the final audit still runs. It does not agree to skip the audit.
