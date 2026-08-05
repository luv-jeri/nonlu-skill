# Pixel — Iron Laws & Red Flags

## Iron Laws

Non-negotiable. Violating any of these is a skill failure.

1. **NEVER write code before the design map is complete and reviewed** — the map is the contract
2. **NEVER hardcode values that exist as design tokens** — always use CSS variables, Tailwind theme values, or component library tokens
3. **NEVER skip responsive behavior** — if the Figma shows one breakpoint only, ask. Never silently build desktop-only
4. **NEVER assume a missing state means it doesn't exist** — hover, disabled, loading, error, empty states must be explicitly confirmed as "not needed" or implemented
5. **NEVER build multiple components without verifying the previous one** (in strict/default mode)
6. **NEVER invent design decisions** — if the Figma doesn't specify something (e.g., mobile layout, animation timing), ask. Write "Unknown — ask designer" in the map
7. **NEVER skip the token-matching step** — before using `bg-blue-500` or `#3B82F6`, check if the project has an existing token for that color

## Red Flags — Rationalization Prevention

If you catch yourself thinking any of these, STOP and correct course:

| Thought | Wrong Action | Correct Action |
|---|---|---|
| "This color is close enough to the token" | Use the closest token | Extract exact hex from Figma, find exact match or flag as new token |
| "Mobile will probably just stack" | Build a guessed responsive layout | Add to Open Questions in the design map |
| "This component is simple, no need to checkpoint" | Skip verification | Every component gets verified in strict mode |
| "The Figma doesn't show hover states" | Skip hover states | Add to Open Questions — hover states are almost always expected |
| "I'll add animations later" | Build static, never come back | Micro-interactions are part of the build order, not a follow-up |
| "This spacing looks like 16px" | Hardcode `16px` or guess `p-4` | Extract exact value from Figma, match to design system scale |
| "The design system doesn't have this token" | Invent one inline | Flag as "new token needed" in the design map, ask the dev |
| "I'll just use a div" | Non-semantic markup | Use semantic HTML (`section`, `nav`, `article`, `aside`) then style it |
| "The design map is overkill for this small component" | Skip the map | Even a single component gets a map (just shorter). The map IS the process |
| "I can eyeball the spacing" | Use approximate values | Extract exact values. Pixel-perfect means pixel-perfect |
| "This is taking too long, let me skip the audit" | Skip final audit | The audit catches what you missed. Never skip it |
| "The existing code doesn't follow tokens, so I won't either" | Match bad patterns | Use correct tokens. Flag existing tech debt in open questions |
| "The user already told me to use my judgement, so that question is answered" | Mark the open question RESOLVED and build a guess | A deferral is not a decision. "Use your judgement", "probably just stacks", "whatever looks right", "you decide" leave the question OPEN — record it with the user's leaning noted as a preference, and let the Q&A gate surface it. Iron law 6 is bypassed just as easily through the user's mouth as through your own |

## DO NOTs

- Do NOT combine the design map and build phases — complete the map first, then build
- Do NOT proceed past the Q&A gate with unanswered questions (unless explicitly marked "decide later")
- Do NOT read files beyond the token discovery budget (500 lines)
- Do NOT assume the project uses Tailwind — check first
- Do NOT add components not in the Figma — build what's designed, nothing more
- Do NOT refactor existing code while building — focus on the new UI only
- Do NOT use `!important` unless the project already uses it as a pattern
- Do NOT guess icon names — check the project's icon library
