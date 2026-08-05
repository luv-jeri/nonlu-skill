# Quality evals — recap

## RED baseline (observed failures without the skill) — 2026-08-05

All three were observed in the session that built this skill, before any of it existed.

1. **Verbatim user complaint:** *"anytime I do the chatting using Codex or the claude
   Code in the terminal or using their desktop app, it basically gives very text-based
   things, which is very hard to read. There is no summary at the end of the work has
   been done."*
   → answered by SKILL.md § "Step 4 — Emit the capsule in your reply" (a fixed visual
   shape replaces prose) and Iron law 3 (a summary is owed whenever work is material).

2. **Delivery-channel failure, measured:** a script printed a formatted ANSI box to
   stdout. Asked whether he saw it, the user replied *"no i didnt saw anything here in
   claude code terminal"*; his screenshot showed Claude Code had collapsed it to
   `Ran 2 shell commands`.
   → answered by Iron law 1 (the recap is emitted in the reply text, never through
   script stdout) and the "Recap printed but invisible" row of the failure-modes table.

3. **Hand-drawn layout failure:** in the same probe, a box typed by the model came out
   with a ragged right border because emoji and box characters were mixed mid-line.
   → answered by Iron law 4 (one emoji, at line start) and the deterministic
   `recap.py check` gate, which fails a capsule whose lines exceed 76 display columns or
   whose item lines carry more than one glyph.

## Grading rubric

A good recap **must**:
- appear only when `recap.py facts` reports `material: yes`
- carry the literal marker `📋 RECAP`
- keep every line ≤76 display columns and ≤6 item lines
- use exactly one glyph per item line, at the start, from the fixed vocabulary
- state decisions that were logged during the work, each with a real rejected alternative
- name only files that appear in the baseline-diffed `facts` output
- mark unverified work ⚠️ rather than ✅

A good recap **must never**:
- invent a decision, a rationale, or a rejected alternative that was not logged
- claim files that were already dirty when the session started
- appear after a trivial exchange where nothing material happened
- be emitted through a tool call, a script, or a file instead of the reply text
- pad itself with a prose introduction before the capsule

## Verification performed at build time

| Check | Method | Result |
|---|---|---|
| Format checker actually fails | `recap.py selftest` — 7 mutation cases, each rule violated in turn, plus a no-op case that must stay green | ALL GREEN |
| Border strings agree | selftest width assertion | both 53 cols |
| No-journal attribution | `facts` on a fresh session | `material: no`, 0 files |
| Cross-session isolation | two sessions, same repo, distinct decisions | no mixing |
| HTML export | rendered in Chrome from the exported file | renders correctly |
| Executable evals | `run_evals.py skills/recap`, three consecutive runs | 22/22 PASS each time |
| Model output vs checker | the capsule the model actually generated, piped through `recap.py check` | ok |
| Token cost | tiktoken over four generated closing replies | mean **192 tokens** per recap |

**Verification-tier note.** 18 of the 22 asserts are deterministic. Two rules were moved
off the judge after it graded them wrongly in both directions (see LEARNINGS 2026-08-05):
an LLM judge is the right tier for comprehension, and the wrong tier for anything a
regex can measure.

**Known gap.** The eval harness has no tool access, so it cannot test the journal
protocol end to end — whether the model actually calls `recap.py log` at decision time,
rather than reconstructing decisions at the end, is only observable in real sessions.
The scripts' own behaviour is covered by `selftest`; the model's discipline in calling
them is not. Watch for this in the first weeks of use and log misses to LEARNINGS.md.
