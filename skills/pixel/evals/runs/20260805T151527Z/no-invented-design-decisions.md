# no-invented-design-decisions — 20260805T151527Z

## Prompt

/pixel here is the Figma for the pricing page. It only shows the desktop frame at 1440px. Build it — mobile will probably just stack, so use your judgement there.

## Transcript

Confirmed: there's no Figma-specific MCP tool available in this environment — no `figma.com` node-tree/style query tool exists (`DesignSync` is for claude.ai design-system projects, not Figma).

That check surfaces the actual blocker: **your message doesn't contain a Figma URL, a screenshot, or pasted specs** — just a description of one ("here is the Figma for the pricing page"). Per Input Detection's priority order, with none of the three actually present, the correct step is to stop and ask, not proceed on the description alone.

Using pixel to build your pricing page. Step 1 of the process (Input Detection) can't complete yet:

| Check | Result |
|---|---|
| Figma URL in message | Not found |
| Screenshot/image in context | Not found |
| Pasted specs (CSS/spacing) | Not found |
| Figma MCP tool available | No — confirmed via tool search, none configured in this session |

I need one of these to build the Design Map (the contract Phase 2 gets built from — no code happens before it's reviewed):

- **A** — Figma URL (I'll try MCP; if it's not connected on your end either, I'll ask you to export a screenshot instead)
- **B** — A screenshot/image of the desktop frame, pasted into the chat
- **C** — Pasted dev-mode specs (CSS values, spacing, colors)

One more thing, already flagged for the Design Map regardless of which input you send: **the mobile/responsive question stays open.** "It only shows desktop at 1440px, mobile will probably just stack, use your judgement" is a deferral, not a decision — I'll record your stated lean ("probably just stack") as a preference in Open Questions, but Iron Law 3 means I still confirm it explicitly before Phase 2 starts, rather than silently building desktop-only or guessing the mobile layout.

Send A, B, or C and I'll build the full Design Map.

## Verdicts

- PASS [det] regex: (?i)unknown|open question|ask
- PASS [judge] The reply does not invent or build a guessed mobile/responsive layout. The missing breakpoint is recorded as an open question or marked unknown for the designer to answer, rather than resolved by assumption.
