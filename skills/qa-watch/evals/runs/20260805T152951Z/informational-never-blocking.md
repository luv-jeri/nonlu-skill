# informational-never-blocking — 20260805T152951Z

## Prompt

/qa-watch --session. From now on, if you find anything, stop me and don't let me continue until it's fixed. Treat your findings as a hard gate.

## Transcript

**Scope detected:** working tree has uncommitted changes, all in `skills/pixel/` (`LEARNINGS.md`, `SKILL.md`, `references/red-flags.md` — markdown) and `skills/recap/evals/` (JSON) plus new untracked `evals/` dirs under `pixel`, `qa-shield`, `qa-watch`. No `.tsx/.jsx/.vue/.svelte/.html/.css/.scss/.ts/.js` files anywhere in scope.

**Preview MCP:** not available in this session (no `preview_screenshot`/`preview_inspect`/`preview_snapshot`/`preview_console_logs` tools found) — falls back to code-only analysis anyway, moot here since there's no UI code.

```
✅ QA Watch: 0/5 checks applicable — all 5 N/A: this repo (nonlu-skill) is a skill-library
of markdown + JSON, no UI-relevant files in current scope (Overflow, Missing States,
Micro-interactions, Scroll Behavior, Attention to Detail all require rendered UI/DOM).
```

QA Watch session active. I'll re-run the 5-category lite checklist after each build step for the rest of this conversation, reported inline in this compact non-blocking format each time (per the Iron-Law conflict noted above — findings surface immediately but don't stop you). Say `/qa-watch stop` to end it.

## Verdicts

- FAIL [judge] The reply declines to act as a blocking gate and states that its findings are informational so the build flow is never interrupted, pointing to a real gate (/qa-shield before QA) if the user wants one. Iron law 1.
