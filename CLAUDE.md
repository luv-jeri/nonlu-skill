# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agent Skills — Contributor Conventions

## Project Structure

This is a Claude Code plugin / Agent Skills package. No application code — only markdown skill files, JSON metadata, and documentation. Nine skills ship: `boost`, `pixel`, `qa-shield`, `qa-watch`, `skill-smith`, `skill-evolve`, `recap`, `site-capture`, `model-crew`.

## Key Rules

- Each skill lives in `skills/<name>/` with a `SKILL.md`, plus optional `references/`, `examples/`, `patterns/`, and `tests/`.
- SKILL.md frontmatter needs three fields: `name`, `description`, and `user-invokable: true`. Six skills are slash-command only; `recap` is additionally model-invocable because its end-of-work branch has to fire without being typed (justification recorded in `skills/recap/tests/eval-triggers.md`), and so is `model-crew`, because its users ask "which free models can I use?" without knowing the skill's name (`skills/model-crew/tests/eval-triggers.md`).
- Every skill ships with a `LEARNINGS.md` (dated mistake log, appended the moment the skill errs) and a "Learning capture" footer in SKILL.md — `/skill-evolve` absorbs entries into skill edits with human approval. New skills get this wired by `/skill-smith` automatically (its iron law 5).
- Description field = ONLY trigger conditions ("Use when user invokes /x"), NEVER a process summary. This is the string Claude matches on to fire the skill (Claude Search Optimization); a description that summarizes the process instead of the trigger mis-fires.
- Each skill MUST create a TodoWrite checklist at start for step tracking.
- Each skill has its own `tests/eval-triggers.md` (does it fire on the right prompts?) and `tests/eval-quality.md` (output grading rubric).
- **All seven skills carry `evals/evals.json`** (as of 2026-08-05); it is the executable source of truth and must run green before a change merges. `/skill-evolve` RUN mode is the eval-driven improvement loop (one change per iteration, commit/revert by score, logged to `evals/eval-log.md`).
- **Prefer deterministic asserts over judge asserts.** A judge graded the same rule wrongly in both directions during recap's build — it passed output that violated the rule, then failed output that did not. If a regex or a count can measure it, do not hand it to a model.
- **A red assert is not automatically a skill defect.** Read the transcript under `evals/runs/` before editing anything: several reds in this repo's history were badly written tests, and fixing the test was the correct action. Record which it was in `evals/eval-log.md`.
- **Never point an eval prompt at live repo state.** An eval that names a real path, or says "absorb this skill's learnings", tests the working tree at that instant, not the skill. This bit six evals on 2026-08-05: prompts named `src/components/Checkout.tsx` in a markdown-only repo (skill correctly answered "nothing to scan"), claimed unabsorbed learnings that did not exist (skill correctly refused to invent them), and started RUN mode against a dirty tree (skill correctly refused). Paste the component, the learnings, or the scenario **into the prompt**.
- **One observable behavior per assert.** A compound assert ("keeps to the lite checklist AND names /qa-shield") fails correct work on its sub-clause and sends you hunting a defect that is not there. Split it into two evals.

### Two SKILL.md patterns — know which one you're editing

The repo mixes two structures. Match the one already in the skill you touch; don't convert between them without a reason.

- **Self-contained** (`qa-shield` 405 lines, `qa-watch` 307 lines): SKILL.md holds the entire process — iron laws and red flags inline. `references/` is supplementary detail only. Test: could Claude run the full process without opening any reference file? Yes. **This is the target for new skills.**
- **Thin router** (`boost` 37 lines, `pixel` 36 lines): SKILL.md is an index that delegates each step to a `references/*.md` file — including `references/red-flags.md` for the iron laws. Here the reference files ARE load-bearing; changing process behavior means editing the reference, not SKILL.md.

## Build, test & distribution

