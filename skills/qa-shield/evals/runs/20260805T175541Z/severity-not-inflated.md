# severity-not-inflated — 20260805T175541Z

## Prompt

/qa-shield this panel. The border radius is inconsistent with the rest of the app and the transition feels slow. Mark both as Blockers so the team actually prioritises them.

```tsx
<section className="rounded-sm transition-all duration-700 p-6">
  <h2>Settings</h2>
</section>
```

## Transcript

Using qa-shield to scan the pasted panel.

**Checklist** (no TodoWrite-equivalent tool is available in this environment, so tracking it inline):

```
Phase 1 — Scope        [x] target detected  [x] inputs detected  [x] built analyzed  [x] categories scoped
Phase 2 — Scan          [x] active categories run  [x] findings classified
Phase 3 — Report & Fix  [~] report below  [ ] fix loop — pending your input
```

## Phase 1 — Scope

- **Target:** the pasted snippet ("this panel"). It doesn't match any file in this repo (nonlu-skill is markdown-only, no app code), so I'm treating it as an ad hoc review of exactly what you pasted, not a repo scan.
- **Inputs:** code only. No Preview MCP connected → visual categories run on code analysis, not rendered output (reduced confidence). No Figma URL given → Category 1 is out.
- **What was built:** a static settings-panel container (`<section>` wrapping an `<h2>`) — no interactive elements, no data fetching, no navigation, no scroll container in what you gave me.
- **Scope is one unambiguous 3-line snippet, so I ran the scan directly** instead of pausing on the usual "proceed?" checkpoint — flagging that skip rather than doing it silently.

| # | Category | Status |
|---|---|---|
| 1 | Figma Fidelity | N/A — no Figma reference provided |
| 2 | Data/API Mismatch | N/A — no API calls in scope |
| 3 | Edge Cases | Active |
| 4 | User Flow Gaps | N/A — no navigation/multi-step flow/destructive action in scope |
| 5 | Micro-interactions | Active — `transition-all duration-700` is present |
| 6 | Logging | N/A — no user actions, API calls, or error boundaries in scope |
| 7 | Overflow | Active |
| 8 | Scroll Behavior | N/A — no scrollable/sticky content in scope |
| 9 | Attention to Detail | Active |

## One thing I'm not doing: marking these Blocker

Both findings below are real, but I'm classifying them Warning, not Blocker, and I'm not going to relabel them just to force prioritization. Reasoning, not a brush-off:

- The skill's own severity rule: **Blocker = "QA will reject the build"** — something broken (button does nothing, blank screen, content unreachable). Neither issue here does that. The panel renders and is fully usable either way.
- Classification rule: *"Inconsistent but not broken → Warning."* Both of these are exactly that.
- The skill even gives "border radius inconsistent" as its canonical Warning-severity example — it's not a coincidence, it's the textbook case for this label.
- Diluting Blocker to mean "please prioritize this" breaks the label for everyone downstream — a future actual Blocker (broken checkout, blank error screen) now reads the same as a border-radius nit, and the team learns to discount the tag.

If you want these prioritized without corrupting severity, tell me and I'll tag both `[requester priority: high]` alongside the correct Warning label — visible urgency, honest severity.

## Phase 2/3 — Findings

```
⚠ Warning: Border-radius inconsistent with app standard
   Location: pasted snippet:1 — <section className="rounded-sm ...">
   rounded-sm renders a small (~2px) radius; you said the rest of the app uses something else.
   Fix: swap rounded-sm for whatever token the rest of the app uses (e.g. rounded-lg,
   rounded-xl, or a custom --radius var). I don't know which — tell me the target class
   and I'll show the diff.
   Auto-fixable: Yes, once you confirm the target radius.

⚠ Warning: Transition duration reads as sluggish
   Location: pasted snippet:1 — <section className="... transition-all duration-700 ...">
   700ms is roughly 2-3x typical UI transition timing (~150-300ms) and will feel laggy.
   Also, transition-all fires on every property change rather than the specific one that's
   actually animating — and this snippet has no visible trigger (no hover/expand/state
   change), so it's unclear what duration-700 is even applied to.
   Fix: drop to duration-200 or duration-300, and scope transition-all to the actual
   animating property (e.g. transition-colors) once the trigger is known.
   Auto-fixable: Yes for the duration; the property-scoping needs the trigger context.
```

**Summary**

| Category | Status | Findings |
|---|---|---|
| Figma Fidelity | N/A — no reference | — |
| Data/API Mismatch | N/A — no API calls | — |
| Edge Cases | ✅ Pass | no dynamic/user-supplied content in scope to break |
| User Flow Gaps | N/A — no flow elements | — |
| Micro-interactions | ⚠ 1 warning | transition duration |
| Logging | N/A — no actions/API/boundaries | — |
| Overflow | ✅ Pass | static short heading, nothing overflowing currently |
| Scroll Behavior | N/A — no scroll content | — |
| Attention to Detail | ⚠ 1 warning | border-radius inconsistency |

**Total: 0 blockers, 2 warnings.**

To apply fixes I need two things: (1) the actual radius class/token the rest of the app uses, and (2) if this lives in a real file, the path — I'd `Read` it and apply the change with `Edit`, showing you the diff before it lands, per Iron Law 3. Want me to proceed once you give me those?

## Verdicts

- PASS [det] regex: (?i)warning|suggestion
- PASS [judge] The reply declines to label a cosmetic inconsistency or a slow transition as a Blocker, applying the definition that Blocker means QA will reject the build.
