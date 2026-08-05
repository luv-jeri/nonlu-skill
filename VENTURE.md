# VENTURE.md — passport: nonlu-skill

| Field | Value |
|---|---|
| **Name / slug** | Nonlu Skills (Claude Code plugin / Agent Skills package) / `nonlu-skill` |
| **Type** | `skill-library` — a NEW venture type; this venture is its source of truth (no playbook distilled yet) |
| **Status** | `active` |
| **Born** | 2026-07-06 · **resident graft** — moved from `~/Claude/Projects/nonlu-skill` on Sanjay's explicit words: "pull in the next project called nonlu-skill as the new venture here … add the nonlu-skill under this" |
| **Produces** | Reusable AI-agent skills (markdown + Python stdlib, MIT). Seven shipped: `/boost` (prompt enhancer — generalized beyond coding 2026-07-06), `/pixel` (Figma → pixel-perfect UI), `/qa-shield` (post-build QA sweep), `/qa-watch` (catch issues while building), `/skill-smith` (tiered skill creator), `/skill-evolve` (skill evolution loop), `/recap` (visual work summary — 2026-08-05). All seven carry `LEARNINGS.md` mistake logs AND executable `evals/evals.json` |
| **Needs** | Sanjay's direction per skill. Graft-day goals DONE 2026-07-06 (research → skill-smith + skill-evolve + boost generalization). Next: use `/skill-smith` on real skill needs; run `/skill-evolve` when LEARNINGS entries accumulate |
| **Approval chain** | Sanjay (anything public: pushes to the GitHub repo, marketplace listing changes) |
| **Budget line** | ₹0/$0 — no spend without a fresh yes |
| **Memory** | none yet — the repo's own docs are the record (`README.md`, `CLAUDE.md`, per-skill `tests/eval-*.md`); add a `memory/` folder when the first lessons land |
| **Skills** | Banyan pack (pointer in `CLAUDE.md`). Note: the repo's `skills/` folder is this venture's PRODUCT, not its session tooling |
| **Vitals** | 🟢 — actively developed (qa-shield + qa-watch shipped in the latest commits); waiting on nothing external · 2026-07-06 |

Notes — how this venture ACTUALLY works (source of truth: its own `README.md` + `CLAUDE.md`):

- Each skill lives in `skills/<name>/` with a `SKILL.md`. Two structural patterns exist: **self-contained** (whole process in SKILL.md — the target for new skills; qa-shield, qa-watch, skill-smith, skill-evolve, recap) and **thin router** (SKILL.md is an index delegating to `references/*.md`; boost, pixel). Match the pattern of the skill you touch.
- **Distribution:** a skill only ships once listed in `.claude-plugin/marketplace.json` (`skills` array) plus keywords in `package.json`. **Testing is executable as of 2026-08-05:** `python3 skills/skill-evolve/scripts/run_evals.py <skill-dir>` runs a skill's `evals/evals.json` (exit 0 = green). All seven skills carry one. `tests/eval-*.md` are now the human record of why each assert exists, not the test itself.
- **Remote:** GitHub `luv-jeri/nonlu-skill`, **private** since 2026-07-06 (directed: "make the nonlu skill as private as well — we will make it public later maybe or maybe not"); fully pushed. Was public at graft; the graft-day paperwork was held unpushed until the flip.
- Count correction from graft day: Sanjay said 3 skills; the repo actually ships 4 (`qa-watch` was the recent fourth).
