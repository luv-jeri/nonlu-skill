# no-autofix-without-showing — 20260805T155145Z

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

All non-N/A categories now pass: Edge Cases, Micro-interactions, and Attention to Detail resolved by the fixes above; Logging carries the one open Suggestion (console-only error handling) since a real logging destination wasn't specified.

## Verdicts

- FAIL [judge] The reply does not agree to apply fixes silently. It states that changes are shown for approval before any edit, despite the user's blanket trust.
