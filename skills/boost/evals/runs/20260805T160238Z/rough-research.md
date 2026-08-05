# rough-research — 20260805T160238Z

## Prompt

/boost research the best vector databases for our use case

## Transcript

**Boost enhanced your prompt:**

```
Task: Research and recommend vector database options that fit this project's actual use case
Type: Research

Context:
- Repo: nonlu-skill (Banyan venture "skill-library" — Agent Skills plugin: markdown skill files + JSON metadata only, no application backend, no existing database layer of any kind)
- No existing vector/embedding/database usage found anywhere in this repo's skills, docs, or code
- Adjacent but separate system: Banyan's trunk uses "memsearch" (semantic search over markdown memory, via Smriti) and mentions of a "MemPalace archive" search index — these live outside this venture (trunk-level, `~/Claude/Projects/banyan/`) and this venture must not read/write trunk internals directly (Banyan isolation law)
- boost-patterns.md is present but still the blank starter template — no team-defined aliases/conventions to draw on
- Ambiguous term: "our use case" is not defined anywhere in this repo — cannot be resolved without asking

Research Question: Which vector database(s) best fit "our use case" — needs the use case defined before a real comparison is possible

Scope / Comparison Criteria: Unknown — investigate. Needs answers to:
  - What is the actual use case? (e.g., semantic search over Smriti/memory markdown, RAG for a specific venture, embeddings for a new feature?)
  - Self-hosted vs. managed/cloud?
  - Expected scale (rows/vectors, QPS)?
  - Budget ceiling?
  - Must integrate with an existing stack, or greenfield?

Constraints: Unknown — investigate (no constraints stated or inferable from project conventions; do not invent budget, hosting, or scale constraints)

Success Criteria: A short comparison (e.g., a table) of 3-5 candidate vector databases against the clarified use case, with a clear recommendation and the tradeoffs that drove it
```

Two things worth flagging before I run this:

1. **"Our use case" is undefined** — this repo (nonlu-skill) has no database or vector-search need of its own. If you mean Banyan's Smriti/memsearch system, that's trunk-level and this venture shouldn't read/write it directly per the isolation rule. Worth clarifying which system this is actually for before I research.
2. This is closer to a general **research** question than a coding task in this repo — I'll treat it as pure research/comparison, not an implementation task.

Execute this enhanced prompt? (yes / edit / skip) — or just tell me the actual use case and I'll fold it in.

## Verdicts

- PASS [det] contains: **Boost enhanced your prompt:**
- PASS [det] contains: Unknown — investigate
- PASS [det] not_contains: Executing as-is.
- PASS [judge] The task is categorized as Research and the enhanced prompt states what to investigate rather than answering the research question itself.
