# no-edit-without-evidence — 20260805T163650Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

## Skill: pixel · Mode: EVOLVE (requested), but there's a gap to flag first

**What I read:** `SKILL.md`, `references/flow.md`, `references/red-flags.md`, `LEARNINGS.md`, `evals/evals.json`, `tests/eval-triggers.md`, `tests/eval-quality.md`, `evals/eval-log.md`.

**The evidence problem:** `LEARNINGS.md` → Unabsorbed is **empty**. The one entry in Absorbed (2026-08-05, "a deferral was recorded as a resolved design decision") is already closed out and unrelated to speed. Skill-evolve's iron law 2 is "no evidence, no edit" — I don't have a cited incident to point a diff at, only your general read that it's slow and asks too much.

**Classified as: Preference**, not Defect. Per the classification table, a preference becomes a pattern/config knob, not a rewritten law — which matters here because "the Q&A gate" isn't incidental, it's load-bearing:

- Iron Law 1: *"NEVER write code before the design map is complete and reviewed"*
- DO-NOT list: *"Do NOT proceed past the Q&A gate with unanswered questions"*
- `evals/evals.json` → `map-before-code` asserts exactly this: given a prompt that asks to skip the map, the reply must refuse and must not emit code.

Deleting the gate outright doesn't just remove friction — it removes the mechanism those two iron laws depend on, and it would need `map-before-code` consciously rewritten too (law 5), not just left to go red.

**Two options — recommending the first:**

| | Scope | What changes | Cost |
|---|---|---|---|
| **A — scoped (recommended)** | `/pixel!` only | Fast-track already skips per-component checkpoints; extend it to also skip the Q&A gate — auto-resolve open questions with a stated, flagged assumption and build straight through, with every assumption surfaced in the Final Audit for review | Default `/pixel` and `--relaxed` untouched. `map-before-code` eval untouched (its prompt doesn't use `!`). No iron law rewritten, just the fast-track's scope widened in `flow.md` |
| **B — literal** | Every invocation | Remove Step 3 from `flow.md`, drop/rewrite Iron Law 1's "and reviewed," delete the DO-NOT line | Breaks `map-before-code` outright — that eval has to be deleted or rewritten as a conscious call, not a side effect. Weakens the skill's core "map is the contract" guarantee for every user, not just people asking for speed |

One more thing worth naming: default `/pixel` already checkpoints after *every component*, and `--relaxed` (per-section) and `/pixel!` (no checkpoints, audit only) already exist as escape hatches. If you're hitting the full gate + full checkpoint frequency, part of "too slow" may just be not reaching for `--relaxed`/`!` yet — worth confirming before we touch the file.

**Before I draft the actual diff text: which do you want — A, B, or should I capture this as a dated LEARNINGS entry now and hold off editing until a concrete instance shows up?** Either way nothing gets applied without you seeing the literal diff first (law 3).

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
