# Executable-evals upgrade — directed lane

**Directive:** Sanjay 2026-07-11: "please read the handoff and complete the task 1 and 2" — Task 2 = skill-creator evals upgrade, standing yes given 2026-07-11; design source: banyan research/agentic-os-skills/REPORT.md §6.

## Files changed

- `skills/skill-evolve/scripts/run_evals.py` — proven eval runner copied verbatim (selftest-verified: PASS 1 good, 4 bad, 1 invariant).
- `skills/skill-evolve/SKILL.md` — RUN mode added (Step 7 eval-driven improvement loop); law 3 RUN-mode exception; law 5 re-verify now EXECUTES evals.json when present; Step 0/Step 1 wiring; 2 new red flags.
- `skills/skill-smith/SKILL.md` — new iron law 8 (T2+ ships executable evals, run green); Q3 disable-model-invocation by default; Step 4 craft-pattern bullet; Step 6 T2 writes+executes evals.json; negative-space pass; 1 new red flag.
- `skills/skill-smith/references/templates.md` — §6 craft-pattern skeleton + §7 evals.json skeleton appended; Contents updated.
- `CLAUDE.md` — eval runner documented as the repo's one test tool; Key Rules note on evals.json + RUN mode.
- `evolution/inbox/.gitkeep`, `evolution/approved/` — directed lane created in this venture.

## Law-3 RUN-mode exception — rationale

Invoking RUN mode is the consent boundary: every edit inside the loop is eval-scored (kept only by a green re-run), committed individually, and each revertible — so the invocation itself is the standing yes for wording/structure edits during that run. Edits that add/remove/change an iron law, the description's triggers, or delete a rule still stop for a per-diff yes.

## NOT authorized

- No pushes.
- No edits beyond the files listed above.
- Other skills get evals via separate runs.
