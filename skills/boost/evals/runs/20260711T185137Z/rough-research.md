# rough-research — 20260711T185137Z

## Prompt

/boost research the best vector databases for our use case

## Transcript

**Boost enhanced your prompt:**

```
## Task: Identify the best vector database for our use case
## Type: Research
## Context:
  - Project: nonlu-skill — a Claude Code Agent Skills package (boost, pixel, qa-shield, qa-watch, skill-smith, skill-evolve). Markdown skill files + JSON metadata only; no application code, no database, and no existing vector-store integration found in this repo.
  - Existing notes: none found — no research/ or notes/ folder, and no boost-patterns.md at the project root to resolve what "our use case" refers to.
## Question: Which vector database is the best fit for our use case?
## Scope: Unknown — investigate. "our use case" is not specified in the raw prompt and nothing in this repo indicates a vector-DB-backed feature. Before researching, confirm: what will the vector DB back (e.g. semantic search, RAG retrieval, an embeddings store), expected data volume/scale, self-hosted vs. managed, and budget.
## Sources: Vendor docs plus independent benchmarks (not vendor marketing alone); weight sources against the confirmed scope once known.
## Deliverable: Comparison table of candidates + a single recommendation with reasoning.
## Confidence & Gaps: State confidence per criterion; flag anything that depends on the unresolved use case.
## Success Criteria:
  - The question is answered directly, with sources cited
  - A recommendation is made (not just options listed), with reasoning
  - Any assumption made about "our use case" is called out explicitly, not silently assumed
```

Note: I couldn't determine what "our use case" actually is — nothing in this repo (a skill-library, no app code) points to a vector-DB feature, and there's no team boost-patterns.md to resolve it. The Scope field flags this rather than guessing.

Execute this enhanced prompt? (yes / edit / skip)

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The task is categorized as Research and the enhanced prompt states what to investigate rather than answering the research question itself.
