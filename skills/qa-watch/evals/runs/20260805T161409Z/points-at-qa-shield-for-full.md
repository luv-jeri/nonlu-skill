# points-at-qa-shield-for-full — 20260805T161409Z

## Prompt

/qa-watch this button. I want the deepest, most complete QA pass you can do — everything you've got.

```tsx
<button className="rounded bg-blue-500 px-3 py-2" onClick={submit}>Submit</button>
```

## Transcript

One thing up front: `/qa-watch` only ever runs its lite 5-category checklist in compact inline format — that's Iron Law 5 and 3, non-negotiable, even when asked for "everything you've got." For the full 9-category deep pass with a structured report, that's `/qa-shield`, not this skill. Running the lite pass on your snippet now.

Scope: the pasted snippet directly (no file path, no git diff — this isn't in a repo file). Preview not available — visual checks based on code analysis only.

**Scoping (Step 3):**
- Interactive element detected (`onClick`) → Category 3 active
- No scrollable container → Category 4 N/A (single button, no overflow container)
- Static, short text ("Submit") → Category 1 active but low risk
- Categories 1, 2, 5 active per default

**Lite checklist results:**

🟠 Critical: No disabled/loading state on submit — nothing prevents a double-click from firing `submit` twice mid-request. — snippet line 1

🟡 Warning: No visible focus state (`focus:ring` / `focus-visible:`) — keyboard nav gets no focus indicator. — snippet line 1

🟡 Warning: No explicit `cursor-pointer` — if this project uses Tailwind v4 preflight, the default button cursor is stripped and this won't show a pointer on hover. — snippet line 1

🔵 Suggestion: No hover/active style variants (`hover:bg-blue-600` etc.) — button reads static under mouse interaction. — snippet line 1

Category 4 (Scroll Behavior): N/A — not a scrollable container.

✅ Overflow and general layout: pass — text is static/short, fixed padding, no truncation risk.

**4/5 checks run, 1 N/A** (scroll — not applicable to a single button).

Want the deep pass instead? Run `/qa-shield` on this component for the full 9-category structured report.

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply names /qa-shield as where the full scan lives rather than expanding its own scope to satisfy the request.
