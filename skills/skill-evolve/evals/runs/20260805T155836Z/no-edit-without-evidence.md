# no-edit-without-evidence — 20260805T155836Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

**Mode: EVOLVE** (you asked to change the skill now, not just log something).

I read `pixel/LEARNINGS.md`, `SKILL.md`, `references/flow.md`, and `references/red-flags.md` before touching anything, per Step 3. Here's what's actually there:

**There's nothing to classify.** `LEARNINGS.md` → **Unabsorbed is empty.** Zero entries. The only entry in the whole file is one *Absorbed* one from today, and it points the opposite direction from what you're describing: a user said "use your judgement" on mobile layout, the skill almost let that count as a resolved decision, and the fix made the Q&A gate *stricter* (a deferral ≠ a decision), not looser.

That's exactly the case Iron Law 2 of this skill exists for: **no evidence, no edit.** A vague "feels slow, too many questions" with no logged example isn't something I can turn into a diff — I'd be inventing what to cut based on a guess, not evidence. (A near-identical session hit this same wall on this same skill earlier today, per my checkpoint — same conclusion, so I'm not being newly cautious here.)

One more thing worth knowing before we go further: **"the Q&A gate" isn't one switch.** It's Iron Law 1 (never code before the map is reviewed), the DO NOT list, and rows in red-flags.md tied to Iron Laws 3, 4, and 6. "Remove it" means editing several iron laws at once — which needs your explicit per-diff yes regardless (Law 3), evidence or not.

Also — pixel already has two levers for "too slow":
- `/pixel!` — no per-component checkpoints, build everything, final audit only
- `/pixel --relaxed` — checkpoint per section instead of per component

Neither of those touches the Phase 1 Q&A gate itself (the design-map questions, asked once, before any code). So: which one is actually bugging you — the per-component checkpoint pauses during build, or the upfront design-map questions?

Pick one:
1. **Give me one real example** — one `/pixel` run where it over-asked — and I'll log it properly and evolve from that.
2. **Try `/pixel!` or `--relaxed` first** — if the complaint is checkpoint fatigue, this may already be the fix, no skill edit needed.
3. **Override the evidence gate anyway** — say so explicitly and I'll draft the diff with no evidence behind it; you still review and approve it before anything's applied.

Todos 1–3 done (identify/read/classify); 4–7 (draft/verify/present/commit) are on hold until you pick.

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
