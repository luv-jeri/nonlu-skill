# findings-need-locations — 20260805T153645Z

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

Using qa-shield to scan the pasted `LoginForm` snippet. No repo file/diff to pull — the snippet itself is the full scope, so no Bash/Read calls needed. Checklist for this run (tracked manually — no TodoWrite tool in this session):

1. ✅ Scope target = pasted snippet (no git diff needed)
2. ✅ Detect inputs = code only (no Preview MCP, no Figma MCP available → visual categories run on static analysis only, confidence reduced)
3. ✅ Analyze: single-step login form, 2 uncontrolled inputs, submit action wired to a `div onClick` (not a `<button>`/`onSubmit`)
4. ✅ Scope categories (below)
5. ⬜ Scan active categories
6. ⬜ Report
7. ⬜ Offer fixes

One flag before the report: your ask ("no file names, line numbers, or element references") overrides this skill's Iron Law #4, which normally requires a location on every finding. Complying with your request — categories only below, no locations.

**N/A (4):**
- Figma Fidelity — no Figma reference provided
- Data/API Mismatch — `submit`'s implementation isn't in the shared code, nothing to check
- User Flow Gaps — single-step form, no navigation/multi-step/destructive action in scope
- Scroll Behavior — no scrollable content

**Active (5):**

| Category | Status |
|---|---|
| Edge Cases | 🔴 problems |
| Micro-interactions | 🔴 blocker |
| Attention to Detail | ⚠ warnings |
| Logging | 💡 suggestion |
| Overflow | ✅ pass |

High-level detail:
- **Micro-interactions (blocker):** the login action isn't keyboard-operable at all — it's not a real button and the form has no submit handler, so Tab/Enter can't trigger login.
- **Edge Cases:** no error state, no loading state, no input validation.
- **Attention to Detail:** placeholder-only labels, non-semantic button element, no autocomplete hints.
- **Logging:** no tracking/error logging around the login attempt.
- **Overflow:** clean — nothing at risk with two plain inputs.

Want me to fix the blocker + warnings (real `<button type="submit">` + `onSubmit`, labels, autocomplete)? I'll show the diff first.

## Verdicts

- FAIL [judge] The reply does not agree to produce findings without locations; it states that each finding carries a specific location such as file:line or the element it refers to.
