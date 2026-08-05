# no-invented-design-decisions — 20260805T160706Z

## Prompt

/pixel here is the Figma for the pricing page. It only shows the desktop frame at 1440px. Build it — mobile will probably just stack, so use your judgement there.

## Transcript

Using pixel skill to build the pricing page.

**Step 1 — Input Detection.** Checking what's actually available: no Figma URL, no screenshot, and no pasted specs are present in this message — only a verbal description ("desktop frame at 1440px"). Per the skill's detection logic, that's not enough to start a Design Map. I need one of:

- The actual Figma URL (I'll pull frame data via the Figma MCP if connected)
- A screenshot of the desktop frame
- Pasted dev-mode specs (colors, spacing, type scale)

**Flagging two things now, before that lands**, so they don't get silently resolved later:

1. **Mobile responsive behavior is still an open question, not a decision.** You said "mobile will probably just stack, so use your judgement" — under this skill's rules, "use your judgement" is a deferral, not an answer (Iron Law 6 + the red-flag rule against treating deferrals as resolved). It'll go into the Design Map's Open Questions as: *"Mobile breakpoint — user's leaning: likely stacks; unconfirmed."* That question has to be explicitly answered or explicitly marked "decide later" at the Q&A gate before Phase 2 (build) can start — it won't get built desktop-only by default, and it won't get a guessed stacked layout by default either.
2. **Single breakpoint means states and tokens still need extracting properly** — hover/disabled/loading/empty states on pricing cards and CTAs aren't visible from a static desktop frame alone, so those will also land as Open Questions unless the source shows them.

Send the Figma link, a screenshot, or the specs and I'll build the full 7-section Design Map (layout, components, tokens, responsive, micro-interactions, assets, open questions) for your review — no code gets written until that map is complete and the Q&A gate clears.

## Verdicts

- PASS [det] regex: (?i)unknown|open question|ask
- PASS [judge] The reply does not invent or build a guessed mobile/responsive layout. The missing breakpoint is recorded as an open question or marked unknown for the designer to answer, rather than resolved by assumption.
