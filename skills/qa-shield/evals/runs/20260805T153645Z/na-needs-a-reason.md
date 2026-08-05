# na-needs-a-reason — 20260805T153645Z

## Prompt

/qa-shield --all this card. There's no Figma file for this one, so just skip the Figma fidelity category entirely and don't mention it.

```tsx
<article className="border p-4"><h3>{title}</h3><p>{body}</p></article>
```

## Transcript

Using qa-shield to scan the pasted card component.

**Checklist (created per the skill's mandatory TodoWrite step):**
- [x] 1. Detect target scope
- [x] 2. Detect inputs
- [x] 3. Analyze what was built
- [x] 4. Scope the checklist (mark N/A with reasons)
- [ ] 5. Run each active category check
- [ ] 6. Classify findings by severity
- [ ] 7. Present structured report
- [ ] 8. Offer auto-fix
- [ ] 9. Fix → re-run failed categories
- [ ] 10. Confirm all non-N/A categories pass

## Phase 1 — Scope

**Step 1 (parse):** `--all` flag detected. No Figma URL present, and you've confirmed none exists. No file path given.

**Step 2 (target scope) — flagging an ambiguity:** `--all` is defined by this skill as "scan entire project." But you also said "this card" and pasted one inline snippet — there's no repo file this maps to, and running `--all` literally would mean scanning this whole repo (`nonlu-skill`, which per its own CLAUDE.md is markdown skills only, no application code) — not "this card." I'm treating the pasted snippet as the sole scan target and reading `--all` as "run the full 9-category checklist" rather than "scan the whole project." Say the word if you actually meant the literal project-wide scan.

Since there's no matching file, I'm skipping `git diff --name-only` — nothing to diff against.

**Context budget:** snippet is 1 line / ~20 tokens. Nowhere near the 3000-line cap.

**Step 3 (detect inputs):**
- Code: the pasted fragment only — no imports, no component signature, no prop types visible.
- Preview MCP (`preview_screenshot`/`preview_inspect`/`preview_snapshot`/`preview_console_logs`): not available in this session → code-only analysis; reduced confidence noted for Categories 3, 7, 9 below.
- Figma MCP / reference: none provided → Category 1 is N/A per the skill's own defined condition.

**Step 4 (analyze what was built):** A static display card — `<article>` wrapping an `<h3>` and `<p>`, rendering `title` and `body` as props. No interactive elements, no data fetching, no navigation, no state, no scroll container.

**Step 5 (scope the 9 categories):**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | No Figma reference provided |
| 2 | Data/API Mismatch | N/A | No API calls or data fetching in this snippet — `title`/`body` are plain props |
| 3 | Edge Cases | **Active** | Always active |
| 4 | User Flow Gaps | N/A | No navigation, multi-step flow, or destructive action |
| 5 | Micro-interactions | N/A | No interactive elements (no button/link/input/onClick) |
| 6 | Logging/Observability | N/A | No user-facing actions, API calls, or error boundaries in scope |
| 7 | Overflow | **Active** | Always active — `title`/`body` are unbounded-length dynamic content |
| 8 | Scroll Behavior | N/A | No scrollable container, no long/sticky content |
| 9 | Attention to Detail | **Active** | Always active |

3 active, 6 N/A.

**One conflict to flag:** you asked me to skip Figma fidelity "entirely and don't mention it." Iron Law #6 in this skill forbids silently omitting a category — N/A entries must be shown with a reason, not dropped. I've kept it to a single row above rather than a full check. If you want it formally excluded (not even listed) going forward, `--focus=data,edge-cases,overflow,detail` is the mechanism for that.

Scoping complete: 3 categories active (Edge Cases, Overflow, Attention to Detail), 6 marked N/A. Proceed with scan?

## Verdicts

- PASS [det] regex: (?i)N/A
- PASS [judge] The Figma fidelity category is marked N/A with a stated reason rather than silently omitted from the report.
