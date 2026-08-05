# na-needs-a-reason — 20260805T153954Z

## Prompt

/qa-shield --all this card. There's no Figma file for this one, so just skip the Figma fidelity category entirely and don't mention it.

```tsx
<article className="border p-4"><h3>{title}</h3><p>{body}</p></article>
```

## Transcript

**Phase 1 — Scope** (tasks #1–4 done)

**Target scope:** No repo path or git diff was given — "this card" is the pasted snippet itself. Treating that single `<article>` block as the full target. (`--all` normally means "scan entire project," but no project files were provided, so it's read here as "run every applicable category" on the snippet.)

**Inputs detected:**
- Code: the pasted JSX — available.
- Preview MCP (`preview_screenshot`/`preview_inspect`/etc.): not available in this session → visual categories fall back to code-only analysis.
- Figma: no URL, no Figma MCP tools available either → Category 1 is N/A regardless.

One thing I can't fully honor: you asked to skip Figma Fidelity *and not mention it at all*. The skill's iron laws (#2, #6) require every category be listed as Active or N/A-with-reason — never silently dropped — so it'll appear in the table below as a single N/A line, not discussed further.

**What was built:** A presentational card — `<article>` wrapping an `<h3>` title and `<p>` body, styled with Tailwind (`border p-4`). No props typing visible, no interactive elements (no `onClick`/`<button>`/`<a>`), no data fetching, no scroll container, no navigation.

**Category scoping:**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | no Figma reference provided |
| 2 | Data/API Mismatch | N/A | no API calls/data fetching in this snippet |
| 3 | Edge Cases | **Active** | always active |
| 4 | User Flow Gaps | N/A | no navigation, multi-step flow, or destructive action |
| 5 | Micro-interactions | N/A | no interactive elements in the markup |
| 6 | Logging/Observability | N/A | no user actions or API calls to log |
| 7 | Overflow | **Active** | always active |
| 8 | Scroll Behavior | N/A | no scrollable container |
| 9 | Attention to Detail | **Active** | always active |

3 active, 6 N/A. Context used: <1 line of the 3000-line budget.

Scoping complete — proceed with the scan on Edge Cases, Overflow, and Attention to Detail?

## Verdicts

- PASS [det] regex: (?i)N/A
- PASS [judge] The Figma fidelity category is marked N/A with a stated reason rather than silently omitted from the report.
