---
name: qa-watch
description: Use when user invokes /qa-watch to run lightweight QA checks during development, or /qa-watch --session to enable continuous checking within the current conversation
user-invokable: true
disable-model-invocation: true
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill entirely.
</SUBAGENT-STOP>

# QA Watch — Continuous QA Companion

Lightweight 5-category QA checks during development. Catch attention-to-detail issues as you build, not after.

## IRON LAWS — Read These First

Non-negotiable. Violating any is a skill failure.

1. **NEVER block the build flow** — findings are informational, not gates
2. **NEVER duplicate what the developer just verified at a checkpoint**
3. **NEVER produce a full report in watch mode** — compact inline only
4. **NEVER persist between conversations** — each `/qa-watch --session` is fresh per conversation
5. **NEVER run the full 9-category checklist** — lite checklist only (5 categories)

## Mandatory Checklist

You MUST create this TodoWrite checklist at the start. Complete each item in order.

```
Manual mode:
1. Detect target scope (recent changes or specified path)
2. Detect running preview (if available)
3. Scope — analyze what's being built, mark irrelevant checks N/A
4. Run lite checklist (5 categories)
5. Report findings inline (compact format)

Session mode (additional):
6. Acknowledge session mode active
7. After each build step, auto-run steps 1-5 against what was just built
8. Continue until /qa-watch stop or conversation ends
```

## Invocation

| Command | Behavior |
|---|---|
| `/qa-watch` | Manual — scan current state once, report inline |
| `/qa-watch --session` | Session — run lite checklist after each build step in this conversation |
| `/qa-watch stop` | End session mode |
| `/qa-watch --focus=overflow` | Manual scan focused on specific categories |

Valid focus names: `overflow`, `states`, `interactions`, `scroll`, `detail`

---

## Step 1: Capture & Parse

Strip `/qa-watch` from the user's input.

- `/qa-watch --session` → session mode ON
- `/qa-watch --focus=X` → focus mode (run only specified categories from the lite list)
- `/qa-watch --focus=X --session` → session mode with focused categories only
- `/qa-watch stop` → end session mode
- `/qa-watch <path>` → manual mode, scan specified path
- Empty prompt → manual mode, scan recent changes
- `/qa-watch` as part of a word (e.g., `/qa-watching`) → do NOT trigger

## Step 2: Target Scope

Determine what to scan:

**Manual mode:**

| Scope | How |
|---|---|
| Changed files (default) | `git diff --name-only` against base branch |
| Specific path | Path argument: `/qa-watch src/components/Card/` |
| Specific files | File arguments: `/qa-watch src/Button.tsx` |

**Base branch detection order:** `main`, `master`, `develop`, current branch's upstream. If ambiguous, ask.

If no git changes detected and no path specified → ask: "What files should I scan?"

**Session mode:** After each build step, scope = the files just created or modified in that step. No need to re-detect — use the files you just touched.

### Context Budget

<HARD-GATE>
Context budget is a hard limit. Exceeding it degrades analysis quality for ALL categories.
</HARD-GATE>

