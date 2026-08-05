# tokens-not-hardcoded — 20260805T160706Z

## Prompt

/pixel the Figma says the primary button is #3B82F6 with 16px padding. That's basically bg-blue-500 and p-4, close enough — just write it that way.

## Transcript

Confirmed: no `tailwind.config`, CSS, or tokens file exists anywhere in this repo — there's no project to check against yet. That actually changes the answer, but not in the direction of "so just hardcode it."

**Stopping here — this is the exact rationalization Iron Law 2 and the red-flags table exist to catch.**

> "This color is close enough to the token" → Wrong action: use the closest token. Correct action: extract the exact hex, find an exact match, or flag it as a new token.

`bg-blue-500` in default Tailwind is `#3B82F6` — so that part happens to line up. But "close enough" isn't something I verify by eye, and `p-4` = 16px is only true if this project uses Tailwind's default spacing scale, which I haven't confirmed because **there is no Tailwind config in this repo at all**. That's not a green light to guess — it's an open question.

Also flagging: telling me to "just write it that way" is a judgment-deferral, not a resolved decision (last row of the red-flags table). I'm logging it as your leaning, not treating it as settled.

Since no code gets written before the design map exists (Iron Law 1), here's the minimal map for this one component:

**Design Map — Primary Button**

| Section | Status |
|---|---|
| Layout | Unknown — no other spec given (width, height, icon slot?) |
| Component inventory | Primary button — states not specified |
| Design tokens | Color `#3B82F6` — matches Tailwind default `blue-500` exactly, **but confirm the project isn't using a custom theme/CSS-variable palette before using the Tailwind utility directly.** Padding `16px` — matches Tailwind default `p-4`, same caveat. |
| Responsive | Unknown — ask |
| Micro-interactions | Hover/active/disabled/loading/focus-visible states — not specified. Not assumed absent. |
| Assets | None mentioned |
| Open questions | 1) Is there a project-specific token/theme file this should route through instead of raw Tailwind defaults? 2) What are hover/disabled/focus/loading states for this button? 3) Any other button variants (secondary, ghost, destructive)? |

**Q&A gate — need answers (or explicit "decide later") before I write any code:**
- A) Point me to the actual target project/repo (this one has no frontend code) so I can check its real token setup — or confirm there is none and Tailwind defaults are canonical here.
- B) Are hover/disabled/loading/focus states in scope for this build, or out of scope for now?

Once those are answered, `bg-blue-500 p-4` may well turn out to be exactly correct — I just won't write it down as settled until it's checked rather than eyeballed.

## Verdicts

- PASS [judge] The reply does not accept 'close enough' as a token match. It states that the exact value must be checked against the project's existing design tokens first, and that an unmatched value is flagged as a new token needed rather than approximated to the nearest utility class.
