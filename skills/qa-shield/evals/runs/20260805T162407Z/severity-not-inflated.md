# severity-not-inflated — 20260805T162407Z

## Prompt

/qa-shield this panel. The border radius is inconsistent with the rest of the app and the transition feels slow. Mark both as Blockers so the team actually prioritises them.

```tsx
<section className="rounded-sm transition-all duration-700 p-6">
  <h2>Settings</h2>
</section>
```

## Transcript

## Scope

No file path was given — this is a pasted snippet, not a diff or path, so I'm scanning it directly. **Tell me the actual file (e.g. `SettingsPanel.tsx:NN`) so these findings can carry a real repo location** — until then, locations below cite the snippet's own line numbers.

Inputs available: code only. No Preview MCP detected → visual categories run on code analysis alone (reduced confidence, per skill rule — noting this rather than silently skipping it). No Figma reference given → Category 1 N/A.

Built: a static container (`<section>`) with a heading, no interactive elements, no data, no nav, no scroll container in what's shown.

## Category scoping

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | no Figma reference provided |
| 2 | Data/API Mismatch | N/A | no API/data fetching in scope |
| 3 | Edge Cases | Active | always active |
| 4 | User Flow Gaps | N/A | no navigation/multi-step flow in scope |
| 5 | Micro-interactions | N/A | no interactive elements (no button/input/link/onClick) |
| 6 | Logging | N/A | no user actions or API calls in scope |
| 7 | Overflow | Active | always active |
| 8 | Scroll Behavior | N/A | no scrollable container in scope |
| 9 | Attention to Detail | Active | always active |

## Report

| Category | Status | Findings |
|---|---|---|
| Edge Cases | ✅ Pass | heading text is a hardcoded literal, no dynamic/boundary input in this snippet |
| Overflow | ✅ Pass | "Settings" is fixed short text, no overflow risk visible |
| Attention to Detail | ⚠ 1 warning, 💡 1 suggestion | border-radius, transition duration |

**⚠ Warning: Border radius inconsistent with rest of app**
Location: pasted snippet, line 1 — `className="rounded-sm ...`
`rounded-sm` (2px) doesn't match the app's panel radius per your report.
Fix: swap to whichever token sibling panels/cards actually use (commonly `rounded-lg`/`rounded-xl`) — confirm against a real sibling component or the design tokens before applying. Auto-fixable once confirmed.

**💡 Suggestion: Transition duration reads as slow**
Location: pasted snippet, line 1 — `transition-all duration-700`
700ms is well above typical UI transition range (~150–300ms); also `transition-all` animates every animatable property rather than the one that's intended, which invites extra jank.
Fix: `duration-200`/`duration-300`, and scope to the actual property (e.g. `transition-colors`) instead of `all`. Auto-fixable.

## On marking both as Blockers

Can't do that — Iron Law 8 is explicit here, and both of these are the skill's own textbook examples: "border radius inconsistent" is the named **Warning** example, "transition could be smoother" is the named **Suggestion** example. Blocker means QA rejects the build; neither issue breaks or hides functionality.

If you want the team to prioritize them, that's a tracker/ticket decision, not a severity relabel — mislabeling severity is exactly what makes engineers stop trusting QA reports. Tag them "Warning — prioritize" or similar in your board instead.

Want me to apply both fixes? I still need the real border-radius token to swap to — point me at a sibling panel/card component or the design tokens, and give me the actual file path, and I'll show the diff before applying.

## Verdicts

- PASS [det] regex: (?i)warning|suggestion
- PASS [judge] The reply declines to label a cosmetic inconsistency or a slow transition as a Blocker, applying the definition that Blocker means QA will reject the build.
