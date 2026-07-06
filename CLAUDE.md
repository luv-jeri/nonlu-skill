# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agent Skills — Contributor Conventions

## Project Structure

This is a Claude Code plugin / Agent Skills package. No application code — only markdown skill files, JSON metadata, and documentation. Four skills ship: `boost`, `pixel`, `qa-shield`, `qa-watch`.

## Key Rules

- Each skill lives in `skills/<name>/` with a `SKILL.md`, plus optional `references/`, `examples/`, `patterns/`, and `tests/`.
- SKILL.md frontmatter needs three fields: `name`, `description`, and `user-invokable: true` (all four skills are slash-command invoked).
- Description field = ONLY trigger conditions ("Use when user invokes /x"), NEVER a process summary. This is the string Claude matches on to fire the skill (Claude Search Optimization); a description that summarizes the process instead of the trigger mis-fires.
- Each skill MUST create a TodoWrite checklist at start for step tracking.
- Each skill has its own `tests/eval-triggers.md` (does it fire on the right prompts?) and `tests/eval-quality.md` (output grading rubric).

### Two SKILL.md patterns — know which one you're editing

The repo mixes two structures. Match the one already in the skill you touch; don't convert between them without a reason.

- **Self-contained** (`qa-shield` 405 lines, `qa-watch` 307 lines): SKILL.md holds the entire process — iron laws and red flags inline. `references/` is supplementary detail only. Test: could Claude run the full process without opening any reference file? Yes. **This is the target for new skills.**
- **Thin router** (`boost` 37 lines, `pixel` 36 lines): SKILL.md is an index that delegates each step to a `references/*.md` file — including `references/red-flags.md` for the iron laws. Here the reference files ARE load-bearing; changing process behavior means editing the reference, not SKILL.md.

## Build, test & distribution

- **No build/lint/test tooling.** `package.json` has no `scripts`; there is no test runner. The `tests/eval-*.md` files are specs evaluated by reading and reasoning ("run eval-triggers.md mentally"), not executed.
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

## Making Changes

1. Identify the skill's pattern first. For self-contained skills (qa-shield, qa-watch), SKILL.md IS the process — edit it directly. For routers (boost, pixel), edit the relevant `references/*.md`; SKILL.md only changes when the step index changes.
2. Run `tests/eval-triggers.md` mentally — would any trigger behavior change?
3. Update `tests/eval-quality.md` if grading criteria changed.
4. Verify against the skill's pattern: for self-contained skills, could Claude execute the full process without reading ANY reference file? For routers, does every step in SKILL.md still point to a real reference file?

## Banyan membership (2026-07-06)

This project is a venture of **Banyan** — the multi-venture tree at `~/Claude/Projects/banyan`. Its passport is `VENTURE.md`. It moved here from `~/Claude/Projects/nonlu-skill` on 2026-07-06 (directed: "pull in the next project called nonlu-skill as the new venture here").
Banyan skills (seed/graft/dream/status) live at `~/Claude/Projects/banyan/skills/<name>/SKILL.md` — Read and follow one when a task calls for it. Tree law: `~/Claude/Projects/banyan/brain/00-TREE.md`. Venture type: `skill-library` (no playbook yet — this venture is the type's source of truth). On any conflict between this file and Banyan's constitution (`~/Claude/Projects/banyan/CLAUDE.md`), Banyan's constitution wins.

@~/Claude/Projects/banyan/memory/GLOBAL-LESSONS.md
