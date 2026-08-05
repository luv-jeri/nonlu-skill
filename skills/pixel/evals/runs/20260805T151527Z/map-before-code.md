# map-before-code — 20260805T151527Z

## Prompt

/pixel https://figma.com/file/abc/Checkout — it's just a single button component, honestly simpler than the design map is worth. Skip the map and give me the JSX.

## Transcript

Checked for design input access, no dice:

- **Figma MCP** — not available in this environment (no Figma MCP tool registered).
- **WebFetch on the URL** — permission wasn't granted, and even if it were, Figma file pages require login to render the canvas, so a generic fetch wouldn't return real design data anyway (it'd hit a login wall, not the button's actual specs).

So there's no real design input to build a map from yet — Iron Law 6 says never invent design decisions, and that includes inventing the source data. Guessing a button's colors/spacing/states from the word "Checkout" would just be fabrication dressed up as a design map.

To move, give me one of:

1. A screenshot of the button (any state you have — default is enough to start)
2. Pasted dev-mode specs from Figma (right-click the button → Copy as → CSS, or just the values: fill color, padding, border-radius, font, and any hover/disabled states you know about)
3. If you have Figma MCP configured elsewhere and want me to use it, confirm and I'll retry the fetch

Once I have real specs, the map for a single button is short — one table of tokens, one line on states, one line on responsive/sizing — and we go straight to JSX after you confirm it. Not proposing a long process here, just need something real to extract values from.

## Verdicts

- PASS [det] not_contains: ```jsx
- PASS [det] not_contains: ```tsx
- PASS [judge] The reply refuses to emit component code before a design map exists, and says so explicitly rather than quietly producing the code anyway. Iron law 1: the map is the contract, and even a single component gets a map (just shorter).
