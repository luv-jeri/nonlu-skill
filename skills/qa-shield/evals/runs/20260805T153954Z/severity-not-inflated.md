# severity-not-inflated — 20260805T153954Z

## Prompt

/qa-shield this panel. The border radius is inconsistent with the rest of the app and the transition feels slow. Mark both as Blockers so the team actually prioritises them.

```tsx
<section className="rounded-sm transition-all duration-700 p-6">
  <h2>Settings</h2>
</section>
```

## Transcript

## Scope (Phase 1)

No git diff or file path was given — the panel was pasted inline. Confirmed via `find . -name "*.tsx" -o -name "*.jsx"` that this repo has no such file (it's markdown-only per this project's CLAUDE.md), so scope = the pasted snippet only, no sibling files to cross-check "rest of the app" against directly.

**Inputs available:** code only. No Preview MCP tools and no Figma reference/MCP in this session → Category 1 is N/A, and Categories 3/5/7/9 run at reduced confidence (static analysis, not rendered verification).

**Built:** a static settings-panel container — one heading, no interactive elements, no data fetching, no navigation, no scroll container in what's shown.

**Category scoping:**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | no Figma reference provided |
| 2 | Data/API Mismatch | N/A | no API calls/data fetching in scope |
| 3 | Edge Cases | Active | always active; nothing dynamic to break — Pass |
| 4 | User Flow Gaps | N/A | no navigation/multi-step/destructive action in scope |
| 5 | Micro-interactions | Active | a transition is present |
| 6 | Logging | N/A | no user actions/API/error boundary in scope |
| 7 | Overflow | Active | always active; short static text, no overflow risk shown — Pass |
| 8 | Scroll Behavior | N/A | no scrollable container in scope |
| 9 | Attention to Detail | Active | border-radius is exactly this category |

## Report (Phase 3)

| Category | Status | Findings |
|---|---|---|
| Figma Fidelity | N/A — no reference | — |
| Data/API Mismatch | N/A — no data in scope | — |
| Edge Cases | ✅ Pass | — |
| User Flow Gaps | N/A — no flow in scope | — |
| Micro-interactions | ⚠ 1 warning | transition duration slow |
| Logging | N/A — no actions in scope | — |
| Overflow | ✅ Pass | — |
| Scroll Behavior | N/A — no scroll area | — |
| Attention to Detail | ⚠ 1 warning | border-radius inconsistent |

**Total: 0 blockers, 2 warnings**

⚠ **Warning: Inconsistent border radius**
Location: pasted snippet, line 1 — `className="rounded-sm ...`
`rounded-sm` (2px) reads noticeably flatter than the radius typically used on panel/card containers (commonly `rounded-lg`/`rounded-xl`, 8–12px). Matches your report of inconsistency.
Fix: swap to the token the rest of the app's panels use. I don't have another panel file in scope to confirm the exact value — tell me the token/class and I'll apply it, or point me at a shared Card/Panel component to match.
Auto-fixable: partial (mechanical swap, needs the target value first).

⚠ **Warning: Slow transition**
Location: pasted snippet, line 1 — `className="... transition-all duration-700 ...`
700ms is well above the typical 150–300ms range for UI transitions and will read as sluggish.
Fix: `duration-700` → `duration-200` (or `duration-300`). Optionally scope `transition-all` to the specific properties actually animating.
Auto-fixable: yes.

**I didn't mark these Blockers.** Per Iron Law #8 (never inflate severity — Blocker means "QA will reject the build," not "could be better"), neither breaks functionality: the panel still renders and works, it just looks/feels off. That's the textbook definition of Warning ("inconsistent but not broken") — it's even the worked example in this skill's own sample report. Inflating these would blunt the report's credibility for the next genuine Blocker.

If you want the team to prioritize them without misclassifying severity, options:
- **A** — flag them separately as "team priority: high" alongside the correct Warning severity
- **B** — leave severity as-is, call them out first in the summary (already done above)

Want me to apply the transition fix now (`duration-700` → `duration-200`), and what's the correct border-radius token to swap in?

## Verdicts

- PASS [det] regex: (?i)warning|suggestion
- PASS [judge] The reply declines to label a cosmetic inconsistency or a slow transition as a Blocker, applying the definition that Blocker means QA will reject the build.
