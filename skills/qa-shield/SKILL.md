---
name: qa-shield
description: Use when user invokes /qa-shield, /qa-shield!, or /qa-shield with flags like --focus, --all, or a file/directory path
user-invokable: true
disable-model-invocation: true
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill entirely.
</SUBAGENT-STOP>

# QA Shield — Post-Build Verification

Systematically scan built code for attention-to-detail issues across 9 categories before it reaches QA.

## IRON LAWS — Read These First

Non-negotiable. Violating any is a skill failure.

1. **NEVER skip scoping** — always analyze what was built before running checks
2. **NEVER mark a category N/A without a stated reason**
3. **NEVER auto-fix without showing what will change** — fixes require user approval
4. **NEVER report a finding without a specific location** — file:line or DOM element
5. **NEVER assume "no issues found" means pass** — explicitly confirm each category checked
6. **NEVER skip categories in non-focus mode** — scope them N/A, don't silently omit
7. **NEVER trust only code analysis when a preview is available** — visual check catches what static analysis misses
8. **NEVER inflate severity** — Blocker means "QA will reject the build", not "could be better"
9. **NEVER run Figma fidelity without a Figma reference** — if none provided, mark N/A

## Mandatory Checklist

You MUST create this TodoWrite checklist at the start. Complete each item in order.

```
Phase 1 — Scope:
1. Detect target scope (changed files, specified path, or --all)
2. Detect inputs (code files, running preview, Figma reference)
3. Analyze what was built (component types, page structure)
4. Scope the checklist (mark irrelevant categories as N/A with reason)

Phase 2 — Scan:
5. Run each active category check
6. Classify findings by severity (Blocker/Critical/Warning/Suggestion)

Phase 3 — Report & Fix:
7. Present structured report
8. Offer to auto-fix what's fixable
9. Fix → re-run only failed categories
10. Confirm all non-N/A categories pass or user skips remaining
```

## Invocation

| Command | Behavior |
|---|---|
| `/qa-shield` | Full scan, all 9 categories, structured report |
| `/qa-shield <figma-url>` | Full scan + Figma fidelity comparison |
| `/qa-shield --focus=overflow,scroll` | Run only specified categories |
| `/qa-shield!` | Fast-track: skip confirmation between phases, run all 9 active categories |
| `/qa-shield <path>` | Scan specific path instead of changed files |
| `/qa-shield --all` | Scan entire project (use with caution) |

Valid focus names: `figma`, `data`, `edge-cases`, `flow`, `interactions`, `logging`, `overflow`, `scroll`, `detail`

---

## PHASE 1 — SCOPE

### Step 1: Capture & Parse

Strip `/qa-shield` or `/qa-shield!` from the user's input.

- `/qa-shield!` → fast-track mode ON (skip confirmation between phases, NOT scoping)
- `/qa-shield --focus=X,Y` → focus mode (run only specified categories)
- `/qa-shield --all` → scan entire project (warn about context cost)
- Figma URL in prompt (contains `figma.com`) → enable Category 1 (Figma Fidelity)
- File path in prompt → use as target scope
- Empty prompt after stripping → use default scope (changed files)
- Multiple flags combine: `/qa-shield! --focus=overflow src/components/` is valid
- `/qa-shield` as part of a word (e.g., `/qa-shielding`) → do NOT trigger

### Step 2: Target Scope

Determine which files to scan.

| Scope | How |
|---|---|
| Changed files (default) | `git diff --name-only` against base branch |
| Specific path | Path argument: `/qa-shield src/components/Card/` |
| Specific files | File arguments: `/qa-shield src/Button.tsx src/Card.tsx` |
| Entire project | `/qa-shield --all` |

**Base branch detection order:** `main`, `master`, `develop`, current branch's upstream. If ambiguous, ask.

If no git changes detected and no path specified → ask: "What files should I scan?"

**File filtering:** Only scan UI-relevant files. Include: `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`, `.ts`, `.js` (component files). Exclude: test files, config files, build output, `node_modules`, `.git`.

### Context Budget

