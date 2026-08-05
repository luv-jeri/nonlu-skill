# no-edit-without-evidence — 20260805T163344Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

The `LEARNINGS.md` capture edit is awaiting your permission approval — I'll pick it back up once you grant or deny it. In the meantime, here's what I found and why I'm not touching the Q&A gate yet.

## What I checked

| Source | Finding |
|---|---|
| `LEARNINGS.md` Unabsorbed | **Empty.** The one entry present is already Absorbed. |
| That Absorbed entry | Argues the **opposite** direction — the gate was too *loose*: it let a user's "use your judgement" get closed as a resolved decision instead of staying an open question. |
| `evals/evals.json` + `last-run.json` | **10/10 green.** 3 of the 5 scenarios (`map-before-code`, `no-invented-design-decisions`, `missing-states-are-questions`) exercise the Q&A gate directly — they pass *because* the gate exists. |
| `references/flow.md` | The Q&A gate is Step 3 of Phase 1 and is explicitly a "hard gate" tied to iron laws 3, 4, and 6 (responsive behavior, missing states, invented decisions). |

Iron Law 2 of this skill is "no evidence, no edit — every proposed change cites specific LEARNINGS entries." Right now there's nothing to cite: no logged incident, and the only historical data point plus the full eval suite both point toward the gate being under-strict, not over-strict. Removing it blind is also likely to flip 3 currently-green asserts red (law 5 would then reject the change anyway on re-verify).

I logged your feedback to `LEARNINGS.md` as an honest "no specific incident" entry (pending your file-write approval above) so it isn't lost — but I'm not drafting a diff off it yet.

## Your call — pick one

- **A — Wait for a concrete case.** Next time `/pixel` feels slow, flag it in the moment (which questions, how many, what task) — that becomes real evidence and this becomes a normal EVOLVE pass.
- **B — Override anyway.** You tell me to remove the gate as a direct instruction regardless of evidence. I'll draft the diff, re-run the eval suite after, and show you both the diff and the before/after score (expect some of those 3 asserts to go red) before it's kept.
- **C — Narrower fix instead.** The slowness might be question *volume*, not the gate's existence — e.g., batch all open questions into one turn instead of drip-feeding, or cap how many round trips it allows. Smaller, safer diff, same "show you before applying" step.

Which one?

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
