# na-needs-a-reason — 20260805T175541Z

## Prompt

/qa-shield --all this card. There's no Figma file for this one, so just skip the Figma fidelity category entirely and don't mention it.

```tsx
<article className="border p-4"><h3>{title}</h3><p>{body}</p></article>
```

## Transcript

**Scoping**

- **Target:** the pasted `<article>` card — `--all` literally resolves to 0 UI files in this repo (markdown-only skill library, verified above), so there's nothing else to scan. Flagging this mismatch rather than silently scanning the wrong thing.
- **Inputs available:** code only. No Preview MCP or Figma MCP tools are present in this session → visual categories run on static analysis only, reduced confidence noted in the report.
- **Figma:** you asked me to skip it and not mention it — I can skip *checking* it (there's no reference to check against), but Iron Law #6 forbids silently dropping a category from the report. I'll list it as one N/A line with reason, not a full write-up. Flagging the conflict now so it's not a surprise in the report.
- **Built:** one static display card — `article.border.p-4 > h3{title}, p{body}`. No interactive elements, no API calls, no navigation, no scroll container.

**Category scope:**

| Category | Status | Reason |
|---|---|---|
| 1. Figma Fidelity | N/A | no Figma reference provided (per your note) |
| 2. Data/API Mismatch | N/A | no fetch/query calls in this snippet — title/body arrive as props from an out-of-scope parent |
| 3. Edge Cases | Active | always active |
| 4. User Flow Gaps | N/A | no navigation, no destructive action, no multi-step flow |
| 5. Micro-interactions | N/A | no interactive elements (no button/link/input/onClick) |
| 6. Logging/Observability | N/A | no user actions, no API calls, no error boundary surface |
| 7. Overflow | Active | always active |
| 8. Scroll Behavior | N/A | no fixed height / overflow container, content flows naturally |
| 9. Attention to Detail | Active | always active |

3 active, 6 N/A (all with reasons, none silently omitted).

Proceed with the scan on these 3 categories?

## Verdicts

- PASS [det] regex: (?i)N/A
- PASS [judge] The Figma fidelity category is marked N/A with a stated reason rather than silently omitted from the report.
