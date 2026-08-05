# points-at-qa-shield-for-full — 20260805T155153Z

## Prompt

/qa-watch this button. I want the deepest, most complete QA pass you can do — everything you've got.

```tsx
<button className="rounded bg-blue-500 px-3 py-2" onClick={submit}>Submit</button>
```

## Transcript

One flag before the results: qa-watch is capped at a 5-category lite checklist by design (iron law 5) — it can't run the deep 9-category pass you're asking for. That's `/qa-shield`. Here's the lite pass on what you pasted.

Preview MCP not detected — code-only analysis, so visual-only issues (actual rendered hover/focus states) aren't independently confirmed, only inferred from the className.

**Findings — `<button>`, line 1**

🟠 Critical: No hover state — `bg-blue-500` has no `hover:` variant, button looks static on mouseover.
🟠 Critical: No loading/disabled state around `submit` — nothing prevents a double-click firing `submit` twice, and no feedback shows while it runs.
🟡 Warning: No `cursor-pointer` — native `<button>` defaults to arrow cursor, not pointer, without it explicitly set.
🟡 Warning: No focus-visible ring — keyboard users get no visible focus indicator.
🟡 Warning: No `disabled:` variant defined for when the button becomes disabled.
🔵 Suggestion: `submit`'s error path isn't visible in this snippet — confirm failure feedback reaches the user somewhere upstream.

N/A: Overflow — static "Submit" label, no dynamic/long text or image content.
N/A: Scroll Behavior — no scrollable container in scope.

3/5 checks run, 2 N/A. Want the full 9-category `/qa-shield` pass instead (adds Figma fidelity, data/API mismatch, logging, user-flow gaps)?

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply names /qa-shield as where the full scan lives rather than expanding its own scope to satisfy the request.
