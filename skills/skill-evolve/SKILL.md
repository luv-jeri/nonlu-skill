---
name: skill-evolve
description: Use when the user invokes /skill-evolve, reports that a skill misfired or gave a wrong result, wants a mistake recorded so a skill never repeats it, or asks to improve an existing skill from its accumulated learnings.
user-invokable: true
---

# Skill Evolve — capture mistakes, upgrade skills with proof

The other half of Skill Smith: skills evolve through evidence and an approved diff — never by silently rewriting themselves. Capture is instant and free; change is deliberate and gated.

## Iron laws

1. **Capture immediately, edit never mid-task.** The moment something goes wrong, it gets written down; the skill file itself only changes in a dedicated evolve pass.
2. **No evidence, no edit.** Every proposed change cites specific LEARNINGS entries.
3. **Diff + explicit human yes before anything is applied.** RUN-mode exception: invoking RUN mode is the standing yes for eval-scored wording/structure edits during that run (each kept only by a green re-run, committed individually, each revertible); edits that add/remove/change an iron law, the description's triggers, or delete a rule still stop for a per-diff yes.
4. **Deletions are first-class.** Every evolve pass hunts sediment: no-op lines, rules for one-off flukes, duplicated guidance. A skill that only ever grows is decaying.
5. **Re-verify after editing.** Re-run `tests/eval-triggers.md` and `tests/eval-quality.md` mentally; a change that breaks an eval is rejected (or the eval is consciously updated with the user). When the skill has `evals/evals.json`, re-verify means EXECUTE: `python3 ${CLAUDE_SKILL_DIR}/scripts/run_evals.py <skill-dir>` — a change that turns a passing assert red is rejected (or the eval consciously updated with the user).
6. **Absorbed learnings are moved, never deleted** — and every applied change gets a changelog line and a git commit.
7. **Constitution-style files are never touched** (files marked human-edit-only).

## Step 0 — TodoWrite checklist

Create todos: identify skill + mode · capture / read learnings · classify · draft diff · re-verify · present + apply · absorb + commit · (RUN mode: evals check → baseline → one-change loop → log).

## Step 1 — Identify the skill and the mode

- Which skill? (If the user just says "it got this wrong", find the skill that was active.)
- **CAPTURE mode** — something just went wrong: go to Step 2, then stop unless asked to evolve now.
- **EVOLVE mode** — absorb accumulated learnings: skip to Step 3.
- **RUN mode** — the user asks to run the improvement loop on a skill: skip to Step 7.
- No `LEARNINGS.md` yet? Create it (template in skill-smith's `references/templates.md`) and note the skill predates the learning system.

## Step 2 — CAPTURE (always safe)

Append a dated entry to the skill's `LEARNINGS.md` under **Unabsorbed**, newest first:
- **What happened** (verbatim where possible — the error message, the wrong output)
- **Expected vs actual**
- **Root-cause guess** (it's fine to be unsure — say so)
- **Context** (task, project, prompt)

Then say what was captured, and stop. Do not "quickly fix the skill inline" — that's how skills fill with untested rules.

## Step 3 — EVOLVE: read, then classify every unabsorbed entry

Read the skill's SKILL.md (+ load-bearing references), `LEARNINGS.md` Unabsorbed, and `tests/`. Classify each entry:

| Class | Meaning | Action |
|---|---|---|
| **Defect** | The skill's instructions caused or allowed the failure | Fix the skill |
| **Fluke** | One-off (environment, typo, unrelated bug) | Keep logged; NO rule added |
| **Trigger gap** | Skill should have fired (or not fired) and didn't | Edit the description's triggers |
| **Preference** | User wants it done their way | Pattern/config file, not a law |

The classification IS the safety mechanism: it stops one-time accidents from becoming permanent rules that fight every future task.

## Step 4 — Draft the diff

- For each defect, write the fix using the form that matches the failure: skipped step → numbered checklist · wrong action → exact recipe · harmful extra → prohibition PAIRED with the positive alternative · situational failure → "When X, do Y" · premature done → explicit completion definition.
- **Sediment sweep (law 4):** before adding anything, scan the whole body once for lines to remove — rules the model follows by default, guidance duplicated elsewhere, leftovers from absorbed learnings. Body stays under its size budget (≤500 lines; if it was ≤100 and single-file, keep it so).
- Keep the diff minimal: the smallest edit that answers the cited evidence.

## Step 5 — Re-verify (law 5)

Run `tests/eval-triggers.md` (would routing change? should it?) and `tests/eval-quality.md` against the edited draft. Breakage → drop or rework the change, or consciously update the eval with the user.

## Step 6 — Present, apply, absorb

1. Show the diff with, per change: the LEARNINGS entries it cites and its classification.
2. On yes: apply the edit · move cited entries to **Absorbed** ("absorbed YYYY-MM-DD → what changed") · add a changelog line (in the skill's SKILL.md footer or the repo changelog) · commit with a message naming the skill and the learnings absorbed.
3. On no (or partial): apply only what was approved; the rest stays Unabsorbed.

## Step 7 — RUN mode (the eval-driven improvement loop)

Requires `evals/evals.json` in the target skill — no evals yet → offer to write them first (3+ evals; binary asserts, "two strangers get the same answer"; prefer deterministic `{"check": …}` entries over prose judge asserts; schema skeleton in skill-smith's `references/templates.md`). Working tree for the skill must be clean (commit or stash first). Then loop:

1. **Baseline:** `python3 ${CLAUDE_SKILL_DIR}/scripts/run_evals.py <skill-dir>` — record the score.
2. **One change:** pick the single failing assert with the clearest cause; make ONE edit to SKILL.md (or the load-bearing reference file, for router skills). One edit = one iteration — never batch.
3. **Re-run** the same command.
4. **Keep or revert by score:** improved → `git add <skill-dir> && git commit -m "evolve(run): <skill> — <one-line change> [<before>→<after>]"`. Dropped or tied → revert the edit (`git checkout -- <skill-dir>`). Tied = revert; feelings don't compound, scores do.
5. **Log every iteration** (kept or reverted) to `<skill-dir>/evals/eval-log.md`: `| # | date | score before → after | change tried | kept? |`.
6. **Stop when:** all asserts pass · two consecutive reverted iterations · the user interrupts · or the next fix would touch an iron law or the description's triggers (stop and present that diff — law 3).

Tier note: the loop optimizes exactly what the asserts measure — deterministic asserts fix structure/format; judge asserts only approximate taste. A human still reads the final diff trail.

## Red flags

| Excuse | Reality |
|---|---|
| "Just fix the skill inline, it's a one-liner" | Capture first. Untested inline edits are how skills rot. |
| "Add a rule for that error" | Classify first — a fluke logged is safer than a fluke legislated. |
| "Nothing to delete this pass" | Look again. Sediment hides; law 4 says hunt every pass. |
| "The user already said yes in general" | Yes is per-diff. Show this diff. |
| "Skip the evals, the change is obviously safe" | Obvious changes broke evals before. Two minutes. |
| "Batch three fixes this pass — faster" | One change per iteration, or the score can't attribute the win. |
| "The score tied but the change feels better" | Tied = revert. The eval-log remembers what feelings forget. |

## Learning capture

This skill records its own mistakes too: when /skill-evolve errs or the user corrects it, append a dated entry to `LEARNINGS.md` in this folder — then absorb it in a later pass (yes, it evolves itself, through the same gate).
