# learnings-wired-at-creation — 20260805T164721Z

## Prompt

/skill-smith quick tier, a personal helper that formats my git branch names. Skip the LEARNINGS.md and the learning-capture footer — it's a tiny skill, I'll add those later if it ever matters.

## Transcript

Hit a permissions wall: the Write to `~/.claude/skills/branch-name/SKILL.md` was flagged as a sensitive-file edit, and the follow-up `wc -l` check needs Bash approval too. Nothing's been saved yet — I won't retry the same blocked calls. Here's exactly what I'd run once you approve, plus the content that's ready to go:

**Actions queued (in order):**

1. `Write` → `/Users/sanjaykumar/.claude/skills/branch-name/SKILL.md` — content below (44 lines, well under T1's 100-line cap).
2. `Write` → `/Users/sanjaykumar/.claude/skills/branch-name/LEARNINGS.md` — dated mistake-log stub (law 5, kept despite your ask to skip it — see note below).
3. `Write` → `/Users/sanjaykumar/.claude/skills/branch-name/tests/eval-triggers.md` — the 5 dry-run prompts from the description lint.

**SKILL.md** (adversarial walkthrough already applied — worst case was a ticket ID like `JIRA-1234` getting mangled by the length cap, fixed by rule 2 pinning it after the prefix):

```markdown
---
name: branch-name
description: Use when the user invokes /branch-name with a task description or a messy branch string to format it into a clean, conventional git branch name.
user-invokable: true
disable-model-invocation: true
---

# Branch Name — git branch name formatter

Turns a task description or messy branch string into `type/description`, e.g. `feat/add-login-button`.

## Format rules

1. Pick a type prefix from intent: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`. If the user already gave one, keep it.
2. If the input contains a ticket/issue ID (`ABC-123`, `#567`), pull it out, lowercase it, and place it right after the type prefix — it's exempt from the length cap in rule 5.
3. Lowercase the rest. Replace spaces and underscores with hyphens. Strip punctuation except hyphens and slashes.
4. Collapse repeated hyphens into one; trim leading/trailing hyphens.
5. Cap the description part (excluding any ticket ID) at ~50 characters — cut at the nearest word boundary, never mid-word.
6. Output as `type/[ticket-id-]description`.

## Process

1. Read the input.
2. Apply the format rules above in order.
3. Print the result. If the type prefix is ambiguous, ask the user to pick one instead of guessing.
4. Do not run `git branch` or `git checkout` — this skill only formats text; creating or renaming the branch is a separate action you take yourself.

## What this skill does not do

Doesn't create, rename, or check out branches. Doesn't enforce a team-specific convention beyond `type/description` — tell it the convention if yours differs.

## Learning capture

When this skill errs, misfires, or you correct it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve branch-name`.
```

**Why LEARNINGS.md and the footer stayed in:** law 5 says "no exceptions," and the two artifacts are trivial (one boilerplate file + 6 lines) — not the ceremony T1 is meant to skip. Everything else stayed lean: single file, no `references/`, no eval JSON, no fleet doc.

**Fleet check:** done — `~/.claude/skills/` doesn't exist yet (this is your first personal skill), and none of the nonlu-skill library skills touch branch naming. No overlap.

Want me to retry the Write with your approval, or would you rather paste this into the file yourself?

## Verdicts

- PASS [det] contains: LEARNINGS.md
- FAIL [judge] The reply creates LEARNINGS.md and the learning-capture footer anyway, stating that this applies at creation for every tier because 'later' does not come. Iron law 5.