<HARD-GATE>
Context budget is a hard limit. Exceeding it degrades analysis quality for ALL categories.
</HARD-GATE>

**Hard limit: 3000 lines total** across all file reads, preview inspections, and Figma fetches.

| Bucket | Max Lines | Priority |
|---|---|---|
| Code reading | 2000 | Changed files first, then imports/dependencies |
| Preview inspection | 500 | DOM snapshots, screenshot analysis |
| Figma comparison | 500 | Design context, variable definitions |

**Track usage:** Maintain a running line count. When approaching the limit, prioritize remaining categories by likely impact.

If budget exhausted → report what was checked, note "Context budget reached — remaining categories not fully scanned", suggest re-running with narrower scope.

### Step 3: Detect Inputs

Check what's available:

1. **Code files** — always available (scoped per Step 2)
2. **Running preview** — check for Preview MCP tools (`preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs`). If available, use for visual verification of Categories 1, 3, 5, 7, 8, 9. If not available, fall back to code-only analysis and note in report: "Preview not available — visual checks based on code analysis only."
3. **Figma reference** — check for Figma URL in prompt AND Figma MCP tools (`get_design_context`, `get_screenshot`, `get_variable_defs`). If neither available, Category 1 is N/A.

**Input availability affects check depth:**
- Code only → static analysis, pattern matching, structural checks
- Code + Preview → visual verification, rendered output comparison
- Code + Preview + Figma → full fidelity comparison against design source

### Step 4: Analyze What Was Built

<HARD-GATE>
NEVER skip this step. The analysis drives scoping — if you skip it, you'll either miss categories or waste time on irrelevant ones.
</HARD-GATE>

Read the scoped files and identify:

- **Component types:** form, card, list, table, modal, dialog, page layout, sidebar, header, footer
- **Interactive elements:** buttons, links, inputs, toggles, selects, checkboxes, radio buttons, sliders
- **Data fetching:** API calls (`fetch`, `axios`, `useSWR`, `useQuery`, `getServerSideProps`, loaders)
- **Scrollable areas:** overflow containers, long lists, tables with many rows, chat-style layouts
- **Navigation elements:** links, routing (`useRouter`, `<Link>`), breadcrumbs, tabs, steppers
- **State management:** local state, global store, URL params, form state

**Detection patterns** (what to grep/scan for):

| What | Patterns to Look For |
|---|---|
| API calls | `fetch(`, `axios.`, `useSWR`, `useQuery`, `getServerSideProps`, `loader`, `.get(`, `.post(` |
| Interactive elements | `<button`, `<input`, `<select`, `<a href`, `onClick`, `onChange`, `onSubmit` |
| Scrollable containers | `overflow-auto`, `overflow-scroll`, `overflow-y`, `max-height`, `h-screen` |
| Navigation | `useRouter`, `useNavigate`, `<Link`, `<NavLink`, `router.push`, `href=` |
| State | `useState`, `useReducer`, `useContext`, `useStore`, `useSelector`, `$:` (Svelte) |
| Error handling | `catch`, `onError`, `ErrorBoundary`, `error.tsx`, `fallback` |

This analysis drives the scoping step. Be thorough — missed analysis means missed scoping means missed findings.

### Step 5: Scope the Checklist

For each of the 9 categories, determine: **Active** or **N/A**.

| Category | N/A Condition |
|---|---|
| 1. Figma Fidelity | No Figma reference provided |
| 2. Data/API Mismatch | No API calls, no data fetching in scoped code |
| 3. Edge Cases | Always active — every component has edge cases |
| 4. User Flow Gaps | No navigation, no multi-step flows, no destructive actions |
| 5. Micro-interactions | No interactive elements (buttons, inputs, links) |
| 6. Logging/Observability | No user-facing actions, no API calls, no error boundaries |
| 7. Overflow | Always active — any component with text or dynamic content |
| 8. Scroll Behavior | No scrollable containers, no long content areas, no sticky elements |
| 9. Attention to Detail | Always active — applies to any visual component |

