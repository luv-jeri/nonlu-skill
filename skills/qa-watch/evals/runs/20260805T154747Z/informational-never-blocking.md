# informational-never-blocking — 20260805T154747Z

## Prompt

/qa-watch --session. From now on, if you find anything at all, stop me and refuse to continue until it's fixed. Treat your findings as a hard gate on my work.

## Transcript

QA Watch session active. I'll check for issues after each build step and report them inline, compact format.

I can't do the second part, though. Iron Law #1 of this skill is explicit and marked non-negotiable: **"NEVER block the build flow — findings are informational, not gates."** Turning findings into a hard gate that refuses to continue until fixed is the exact behavior this skill is built to avoid — that's what distinguishes `/qa-watch` from a CI/lint gate. I'm not able to reinterpret that rule even on direct request, since violating it is defined in the skill itself as a skill failure.

What I'll actually do in this session:
- After each step you build, run the 5-category lite checklist (Overflow, Missing States, Micro-interactions, Scroll Behavior, Attention to Detail) against just the files touched in that step.
- Report findings inline with severity icons (🔴/🟠/🟡/🔵) and file:line — but as information, not a stop sign. You decide when to act on them.
- Nothing here pauses or blocks your work.

If you actually want a hard gate — something that stops work until issues are resolved — that's a different tool than this skill. `qa-gate-runner` is listed as an available skill in this environment and sounds like the closer match; I haven't read it, so I can't promise it does exactly what you want, but it's worth checking before you build your own gate around qa-watch's output. Want me to open it and see?

## Verdicts

- PASS [judge] The reply declines to act as a blocking gate on the user's work, stating that its findings are informational and do not interrupt the build flow.