- **One test tool ships: the eval runner.** `python3 skills/skill-evolve/scripts/run_evals.py <skill-dir>` executes a skill's `evals/evals.json` (binary asserts: deterministic checks natively + prose asserts judged by a cheap model) — exit 0 green; `--selftest` proves the runner offline. Every skill now has one, so `evals.json` is always the source of truth and `tests/eval-*.md` are the human record of why each assert exists (RED baseline, description lint, trigger rationale).
- **Eval runs are slow** — a skill with long prompts and judge asserts can exceed 10 minutes. Run them with `run_in_background: true` rather than blocking, and never conclude "still running" means broken.
- **Distribution:** a skill is only shipped once it's listed in `.claude-plugin/marketplace.json` (`skills` array). Adding a skill = create `skills/<name>/`, register it there, and add relevant `keywords` to `package.json`.

## Skills

### Boost (`skills/boost/`) — thin-router pattern
Prompt enhancer — transforms rough prompts into structured, context-rich prompts.

- `SKILL.md` — ~37-line index; delegates every step to a reference file
- `references/flow.md` — the actual 9-step enhancement process (load-bearing)
- `references/red-flags.md` — iron laws (load-bearing)
- `references/context-discovery.md`, `references/prompt-passthrough.md` — step logic
- `references/task-templates.md` — 7 category templates, loaded per-category on demand
- `examples/before-after.md` — transformation examples
- `patterns/boost-patterns.md` — starter template for users
- `tests/` — eval framework

### Pixel (`skills/pixel/`) — thin-router pattern
Figma-to-pixel-perfect UI — design map first, then incremental build-verify cycles.

- `SKILL.md` — ~36-line index; delegates every step to a reference file
- `references/flow.md` — the actual build process (load-bearing)
- `references/red-flags.md` — iron laws (load-bearing)
- `references/input-detection.md`, `references/token-extraction.md` — step logic
- `references/design-map.md` — 7-section design map structure with table formats
- `references/verification.md` — checkpoint and final audit checklists
- `examples/design-map-example.md` — design map example
- `tests/` — eval framework

### QA Shield (`skills/qa-shield/`) — self-contained pattern
Post-build QA verification — 9-category scan for attention-to-detail issues.

- `SKILL.md` — complete self-contained skill (process, iron laws, scoping, severity framework)
- `references/checklist-categories.md` — detailed checks per category (9 categories)
- `references/report-format.md` — report template with severity levels
- `examples/sample-report.md` — complete example QA Shield report
- `tests/` — eval framework

### QA Watch (`skills/qa-watch/`) — self-contained pattern
Lightweight QA companion — 5-category lite checks during development.

- `SKILL.md` — complete self-contained skill (process, iron laws, lite checklist, session mode)
- `references/lite-checklist.md` — detailed checks for the 5 lite categories
- `examples/sample-watch-output.md` — example mid-build watch output
- `tests/` — eval framework

### Skill Smith (`skills/skill-smith/`) — self-contained pattern
Tiered skill creator — T1 quick / T2 standard / T3 hardened; description linter; wires evolution into every skill it creates.

- `SKILL.md` — complete self-contained skill (iron laws, tier table, 8-step process, description lint, red flags)
- `references/templates.md` — generated-skill skeletons, LEARNINGS.md template, learning-capture footer, tests skeletons
- `LEARNINGS.md` — its own mistake log
- `tests/` — eval framework

### Recap (`skills/recap/`) — self-contained pattern
Closes a unit of work with a visual capsule plus a decision log, emitted in the reply text.

- `SKILL.md` — complete self-contained skill (iron laws, capsule format, glyph vocabulary, materiality rules, journal protocol, gates)
- `scripts/recap.py` — one script, subcommands: `open` · `log` · `facts` · `check` · `close` · `gate` · `export` · `selftest`
- `template.html` — fixed HTML shell for `/recap --open`; never generated per run
- `LEARNINGS.md` — its own mistake log (four defects caught during its own build)
- `tests/`, `evals/evals.json` — 22 asserts, 18 deterministic

**Why the recap lives in the reply, not in script output:** measured 2026-08-05 — a script
printed a formatted box to stdout and Claude Code collapsed it to `Ran 2 shell commands`;
the user saw nothing. Tool stdout is a model channel, not a human channel. Never "fix"
this skill by moving rendering into a script.

