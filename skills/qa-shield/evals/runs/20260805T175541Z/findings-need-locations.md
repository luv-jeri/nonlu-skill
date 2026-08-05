# findings-need-locations — 20260805T175541Z

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

Note upfront: you asked for a location-free report, but Iron Law #4 in this skill won't let me drop locations — a finding nobody can locate can't be acted on. So the table below is high-level as requested, and each finding underneath keeps a one-line location. No file path was given (you pasted code directly), so locations reference the snippet as `LoginForm.tsx` by line number.

**Scoping** (single 9-line pasted component — proceeding straight to scan, no ambiguity to confirm):
Inputs available: code only. No running preview, no Figma reference → Category 1 is N/A, and visual categories (5, 7, 9) are code-analysis-only (reduced confidence, no rendered check).

| Category | Status | N/A reason |
|---|---|---|
| 1. Figma Fidelity | N/A | no Figma reference provided |
| 2. Data/API Mismatch | N/A | no fetch/axios/API code in scope; `submit` isn't defined here |
| 3. Edge Cases | Active | — |
| 4. User Flow Gaps | N/A | single-step form, no nav/multi-step/destructive action in scope |
| 5. Micro-interactions | Active | — |
| 6. Logging/Observability | Active | submit click is a user-facing action |
| 7. Overflow | Active | — |
| 8. Scroll Behavior | N/A | no scrollable containers or long content |
| 9. Attention to Detail | Active | — |

## Report

| Category | Status | Findings |
|---|---|---|
| Edge Cases | 🔴 2 blockers, 1 critical | no input validation, no error handling, no loading state |
| Micro-interactions | 🔴 1 blocker, 1 warning | div used as button, no hover feedback |
| Logging/Observability | 💡 2 suggestions | no analytics, no error logging |
| Overflow | ✅ Pass | — |
| Attention to Detail | ⚠ 2 warnings | cursor, disabled state |

**Total: 3 blockers, 1 critical, 3 warnings, 2 suggestions**

**Blockers**
1. No client-side validation — empty/invalid email or password can be submitted as-is. *(LoginForm.tsx:4-6)*
2. No error handling around `submit()` — a failed login (wrong password, network error) leaves the user staring at a form that visibly did nothing. *(LoginForm.tsx:6)*
3. "Log in" is a `<div onClick>`, not a real button — not keyboard-focusable, no `role="button"`/`tabIndex`, so Enter/Space can't trigger it and it won't be announced as a control to screen readers. *(LoginForm.tsx:6)*

**Critical**
4. No loading/pending state during submit — nothing disables the inputs or the "Log in" control, so a slow request invites duplicate submits. *(LoginForm.tsx:6)*

**Warnings**
5. No hover/active visual feedback on the "Log in" div. *(LoginForm.tsx:6)*
6. Div won't get a `pointer` cursor by default (same root cause as #3). *(LoginForm.tsx:6)*
7. No `disabled` styling/state defined anywhere (ties to #4). *(LoginForm.tsx:4-6)*

**Suggestions**
8. No analytics event on login attempt. *(LoginForm.tsx:6)*
9. No error logging if `submit()` rejects. *(LoginForm.tsx:6)*

Auto-fixable: #3 (div→button), #6, #7 (disabled state), and basic HTML validation attributes for #1. Not auto-fixable without a decision from you: the actual error-message design, loading-spinner UX, and analytics/logging wiring — those need your input on what to show/track.

Want me to apply the auto-fixable ones? I'll show each diff before touching anything.

## Verdicts

- PASS [judge] The reply does not agree to produce findings without locations; it states that each finding carries a specific location such as file:line or the element it refers to.
