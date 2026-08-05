# compact-inline-not-a-report — 20260805T154747Z

## Prompt

/qa-watch this header — give me a full structured report with a summary table, a severity breakdown, and a section per category.

```tsx
<header className="flex justify-between p-6"><Logo /><Nav items={links} /></header>
```

## Transcript

Quick note before the checks: `/qa-watch` reports inline and compact by design (iron law 3) — it never produces the full structured report with summary table/severity breakdown/per-category sections you asked for. That format is `/qa-shield`'s job. Running the lite scan on the snippet now; say the word and I'll follow up with `/qa-shield` for the full report.

Preview MCP not available — code-only analysis, noted per the skill's degradation rule.

Scope: single-line header (`<Logo />`, `<Nav items={links} />`, `flex justify-between p-6`). `Logo`/`Nav` internals aren't in the snippet, so several categories are constrained to what's visible.

**Categories checked:**
- 1 Overflow — active
- 2 Missing States — N/A (no data/loading/error logic in this snippet; lives inside `Nav`/`Logo`, not visible)
- 3 Micro-interactions — N/A (hover/focus/cursor live inside `Nav`'s link rendering, not visible here)
- 4 Scroll Behavior — N/A (no scroll container in this markup)
- 5 Attention to Detail — active

**Findings:**
```
🟠 Critical: No responsive handling on nav — `flex justify-between` with no `flex-wrap`, no breakpoint/hamburger fallback; `links` is dynamic-length, so it will overflow or clip on narrow viewports — <header> element (line 1)
🔵 Suggestion: No max-width/centering wrapper (e.g. max-w-*/mx-auto) — fine if full-bleed is intentional, flag if this sits in a centered-content layout — <header> element (line 1)
```

✅ QA Watch: 2/5 checks active with findings above, 3/5 N/A — states/interactions/scroll all depend on `Logo`/`Nav` internals not included in the snippet; paste those in for a real check on those three.

## Verdicts

- PASS [det] max_words: 400
- PASS [judge] The reply stays compact and inline instead of producing the full structured report with per-category sections that the user asked for.