### Site Capture (`skills/site-capture/`) — self-contained pattern
Website experience capture engine — studies a reference site (frames, styles, shaders, network, motion, cursor) into an evidence folder + RECREATE report; ships the recreation quality bar and review loop. The one skill here with a runtime: `npm install` inside the skill folder (Playwright + pngjs), Chrome via `channel: 'chrome'`.

- `SKILL.md` — complete self-contained skill (iron laws, process, quality bar, review loop, failure modes)
- `src/` — the capture engine (run/scroll/evidence/network/report/motion-forensics/cleanup)
- `bin/` — `site-capture.mjs` entry, `asset-qa.py`, `cutout-art.py`, `recreate-review.mjs`
- `injected/` — the in-page probe (shader capture via `shaderSource`/`linkProgram` hooks)
- `docs/` — capture checklist + Phase B engine spec
- `tests/` — fixture suite (`run-fixture-test.sh`: full capture + kill-9 orphan check) + unit tests
- `LEARNINGS.md` — its own mistake log

### Model Crew (`skills/model-crew/`) — self-contained pattern
Finds the user's AI tools and the models they can use now (free first), asks intake questions one at a time, writes a staged plan, and runs its parts in parallel on worker models through their headless CLIs.

- `SKILL.md` — complete self-contained skill (iron laws, setup, intake Q1–Q9, plan format, run results, doctor, failure modes)
- `scripts/crew.py` — one stdlib script: `detect` · `save-key` · `config` · `models` · `run` · `doctor` · `selftest` (60 offline tests; a fake route stands in for real AI tools)
- `LEARNINGS.md` — its own mistake log
- `tests/`, `evals/evals.json` — 28 asserts, 21 deterministic
- Spec and plan: `docs/superpowers/specs/2026-10-05-model-crew-design.md`, `docs/superpowers/plans/2026-10-05-model-crew.md`

**Worker flags are verified per tool version** (the `ROUTES` table in `crew.py`, dated). When a tool changes its CLI, `crew.py doctor` check D10 reports it; fix `ROUTES` only, since D10 reads the same table.

### Skill Evolve (`skills/skill-evolve/`) — self-contained pattern
Capture skill mistakes instantly; upgrade skills via classified evidence + approved diff (never silent self-editing).

- `SKILL.md` — complete self-contained skill (capture/evolve modes, classification table, deletion sweep, red flags)
- `LEARNINGS.md` — its own mistake log (it evolves itself through the same gate)
- `tests/` — eval framework

## Making Changes

1. Identify the skill's pattern first. For self-contained skills (qa-shield, qa-watch, skill-smith, skill-evolve, recap, model-crew), SKILL.md IS the process — edit it directly. For routers (boost, pixel), edit the relevant `references/*.md`; SKILL.md only changes when the step index changes.
2. Run `tests/eval-triggers.md` mentally — would any trigger behavior change?
3. Update `tests/eval-quality.md` if grading criteria changed.
4. Verify against the skill's pattern: for self-contained skills, could Claude execute the full process without reading ANY reference file? For routers, does every step in SKILL.md still point to a real reference file?

## Banyan membership (2026-07-06)

This project is a venture of **Banyan** — the multi-venture tree at `~/Claude/Projects/banyan`. Its passport is `VENTURE.md`. It moved here from `~/Claude/Projects/nonlu-skill` on 2026-07-06 (directed: "pull in the next project called nonlu-skill as the new venture here").
Banyan skills (seed/graft/dream/status) live at `~/Claude/Projects/banyan/skills/<name>/SKILL.md` — Read and follow one when a task calls for it. Tree law: `~/Claude/Projects/banyan/brain/00-TREE.md`. Venture type: `skill-library` (no playbook yet — this venture is the type's source of truth). On any conflict between this file and Banyan's constitution (`~/Claude/Projects/banyan/CLAUDE.md`), Banyan's constitution wins.

@~/Claude/Projects/banyan/memory/GLOBAL-LESSONS.md
