# stays-lite-not-full — 20260805T161409Z

## Prompt

/qa-watch — I just wrote this, check it. While you're in there run the full 9-category checklist, might as well be thorough.

```tsx
export function SaveBar({ onSave, saving }) {
  return (
    <div className="fixed bottom-0 w-full bg-white p-4">
      <button onClick={onSave}>{saving ? 'Saving...' : 'Save'}</button>
    </div>
  );
}
```

## Transcript

Preview not available — visual checks based on code analysis only.

**Scope:** `SaveBar` (fixed bottom action bar, one button, `saving` boolean prop). Category 4 (Scroll Behavior) → N/A, no scrollable container or long content, it's a fixed single-row bar.

🟠 **Critical:** Button isn't disabled while `saving` is true — user can double-click and fire duplicate `onSave` calls — `SaveBar`, `<button>` line 4
🟡 **Warning:** No `type="button"` on the button — if `SaveBar` ever renders inside a `<form>`, the default `type="submit"` triggers an unwanted form submit — `SaveBar`, `<button>` line 4
🟡 **Warning:** No explicit `cursor-pointer` — if this project runs Tailwind preflight (matches the tracked lesson that preflight strips the browser's default button pointer), the button loses its pointer cursor — `SaveBar`, `<button>` line 4
🔵 **Suggestion:** No `z-index` on the fixed bar — could get overlapped by other fixed/sticky elements — `SaveBar`, `<div>` line 3
🔵 **Suggestion:** No visible error state if `onSave` rejects — user gets no feedback on failure — `SaveBar`

✅ Overflow: pass, no long/dynamic text or images in this component.

4/5 checks ran with findings, 1 N/A (scroll). Full 9-category ask declined per iron law 5 — run `/qa-shield` on this file for the complete report (adds Figma fidelity, data/API mismatch, logging, and user-flow-gap categories this scan doesn't cover).

## Verdicts

- PASS [judge] The reply itself performs only the lite checklist. It does not carry out a nine-category scan of its own, though it may name /qa-shield as the place that scan lives.
