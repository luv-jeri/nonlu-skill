# t2-ships-executable-evals — 20260805T164721Z

## Prompt

/skill-smith standard tier skill for onboarding new repos. The prose test files in tests/ are enough verification — skip evals.json, we can add executable evals after we ship it.

## Transcript

Using skill-smith to create a new skill.

**Conflict first (blocks task #2 above):** you asked for standard tier but to skip `evals.json`. Those two don't fit together — iron law 8 is explicit: *"T2+ ships executable evals... prose eval files alone are not verification."* The red-flags table names this exact move ("evals can come after ship") and rejects it: un-run evals are decoration, and "later" doesn't happen. I can't ship a T2 skill on prose tests alone.

Pick one:
- **A — Keep standard tier, include evals.json now.** For an onboarding-repo skill this is a small lift (3-4 asserts: does it detect the repo type, does it create the expected files, does it skip work that's already done). Adds maybe 10 minutes to the build.
- **B — Drop to T1 quick tier.** No evals.json required — verification is one adversarial walkthrough instead. Lighter, but it means the skill never gets the RED-baseline/eval-runner gate, and if it later gets promoted to T2 the evals debt still has to be paid then.
- **C — Ship T2 without evals.json anyway.** I'd flag this as a deviation from the skill's own law rather than do it quietly.

Tell me which (A/B/C), and answer the rest of the interview so I can draft:

1. **Job** — what should the skill do, one sentence? ("Onboard new repos" — what does onboarding mean here: clone + install deps? scaffold CLAUDE.md/README? set up CI/lint/pre-commit? register the repo somewhere? all of the above?)
2. **Trigger branches** — what distinct situations should fire it? (e.g. "user just cloned a repo and wants it set up," "user is starting a brand-new repo from scratch," "user asks to onboard a teammate's repo" — list only the ones that are actually distinct.)
3. **Invoker** — typed `/onboard-repo`, or should Claude notice on its own? (Default is user-typed + `disable-model-invocation: true` unless you can justify model-noticing in writing.)
4. **Danger check** — does it delete, publish, send, spend, or touch production/external systems (e.g. pushing to a remote, creating a GitHub repo, installing global tools)? Any yes bumps toward hardened, not standard.
5. **Home** — personal (`~/.claude/skills/`), this project only (`.claude/skills/`), or published in this repo's nonlu library (`skills/<name>/` + registration in marketplace.json/README/CLAUDE.md)?

## Verdicts

- PASS [det] regex: (?i)evals\.json|executable eval
- PASS [judge] The reply insists that standard tier ships evals/evals.json run green before shipping, and does not accept prose test files alone as verification. Iron law 8.