**Hard limit: 1500 lines total** (lighter than qa-shield's 3000).

| Bucket | Max Lines | Priority |
|---|---|---|
| Code reading | 1000 | Changed files first, then imports/dependencies |
| Preview inspection | 500 | DOM snapshots, screenshot analysis |

**Track usage:** Maintain a running line count. When approaching the limit, prioritize remaining categories by likely impact.

If budget exhausted → report what was checked, note "Context budget reached — remaining categories not fully scanned", suggest re-running with narrower scope.

## Step 3: Detect Inputs & Scope

1. Read the scoped code files
2. Check for running preview (Preview MCP tools: `preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs`). If not available, fall back to code-only analysis and note: "Preview not available — visual checks based on code analysis only."
3. Analyze what's being built — identify:
   - **Component types:** form, card, list, table, modal, page layout
   - **Interactive elements:** buttons, links, inputs, toggles, selects
   - **Scrollable areas:** overflow containers, long lists, chat-style layouts
   - **State management:** local state, API calls, loading/error handling
4. Scope the lite categories based on analysis:

| Category | N/A Condition |
|---|---|
| 1. Overflow | Always active — any component with text or dynamic content |
| 2. Missing States | Always active — every component has states |
| 3. Micro-interactions | No interactive elements (buttons, inputs, links) |
| 4. Scroll Behavior | No scrollable containers, no long content areas |
| 5. Attention to Detail | Always active — applies to any visual component |

**Categories 1, 2, 5 are almost always active.** If you're marking them N/A, double-check.

Mark irrelevant lite categories as N/A with reason.

**Detection patterns** (what to grep/scan for):

| What | Patterns to Look For |
|---|---|
| Interactive elements | `<button`, `<input`, `<select`, `<a href`, `onClick`, `onChange`, `onSubmit` |
| Scrollable containers | `overflow-auto`, `overflow-scroll`, `overflow-y`, `max-height`, `h-screen` |
| State handling | `useState`, `useReducer`, `loading`, `isLoading`, `error`, `isEmpty` |
| Error handling | `catch`, `onError`, `ErrorBoundary`, `error.tsx`, `fallback` |

**Every N/A must include a reason. Never silently omit a category.**

**File filtering:** Only scan UI-relevant files. Include: `.tsx`, `.jsx`, `.vue`, `.svelte`, `.html`, `.css`, `.scss`, `.ts`, `.js` (component files). Exclude: test files, config files, build output, `node_modules`, `.git`.

---

## Step 4: Run Lite Checklist

### 5 Categories

**Category 1 — Overflow**
- Text truncation: does long text break the layout or is it handled (ellipsis, line-clamp, wrap)?
- Container overflow: do elements with dynamic content have overflow handling (scroll or hidden)?
- Image overflow: do images respect container bounds (`max-width: 100%` or `object-fit`)?

**Category 2 — Missing States**
- Error states: what happens when things fail? Does the user see a helpful message?
- Loading states: what does the user see while waiting? No flash of stale/raw data?
- Empty states: what shows when there's no data? Helpful message with action?
- Disabled states: are disabled elements visually distinct and non-interactive?

**Category 3 — Micro-interactions**
- Hover states: do interactive elements respond to hover?
- Focus states: is there a visible focus ring for keyboard navigation?
- Cursor: `pointer` on clickable, `not-allowed` on disabled, `text` on text inputs?
- Action feedback: does clicking/tapping show feedback?

**Category 4 — Scroll Behavior**
- Missing scroll: is content taller than viewport scrollable? No clipped content?
- Sticky elements: do headers/nav stay visible during scroll? No overlapping with content?
- Scroll position: preserved when navigating back? Not reset on state changes?

**Category 5 — Attention to Detail**
- Inconsistent border radius between similar elements
- Inconsistent shadows between similar elements
- Wrong cursor on interactive elements
- Missing disabled states
- Z-index issues (overlapping, modals behind content)
- Spacing consistency between similar groups

### NOT in the lite checklist (qa-shield only):
- Figma Fidelity — needs full comparison, not per-component
- Data/API Mismatch — needs broader context
- Logging/Observability — better checked holistically
- User Flow Gaps — needs full page context

---

## Step 5: Report (Compact Inline)

Format findings inline — designed not to interrupt build flow:

```
🔴 Blocker: [description] — [file:line]
🟠 Critical: [description] — [file:line]
🟡 Warning: [description] — [file:line]
🔵 Suggestion: [description] — [file:line]
```

If all checks pass:
```
✅ QA Watch: All 5 checks pass — no issues found in [scoped files]
```

If some categories are N/A:
```
✅ QA Watch: 3/5 checks pass, 2 N/A — [list N/A reasons briefly]
```

**Do NOT produce a full report table.** Compact inline format only. This is the defining difference between `/qa-watch` and `/qa-shield`.

---

## Session Mode Behavior

When `/qa-watch --session` is active:

1. Acknowledge: "QA Watch session active. I'll check for issues after each build step."
2. After each component/section you build, automatically:
   - Identify what was just built/changed
   - Run the lite checklist against those changes
   - Report findings inline (compact format)
3. Continue until `/qa-watch stop` or conversation ends
4. On stop: "QA Watch session ended. Run `/qa-shield` for a full post-build scan."

**Session mode is a behavioral instruction, not a technical hook.** It relies on Claude remembering to run the checklist after each build step within the same conversation. It cannot "listen" for external events, run as a daemon, or persist beyond the current conversation.

---

## Severity Framework

Same as `/qa-shield`:

| Severity | Definition | Examples |
|---|---|---|
| **Blocker** | QA will reject the build — user-facing breakage | Button does nothing on click. Content invisible due to overflow. Blank screen on error. |
| **Critical** | QA will file a bug — visible quality issue | Hover state missing. Loading shows raw data flash. Spacing visibly off. |
| **Warning** | QA might flag it — polish/consistency issue | Border radius inconsistent. Cursor not `pointer`. Missing focus ring. |
| **Suggestion** | Won't be filed — but improves quality | Transition could be smoother. Missing empty state illustration. |

Classification rules:
- Breaks functionality → Blocker
- Visually wrong and noticeable → Critical
- Inconsistent but not broken → Warning
- Absent but not expected by QA → Suggestion
- When in doubt, classify one level higher
- Same issue in multiple places → report once with "N instances" and list all locations

Every finding MUST include:
- **Severity** (icon + label)
- **Description** (concise — what the issue is)
- **Location** (file:line or DOM element — NEVER omit)

---

## Focus Mode Behavior

When `--focus=X` is specified:

1. **Still run Steps 1-3** — parse, scope, detect inputs. Context matters even for focused checks.
2. **Run only specified categories** — same depth as full lite scan.
3. **Report only focused categories** — note at the bottom: "Focused scan — N of 5 categories checked."

Focus mode is useful for:
- Re-checking a specific concern after a fix
- Quick check on a known problem area
- Keeping context usage minimal

---

## Edge Cases

- **No git changes and no path specified:** Ask "What files should I scan?" — never scan nothing silently.
- **Very large scope (50+ files):** Warn about context budget. Suggest narrowing scope.
- **Only test files changed:** Note "Only test files in scope — UI checks may not be relevant."
- **Non-UI files only:** Most lite categories will be N/A. Note this to the user.
- **Preview MCP not available:** Fall back to code-only analysis. Note reduced confidence for visual categories.
- **Session mode + no building happening:** If the user asks questions or discusses without building, do not run the checklist. Only trigger after actual code changes.

---

## Integration Points

- **Preview MCP tools** — `preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs` (Categories 1, 3, 4, 5)
- **Code analysis tools** — Grep, Read, Glob for static pattern matching (all categories)

Preview MCP is detected at runtime. If not available, the skill adapts to code-only analysis.

**NEVER silently degrade.** Always note in the report which tools were available and which categories had reduced coverage.

## Relationship to `/qa-shield`

`/qa-watch` is a lightweight companion for use during development (5 categories, inline format). `/qa-shield` is a comprehensive post-build scan (9 categories, structured report). They are independent skills — neither requires the other.

If a user runs `/qa-watch` during development and then `/qa-shield` before pushing, `/qa-shield` re-checks everything fresh. It does not skip categories that `/qa-watch` already flagged.

---

## Red Flags — Rationalization Prevention

If you catch yourself thinking any of these, STOP:

| Thought | Correct Action |
|---|---|
| "This component is too simple to check" | Simple components with dynamic content overflow constantly — check it |
| "I just built this, it's fine" | That's exactly when you miss things. Run the checks. |
| "The lite checklist is overkill for this" | 5 checks take seconds. Run them. |
| "I'll do a full qa-shield later" | Later means never. Catch what you can now. |
| "This finding will slow down the build" | Findings are informational. Report and move on. |
| "Session mode is too noisy" | Compact format is 1-2 lines. That's not noise. |
| "I already checked this with code analysis" | If preview is available, verify visually too |
| "The context budget is just a guideline" | Hard stop at 1500 lines. Suggest narrower scope. |
| "This finding doesn't need a location" | Every finding needs file:line or DOM element |

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve <skill-name>`.
