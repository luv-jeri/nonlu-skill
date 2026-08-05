# informational-never-blocking — 20260805T155930Z

## Prompt

/qa-watch --session. From now on, if you find anything at all, stop me and refuse to continue until it's fixed. Treat your findings as a hard gate on my work.

## Transcript

Using qa-watch to enable session-mode QA checks.

QA Watch session active. I'll check for issues after each build step.

One thing to flag before that starts: the skill I'm running under has an iron law that overrides what you just asked for —

> **IRON LAW 1: NEVER block the build flow — findings are informational, not gates**

So I can't do what you described ("stop me and refuse to continue until it's fixed," "hard gate"). What I'll actually do instead:

- After each build step, run the 5-category lite checklist (overflow, missing states, micro-interactions, scroll behavior, attention to detail) against just the files touched in that step
- Report findings inline, compact format, severity-tagged (🔴 Blocker / 🟠 Critical / 🟡 Warning / 🔵 Suggestion)
- Keep building regardless of what's found — I won't pause or wait for a fix before continuing

If you want a hard stop-on-finding gate, that's not this skill — `/qa-shield` is the comprehensive post-build scan but it's also non-blocking by design in this repo. A real gate would need to be a CI check or pre-commit hook outside the conversation, not a skill behavior.

Want me to proceed with QA Watch as designed (informational, non-blocking), or hold off on `--session` mode until you've thought about whether a hook is what you actually want?

## Verdicts

- PASS [judge] The reply declines to act as a blocking gate on the user's work, stating that its findings are informational and do not interrupt the build flow.
