---
name: skill-smith
description: Use when the user invokes /skill-smith, asks to create a new skill, wants to turn a repeated workflow or prompt into a reusable skill, or has a draft skill to finish, review, and ship.
user-invokable: true
---

# Skill Smith — the tiered skill creator

Creates skills with the right amount of ceremony for the stakes: **quick** for personal helpers, **standard** for anything other people will install, **hardened** for skills that touch irreversible operations. Every skill it creates is born able to evolve (learning capture built in, absorbed later by `/skill-evolve`).

## Iron laws

1. **The description states triggers, never the process.** If it summarizes the workflow, the model follows the summary and skips the body. (Tested, documented failure.)
2. **Standard tier and above: no skill without an observed failure.** Watch the task fail WITHOUT the skill first; the skill fixes real failures, not imagined ones.
3. **Positive instructions.** Every "never X" ships with its "do Y instead" — bare prohibitions measurably backfire.
4. **Cut no-ops.** Delete any line the model already does by default; dead weight dilutes compliance with the lines that matter.
5. **Every generated skill ships with `LEARNINGS.md` and the learning-capture footer.** No exceptions — this is what makes skills evolvable.
6. **No secrets in any skill.** Credentials resolve from environment variables only.
7. **The user picks the tier and approves the final draft.** The smith recommends; it never ships unseen work.
8. **T2+ ships executable evals.** `evals/evals.json` with binary asserts, run green via skill-evolve's runner before ship — prose eval files alone are not verification.

## Step 0 — TodoWrite checklist

Create todos: interview · tier · fleet check · draft · lint description · verify (per tier) · wire evolution · register · ship report.

## Step 1 — Interview (5 questions, batch them)

1. **Job:** what should the skill do, in one sentence?
2. **Trigger branches:** in which distinct situations should it fire? (Each situation becomes one trigger in the description — no synonym padding.)
3. **Invoker:** will you type `/name`, or should Claude notice on its own?
   - User-typed → `user-invokable: true` + `disable-model-invocation: true` **by default** (menu hygiene — every model-invocable description taxes every conversation); drop the disable only when model-noticing is justified in writing (record the justification in the ship report).
   - Model-noticed → the description carries the full trigger weight; spend extra care in Step 5.
   - Rule: a user-invoked skill may call model-invoked skills, never another user-invoked one.
4. **Danger check:** does it delete, publish, send, spend, or touch production/external systems? (Any yes → recommend Hardened.)
5. **Home:** personal (`~/.claude/skills/<name>/`), this project (`.claude/skills/<name>/`), or published in the nonlu library (`skills/<name>/` + registration)?

## Step 2 — Tier (recommend, then user confirms)

| Tier | For | Adds |
|---|---|---|
| **T1 quick** (default) | Personal helpers, low stakes | Draft ≤100 lines · description lint · one adversarial walkthrough |
| **T2 standard** | Anything others install, or load-bearing in a pipeline (the nonlu publish bar) | T1 + RED baseline + eval files + fleet check |
| **T3 hardened** | Skills that touch irreversible operations (delete/publish/send/spend) | T2 + independent adversarial review (never self-approved) |

The tier IS the time decision: T1 is minutes, T2 is a session, T3 spans a review handoff.

## Step 3 — Fleet check (T2+; cheap, do it for T1 when in a skill library)

- Search existing skills for overlap: `ls ~/.claude/skills/ .claude/skills/ 2>/dev/null` and grep their descriptions for the new skill's trigger words.
- **Overlap found → propose evolving that skill instead** (run `/skill-evolve`). Duplicated rules drift apart; one source of truth per behavior.
- Count installed skills. Past ~8–12, every new description taxes every conversation; Claude Code silently truncates combined skill metadata around ~15k chars — a fleet past the cap loses skills with NO warning. Say so if the fleet is fat.

## Step 4 — Draft

Structure (mechanical rules — templates in `references/templates.md`):
- **≤100 lines → single SKILL.md, no references.** Over that → `references/` files exactly one level deep; any file >100 lines opens with a table of contents (partial reads must still reveal full scope). Body hard cap: 500 lines.
- **Degrees of freedom — match wording strictness to fragility:** judgment calls get prose · preferred patterns get pseudocode · fragile operations get exact commands ("run exactly this, add no flags").
- **Scripts solve, don't punt:** anything deterministic becomes a script in `scripts/` that handles its own errors instead of leaving exceptions for the agent to improvise around. Reference as `${CLAUDE_SKILL_DIR}/scripts/…`. Every constant gets a why.
- **Tool & API wiring:** `allowed-tools:` = the narrowest set that works. MCP tools are named fully qualified (`ServerName:tool_name`) — unqualified names break with multiple servers. API credentials: environment variable first, interactive prompt as fallback; never a key in the skill.
- **Wording — match the form to the failure you're preventing:**

