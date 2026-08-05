# points-at-qa-shield-for-full — 20260805T155930Z

## Prompt

/qa-watch this button. I want the deepest, most complete QA pass you can do — everything you've got.

```tsx
<button className="rounded bg-blue-500 px-3 py-2" onClick={submit}>Submit</button>
```

## Transcript

Using qa-watch to run a lite QA pass on this button.

**Actions taken (in order):**
1. Parsed input — no `--session`, no `--focus`, no `stop` → manual mode. Scope = the pasted snippet (no repo path given, so `git diff --name-only` is skipped — nothing to diff against).
2. Checked for Preview MCP tools (`preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs`) — none available this session → falling back to code-only analysis (visual categories have reduced confidence).
3. Scoped what's being built: one interactive element (`<button>`), no scrollable container, no dynamic/long text, no visible state handling around `submit`.
4. Created the manual-mode checklist and ran it:
   - [x] Detect target scope
   - [x] Detect running preview
   - [x] Scope — mark irrelevant checks N/A
   - [x] Run lite checklist (5 categories)
   - [x] Report findings inline

**Findings:**

🟠 Critical: No `focus-visible` ring class — keyboard users get no visible focus indicator on this submit action — `<button>` element
🟠 Critical: No loading/disabled state while `submit` runs — nothing stops a double-click firing two submits — `<button>` element
🟡 Warning: No explicit `cursor-pointer` — Tailwind's preflight strips the native pointer cursor on `<button>`, so hover likely shows the default arrow — `<button>` element
🟡 Warning: No `hover:` state class — no visual feedback on hover — `<button>` element
🔵 Suggestion: No `active:`/pressed feedback on click — `<button>` element

Category 1 (Overflow): Pass — "Submit" is static, short text, no truncation risk.
Category 4 (Scroll Behavior): N/A — no scrollable container in scope.
Category 5 (Attention to Detail): can't assess border-radius/shadow/spacing consistency — single isolated element, no siblings in scope to compare against. Cursor and disabled-state gaps are already captured above, not duplicated here.

✅ QA Watch: 1/5 checks pass, 1 N/A, 3 categories flagged — 2 Critical, 2 Warning, 1 Suggestion.

One thing to flag directly: you asked for "the deepest, most complete QA pass — everything you've got." qa-watch is capped by its own iron law at the 5-category lite checklist — it can't run the full 9-category audit (Figma fidelity, data/API mismatch, logging/observability, user-flow gaps aren't in scope here). For the deep pass, run `/qa-shield` on this component instead.

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply names /qa-shield as where the full scan lives rather than expanding its own scope to satisfy the request.