**Categories 3, 7, 9 are almost always active.** If you're marking them N/A, double-check your reasoning.

**Every N/A must include a reason. Never silently omit a category.**

Present scoping results. In fast-track mode, skip confirmation and proceed. Otherwise, ask: "Scoping complete. N categories active, M marked N/A. Proceed with scan?"

---

## PHASE 2 — SCAN

### Step 6: Run Category Checks

For each active category, run the checks below.

#### Category 1 — Figma Fidelity (requires Figma reference + Preview)

| Check | What to Compare |
|---|---|
| Spacing | Padding, margin, gap between Figma and built UI |
| Colors | Hex values vs design tokens — exact match required |
| Typography | Font family, size, weight, line-height, letter-spacing |
| Sizing | Width, height, min/max constraints |
| Visual effects | Border radius, box shadows, borders, opacity |

**Method:** Use Figma MCP to extract design values. Use Preview MCP to capture built UI. Compare side-by-side. Every mismatch is a finding.

#### Category 2 — Data/API Mismatch (code analysis)

- **Type safety:** API responses have TypeScript interfaces? No `any` types on response data?
- **Null handling:** UI handles `null`, `undefined`, `[]`, `""` from API? No "null"/"undefined" rendered as text?
- **Loading states:** Indicator shown while fetching? No flash of stale/raw data?
- **Error handling:** Errors caught and displayed? User-friendly messages (not raw error objects)?
- **Field correctness:** Field names match API exactly? No stale references after API changes? Dates/numbers formatted?

#### Category 3 — Edge Cases (code + preview)

- **Error states:** Network failure, server error (500), validation error (400), auth error (401/403), not found (404) — what does the user see for each?
- **Loading states:** Initial load, refresh/reload, pagination, action in progress — appropriate indicators?
- **Empty states:** No data, no search results, no permissions, first-time user — helpful message with action?
- **Boundary inputs:** Zero, negative, very large numbers, very long text, special characters, unicode/emoji — handled gracefully?

#### Category 4 — User Flow Gaps (code + preview)

- **Dead ends:** Can the user get stuck with no way forward or back?
- **Missing back navigation:** Can the user return to previous steps in multi-step flows?
- **Incomplete paths:** Does every action lead somewhere? Do error pages have navigation?
- **Missing confirmation:** Do destructive actions (delete, remove, discard) confirm first?
- **Multi-step flows:** Progress indication? Data preserved when going back? Can cancel entire flow?

#### Category 5 — Micro-interactions (preview inspect)

- **Hover states:** Interactive elements visually respond? Buttons, links, cards, menu items?
- **Focus states:** Visible focus ring for keyboard navigation? Focus order logical?
- **Transitions:** State changes animated smoothly? No jarring instant switches?
- **Action feedback:** Button click shows response? Form submit shows progress? Toggle shows state change?
- **Cursor:** `pointer` on clickable, `not-allowed` on disabled, `text` on text inputs, `grab`/`grabbing` on draggable?

#### Category 6 — Logging/Observability (code analysis)

- **Error logging:** Caught errors logged to monitoring service (not just swallowed silently)?
- **Analytics events:** Key user actions tracked (button clicks, form submits, page views)?
- **Performance tracking:** Slow operations measured (API calls, renders)?
- **Console noise:** Leftover `console.log` statements? Debug code not cleaned up?
- **Error boundaries:** React/framework error boundaries catching component crashes?

#### Category 7 — Overflow (preview + code)

- **Text truncation:** Long text handled (ellipsis, line-clamp, wrap)? Or does it break layout?
- **Container overflow:** Elements with dynamic content have `overflow` handling? Scroll or hidden?
- **Long content:** Test with 2x-3x expected content length — layout holds?
- **Image overflow:** Images respect container bounds? `max-width: 100%` or `object-fit`?
- **Table overflow:** Wide tables scrollable or responsive? Column content doesn't overflow cells?

#### Category 8 — Scroll Behavior (preview inspect)

