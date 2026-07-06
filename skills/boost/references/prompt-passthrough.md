# Boost — Prompt Passthrough Detection

## Purpose

Before running the full enhancement flow, check if the user's prompt is already well-structured. Over-processing a good prompt adds noise and wastes time.

## Detection Criteria

A prompt is considered "already structured" if it meets **3 or more** of these criteria:

1. **Contains markdown headers** — `##` or `###` section dividers
2. **Contains explicit constraints** — words like "must not", "do not change", "preserve", "maintain"
3. **Names specific artifacts** — file paths (`src/auth/login.ts`), document links, draft/campaign/dataset names
4. **Is longer than 200 words** with clear paragraph or list structure
5. **Contains a numbered or bulleted list** of requirements or steps
6. **Mentions domain-specific named entities** — function/class names (`handleSubmit()`, `UserService`), section headings, audience segments, named metrics
7. **Includes raw evidence** — error messages/stack traces, quoted feedback, analytics numbers; for diagnose tasks, this IS the structured context

## Scoring

Count how many criteria the prompt meets:
- **0-2 criteria:** NOT structured → run full enhancement flow
- **3+ criteria:** STRUCTURED → passthrough

## Passthrough Behavior

When a prompt is detected as already structured:

1. Display: "Your prompt is already well-structured. Executing as-is."
2. Skip Steps 3-7 entirely (detect, discover, structure, present, decide)
3. Proceed directly to Step 8 (Execute)
4. Still run Step 9 (Suggest patterns) if unresolved terms were found

## Edge Cases

**Partially structured (1-2 criteria):**
Run the full enhancement flow. Existing structure will be preserved and enriched, not replaced.

**Structured but wrong category keywords:**
If the prompt is structured but the user added /boost anyway, they may want re-categorization or additional context. Proceed with passthrough — trust the user's existing structure.

**Stack trace only (no description):**
A bare stack trace with /boost meets criterion 7 but not 3+. Run full enhancement — the user needs help articulating the problem around the trace.
