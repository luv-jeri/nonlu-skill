# overlap-means-evolve-not-create — 20260805T164721Z

## Prompt

/skill-smith create a new skill called code-checker that scans a finished build for accessibility problems, missing hover states, and spacing issues before QA sees it.

## Transcript

Fleet check (Step 3) found real overlap — need your call before I draft anything.

## What already exists

Two of your three targets are already fully covered:

| Target | Already covered by | Where |
|---|---|---|
| **Hover states** | `qa-shield` Category 5, `qa-watch` Category 3 (Micro-interactions) | `skills/qa-shield/SKILL.md:230-236`, `skills/qa-watch/SKILL.md:157-161` |
| **Spacing** | `qa-shield` Category 9, `qa-watch` Category 5 (Attention to Detail) | `skills/qa-shield/SKILL.md:262-269`, `skills/qa-watch/SKILL.md:168-174` |
| **Accessibility** | Only tangentially — focus-ring visibility and keyboard focus order (part of Micro-interactions), nothing else | `skills/qa-shield/SKILL.md:232-233` |

So accessibility is a real gap (no ARIA, alt text, contrast, semantic HTML, or keyboard-operability-of-custom-widgets checks anywhere in the fleet). Hover states and spacing are not — a new `code-checker` skill would duplicate rules that already exist in two places, and per the skill's own guidance, duplicated rules drift apart instead of staying one source of truth.

**My recommendation:** don't build a new skill. Evolve `qa-shield` (and mirror into `qa-watch`'s lite list) to add a proper **Accessibility** category — that closes the actual gap without creating a third skill that overlaps two existing ones on 2 of 3 checks.

## Your call

- **A — Evolve qa-shield/qa-watch** to add a real Accessibility category (`/skill-evolve qa-shield`). Fastest, no drift risk.
- **B — Build `code-checker` anyway**, scoped to accessibility only (drop hover/spacing since they're already owned elsewhere) — a focused a11y-only skill.
- **C — Build `code-checker` anyway, full scope as asked** (accessibility + hover + spacing), accepting the duplication with qa-shield/qa-watch.

If you pick B or C, I still need the rest of the Step 1 interview before I can draft:

1. **Trigger branches** — is this always a manual `/code-checker` run, or should it ever fire on its own (e.g., right after a build)?
2. **Invoker** — user-typed (`/code-checker`, menu-hygiene default: model won't self-trigger) or should Claude notice on its own and run it unprompted?
3. **Danger check** — confirms read-only (scan/report, no auto-fix, no writes to production) — correct?
4. **Home** — personal (`~/.claude/skills/`), this project only (`.claude/skills/`), or published in this nonlu library (`skills/` + registered in marketplace.json)?

Which of A/B/C, and if B or C, your answers to 1-4?

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply identifies the overlap with the existing qa-shield skill and proposes evolving that skill rather than creating a duplicate, because duplicated rules drift apart. Step 3.
