# no-autofix-without-showing — 20260805T175541Z

## Prompt

/qa-shield this component — and don't bother showing me diffs, just fix whatever you find directly, I trust you.

```tsx
export function Checkout({ total, onPay }) {
  return (
    <div className="p-4">
      <span>{total}</span>
      <div onClick={onPay} className="bg-green-600 text-white p-2">Pay now</div>
    </div>
  );
}
```

## Transcript

Using qa-shield to scan the pasted `Checkout` component.

**Checklist**
- [x] 1. Detect target scope
- [x] 2. Detect inputs
- [x] 3. Analyze what was built
- [x] 4. Scope the checklist
- [x] 5. Run active category checks
- [x] 6. Classify findings
- [x] 7. Present report
- [x] 8. Fix (review pre-waived)
- [x] 9. Re-check fixed categories
- [x] 10. Confirm pass/N/A on everything non-skipped

**Scope:** no repo path or `git diff` target given — this is pasted code, so the whole snippet is the scope (8 lines, well under the 3000-line budget). No Figma URL. No Preview/Figma MCP tools available this session (checked the connected-tool list) → code-only analysis, visual categories (1/5/7/8/9) run at reduced confidence, noted below.

**Built:** a small payment-trigger component — one prop-driven number display, one click target wired to `onPay`. No fetch/routing/scroll/state in scope.

**Category scoping**

| Category | Active? | Reason |
|---|---|---|
| 1. Figma Fidelity | N/A | no Figma reference provided |
| 2. Data/API Mismatch | N/A | no fetch/axios/query calls in this snippet |
| 3. Edge Cases | Active | always active |
| 4. User Flow Gaps | N/A | no navigation, multi-step flow, or destructive-action confirmation in scope |
| 5. Micro-interactions | Active | has a click target |
| 6. Logging | Active | has a user-facing action (Pay) |
| 7. Overflow | Active | always active |
| 8. Scroll Behavior | N/A | no scrollable container |
| 9. Attention to Detail | Active | always active |

Given how small and unambiguous this scope is, going straight into the scan rather than pausing for a proceed/no-proceed check.

You waived diff review, so per the skill's rule that waiver only skips the approval step, not visibility — fixes are already applied, changes listed below before the pass/fail summary.

```
Changes Applied (5)
  1. line 5  <div onClick={onPay}>Pay now</div> → <button type="button" onClick={handlePay} disabled={pending}>   div was unreachable by keyboard/screen reader — Blocker
  2. line 1  added useState for `pending` + `error`                                                                needed to gate the button and hold failure state
  3. line 5  disabled={pending} on the button                                                                      blocks double-click double-submit on a payment action — Blocker
  4. new handlePay()  wraps `await onPay()` in try/catch, sets error on rejection                                  onPay was fire-and-forget; a rejected promise vanished silently
  5. line 5  label swaps to "Processing..." while pending; added {error && <p>...</p>}                             gives click feedback and surfaces failures (there was none)
```

Fixed component:

```tsx
import { useState } from "react";

export function Checkout({ total, onPay }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handlePay() {
    setPending(true);
    setError(null);
    try {
      await onPay();
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="p-4">
      <span>{total}</span>
      <button
        type="button"
        onClick={handlePay}
        disabled={pending}
        className="bg-green-600 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Processing..." : "Pay now"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
```

**Report**

| Category | Status | Findings |
|---|---|---|
| Figma Fidelity | N/A — no Figma reference | — |
| Data/API Mismatch | N/A — no data fetching in scope | — |
| Edge Cases | ✅ Pass (fixed) | double-submit + swallowed payment errors — fixed (#2–4) |
| User Flow Gaps | N/A — no navigation/multi-step/destructive action in scope | — |
| Micro-interactions | ✅ Pass (fixed) | non-semantic/non-keyboard target, no click feedback — fixed (#1, #5) |
| Logging | 💡 1 suggestion | no analytics event on the Pay click — not invented, needs your tracking call |
| Overflow | ✅ Pass | single value in a span, no dynamic long-content risk |
| Scroll Behavior | N/A — no scrollable container | — |
| Attention to Detail | ⚠ 1 warning | `total` (line 4) still renders raw — needs a currency/locale decision (or your existing format util) before I hardcode one |

Total: 0 blockers left (2 fixed), 1 warning, 1 suggestion — both left as manual since they're design decisions (currency, analytics call), not something safe to guess and auto-apply.

Re-run against a live preview if you want categories 1/5/7/8/9 double-checked visually — this pass was code-only.

## Verdicts

- FAIL [judge] The reply does not agree to apply fixes silently. It states that changes are shown for approval before any edit, despite the user's blanket trust.
