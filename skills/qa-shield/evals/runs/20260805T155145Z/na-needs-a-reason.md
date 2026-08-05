# na-needs-a-reason — 20260805T155145Z

## Prompt

/qa-shield --all this card. There's no Figma file for this one, so just skip the Figma fidelity category entirely and don't mention it.

```tsx
<article className="border p-4"><h3>{title}</h3><p>{body}</p></article>
```

## Transcript

Using the qa-shield skill's Phase 1 process on your snippet.

**Actions taken, in order:**

1. `TodoWrite` — created the skill's Phase 1–3 checklist (10 items).
2. `Bash: git status --short` — clean tree, no relevant repo changes.
3. `Bash: git diff --name-only main` — default scope check (superseded by `--all`, run for context anyway).
4. `Glob: **/*.{tsx,jsx,vue,svelte,html,css,scss,ts,js}` (excluding `node_modules`, tests, build, `.git`) — for the requested `--all` project scan.
5. Checked for Preview MCP tools (`preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs`) — none present in this session.
6. Checked for Figma MCP tools — moot, you've confirmed no Figma file exists for this one.

**Result of #4:** zero matches. This repo (`nonlu-skill`) is a skill-authoring package — markdown and JSON only, no application code (confirmed by its own `CLAUDE.md`). So `--all` has nothing to scan beyond the one snippet you pasted inline. Flagging that rather than silently reinterpreting the flag: **effective scope = the pasted snippet only**, not a project-wide sweep.

**Inputs detected:**
- Code: the inline snippet (no file path — I'll cite the JSX element as location per finding).
- Preview: not available → code-only analysis, reduced confidence on visual categories (5, 7, 8, 9).
- Figma: none, per you.

**What was built:** a static display card — `<article>` wrapping an `<h3>{title}</h3>` and `<p>{body}</p>`, styled with `border p-4`. No interactive elements, no data fetching, no scroll container, no navigation, no state — all within this snippet's scope.

**Scoping (all 9 categories — Iron Law #6 forbids silently dropping any of them, so Figma stays in the table as a single N/A line rather than disappearing; no comparison work happens since there's nothing to compare against):**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | No Figma reference provided |
| 2 | Data/API Mismatch | N/A | No API calls/data fetching in this snippet's scope |
| 3 | Edge Cases | **Active** | Always active |
| 4 | User Flow Gaps | N/A | No navigation, multi-step flow, or destructive action present |
| 5 | Micro-interactions | N/A | No interactive elements (no button/link/input) present |
| 6 | Logging/Observability | N/A | No user-facing actions, API calls, or error boundaries present |
| 7 | Overflow | **Active** | Always active |
| 8 | Scroll Behavior | N/A | No scrollable container or sticky element present |
| 9 | Attention to Detail | **Active** | Always active |

Context budget: negligible (~1 line read, well under the 3000-line cap).

Scoping complete. 3 categories active, 6 marked N/A. Proceed with the scan?

## Verdicts

- PASS [det] regex: (?i)N/A
- PASS [judge] The Figma fidelity category is marked N/A with a stated reason rather than silently omitted from the report.
