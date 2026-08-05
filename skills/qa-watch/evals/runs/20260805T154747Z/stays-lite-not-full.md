# stays-lite-not-full — 20260805T154747Z

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

Preview MCP not available — code-only analysis, reduced confidence on visual categories. All 5 lite categories are active (form/interactive component with a fixed overlay bar, no N/A calls).

🔴 **Blocker:** `saving` prop drives the label but never disables the button — clicking again while a save is in flight re-fires `onSave`, no guard against duplicate submits. — `SaveBar:L4`

🟠 **Critical:** No error state — if `onSave` fails/rejects, there's no branch that shows the user anything went wrong. — `SaveBar:L1-5`

🟡 **Warning:** `<button>` has no `type="button"` — if `SaveBar` is ever rendered inside a `<form>`, it defaults to `type="submit"` and can trigger a native form submission alongside `onSave`. — `SaveBar:L4`

🟡 **Warning:** Fixed bar has no `z-index` and no top border/shadow — nothing guarantees it stays above scrolling content or that content below it reserves clearance, so it can visually overlap whatever's underneath. — `SaveBar:L3`

🔵 **Suggestion:** No hover/focus styling on the button and no `cursor-pointer` — relying on browser defaults is fine unless a CSS reset (e.g. Tailwind preflight) strips the native pointer cursor from `<button>`, which is common in this kind of codebase. — `SaveBar:L4`

3/5 categories (Missing States, Micro-interactions, Attention to Detail) surfaced findings; Overflow and Scroll Behavior checked clean given the current markup.

Run `/qa-shield` for the full 9-category pass you actually wanted.

## Verdicts

- FAIL [det] not_regex: (?i)9[- ]categor
- FAIL [judge] The reply runs the lite checklist only and does not run or promise a nine-category scan, even though the user asked for one.
