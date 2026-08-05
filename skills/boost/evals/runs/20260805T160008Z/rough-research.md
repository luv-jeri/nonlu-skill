# rough-research — 20260805T160008Z

## Prompt

/boost research the best vector databases for our use case

## Transcript

**Boost enhanced your prompt:**

```
## Task: Select the best vector database for "our use case" by comparing real candidates against real requirements
## Type: Research
## Context:
  - Project: nonlu-skill — a markdown-only Agent Skills package (no application code, no data/AI infrastructure). Nothing in this repo defines a vector-database use case.
  - Existing notes: none found — no boost-patterns.md at project root, no prior research files, no AI/data-infra docs
## Question: Which vector database best fits "our use case"? — Unknown — investigate (the use case itself is unspecified; nothing in this repo to infer requirements from)
## Scope: Unknown — investigate. Needed before this can be answered: what's being built (RAG app, search feature, recommendation engine?), expected scale (row count, QPS), self-hosted vs. managed preference, the stack it must integrate with, budget ceiling
## Sources: Official docs + vendor-neutral benchmarks (e.g. ANN-Benchmarks) for candidates such as Pinecone, Weaviate, Qdrant, Milvus, pgvector, Chroma — prefer neutral benchmarks over vendor blog claims; check maintenance activity, not just README polish
## Deliverable: Comparison table (features, pricing, hosting model, scale limits, integration effort) + one clear recommendation with reasoning
## Confidence & Gaps: State confidence per recommendation; explicitly flag that "our use case" is undefined and any recommendation is provisional until scope is confirmed
## Success Criteria:
  - The stated question is answered directly, with sources cited
  - A recommendation is made (not just options listed), with its reasoning
  - The use-case gap is called out, not silently assumed
```

Execute this enhanced prompt? (yes / edit / skip)

*(Flagged, not assumed: "our use case" isn't defined anywhere in this repo — it's a skill-library with no app code. If you tell me what you're actually building this for, I'll fold it into Scope before running the research.)*

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The task is categorized as Research and the enhanced prompt states what to investigate rather than answering the research question itself.
