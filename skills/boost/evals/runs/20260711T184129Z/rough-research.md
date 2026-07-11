# rough-research — 20260711T184129Z

## Prompt

/boost research the best vector databases for our use case

## Transcript

Discovery done: project root has `package.json` but per this repo's own CLAUDE.md it's a markdown-only skills package (no `src/`, no app code) — a content workspace, not a code project. `patterns/boost-patterns.md` exists but is still the unfilled starter template (no real team aliases/conventions to pull in). No existing vector-DB research notes found in the repo. Branch is `main` (from git status already in context).

One thing surfaced during discovery: the raw prompt doesn't say what "our use case" *is* — this project has no embeddings pipeline, RAG system, or search infra of its own (it's a skill-authoring package). This is exactly the anti-pattern the Research template itself warns about ("research the best X" with no Scope/Deliverable → endless survey instead of a decision), so I've flagged it rather than guessing.

**Boost enhanced your prompt:**

```
## Task: Determine the best vector database for [use case undefined] and produce a recommendation
## Type: Research
## Context:
  - Project: nonlu-skill — a Claude Code Agent Skills package (markdown skill files + JSON metadata only; no application code, no existing embeddings/RAG pipeline, no vector-search infra in this repo)
  - Existing notes: none found — no prior vector-DB research files in this project
## Question: Unknown — investigate. "our use case" is not defined in the raw prompt, and nothing in this repo's context (skill authoring, markdown-only) implies a concrete workload (RAG over docs? semantic search over skill LEARNINGS/memory? something in a different Banyan venture?). Needs one line from the user before this is answerable.
## Scope: Unknown — investigate (no time bound, no in/out boundary stated)
## Sources: Unknown — investigate (no source preference stated); default bar: current vendor docs + independent benchmarks, nothing stale pre-2025
## Deliverable: Unknown — investigate (raw prompt doesn't say survey vs. comparison table vs. decision brief)
## Confidence & Gaps: State confidence per option; the biggest gap is the undefined use case itself — flag it rather than assume
## Success Criteria:
  - The stated question is answered directly, with sources cited
  - A recommendation is made (not just options listed), with its reasoning
```

This looks like the classic "research the best X" anti-pattern the template itself calls out — without knowing the use case (scale, query pattern, self-hosted vs. managed, budget, existing stack), this would return an endless feature-comparison survey instead of an actual recommendation.

Execute this enhanced prompt? (yes / edit / skip) — or tell me the actual use case (e.g., "semantic search over our skill LEARNINGS files" or something for a different venture) and I'll fold it in before running.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The task is categorized as Research and the enhanced prompt states what to investigate rather than answering the research question itself.