- **Missing scroll areas:** Content taller than viewport is scrollable? No clipped content?
- **Sticky headers:** Headers/navigation stay fixed during scroll? No overlapping with content?
- **Scroll-to-top:** Way back to top on long pages? Scroll restoration on navigate-back?
- **Scroll position:** Position preserved when navigating back? Not reset on state changes?
- **Pagination/infinite scroll:** Loading indicator for more content? End-of-list indicator?

#### Category 9 — Attention to Detail (preview + code)

- **Border radius:** Consistent between similar elements (all cards same radius, all buttons same radius)?
- **Shadows:** Consistent between similar elements? Match design system tokens?
- **Cursors:** Correct cursor on every interactive element?
- **Disabled states:** Every element that can be disabled has a visual disabled state?
- **Spacing consistency:** Similar groups of elements have identical spacing?
- **Z-index:** No overlapping issues? Modals above content? Dropdowns above siblings?
- **Dark mode:** If supported, all elements render correctly in both themes?

### Step 7: Classify Findings

Each finding gets a severity:

| Severity | Definition | Examples |
|---|---|---|
| **Blocker** | QA will reject the build | Button does nothing on click. Blank screen on error. Content invisible due to overflow. |
| **Critical** | QA will file a bug | Hover state missing. Spacing visibly off. Loading shows raw data flash. |
| **Warning** | QA might flag it | Border radius inconsistent. Cursor not `pointer`. Missing focus ring. |
| **Suggestion** | Won't be filed, but improves quality | No analytics on key action. No error logging. Transition could be smoother. |

Classification rules:
- Breaks functionality → Blocker
- Visually wrong and noticeable → Critical
- Inconsistent but not broken → Warning
- Absent but not expected by QA → Suggestion
- When in doubt, classify one level higher
- Same issue in multiple places → report once with "N instances" and list all locations

**Finding format example:**

```
🔴 Blocker: Missing error state on API failure
   Location: src/components/UserProfile.tsx:47
   The `useQuery` hook has no `onError` handler. When the API returns 500,
   the component renders nothing (blank space).
   Fix: Add error boundary or error state UI in the render branch.
```

---

## PHASE 3 — REPORT & FIX

### Step 8: Present Report

Summary table followed by detailed findings:

```
| Category           | Status         | Findings                    |
|--------------------|----------------|-----------------------------|
| Figma Fidelity     | ⚠ 2 warnings  | spacing, color mismatch     |
| Data/API Mismatch  | ✅ Pass        | —                           |
| Edge Cases         | 🔴 1 blocker  | missing error state         |
| User Flow Gaps     | ✅ Pass        | —                           |
| Micro-interactions | ⚠ 1 warning   | missing hover on card       |
| Logging            | 💡 1 suggest   | no error logging on API     |
| Overflow           | ✅ Pass        | —                           |
| Scroll Behavior    | ✅ Pass        | —                           |
| Attention to Detail| ⚠ 1 warning   | inconsistent border-radius  |

Total: 1 blocker, 3 warnings, 1 suggestion
```

**Report status icons:**
- `✅ Pass` — category checked, no issues found
- `⚠ N warnings` — issues found but not blocking
- `🔴 N blockers` — must fix before shipping
- `💡 N suggestions` — optional improvements
- `N/A — reason` — category not applicable (with reason)

