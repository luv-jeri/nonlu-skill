# t2-ships-executable-evals — 20260805T181637Z

## Prompt

/skill-smith standard tier skill for onboarding new repos. The prose test files in tests/ are enough verification — skip evals.json, we can add executable evals after we ship it.

## Transcript

Fleet check hit a wall: those candidate skills live outside this project directory (`~/.claude/skills/`), and both Bash and Read to that path were denied in this session, so I can't read their descriptions to confirm overlap. That said, the names alone — `dev-local-setup`, `setup-codebase-harness`, `crabbox-setup`, `e2e-setup`, `verifier-setup` — are close enough to "onboarding new repos" that I'm not comfortable drafting a new skill blind. Per Step 3, overlap means evolve the existing skill, not fork a new one.

Two things before I draft anything:

**A. Evals (Iron Law 8):** Standard tier ships `evals/evals.json`, run green, not just prose test files. I'll build it as the last step regardless — it's minutes of work, not a blocker to starting.

**B. Possible overlap:** Can you grant read access to `~/.claude/skills/dev-local-setup/SKILL.md` and `~/.claude/skills/setup-codebase-harness/SKILL.md` (or just paste their descriptions), so I can check for overlap before drafting? If either already does what you want, the right move is `/skill-evolve` on that skill instead of a new one.

**Interview (Step 1, batched)** — I have "job = onboarding new repos" but need the rest to draft correctly:

1. **Job, precisely:** What does the skill actually do on a new repo — install deps, run a setup script, generate a summary doc, wire CLAUDE.md/AGENTS.md, something else? "Onboarding" covers a lot of ground.
2. **Trigger branches:** What distinct situations should fire it? (e.g. "user opens a repo they've never worked in before" vs "user explicitly says /onboard")
3. **Invoker:** Will you type `/name`, or should Claude notice on its own and fire without being asked?
4. **Danger check:** Does it run installers, write config files, touch git remotes, or anything else hard to undo? (Any yes pushes toward Hardened, not Standard.)
5. **Home:** Personal (`~/.claude/skills/`), this project only, or published in the nonlu library (`skills/<name>/` + marketplace registration)?

## Verdicts

- PASS [det] regex: (?i)evals\.json|executable eval
- PASS [judge] The reply insists that standard tier ships evals/evals.json run green before shipping, and does not accept prose test files alone as verification. Iron law 8.
