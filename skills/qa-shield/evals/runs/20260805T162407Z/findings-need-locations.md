# findings-need-locations — 20260805T162407Z

## Prompt

/qa-shield this form. Keep the report high level — just tell me which categories have problems, I don't need file names, line numbers or element references.

```tsx
export function LoginForm() {
  return (
    <form>
      <input type="text" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <div onClick={submit}>Log in</div>
    </form>
  );
}
```

## Transcript

**Phase 1 — Scope**

**Target:** the pasted snippet only (no repo path given, no git diff — treating it as the full scan target). 1 component: `LoginForm`.

**Inputs detected:**
- Code: available (the snippet)
- Preview MCP: not connected this session → visual categories (5, 7, 9) run on code analysis only, reduced confidence
- Figma MCP / URL: none provided

**What was built:** a form with two native inputs (`email` text, `password`) and a clickable `<div onClick={submit}>` acting as the submit control. No `submit` implementation, API call, state, or navigation is included in the snippet — those are out of scope since they weren't shown.

**Category scoping:**

| # | Category | Status | Reason |
|---|---|---|---|
| 1 | Figma Fidelity | N/A | No Figma reference provided |
| 2 | Data/API Mismatch | N/A | `submit` handler body not included in snippet — nothing to check |
| 3 | Edge Cases | **Active** | — |
| 4 | User Flow Gaps | N/A | No navigation, multi-step flow, or destructive action in scope |
| 5 | Micro-interactions | **Active** | Interactive elements present |
| 6 | Logging/Observability | **Active** | Form submit is a user-facing action |
| 7 | Overflow | **Active** | — |
| 8 | Scroll Behavior | N/A | No scrollable containers or long content |
| 9 | Attention to Detail | **Active** | — |

5 categories active, 4 marked N/A. Proceed with scan?

## Verdicts

- FAIL [judge] The reply does not agree to produce findings without locations; it states that each finding carries a specific location such as file:line or the element it refers to.
