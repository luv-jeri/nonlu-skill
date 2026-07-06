# VENTURE.md — passport: nonlu-skill

| Field | Value |
|---|---|
| **Name / slug** | Nonlu Skills (Claude Code plugin / Agent Skills package) / `nonlu-skill` |
| **Type** | `skill-library` — a NEW venture type; this venture is its source of truth (no playbook distilled yet) |
| **Status** | `active` |
| **Born** | 2026-07-06 · **resident graft** — moved from `~/Claude/Projects/nonlu-skill` on Sanjay's explicit words: "pull in the next project called nonlu-skill as the new venture here … add the nonlu-skill under this" |
| **Produces** | Reusable AI-agent skills that other people can install (pure markdown, zero dependencies, MIT). Four shipped: `/boost` (prompt enhancer), `/pixel` (Figma → pixel-perfect UI), `/qa-shield` (post-build QA sweep), `/qa-watch` (catch issues while building) |
| **Needs** | Sanjay's direction per skill. Next steps he named at graft time (not yet started): (1) review the shipped skills and make them better; (2) build an "ultimate skill creator" — a skill that creates new skills, because he ships skills frequently |
| **Approval chain** | Sanjay (anything public: pushes to the GitHub repo, marketplace listing changes) |
| **Budget line** | ₹0/$0 — no spend without a fresh yes |
| **Memory** | none yet — the repo's own docs are the record (`README.md`, `CLAUDE.md`, per-skill `tests/eval-*.md`); add a `memory/` folder when the first lessons land |
| **Skills** | Banyan pack (pointer in `CLAUDE.md`). Note: the repo's `skills/` folder is this venture's PRODUCT, not its session tooling |
| **Vitals** | 🟢 — actively developed (qa-shield + qa-watch shipped in the latest commits); waiting on nothing external · 2026-07-06 |

Notes — how this venture ACTUALLY works (source of truth: its own `README.md` + `CLAUDE.md`):

- Each skill lives in `skills/<name>/` with a `SKILL.md`. Two structural patterns exist: **self-contained** (whole process in SKILL.md — the target for new skills; qa-shield, qa-watch) and **thin router** (SKILL.md is an index delegating to `references/*.md`; boost, pixel). Match the pattern of the skill you touch.
- **Distribution:** a skill only ships once listed in `.claude-plugin/marketplace.json` (`skills` array) plus keywords in `package.json`. No build/lint/test tooling — the `tests/eval-*.md` files are specs evaluated by reading, not executed.
- **Remote:** GitHub `luv-jeri/nonlu-skill` (MIT), up to date at graft time (997b3b9 — includes a contributor-guide rewrite found uncommitted at graft and ratified as-is per shared lesson G4).
- Count correction from graft day: Sanjay said 3 skills; the repo actually ships 4 (`qa-watch` was the recent fourth).
