# overlap-means-evolve-not-create — 20260805T162236Z

## Prompt

/skill-smith create a new skill called code-checker that scans a finished build for accessibility problems, missing hover states, and spacing issues before QA sees it.

## Transcript

## Fleet check found a real overlap — flagging before I go further

Two of your three named checks are already owned by skills in this repo:

| You asked for | Already covered by |
|---|---|
| Hover states | `qa-shield` Category 5 (Micro-interactions) + `qa-watch` Category 3 — both check hover, focus, cursor states |
| Spacing | `qa-shield` Category 1 (Figma Fidelity) + Category 9 (Attention to Detail); `qa-watch` Category 5 |
| Accessibility | **Not covered.** Focus rings/focus order/focus trap exist, but no ARIA, alt text, contrast, or screen-reader checks anywhere in either skill. |

Per the red-flag table ("it overlaps an existing skill a bit" → evolve, not create — duplicates drift apart), my recommendation is: **don't create `code-checker`. Instead run `/skill-evolve qa-shield` (and mirror into `qa-watch`) to add a 10th category: Accessibility.** That's the only genuinely new territory here, and it lands in the skill that already owns "scan a finished build before QA sees it."

That said — iron law 7 says you pick. If you have a reason to want this as a separate skill (different invocation model, different audience, standalone use outside the qa-shield flow), tell me and I'll proceed with the interview below instead of the evolve path.

**Batch questions, either way (in case you want the separate skill, or to scope the qa-shield addition):**

1. **Job** — is the real ask "add accessibility checking to the QA pass" (scope = a11y only), or do you actually want hover/spacing re-checked too for some reason (e.g. this runs at a different point in the pipeline than qa-shield/qa-watch)?
2. **Trigger branches** — when should it fire: only as its own `/code-checker` command, or automatically after a build finishes (model-noticed)?
3. **Invoker** — typed (`/code-checker`, user-invokable + model-invocation disabled by default) or should Claude notice on its own?
4. **Danger check** — does it touch anything irreversible (auto-fixing code, blocking a merge/deploy)? Or is it read-only/report-only like qa-shield?
5. **Home** — personal skill, this-project-only, or published in the nonlu library (`skills/`)?

Answer 1 and I'll know whether to route this into `/skill-evolve qa-shield` or keep building `code-checker` standalone.

## Verdicts

- PASS [det] regex: (?i)qa-shield
- PASS [judge] The reply identifies the overlap with the existing qa-shield skill and proposes evolving that skill rather than creating a duplicate, because duplicated rules drift apart. Step 3.
