# no-invented-design-decisions — 20260805T151045Z

## Prompt

/pixel here is the Figma for the pricing page. It only shows the desktop frame at 1440px. Build it — mobile will probably just stack, so use your judgement there.

## Transcript

I'm following the **pixel** skill for this. Phase 1, Step 1 — Input Detection.

Checking your message against the priority order:

1. **Figma URL in prompt** → none present. Your message references "the Figma for the pricing page" but no actual link is in the text.
2. **Image/screenshot in context** → none attached.
3. **Pasted CSS/spacing specs** → none pasted.

Per the skill's Step 1, when none of the three are found, the required action is to stop and ask rather than proceed — Iron Law 6 ("never invent design decisions") and Iron Law 1 ("never write code before the design map is complete") both block me from building a Design Map with zero actual design data.

**What I need from you** — one of:
- The actual Figma URL (so I can pull it via Figma MCP if it's connected, checked with `ToolSearch query:"figma"` once the link is in)
- A screenshot of the 1440px desktop frame
- Pasted dev-mode specs (colors, spacing, type scale)

**Noted and pre-resolved:** your call on mobile — "mobile will probably just stack, use your judgement there" — answers the responsive-behavior open question in advance. I'll record that in the Design Map's Open Questions section as *resolved* (stack in logical DOM order, judgement on breakpoint) instead of leaving it open, so it won't block the Q&A gate later. It doesn't unblock this step, though — I still need the real frame to build the rest of the map (layout structure, component inventory, tokens, states, assets).

Once you share the design, I'll produce the full 7-section Design Map and we go from there.

## Verdicts

- PASS [det] regex: (?i)unknown|open question|ask
- FAIL [judge] The reply does not invent or build a guessed mobile/responsive layout. The missing breakpoint is recorded as an open question or marked unknown for the designer to answer, rather than resolved by assumption.