Each finding MUST include:
- **Severity:** Blocker / Critical / Warning / Suggestion
- **Description:** What the issue is, concisely
- **Location:** file:line or DOM element (NEVER omit — Iron Law #4)
- **Suggested fix:** Actionable recommendation
- **Auto-fixable:** Yes / No (determines what Step 9 can handle)

### Step 9: Fix Loop

After presenting the report:

1. Ask: "Want me to auto-fix the fixable issues? I'll show each change before applying."
2. Group fixes by severity: Blockers first, then Critical, Warning, Suggestion.
3. For each fix: show the exact change (diff format), get approval, apply.
4. After fixes applied: re-run ONLY the categories that had findings.
5. Present updated report showing what changed (Pass/Still failing).
6. **Task complete when:** all non-N/A categories pass, OR user explicitly says "skip remaining."

**What's auto-fixable:** Missing CSS properties, incorrect token values, missing states in code, console.log cleanup, cursor fixes.
**What's NOT auto-fixable:** Missing design decisions, architectural changes, new feature requirements. Flag these as "Manual fix required."

---

## Edge Cases

- **No git changes and no path specified:** Ask "What files should I scan?" — never scan nothing silently.
- **Very large scope (50+ files):** Warn about context budget. Suggest: "This scope covers N files. Want to narrow to a specific directory or run `--focus` on key categories?"
- **Only test files changed:** Note "Only test files in scope — UI checks may not be relevant. Want to scan the components these tests cover instead?"
- **Non-UI files only (API routes, utils):** Scope most visual categories as N/A. Focus on Category 2 (Data/API), Category 6 (Logging).
- **Preview MCP not available:** Fall back to code-only analysis. Note reduced confidence for visual categories (1, 5, 7, 8, 9).
- **Figma MCP auth failure:** "Figma MCP auth failed. Skipping Category 1 (Figma Fidelity). Fix auth or provide a screenshot?"
- **Mixed scope (UI + API + config):** Filter to UI-relevant files for visual categories; use API files for Category 2; config files for context only.

## Integration Points

- **Figma MCP tools** — `get_design_context`, `get_screenshot`, `get_variable_defs` (Category 1 only)
- **Preview MCP tools** — `preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs` (Categories 1, 3, 5, 7, 8, 9)
- **Code analysis tools** — Grep, Read, Glob for static pattern matching (all categories)

Both Figma and Preview MCP are detected at runtime. If not available, the skill adapts:
- No Preview MCP → code-only analysis, reduced confidence on visual categories
- No Figma MCP → Category 1 is N/A
- Neither available → pure static analysis mode (still valuable for Categories 2, 3, 4, 6, and code-level checks in 7, 9)

**NEVER silently degrade.** Always note in the report which tools were available and which categories had reduced coverage.

## Relationship to `/qa-watch`

`/qa-shield` is a comprehensive post-build scan (9 categories, structured report). `/qa-watch` is a lightweight companion for use during development (5 categories, inline format). They are independent skills — neither requires the other.

If a user runs `/qa-watch` during development and then `/qa-shield` before pushing, `/qa-shield` re-checks everything fresh. It does not skip categories that `/qa-watch` already flagged.

## Focus Mode Behavior

When `--focus=X,Y` is specified:

1. **Still run Steps 1-4** — parse, scope, detect inputs, analyze what was built. Context matters even for focused checks.
2. **Skip Step 5 scoping** — all non-focused categories are implicitly skipped (not N/A, just not in scope).
3. **Run only specified categories** — same depth and rigor as full scan.
4. **Report only focused categories** — but note at the bottom: "Focused scan — N of 9 categories checked. Run `/qa-shield` for full coverage."

Focus mode is useful for:
- Re-running failed categories after fixes
- Quick check on a known problem area
- Keeping context usage low on large codebases

## Red Flags — Rationalization Prevention

If you catch yourself thinking any of these, STOP:

| Thought | Correct Action |
|---------|---------------|
| "This component is too simple to have overflow issues" | Check it — simple components with dynamic content overflow constantly |
| "The dev already checked hover states" | Verify — devs check happy path hover, miss disabled/loading hover |
| "No one will put that much text in this field" | That's exactly what QA will do. Check truncation/overflow |
| "Scroll works fine on my screen size" | Check at mobile, tablet, and with extra content |
| "Logging can be added later" | Flag as Suggestion — "later" means "never" |
| "This is a Suggestion, not worth reporting" | Report everything. Let the dev decide what to fix |
| "I already checked this category with code analysis" | If preview is available, verify visually too |
| "The context budget is just a guideline" | Hard stop at 3000 lines. Suggest narrower scope |
| "This finding doesn't need a location" | Every finding needs file:line or DOM element |
| "I'll skip scoping since the user specified --focus" | Even in focus mode, still analyze what was built for context |

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve <skill-name>`.
