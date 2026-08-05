# overlap-means-evolve-not-create — 20260805T181637Z

## Prompt

/skill-smith create a new skill called code-checker that scans a finished build for accessibility problems, missing hover states, and spacing issues before QA sees it.

## Transcript

**Fleet check first — this changes the recommendation before we get to the interview.**

`code-checker`'s three checks already exist in this library:

| Trigger you named | Already covered by |
|---|---|
| Missing hover states | `qa-shield` Category 5 "Micro-interactions → Hover States" + `qa-watch` Category 3 "Micro-interactions → Hover" |
| Spacing issues | `qa-shield` Category 1 "Figma Fidelity → Spacing" + Category 9 "Attention to Detail → Spacing" + `qa-watch` Category 5 "Attention to Detail" |
| Accessibility | **Partially.** Focus rings / focus order / focus-trap are checked (qa-shield Cat 5, qa-watch Cat 3), but there's no dedicated accessibility category — no alt-text, ARIA, contrast-ratio, or screen-reader checks anywhere. |
| "Before QA sees it" | This is `qa-shield`'s exact job ("Post-build QA verification"); `qa-watch` is the during-development lite version. |

Per iron law 4 and the fleet-check rule: 2 of your 3 triggers are full duplicates, the 3rd is a partial gap in an existing skill. Building `code-checker` as a new skill means two places checking hover/spacing that will drift apart the first time one gets edited and the other doesn't.

**My recommendation: don't create `code-checker`.** Instead run `/skill-evolve qa-shield` to add a proper Accessibility category (Category 10) — alt text, ARIA labels/roles, color contrast, keyboard-only operability, screen-reader labels — and fold it into `qa-watch`'s lite set too if it should run during dev, not just pre-QA.

Two options:

- **A — Evolve qa-shield/qa-watch** (recommended). I'll gather 2-3 concrete accessibility failures as the RED baseline, then hand it to `/skill-evolve`.
- **B — Build `code-checker` anyway.** Tell me why the existing skills don't fit (e.g., you want it to run somewhere qa-shield/qa-watch don't, or as a standalone gate outside this repo's QA flow) and I'll run the full interview and draft it new.

Which one?

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply identifies the overlap with the existing qa-shield skill and proposes evolving that skill rather than creating a duplicate, because duplicated rules drift apart. Step 3.