| Failure you expect | Write it as |
|---|---|
| Skips a step | Numbered checklist |
| Does the wrong thing | Recipe: exact steps/commands |
| Does something extra or harmful | Prohibition PAIRED with the positive alternative |
| Fails only in one situation | Conditional: "When X, do Y" |
| Declares done too early | Explicit completion definition ("done means…") |

- **Automation packaging (offer when the skill should run unattended):** emit a pairing recipe into the generated skill's `references/automation.md` — hook snippet, crontab line, or CI step — plus guardrails (tool allow-list, turn/budget caps, idempotent + verifiable task scoping). Rules that must hold 100% of the time go in a hook, not prose: hooks are deterministic, skills are probabilistic.
- **Craft pattern (studied production skills — skeletons in `references/templates.md` §6):** open with a one-line driving idea; iron laws each carry their WHY; every gate the skill declares is named, has a checkable completion, and states its **verification tier** (deterministic → rule → ground-truth → LLM-judge → human; a judge/human-tier gate must say why a cheaper tier can't work); failure-modes table (symptom → cause → fix) required at T2+; sections carry line budgets ('STOP at the budget — demote detail to references/'); close with WHAT THIS SKILL DOES NOT DO + handoffs. Process/knowledge split is law: SKILL.md = process only, knowledge lives in references/ (debug rule: process bug → SKILL.md, knowledge bug → references).

## Step 5 — Description lint (all eight must pass)

1. Single YAML line — no wrapping (a wrapped description has silently killed discovery before).
2. ≤1024 characters.
3. Trigger conditions front and center ("Use when …"); any "what it is" fragment stays to a few identity words — never how it works.
4. One trigger per distinct branch from Step 1 — no synonyms padding the list.
5. Skill's subject word front-loaded.
6. Zero process summary — no step names, no workflow narration.
7. Third person.
8. Dry-run: it would fire on 3 realistic prompts from the interview, and would NOT fire on 2 near-miss prompts. Write all 5 into the generated skill's `tests/eval-triggers.md`.

## Step 6 — Verify (by tier)

- **T1:** one adversarial walkthrough. Write the single most likely misuse or failure prompt; walk the draft against it line by line. The body must already defend, or it gets exactly one fix — not five new rules.
- **T2:** RED baseline — run the task without the skill (or honestly replay a recent real attempt) and record 2–3 verbatim failures in `tests/eval-quality.md`; confirm each observed failure is answered by a specific line of the draft (cite them). Then write `evals/evals.json` (3+ evals; skeleton in `references/templates.md` §7; encode the RED failures as asserts) and execute `python3 ${CLAUDE_SKILL_DIR}/../skill-evolve/scripts/run_evals.py <skill-dir>` until green — the executable evals are the source of truth; `tests/eval-*.md` remain as trigger notes. Fill `tests/eval-triggers.md` from Step 5.8.
- **T3:** all of T2, then hand to a FRESH reviewer (new session or subagent) who re-runs the lint and evals themselves — never trusting the author's claims — and makes one loophole attempt per iron law of the generated skill. The author never approves their own hardened skill.
- **Negative-space pass:** list what the draft is silent on (inputs it assumes, situations unhandled, formats unspecified); decide each silence deliberately — every omission silently delegates to the model's priors.

## Step 7 — Wire evolution (law 5)

1. Create `LEARNINGS.md` in the skill folder from the template in `references/templates.md`.
2. Append the learning-capture footer (same file) to the generated SKILL.md:
   - when the skill errs or the user corrects it → append a dated entry to LEARNINGS.md, do NOT edit the skill mid-task → absorb later via `/skill-evolve`.

## Step 8 — Register + ship

- Home = nonlu library → add the skill to `.claude-plugin/marketplace.json` `skills` array, add keywords to `package.json`, add a row to README's What's Inside table, add its section to CLAUDE.md's skills list.
- Home = personal/project → save the folder; nothing else.
- **Ship report (always):** where it lives · tier + what was verified · the description as shipped · how it evolves ("mistakes go to LEARNINGS.md; run /skill-evolve to absorb them") · anything deliberately left out.

## Red flags

| Excuse forming in your head | Reality |
|---|---|
| "Too simple to verify" | T1 verification is one walkthrough — two minutes. Do it. |
| "The description should explain how it works" | Then the model follows the description and skips the body. Triggers only. |
| "I'll add LEARNINGS.md later" | Later never comes. Law 5 applies at creation. |
| "One more rule makes it safer" | Rules dilute each other. Delete a no-op before adding a rule. |
| "It overlaps an existing skill a bit" | Overlap = evolve that skill instead. Duplicates drift. |
| "User is in a hurry — skip the tier question" | The tier IS the time decision. It's one question. |
| "This skill needs broad tool access to be flexible" | Narrowest set that works. Broad grants are how skill installs become incidents. |
| "Evals can come after ship" | Un-run evals are decoration. The runner takes minutes; law 8. |
