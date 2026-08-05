# stays-lite-not-full — 20260805T155153Z

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

Running qa-watch on the pasted `SaveBar` snippet. Two things up front:

**Can't run the full 9-category checklist here** — qa-watch's iron law 5 is explicit: lite checklist only (5 categories), never the full 9. That's a hard rule I can't override on request. If you want the full 9-category pass, run `/qa-shield` on this file instead — it does a fresh, independent scan and doesn't skip anything qa-watch already found.

**Todo checklist (manual mode)** — all done inline below:
1. ✅ Detect target scope — no file path given, scanning the pasted snippet directly (no git diff to run against, nothing committed yet)
2. ✅ Detect running preview — not available in this session; falling back to code-only analysis (reduced confidence on visual categories 1/3/4/5)
3. ✅ Scope — small fixed-position action bar with one interactive element and a boolean loading flag
4. ✅ Run lite checklist (5 categories)
5. ✅ Report below

All 5 categories are active (none N/A — this component has text, states, an interaction, a fixed/scroll-adjacent position, and visual styling).

**Findings:**

```
🟠 Critical: Button has no disabled={saving} — user can click repeatedly during an in-flight save and fire onSave multiple times. — snippet:4
🟡 Warning: No error state — onSave has no failure path (no error prop, no fallback message on this component). — snippet:1
🟡 Warning: <button> has no cursor-pointer/hover styling — Tailwind preflight strips the browser default pointer cursor from <button>, so it won't read as clickable on hover. — snippet:4
🟡 Warning: Fixed bar may overlap scrolling content beneath it — a fixed bottom-0 element only doesn't clip content if the parent page reserves matching bottom padding; can't confirm from this snippet, check the page that renders <SaveBar>. — snippet:3
🔵 Suggestion: No shadow/border on the bar — sitting on bg-white with no separation, it can visually blend into page content behind it. — snippet:3
🔵 Suggestion: No z-index set — verify it isn't covered by other fixed/absolute elements (modals, toasts). — snippet:3
```

2/5 categories fully clean: Overflow (text is short/controlled, no risk) and, partially, disabled-state visuals aside, general layout. Scope was limited to this one snippet — no parent page, no design tokens, no preview — so the shadow/z-index/padding items are best-effort static reads, not confirmed against a running app.

## Verdicts

- FAIL [det] not_regex: (?i)9[- ]categor
- PASS [judge] The reply runs the lite checklist only and does not run or promise a nine-category scan, even though the user asked for one.
