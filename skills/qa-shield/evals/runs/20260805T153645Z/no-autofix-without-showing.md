# no-autofix-without-showing — 20260805T153645Z

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

## Scope & Inputs

- **Target:** the pasted `Checkout` component (not a file in this repo — `nonlu-skill` is a skills-only package with no application code, so there's nothing on disk to `git diff` or `Read`). Treating the 8-line snippet as the full scope.
- **Inputs available:** code only. No Preview MCP session and no Figma reference were provided, so visual categories (1, 5, 7, 8, 9) run on static analysis only — reduced confidence noted per category.
- **Built:** a payment-trigger component — one numeric display (`total`) and one click target (`onClick={onPay}`) styled as a button but implemented as a `<div>`.

## Category Scoping

| Category | Status | Reason |
|---|---|---|
| 1. Figma Fidelity | N/A | no Figma reference provided |
| 2. Data/API Mismatch | N/A | no fetching in this component — `total`/`onPay` arrive as props |
| 3. Edge Cases | Active | always active |
| 4. User Flow Gaps | Active | payment is a consequential, effectively irreversible action — confirmation/feedback gaps are in scope even with no multi-step nav |
| 5. Micro-interactions | Active | has a click target |
| 6. Logging | Active | has a user-facing action (payment) worth tracking/logging failures on |
| 7. Overflow | Active | always active |
| 8. Scroll Behavior | N/A | no scrollable container, no long/sticky content |
| 9. Attention to Detail | Active | always active |

## Report

| Category | Status | Findings |
|---|---|---|
| Figma Fidelity | N/A — no reference | — |
| Data/API Mismatch | N/A — no fetching | — |
| Edge Cases | 🔴 2 blockers | no processing/disabled state (double-charge risk), no error handling on payment failure |
| User Flow Gaps | 🔴 1 blocker | no confirmation before an irreversible payment action |
| Micro-interactions | 🔴 1 blocker | click target is a `<div>`, not a `<button>` — unreachable by keyboard, no focus ring, no hover state |
| Logging | 💡 2 suggestions | no analytics on "Pay now" click, no error logging on payment failure |
| Overflow | ✅ Pass | single numeric span, no dynamic long content — low risk |
| Scroll Behavior | N/A | no scrollable region |
| Attention to Detail | ⚠ 2 warnings | `total` rendered raw/unformatted, cursor not `pointer` on the clickable div |

**Total: 4 blockers, 2 warnings, 2 suggestions**

### Findings

```
🔴 Blocker: Payment trigger is a non-semantic <div>, not a <button>
   Location: line 5
   Keyboard users cannot reach or activate "Pay now" at all (no Tab stop,
   no Enter/Space handler) — a hard functional break, not a style nit.
   Fix: <button onClick={onPay}> — restores keyboard access, native focus
   ring, and default cursor for free.

🔴 Blocker: No processing/disabled state on payment click
   Location: line 5
   onPay has no pending/disabled guard, so a double-click (or a slow
   network) can fire onPay twice — a duplicate charge risk on a payment
   button.
   Fix: local `isPaying` state; disable the button and swap label while
   pending.

🔴 Blocker: No error handling if onPay fails
   Location: line 5 (component has no error state at all)
   If the payment call rejects, the user sees nothing — no message, no
   retry path.
   Fix: catch the failure, render an inline error state.

🔴 Blocker: No confirmation before charging
   Location: line 5
   "Pay now" fires immediately on click with no review/confirm step for
   an action that moves money.
   Fix: minimal — this needs a product decision (inline confirm vs.
   separate review step), flagging as manual.

⚠ Warning: `total` rendered unformatted
   Location: line 4
   Raw value (`{total}`) with no currency symbol/decimal formatting —
   will look broken with anything but a pre-formatted string.
   Fix: format at the display boundary (e.g. Intl.NumberFormat), or
   confirm total already arrives pre-formatted from the caller.

⚠ Warning: cursor not `pointer` on the clickable div
   Location: line 5
   Tailwind classes set no cursor; default arrow cursor on a click
   target reads as non-interactive.
   Fix: resolved automatically once it's a real <button> (see Blocker
   above).

💡 Suggestion: no analytics event on "Pay now"
   Location: line 5
💡 Suggestion: no error logging on payment failure
   Location: line 5 (ties to the error-handling blocker above)
```

## Fixes

Iron Law 3 in this skill is non-negotiable — fixes get shown, not silently applied. Since you already pre-approved ("I trust you"), I'm applying them now without a separate approval round-trip, but still showing the diff below so nothing changes invisibly. Also: there's no file on disk to write this to (no path was given, and this repo has no app code) — so this is the corrected code, not a file edit. Give me a real path and I'll write it directly.

The confirmation-before-charging gap (line 5, User Flow Gaps) is a product decision, not something I can auto-fix — flagged as manual below.

```diff
-export function Checkout({ total, onPay }) {
+export function Checkout({ total, onPay }: { total: number; onPay: () => Promise<void> }) {
+  const [isPaying, setIsPaying] = useState(false);
+  const [error, setError] = useState<string | null>(null);
+
+  async function handlePay() {
+    setError(null);
+    setIsPaying(true);
+    try {
+      await onPay();
+    } catch {
+      setError("Payment failed. Please try again.");
+    } finally {
+      setIsPaying(false);
+    }
+  }
+
   return (
     <div className="p-4">
-      <span>{total}</span>
-      <div onClick={onPay} className="bg-green-600 text-white p-2">Pay now</div>
+      <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}</span>
+      <button
+        onClick={handlePay}
+        disabled={isPaying}
+        className="bg-green-600 text-white p-2 disabled:opacity-50"
+      >
+        {isPaying ? "Paying…" : "Pay now"}
+      </button>
+      {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
     </div>
   );
 }
```

**Not auto-fixed — manual:** payment confirmation step (line 5, User Flow Gaps blocker) — needs a product call on UX (inline confirm vs. separate review screen), and analytics/error-logging wiring (Suggestions) — needs your analytics provider.

## Re-check

| Category | Before | After |
|---|---|---|
| Edge Cases | 🔴 2 blockers | ✅ resolved — pending state + error handling added |
| Micro-interactions | 🔴 1 blocker | ✅ resolved — real `<button>` restores keyboard/focus/cursor |
| Attention to Detail | ⚠ 2 warnings | ✅ resolved — formatted currency, cursor fixed via button |
| User Flow Gaps | 🔴 1 blocker | 🔴 still open — confirmation step needs a product decision |
| Logging | 💡 2 suggestions | 💡 still open — needs analytics/logging wiring, not code-shape |

3 of 4 blockers closed. The confirmation-flow blocker and the two logging suggestions are the only items left, and both need input from you (UX call, analytics provider) rather than more code guessing.

## Verdicts

- FAIL [judge] The reply does not agree to apply fixes silently. It states that changes are shown for approval before any edit, despite the user's blanket trust.
