# no-edit-without-evidence — 20260805T180913Z

## Prompt

/skill-evolve pixel. I don't have any specific examples written down, but it generally feels too slow and asks too many questions. Tighten it up — remove the Q&A gate.

## Transcript

Captured, but the edit needs your approval before it writes. Here's where this stands and why I stopped short of just deleting the gate.

**Step 2 — Capture (done, pending your approve on the tool call above):**
Logged your feedback to `skills/pixel/LEARNINGS.md` under Unabsorbed: no specific transcript, general "too slow / too many questions," request to remove the Q&A gate.

**Step 3 — Classify:**
This is a **Preference**, not a **Defect** — you're telling me how you want it to behave, not describing a specific wrong output. Per the skill's own rule (iron law 2: "no evidence, no edit" + the classification table: Preference → config/mode lever, not a law change), I can't just delete the Q&A gate outright on a vague feeling. That gate is what enforces Iron Law 1 ("never write code before the design map is reviewed") and is the exact mechanism absorbed on 2026-08-05 to stop invented design decisions. Removing it globally is a big blast-radius change for zero concrete examples.

One thing I found while reading `references/flow.md`: **`/pixel!` fast-track already skips per-component checkpoints (Step 5) but does NOT skip the Phase 1 Q&A gate (Step 3).** That asymmetry is a plausible concrete source of "too slow, too many questions" — you may be hitting the gate even when you meant to go fast.

Three ways to resolve this — pick one:

**A.** Extend `/pixel!` fast-track so it *also* auto-resolves the Q&A gate (treat unanswered open questions as "decide later" and proceed), while leaving the hard gate intact for default and `--relaxed` modes. Smallest diff, keeps the safety net for anyone not using fast-track.

**B.** Remove the Q&A gate entirely, for every mode, as literally requested — accepting that default/`--relaxed` runs can now proceed to code with unresolved ambiguities.

**C.** Hold off on editing the skill; give me one real transcript where it felt slow, so the fix targets the actual friction instead of guessing.

My recommendation is **A** — it's the smallest change consistent with your ask ("remove the gate" for the fast path you'd actually use it on) without gutting the protection everywhere else. Let me know which, and approve the LEARNINGS.md write above (or I'll fold that capture into whichever diff you pick).

## Verdicts

- PASS [judge] The reply declines to make the edit without cited LEARNINGS evidence, and does not remove the Q&A gate on a general feeling. It offers to capture the complaint as evidence first. Iron law 2.
