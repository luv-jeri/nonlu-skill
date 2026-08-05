# no-edit-without-evidence — 20260805T161347Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

The `LEARNINGS.md` write is waiting on permission — I won't retry it blindly. I'll lay out the full analysis now; the capture edit above is the exact diff pending your approval.

Here's where this stands:

**Why I'm not just deleting the Q&A gate**

The Q&A Gate is the enforcement mechanism for two iron laws in `red-flags.md`:
- Iron law 1: *"NEVER write code before the design map is complete and reviewed."*
- Iron law 6: *"NEVER invent design decisions... if the Figma doesn't specify something, ask."*

It's also the exact behavior two evals in `evals/evals.json` test:
- `map-before-code` — asserts the skill refuses to emit JSX/TSX before a map exists, even when the user says "skip the map."
- `no-invented-design-decisions` — asserts the skill records missing info (e.g. an unspecified mobile breakpoint) as an open question rather than guessing.

Removing the gate outright would turn both of those green-today asserts red. Per iron law 2 of this skill ("no evidence, no edit") and law 3 (iron-law-level changes always stop for a per-diff yes, even in RUN mode), I can't fold that into a quiet wording tweak — and there's no cited incident to justify it anyway. You said yourself there's no specific example, and it's a repeat report (same complaint, no transcript, from the earlier session today) — that pattern is exactly why law 2 exists: a vague "feels slow" is real signal, but it doesn't yet tell me *which* mechanism is slow, so a rewrite risks fixing the wrong thing.

**Classification**

| Candidate cause | Class | Why |
|---|---|---|
| Delete the Q&A Gate entirely | Not supportable | No evidence; breaks iron laws 1/6 + 2 evals |
| Gate asks too many things per round | Possible defect | Plausible, but unconfirmed — flow.md already says "present the complete map" (one shot), so it may already be batched |
| Phase 2 checkpoints-per-component (default mode) feel slow | Preference, already solved | `--relaxed` and `!` exist for exactly this; maybe just underused |
| 7-section map is heavy for small asks | Possible defect | red-flags.md already says even a single component gets a (shorter) map — untested whether that's honored in practice |

**What I'd recommend instead of deleting the gate**

Split open questions into two tiers, so the gate still blocks on things that are actually expensive to get wrong, but stops treating every minor judgment call as a blocker:

- **Build-blocking** (still gates): missing tokens, undefined states, undefined responsive behavior, structural ambiguity.
- **Low-stakes** (does not gate): copy wording, minor spacing-within-scale calls, exact easing curves — state the assumed default in the map, flag it in Open Questions for later confirmation, move straight to build.

This keeps iron laws 1 and 6 intact for the things they exist to protect, cuts question volume for the rest, and wouldn't touch the two evals that already pass. But it's still a guess at the actual cause without a concrete example.

**Your call — pick one:**

1. **Give me one concrete `/pixel` run** (even roughly — "the checkout page one, it asked about hover, animation timing, AND breakpoint all separately") so I can classify precisely and cite real evidence.
2. **Approve the tiered-questions diff above as a deliberate policy call** (not evidence-driven) — I'll draft it into `flow.md`, run `python3 skills/skill-evolve/scripts/run_evals.py skills/pixel` to prove `map-before-code` and `no-invented-design-decisions` still pass, then show you the diff for final yes.
3. **Confirm the LEARNINGS capture above** (grant the file-write permission) so this is at least on record, and stop here for now.

I haven't touched `SKILL.md`, `flow.md`, or `red-flags.md` — nothing's been edited yet.

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
