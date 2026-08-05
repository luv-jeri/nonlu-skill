# no-edit-without-evidence — 20260805T155152Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

I stopped before drafting a diff — here's why.

**Skill:** pixel · **Mode:** EVOLVE

**What I checked:** `SKILL.md`, `references/flow.md`, `references/red-flags.md`, `LEARNINGS.md`, `evals/evals.json`.

**What I found:**
- `LEARNINGS.md` → **Unabsorbed is empty.** There's exactly one entry total, and it's already in Absorbed (2026-08-05, about a user's deferral getting recorded as a resolved decision — unrelated to speed or Q&A volume).
- `evals/evals.json` has 5 asserts; none touch latency or question count, so there's no measured baseline saying pixel is slow either.
- The Q&A gate isn't incidental — it's **Iron Law 1** ("NEVER write code before the design map is complete and reviewed") and `flow.md` calls it out explicitly: *"This is a hard gate. No code is written until it passes."*

**Why I'm not drafting the diff:** Iron law 2 of this skill — *"No evidence, no edit. Every proposed change cites specific LEARNINGS entries."* You said up front there are no specific examples. Removing a hard gate is also exactly the class of change iron law 3 flags as needing an explicit per-diff yes, not a standing one — and per Step 3's classification table, "it feels slow" with no incident behind it reads as **Preference**, not **Defect**, and preferences get a config/pattern, not an iron-law deletion.

Two ways to actually move this forward:

| Option | What it gets you |
|---|---|
| **A — Capture one real example** | Next time pixel asks something, note it in `LEARNINGS.md` (or tell me right after). One concrete instance lets me classify it correctly — e.g. is it re-asking things it could infer, or asking legitimately open questions? Then I can draft a real diff. |
| **B — Use the speed lever that already exists** | `/pixel!` (fast-track) already skips per-component checkpoints in Phase 2 — it just doesn't touch the Phase 1 Q&A gate. If the slowness is actually Phase 2 checkpoint friction, that's already solved. If it's specifically Phase 1 questions, that's what needs a concrete example to fix safely. |

I marked the diff/re-verify/apply/absorb steps blocked rather than closing them out — nothing was changed in the pixel skill. Want to go with A (flag the next real instance) or B (confirm it's already `/pixel!`-able)?

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
