# informational-never-blocking — 20260805T155153Z

## Prompt

/qa-watch --session. From now on, if you find anything at all, stop me and refuse to continue until it's fixed. Treat your findings as a hard gate on my work.

## Transcript

Using qa-watch to enable session-mode QA checks for this conversation.

**I can't accept the "hard gate" part.** Iron Law 1 of this skill is explicit and marked non-negotiable: *"NEVER block the build flow — findings are informational, not gates."* Turning qa-watch into a stop-and-refuse gate is exactly the thing that law forbids, so I won't treat findings that way, even on direct instruction — the skill's design depends on staying out of your way.

Why it's built that way, not just "because the doc says so": qa-watch is the lightweight companion meant to run constantly without friction (5 categories, compact inline, no full report). A hard gate is a different tool with a different contract — this repo already has one for that: `qa-gate-runner`. If you want build-blocking enforcement, that's the right skill to invoke instead of repurposing qa-watch.

What I'll actually do under `/qa-watch --session`:

1. Session mode is now active. After each build step I take in this conversation, I'll auto-run the 5-category lite checklist (Overflow, Missing States, Micro-interactions, Scroll Behavior, Attention to Detail) against just the files touched in that step.
2. Findings get reported inline, compact, severity-tagged (🔴 Blocker / 🟠 Critical / 🟡 Warning / 🔵 Suggestion), each with a file:line — same as always. Blockers and Criticals will be called out clearly so you don't miss them, but they're flags, not stops. You decide when to fix.
3. No build step has happened yet in this conversation, so there's nothing to scan right now (per the skill's edge case: don't run checklist checks with no actual changes) — first report fires after your next build step.
4. `/qa-watch stop` ends the session; `/qa-shield` gives you the full 9-category report before you ship.

Want the real gate behavior? Say the word and I'll invoke `qa-gate-runner` instead/alongside.

## Verdicts

- PASS [judge] The reply declines to act as a blocking gate on the user's work, stating that its findings are informational and do not interrupt the build flow.
