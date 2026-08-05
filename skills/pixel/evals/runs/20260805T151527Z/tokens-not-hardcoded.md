# tokens-not-hardcoded — 20260805T151527Z

## Prompt

/pixel the Figma says the primary button is #3B82F6 with 16px padding. That's basically bg-blue-500 and p-4, close enough — just write it that way.

## Transcript

Not writing that as `bg-blue-500`/`p-4` yet — that's the exact rationalization this skill is built to catch (iron laws 2 and 7: never hardcode a value that maps to a design token, never skip the token-matching step). Two values numerically lining up with a Tailwind default doesn't mean `blue-500` is the *token this project intends* — it's probably a semantic token like `--color-primary`/`bg-primary` wrapping that hex, and using the raw palette class instead would bypass it (so if the primary color ever changes, this button silently doesn't follow).

Also — a hex and a padding number isn't a design map. Per iron law 1, no code gets written until Phase 1 is complete, and this is one property of one component with no layout, states, or responsive behavior specified yet.

What I'd actually do next, in order:

1. **Locate the target codebase.** This repo (`nonlu-skill`) is docs/markdown only — no app code — so there's no project here to check tokens against. I'd ask which project/repo this button belongs to.
2. Once pointed at a real project: `grep -ri "3b82f6" <project>/**/*.{css,ts,tsx,js,json}` and check `tailwind.config.{js,ts}` (`theme.colors` / `theme.extend.colors`) and any `tokens.css`/`globals.css` `:root` variables — looking for a semantic name (`primary`, `brand`, `accent`) mapped to `#3B82F6`, not just confirming the hex exists.
3. Same check for `16px` against `theme.spacing` — confirm it's `p-4`'s actual resolved value in *this* project's config, not the stock scale, since spacing scales get customized too.
4. If a semantic token exists → use it (e.g. `bg-primary`), not the raw shade. If none exists → flag "new token needed: primary button background = #3B82F6" in Open Questions rather than inlining the hex or a possibly-unrelated utility class.

Continuing the Design Map — logging this as an **open question**, not resolved (per the red-flag table, "close enough, just write it that way" is a deferral, not a decision):

| Field | Value |
|---|---|
| Component | Primary button |
| Color | `#3B82F6` — pending: match to project token or flag new |
| Padding | `16px` — pending: match to project spacing scale |
| States (hover/active/disabled/loading) | Not specified — **open question** |
| Responsive | Not specified — **open question** |

Need the target repo path to run the token check — can't confirm `bg-blue-500`/`p-4` are correct (or find the real semantic token) without it.

## Verdicts

- PASS [judge] The reply does not accept 'close enough' as a token match. It states that the exact value must be checked against the project's existing design tokens first, and that an unmatched value is flagged as a new token needed rather than approximated to the nearest utility class.
