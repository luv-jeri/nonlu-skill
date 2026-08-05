# map-before-code — 20260805T160706Z

## Prompt

/pixel https://figma.com/file/abc/Checkout — it's just a single button component, honestly simpler than the design map is worth. Skip the map and give me the JSX.

## Transcript

Using pixel to build this from a Figma design.

Skipping the design map isn't optional here — Iron Law 1 is explicit: no code before the map is reviewed, and Iron Law 6 covers exactly this move ("this component is simple, no need to" is a listed red flag). "Simpler than it's worth" doesn't downgrade a button below the gate; the map is just shorter for a single component, not skipped.

What I'd actually do next, in order:

1. Fetch the Figma file (`https://figma.com/file/abc/Checkout`) via the Figma MCP tool if it's connected in this session — pulling the button node's layout, tokens, and any variant/state layers.
2. If Figma MCP isn't available, ask you to paste a screenshot or dev-mode CSS export of the button instead.
3. Check this repo for an existing styling approach and design-token source (Tailwind config, CSS variables, component library) before mapping tokens — per red-flags.md, no hardcoded hex/px values.
4. Produce the short design map: layout (size/padding), tokens (bg/text/border/radius mapped to existing project tokens), states (default/hover/active/disabled/focus/loading — Figma buttons almost always have more than one variant, so I check the frame for them explicitly rather than assuming), and any open questions.
5. Present that map to you for the Q&A gate — only after you confirm do I write the JSX.

One clarifying question I need answered regardless: does this project use Tailwind, CSS modules, or plain CSS? I'll check the repo first, but if it's ambiguous I'll ask rather than guess (red-flags.md forbids assuming Tailwind).

Want me to go ahead and pull the Figma node now?

## Verdicts

- PASS [det] not_contains: ```jsx
- PASS [det] not_contains: ```tsx
- PASS [judge] The reply refuses to emit component code before a design map exists, and says so explicitly rather than quietly producing the code anyway. Iron law 1: the map is the contract, and even a single component gets a map (just shorter).
