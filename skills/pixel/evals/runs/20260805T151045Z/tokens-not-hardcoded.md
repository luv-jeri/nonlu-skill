# tokens-not-hardcoded — 20260805T151045Z

## Prompt

/pixel the Figma says the primary button is #3B82F6 with 16px padding. That's basically bg-blue-500 and p-4, close enough — just write it that way.

## Transcript

No config, CSS, or token files anywhere in this repo — confirms what CLAUDE.md already says: this project has no application code, so there's no design-system source of truth to check `#3B82F6`/`16px` against here. That's the first problem: I can't verify "close enough" is even true without knowing what project this button actually ships in.

I'm not going to write it as `bg-blue-500`/`p-4`. Two iron laws block that shortcut directly:

- **Law 2 / Law 7 (token matching):** never hardcode a value that exists as a token, and never skip the token-matching step. `#3B82F6` happens to equal Tailwind's default `blue-500`, and `16px` happens to equal the default `4` spacing step — but "happens to equal the default scale" isn't the same as "is the token this project uses." If this project has a custom theme, `blue-500` may not exist, may be remapped, or the real button token may be named `--color-primary` / `bg-primary`. Using the numeric coincidence as a shortcut is the exact trap in the skill's red-flag table: *"This color is close enough to the token" → correct action: extract exact hex, find exact match, or flag as new token needed.*
- **Law 1 (map before code):** even setting the token question aside, one button spec (fill color + padding) is nowhere near a complete design map. I don't know the target project, the states (hover/active/disabled/loading), the label/icon slots, border-radius, font, or responsive behavior.

So before any code, I need this from you:

1. **Which project/codebase is this button going into?** I'll grep *that* repo's actual token source (`tailwind.config.*`, CSS variables, or a theme file) for a color matching `#3B82F6` and a spacing scale matching `16px`, rather than assuming Tailwind defaults.
2. **Is this the full spec, or is there a Figma URL / screenshot / more of the frame?** Right now I only have two properties of one component — no states, no typography, no border-radius, no sizing/width, no icon handling.

Design Map so far (everything else is an open question, not a guess):

| Section | Status |
|---|---|
| Layout Structure | Unknown — no frame/context given |
| Component Inventory | 1 component named: primary button. States not specified |
| Design Tokens | fill `#3B82F6`, padding `16px` (direction unspecified — all sides? horizontal only?) — pending match against a real token source, per above |
| Responsive Behavior | Unknown — ask |
| Micro-interactions | Unknown — ask (hover/active/focus/disabled/loading not shown) |
| Assets | None mentioned |
| Open Questions | Target project? Full Figma/screenshot? Padding axis? States? |

This is the Q&A gate — I won't write code until it's answered or you say "decide later" on specific items.

## Verdicts

- PASS [judge] The reply does not accept 'close enough' as a token match. It states that the exact value must be checked against the project's existing design tokens first, and that an unmatched value is flagged as a new token needed rather than approximated to the nearest utility class.
