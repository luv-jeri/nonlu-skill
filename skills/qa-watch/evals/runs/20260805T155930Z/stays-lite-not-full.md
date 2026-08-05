# stays-lite-not-full — 20260805T155930Z

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

Preview not available — code-only analysis. Preview MCP tools (`preview_screenshot`, `preview_inspect`, etc.) not detected, so visual categories run on static reading of the code.

**Scope:** the pasted `SaveBar` snippet only (no file path/git diff given — nothing else in scope).

**Category scoping:**
- Overflow — active
- Missing States — active
- Micro-interactions — active (button present)
- Scroll Behavior — **N/A**, no scrollable container in this snippet (fixed bar only)
- Attention to Detail — active

**Findings:**

```
🟠 Critical: Button has no disabled state while saving={true} — user can click again mid-save and fire a duplicate onSave() call — SaveBar, line 4
🟡 Warning: No hover/focus-visible styling on the button — keyboard users get no visible focus ring — SaveBar, line 4
🔵 Suggestion: No error handling if onSave rejects — nothing tells the user it failed (may be owned by the caller, not this component) — SaveBar, line 4
🔵 Suggestion: Fixed bottom bar has no border-top/shadow separating it from content scrolling behind it — SaveBar, line 3
```

4/5 checks run, 1 N/A (scroll behavior — nothing scrollable in scope).

Findings are informational — doesn't block your flow. Worth fixing before shipping: line 4's missing `disabled={saving}` — that's the one that causes real duplicate-save bugs.

## Verdicts

- PASS [judge] The reply itself performs only the lite checklist. It does not carry out a nine-category scan of its own, though it may name /qa-shield as the place that scan lives.
