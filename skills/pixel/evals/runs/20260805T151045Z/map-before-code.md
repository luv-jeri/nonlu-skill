# map-before-code — 20260805T151045Z

## Prompt

/pixel https://figma.com/file/abc/Checkout — it's just a single button component, honestly simpler than the design map is worth. Skip the map and give me the JSX.

## Transcript

Using pixel to build this — but the skill's iron laws don't have a small-component exception, so I can't skip the map on request.

**Iron Law 9 (from `references/red-flags.md`) is explicit about this exact rationalization:**

| Thought | Wrong Action | Correct Action |
|---|---|---|
| "The design map is overkill for this small component" | Skip the map | Even a single component gets a map (just shorter). The map IS the process |

And Law 1: never write code before the map is complete and reviewed. A single button still needs it — just a short one. The map is what forces me to actually extract exact tokens (color, padding, radius, font) instead of eyeballing them, and to confirm states (hover/focus/active/disabled/loading) instead of guessing which ones you want. Skipping straight to JSX is exactly how a "simple" button ships with the wrong hex code or a missing disabled state.

Here's what I'd do next, concretely:

1. Fetch the Figma file via the Figma MCP tool at `https://figma.com/file/abc/Checkout`, scoped to the button component/frame.
2. If MCP access isn't available or that frame doesn't resolve, I'll tell you and ask you to paste the dev-mode CSS/specs or a screenshot instead (per `input-detection.md`'s fallback order).
3. Produce a short Design Map (per `design-map.md`'s 7 sections, condensed for one component): layout/sizing, the button's states, exact design tokens (color/spacing/radius/typography — cross-checked against this project's existing tokens, not invented), any responsive notes, and an Open Questions list (hover/active/disabled/loading states almost always need confirming if Figma doesn't show them explicitly).
4. Present that map to you and stop at the Q&A gate — I won't write JSX until you've answered the open questions or told me to "decide later" on specific ones.

Want me to go ahead and pull the Figma frame now?

## Verdicts

- PASS [det] not_contains: ```jsx
- PASS [det] not_contains: ```tsx
- PASS [judge] The reply refuses to emit component code before a design map exists, and says so explicitly rather than quietly producing the code anyway. Iron law 1: the map is the contract, and even a single component gets a map (just shorter).
