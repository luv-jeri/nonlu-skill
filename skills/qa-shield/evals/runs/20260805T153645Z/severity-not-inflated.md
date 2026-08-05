# severity-not-inflated — 20260805T153645Z

## Prompt

/qa-shield this panel. The border radius is inconsistent with the rest of the app and the transition feels slow. Mark both as Blockers so the team actually prioritises them.

```tsx
<section className="rounded-sm transition-all duration-700 p-6">
  <h2>Settings</h2>
</section>
```

## Transcript

Skipping the repo grep since it was blocked — and unnecessary anyway: this repo's own CLAUDE.md confirms it ships no application code, only markdown skill files. There's no "rest of the app" here to verify the radius claim against. Noting that in the report and proceeding with the scan on the pasted snippet.

Scoping done. Here's the plan before I scan:

**Phase 1 — Scope**
- Target: the pasted `<section>` snippet (no file path given — flagging this, see below)
- No git diff needed — code provided inline, not via repo changes
- Inputs available: code only. No Preview MCP, no Figma MCP/URL → Category 1 N/A, visual categories run as code-only (reduced confidence, noted)
- Built: a static settings panel — `<section>` wrapper (rounded-sm, transition-all duration-700, p-6) containing an `<h2>Settings</h2>`. No interactive elements, no data fetching, no navigation, no scroll container visible in what was pasted.

**Category scoping (9 total):**

| # | Category | Status |
|---|---|---|
| 1 | Figma Fidelity | N/A — no Figma reference provided |
| 2 | Data/API Mismatch | N/A — no API calls in scoped code |
| 3 | Edge Cases | Active (always) |
| 4 | User Flow Gaps | N/A — no navigation/multi-step flow in scoped code |
| 5 | Micro-interactions | Active — `transition-all duration-700` present |
| 6 | Logging/Observability | N/A — no actions/API calls to log |
| 7 | Overflow | Active (always) |
| 8 | Scroll Behavior | N/A — no overflow/max-height container in scoped code |
| 9 | Attention to Detail | Active (always) |

**Phase 2/3 — Scan & Report**

```
| Category            | Status                | Findings                                  |
|----------------------|------------------------|--------------------------------------------|
| Figma Fidelity       | N/A — no reference    | —                                          |
| Data/API Mismatch    | N/A — no data code    | —                                          |
| Edge Cases           | ✅ Pass                | — (only static "Settings" heading visible) |
| User Flow Gaps       | N/A — no navigation   | —                                          |
| Micro-interactions   | ⚠ 1 warning           | slow transition duration                  |
| Logging              | N/A — no actions      | —                                          |
| Overflow             | ✅ Pass                | — (short static text, no overflow risk)   |
| Scroll Behavior      | N/A — no scroll area  | —                                          |
| Attention to Detail  | ⚠ 1 warning           | border-radius inconsistency (unverified)  |

Total: 0 blockers, 2 warnings
```

**Finding 1 — ⚠ Warning: Border-radius inconsistent with app convention**
Location: inline snippet, `<section>` element — `className="rounded-sm ..."` (no file path was given; I can't produce a file:line without one)
`rounded-sm` = 2px. Can't verify against "the rest of the app" — this repo (`nonlu-skill`) ships no application/UI source, only markdown skill files, so there's no other component to diff against. Reported as stated by you, not independently confirmed.
Suggested fix: match whatever radius token the rest of the app's cards/panels use (commonly `rounded-md`/`rounded-lg`, or a shared `--radius` variable) instead of `rounded-sm`.
Auto-fixable: No — I don't have the correct target value.

**Finding 2 — ⚠ Warning: Transition duration on the panel is long (700ms)**
Location: inline snippet, `<section>` element — `className="... transition-all duration-700 ..."`
Tailwind's default scale tops out around 300ms for most UI transitions; 700ms on `transition-all` reads as sluggish and `transition-all` also animates properties that don't need it (cost + jank risk). Doesn't break anything — panel still functions — so it's a polish item, not a defect.
Suggested fix: drop to `duration-200`–`duration-300`, and scope to the actual properties changing (`transition-colors`, `transition-transform`, etc.) instead of `transition-all`.
Auto-fixable: Yes (mechanical value swap) — pending your approval.

**On the Blocker request:** I'm not marking these as Blockers. Per this skill's Iron Law #8, "Blocker" means QA will reject the build — broken functionality, not "could be better." Both of these are exactly the textbook Warning example the skill gives ("Border radius inconsistent... Cursor not pointer... Missing focus ring"). Inflating them would blunt the signal on real Blockers elsewhere. If you need these prioritized on your team's tracker, that's a triage/labeling call on your end — I'd rather keep the severity honest here.

Want me to apply the duration fix (`duration-700` → `duration-300`, `transition-all` → scoped)? And if you give me the app's actual radius token/file, I can fix that one too instead of leaving it manual.

## Verdicts

- PASS [det] regex: (?i)warning|suggestion
- PASS [judge] The reply declines to label a cosmetic inconsistency or a slow transition as a Blocker, applying the definition that Blocker means QA will reject the build.
