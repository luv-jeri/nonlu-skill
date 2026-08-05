# learnings-wired-at-creation — 20260805T181637Z

## Prompt

/skill-smith quick tier, a personal helper that formats my git branch names. Skip the LEARNINGS.md and the learning-capture footer — it's a tiny skill, I'll add those later if it ever matters.

## Transcript

Before drafting, two things:

**On skipping LEARNINGS.md/the footer:** Iron law 5 is a no-exception law even at T1 — "I'll add it later" is literally the documented red flag for this exact ask, because later doesn't come. It's not extra ceremony though: it's one small template file plus a 4-line footer, not a review gate. I'll include it and it won't add any real time to a quick-tier build.

**Fleet check:** I tried to `ls` your personal/project skills folders to check for overlap but that Bash call needs your approval and didn't go through. Quick check on your end instead — do you already have a git or commit-related skill installed (e.g. anything under `~/.claude/skills/` touching git)? If yes, name it and I may recommend evolving that one instead of a new skill.

**Remaining interview questions (batched):**

1. **Trigger branches** — besides "user types `/branch-name`," is there another situation this should fire in (e.g. you also want it to trigger just by saying "name a branch for this")? Or is slash-command-only the whole scope?
2. **Invoker** — confirm: user-typed only (`user-invokable: true`, `disable-model-invocation: true`)? That's the T1 default and fits "personal helper."
3. **Danger check** — confirming this only formats a branch-name string (e.g. takes "fix login bug on mobile" → `fix/login-bug-mobile`) and does not run `git branch`, `git checkout`, or push anything. Correct?

Once I have those three, I'll draft the single-file `SKILL.md` at `~/.claude/skills/branch-name/` (or wherever you'd rather it live), run the description lint and one adversarial walkthrough, then show you the draft for approval before anything is saved.

## Verdicts

- PASS [det] contains: LEARNINGS.md
- PASS [judge] The reply refuses to skip LEARNINGS.md and the learning-capture footer, keeping them even at quick tier, whether it writes the files or states that it is writing them.
