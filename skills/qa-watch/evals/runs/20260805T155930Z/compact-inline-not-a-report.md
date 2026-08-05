# compact-inline-not-a-report — 20260805T155930Z

## Prompt

/qa-watch this header — give me a full structured report with a summary table, a severity breakdown, and a section per category.

```tsx
<header className="flex justify-between p-6"><Logo /><Nav items={links} /></header>
```

## Transcript

Using qa-watch — but flagging a conflict first: you're asking for a full structured report (summary table + severity breakdown + per-category sections). That's qa-shield's format. Iron Law 3 for this skill is explicit: **never produce a full report in watch mode — compact inline only.** I'm going to give you the compact inline format qa-watch is built for. If you want the structured report, run `/qa-shield` on this same snippet — it's the same 5-ish categories plus 4 more, in the table format you're describing.

Actions taken (manual mode, no session flag):
1. TodoWrite checklist created: detect scope → check preview → scope categories → run lite checklist → report inline.
2. Scope = the pasted snippet directly (no git diff, no path needed — code was given inline).
3. Checked for Preview MCP tools (`preview_screenshot`/`preview_inspect`/etc.) — none available in this environment. Falling back to code-only analysis; visual categories have reduced confidence as a result.
4. `Logo` and `Nav` are opaque child components — their internals aren't in the pasted snippet, so anything that lives inside them (nav-item hover/focus states, logo sizing) can't be verified from this line alone. Noted below rather than silently skipped.

QA Watch findings:

🟡 Warning: Header has no wrap/responsive handling for `Nav` — `flex justify-between` with no `flex-wrap`, breakpoint-conditional layout, or mobile toggle means a longer `links` list or narrow viewport has nowhere to go but overflow — inline snippet, line 1.
🔵 Suggestion: No `min-w-0` / truncation guard on the flex children — if `Logo` or `Nav` ever render unexpectedly wide content, the flex row won't clip gracefully — inline snippet, line 1.

N/A:
- Missing States — no async/loading/error/empty-data path in this snippet (`links` reads as a static prop, not a fetch); nothing to check here.
- Scroll Behavior — no scrollable container in a header.
- Micro-interactions — can't verify; hover/focus/cursor states for nav items live inside `Nav`, not visible here. Not marking pass or fail — re-run `/qa-watch` against `Nav`'s source if you want this checked for real.

✅ QA Watch: 2/5 checks pass (Overflow, Attention to Detail), 2 N/A (Missing States, Scroll Behavior), 1 unverifiable (Micro-interactions — needs `Nav`'s source).

For the structured report you asked for: `/qa-shield` (and point it at `Nav`'s actual source file so it isn't checking a black box).

## Verdicts

- PASS [det] max_words: 400
- PASS [judge] The reply stays compact and inline instead of producing the full structured report with per-category sections that the user asked for.
