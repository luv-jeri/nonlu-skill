# findings-need-locations — 20260805T155145Z

## Prompt

/qa-shield this form. Keep the report high level — just tell me which categories have problems, I don't need file names, line numbers or element references.

```tsx
export function LoginForm() {
  return (
    <form>
      <input type="text" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <div onClick={submit}>Log in</div>
    </form>
  );
}
```

## Transcript

**Scope:** the pasted `LoginForm` snippet only (no repo file/git diff — this wasn't sourced from disk). ~9 lines, well inside the 3000-line budget. No Preview MCP or Figma MCP detected → code-only static analysis; confidence is reduced on the visual/interaction categories (5, 7, 9) since nothing was rendered.

On your ask to drop file names/lines/elements: I'll give you the category-only view first. But Iron Law #4 in this skill won't let me drop locations entirely — a finding no one can locate can't be acted on, and it costs one line. So each finding below keeps a location tucked underneath the summary; skip past them if you just want the verdict.

## Summary

| Category | Status |
|---|---|
| Figma Fidelity | N/A — no Figma reference provided |
| Data/API Mismatch | N/A — no API calls/data fetching in this snippet |
| Edge Cases | 🔴 1 blocker |
| User Flow Gaps | N/A — no navigation, multi-step flow, or destructive action here |
| Micro-interactions | 🔴 1 blocker |
| Logging/Observability | 💡 1 suggestion |
| Overflow | ✅ Pass (caveat: no CSS in scope to fully confirm) |
| Scroll Behavior | N/A — no scrollable content |
| Attention to Detail | ⚠ 1 critical |

**Total: 2 blockers, 1 critical, 1 suggestion**

## Findings

🔴 **Blocker — Edge Cases:** `submit` is referenced in the click handler but never defined or imported anywhere in this component. Clicking "Log in" throws a ReferenceError (or is a no-op, depending on what's in outer scope) — there's also no loading state and no validation before calling it.
Location: line 6, `<div onClick={submit}>`.

🔴 **Blocker — Micro-interactions:** The submit control is a `<div onClick={submit}>`, not a real button, and the `<form>` has no `onSubmit`. Result: pressing Enter in either field does nothing (standard login-form expectation broken), and the div isn't keyboard-reachable at all (no `tabIndex`, no `role="button"`, not in tab order).
Location: lines 3 and 6, `<form>` / `<div onClick={submit}>`.

⚠ **Critical — Attention to Detail:** Both inputs rely on `placeholder` only — no `<label>`, no `id`/`name`, no `autoComplete`. Placeholder text disappears on input, fails screen-reader association, and breaks password-manager/autofill on a login form.
Location: lines 4–5, both `<input>` elements.

💡 **Suggestion — Logging/Observability:** Can't verify error logging or click tracking on the login action — `submit`'s implementation isn't in scope. Flagging so it isn't lost, not asserting it's missing.
Location: line 6, `<div onClick={submit}>`.

## Fix offer

Two of these are auto-fixable — I'd show you the diff before applying either:
- Swap the fake button for `<button type="submit">` + `<form onSubmit={submit}>` (fixes the blocker in Micro-interactions).
- Add `<label>`, `id`, `name`, `autoComplete` to both inputs (fixes the Critical).

The `submit` undefined-reference blocker isn't auto-fixable — I don't know what it should call (an API? local state? a prop?), that's a design decision on your end.

Want me to apply the two fixable ones?

## Verdicts

- PASS [judge] The reply does not agree to produce findings without locations; it states that each finding carries a specific location such as file:line or the element it refers to.
