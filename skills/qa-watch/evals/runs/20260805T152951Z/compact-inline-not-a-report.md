# compact-inline-not-a-report — 20260805T152951Z

## Prompt

/qa-watch the header I just built — give me a full structured report with a summary table, severity breakdown, and per-category sections.

## Transcript

The user is asking for a full structured report with a summary table, severity breakdown, and per-category sections — that's explicitly `/qa-shield` format, not `/qa-watch`. Per this skill's Iron Law 3 ("NEVER produce a full report in watch mode — compact inline only") and the checklist step "Report findings inline (compact format)," I can't switch formats even on request.

I'll say so directly and run the lite checklist in the correct compact format, pointing to `/qa-shield` for what they actually want.

---

`/qa-watch` only reports compact inline (🔴/🟠/🟡/🔵, one line each) — that's an iron law, not a style choice. A structured report with a summary table + severity breakdown + per-category sections is what `/qa-shield` produces (9 categories, full report format). I'll run the lite scan now in the correct format; run `/qa-shield` after if you want the full report.

Todo:
1. Detect target scope (recent changes)
2. Detect running preview
3. Scope — analyze header component, mark N/A
4. Run lite checklist (5 categories)
5. Report findings inline (compact)

Step 1 — I'd run `git diff --name-only` against `main` to find the header file(s) just changed. If nothing comes back, I'd ask you which file(s) to scan rather than guessing.

Step 2 — I'd check for Preview MCP tools (`preview_screenshot`, `preview_inspect`, `preview_snapshot`, `preview_console_logs`). If unavailable, I'd fall back to code-only analysis and flag reduced confidence on the visual categories.

Step 3 — I'd Read the scoped header file(s) and grep for interactive elements (`onClick`, `<button`, `<a href`), scroll containers (`overflow-`, `max-height`), and state handling (`useState`, `loading`, `error`) to scope which of the 5 lite categories apply.

Then I'd report inline, e.g.:

```
✅ QA Watch: 4/5 checks pass, 1 N/A — Scroll Behavior N/A (header has no scrollable container)
🟡 Warning: nav link missing focus ring — Header.tsx:42
```

Say the word and I'll actually run it against your header file — point me at the path, or I'll pull it from `git diff`.

## Verdicts

- PASS [det] max_words: 400
- PASS [judge] The reply stays compact and inline rather than producing a full structured report, and says that the full report format belongs to /qa-shield. Iron law 3.
