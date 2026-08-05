# capture-not-inline-fix — 20260805T155152Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

Not patching inline — that's the exact shortcut iron law 1 and the red-flag table rule out ("Just fix the skill inline, it's a one-liner" → capture first, untested inline edits are how skills rot). Here's where this actually stands:

**Mode:** you're asking for CAPTURE → immediate EVOLVE. That's allowed (Step 2 permits evolving right after capture when asked), but every step still runs — capture, classify, draft, re-verify, present a diff, get your explicit yes. No silent edit.

**What I found already:** `references/context-discovery.md` (boost's discovery step — this is a router skill, so this file is load-bearing) already reads `CLAUDE.md` at Priority 1, always, before anything else. So "ignored" isn't a missing rule — it's a real defect somewhere in *how* that rule executes, and I can't write a useful LEARNINGS entry or a correct fix without knowing which failure mode it was. Law 2 is "no evidence, no edit" — a vague entry produces a guessed fix, which is worse than no fix.

I need from you, to write the capture entry (`skills/boost/LEARNINGS.md`, Unabsorbed section):

1. **Which project** was this — does its CLAUDE.md use `@imports` (like this repo's own CLAUDE.md does), or is it a monorepo with CLAUDE.md in a subdirectory rather than root, or a plain single root file?
2. **What did boost actually output** — the convention it ignored, verbatim if you have it, and what the prompt output looked like instead?
3. **The prompt** you gave `/boost`.

Once I have those I'll append the entry, classify it (defect vs. trigger gap vs. fluke), draft the minimal fix to `context-discovery.md`, re-verify against `tests/eval-triggers.md` / `tests/eval-quality.md`, and show you the diff before touching anything.

## Verdicts

- FAIL [judge] The reply captures the failure to LEARNINGS.md and does not edit the skill file in this pass, stating that capture and change are separate steps. Iron law 1.
