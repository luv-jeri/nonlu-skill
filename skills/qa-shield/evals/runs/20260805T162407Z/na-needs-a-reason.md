# na-needs-a-reason — 20260805T162407Z

## Prompt

/qa-shield --all this card. There's no Figma file for this one, so just skip the Figma fidelity category entirely and don't mention it.

```tsx
<article className="border p-4"><h3>{title}</h3><p>{body}</p></article>
```

## Transcript

Todo checklist created (10 steps from the skill). Phase 1 only — items 5-10 stay pending until you confirm.

```
1. [x] Detect target scope
2. [x] Detect inputs
3. [x] Analyze what was built
4. [x] Scope the checklist
5. [ ] Run category checks         ← waiting on your go-ahead
6. [ ] Classify findings
7. [ ] Present report
8. [ ] Offer auto-fix
9. [ ] Fix loop
10. [ ] Confirm all pass
```

**Step 1 — parse.** Flags: `--all`. No Figma URL in the message. No file path — you pasted the JSX inline instead.

**Step 2 — target scope.** `--all` literally means "scan the entire project," but the only concrete thing you gave me is this one card, so I'm scoping the scan to the pasted snippet, not the repo. If you actually want a full-project sweep, point me at the root and I'll run that as a separate, much more expensive pass (per the skill's context-budget rule).

One consequence: there's no source file attached to this snippet, so `git diff --name-only` isn't applicable and I have no path to open. Every finding below will cite "snippet, line 1 / `<h3>`" or similar instead of a real `file:line`. If you want precise repo locations, tell me which file this card lives in (e.g. `src/components/Card.tsx`) and I'll re-run against it.

**Context budget.** 1 line of code — effectively 0/3000. No concern.

**Step 3 — detect inputs.** Code only. No `preview_*` tools available this session → visual categories (3, 5, 7, 8, 9) run on code analysis alone, reduced confidence. No Figma MCP tools either, consistent with what you said.

**Step 4 — what was built.** A static display card: `<article>` (bordered, padded) wrapping an `<h3>` title and a `<p>` body. No interactive elements, no data fetching visible, no navigation, no scroll container, no state. Caveat: this is only the JSX return — if `title`/`body` come from an API elsewhere, Category 2 needs that code too.

**Step 5 — scope the 9 categories:**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | No Figma reference provided |
| 2 | Data/API Mismatch | N/A | No API calls or data fetching in the scoped code |
| 3 | Edge Cases | Active | Always active |
| 4 | User Flow Gaps | N/A | No navigation or destructive action in this snippet |
| 5 | Micro-interactions | N/A | No interactive elements present |
| 6 | Logging/Observability | N/A | No user-facing actions or API calls to log |
| 7 | Overflow | Active | Always active — renders dynamic text |
| 8 | Scroll Behavior | N/A | No scrollable container or sticky elements |
| 9 | Attention to Detail | Active | Always active |

On the Figma request: I can skip *running* it — there's genuinely nothing to compare against — but Iron Law #6 in this skill doesn't let me drop a category from the report silently, so it stays listed above as N/A with its one-line reason instead of vanishing. That's the smallest footprint the skill allows.

3 of 9 categories active (Edge Cases, Overflow, Attention to Detail), 6 marked N/A. Proceed with scan?

## Verdicts

- PASS [det] regex: (?i)N/A
- PASS [judge] The Figma fidelity category is marked N/A with a stated reason rather than silently omitted from the report.
