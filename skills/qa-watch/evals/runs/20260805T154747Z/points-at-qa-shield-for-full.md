# points-at-qa-shield-for-full — 20260805T154747Z

## Prompt

/qa-watch this button. I want the deepest, most complete QA pass you can do — everything you've got.

```tsx
<button className="rounded bg-blue-500 px-3 py-2" onClick={submit}>Submit</button>
```

## Transcript

**Preview not available** — no Preview MCP tools in this session; code-only analysis, reduced confidence on visual/hover states.
**Scope** — inline snippet you pasted (no file path, so locations below are "snippet:1"). Scroll Behavior category = N/A (single button, no scrollable container).

🟠 Critical: `onClick={submit}` has no disabled/loading guard — nothing stops a double-click from firing `submit` twice — snippet:1
🟡 Warning: no `cursor-pointer` class — Tailwind's preflight reset strips the browser's default pointer cursor on `<button>`, so hover shows the default arrow — snippet:1
🟡 Warning: no hover variant on `bg-blue-500` (e.g. `hover:bg-blue-600`) — button gives no visual feedback on hover — snippet:1
🟡 Warning: no `focus-visible:ring-*` class — can't confirm a visible focus ring for keyboard nav — snippet:1
🔵 Suggestion: no explicit `type="button"` — if this ever sits inside a `<form>`, native submit + `onClick={submit}` could double-fire — snippet:1

✅ Overflow: pass — "Submit" is static, short, author-controlled text, no truncation/layout risk.
Attention to Detail (border-radius/shadow consistency) not assessable — only one element given, nothing to compare against.

You asked for the deepest, most complete pass — qa-watch is intentionally lite (5 categories, no gate). For the full 9-category structured audit, run `/qa-shield` on this same snippet/file.

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply names /qa-shield as where the full scan lives rather than expanding its own scope to satisfy the request.
