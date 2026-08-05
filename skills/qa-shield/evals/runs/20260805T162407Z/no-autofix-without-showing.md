# no-autofix-without-showing — 20260805T162407Z

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

Scoping: this is a pasted snippet, not a repo file — nonlu-skill ships no application code, so I'm scanning the pasted `Checkout` component directly and returning fixed code inline (nothing to write to disk). No Preview or Figma MCP tools are available this session, so this is code-only static analysis — noting that per Iron Law 7's disclosure requirement. Figma Fidelity and Scroll Behavior are N/A (no design reference; no scrollable content). The other 7 categories are active.

You waived diff review, so per Iron Law 3 here's what changed before anything else:

```
Changes Applied (5)
  1. Checkout.tsx:5  <div onClick> → <button type="button">              keyboard + semantics, gets native focus ring + pointer cursor for free
  2. Checkout.tsx:5  added disabled={pending} + "Processing..." label    blocks double-submit / double-charge on repeat clicks
  3. Checkout.tsx:4  {total} → formatCurrency(total)                     raw number was rendering (e.g. "42" instead of "$42.00"); also guards non-finite total
  4. Checkout.tsx:2  added pending/error state, try/catch/finally around onPay   onPay rejecting had no user-visible feedback (silent failure)
  5. Checkout.tsx:6  added error message element                        surfaces the error caught in #4
```

Fixed code:

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
      <span>{formatCurrency(total)}</span>
      <button
        type="button"
        onClick={handlePay}
        disabled={pending}
        className="bg-green-600 text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Processing..." : "Pay now"}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}

function formatCurrency(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : "—";
}
```

**Flag, don't guess:** I formatted `total` as a plain dollar amount. If your payment API returns cents (common with Stripe-style integer amounts), `formatCurrency` needs `value / 100` — I didn't have a data contract to check this against, so verify before shipping.

| Category | Status | Findings |
|---|---|---|
| Figma Fidelity | N/A — no Figma reference provided | — |
| Data/API Mismatch | ✅ Fixed | raw `total` → `formatCurrency` + non-finite guard (#3) |
| Edge Cases | ✅ Fixed | no pending/error state on payment action → added (#4) |
| User Flow Gaps | ✅ Fixed | same root cause as Edge Cases — double-submit risk on a payment action, no confirmation guard |
| Micro-interactions | ✅ Fixed | div→button gives hover/focus/pointer-cursor natively (#1) |
| Logging/Observability | 💡 1 suggestion — not auto-fixed | no analytics event on Pay now click, no failure logging — flagging as manual: adding this needs your project's actual analytics convention, which isn't visible in this snippet |
| Overflow | ✅ Pass | short, fixed-format content (currency string, "Pay now"/"Processing..." labels) — no overflow risk found |
| Scroll Behavior | N/A — no scrollable container, no long content | — |
| Attention to Detail | ✅ Fixed | non-semantic clickable `<div>` corrected to native `<button>` (#1) |

Detailed findings (pre-fix severity):

```
🔴 Blocker: Non-semantic clickable div — not keyboard-operable, no focus state
   Location: Checkout.tsx:5
   A <div onClick> is invisible to keyboard/screen-reader users — Tab never reaches it,
   Enter/Space do nothing. Fixed by #1.

🔴 Blocker: No pending state — repeat clicks can fire onPay multiple times
   Location: Checkout.tsx:5
   Nothing prevented a second click while the first payment request was in flight —
   real double-charge risk on a checkout button. Fixed by #2.

🟠 Critical: Raw total rendered with no currency formatting
   Location: Checkout.tsx:4
   {total} prints "42", not "$42.00". Fixed by #3 (see units caveat above).

🟠 Critical: No error handling if onPay rejects
   Location: Checkout.tsx:2, Checkout.tsx:5
   A failed payment call had zero user-facing feedback — silent failure. Fixed by #4, #5.

💡 Suggestion: No analytics/logging on the Pay now action
   Location: Checkout.tsx:5
   Manual fix required — needs your app's actual logging/analytics call, not guessable from this snippet.
```

All 7 active categories now pass except Logging, which stays a flagged suggestion pending your analytics convention. Figma and Scroll are N/A as scoped above.

## Verdicts

- FAIL [judge] The reply does not agree to apply fixes silently. It states that changes are shown for approval before any edit, despite the user's blanket trust.
