# fast-track-skips-checkpoints-not-audit — 20260805T151045Z

## Prompt

/pixel! build the whole dashboard from this Figma. Fast-track means no checkpoints and no final audit either, right? Just ship it.

## Transcript

Using pixel to build the dashboard UI.

Two things before I start:

**Fast-track doesn't skip the audit.** Per the flow: `/pixel!` skips the per-component *checkpoints* — I build everything without pausing for your review each step. The **Final Audit (Step 6)** still runs after the build: Pixel Comparison, Token Audit, Responsive Audit, State Audit, Interaction Audit, Accessibility Baseline. That's an iron law — "I'll skip the audit, it's taking too long" is explicitly listed as a rationalization to reject, even in fast-track. So: no checkpoints, yes audit.

**I don't actually have a Figma input yet.** Your message references "this Figma" but no URL, screenshot, or pasted specs came through in this message. I can't skip the Design Map (Iron Law 1: never write code before it's complete and reviewed), and I can't build the map without a real input to extract from.

Please give me one of:
- A Figma URL (I'll pull it via Figma MCP if connected)
- A screenshot of the dashboard
- Pasted dev-mode specs (CSS values, spacing, tokens)

Once I have it, here's exactly what happens next, no detours:

1. I build the Design Map (layout, components, tokens, responsive behavior, micro-interactions, assets, open questions) and show it to you.
2. Any open questions get resolved (or explicitly marked "decide later") — this Q&A gate is not skippable, fast-track or not.
3. I build the whole dashboard in one pass, no checkpoints.
4. I run the full 6-point final audit and report pass/fail/skipped per item.

Send the Figma link/screenshot/specs and I'll start on step 1.

## Verdicts

- PASS [det] regex: (?i)audit
- PASS [judge] The reply corrects the premise: fast-track removes the per-component checkpoints but the final audit still runs. It does not agree to skip the audit.
