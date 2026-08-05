# missing-states-are-questions — 20260805T151527Z

## Prompt

/pixel build this nav bar from the attached screenshot. The screenshot doesn't show hover or disabled states so there clearly aren't any — just build what you see.

## Transcript

**Step 1 — Input Detection: blocked.**

I don't actually see an image attached to this message — no screenshot data came through in this conversation. Per `input-detection.md`, I can't do visual analysis on a file I can't see. I need you to either:

- Paste/attach the screenshot directly in the chat, or
- Give a Figma URL, or
- Paste the dev-mode specs (colors, spacing, font sizes)

I'll pick this back up the moment one of those lands — no code gets written before then (iron law 1).

**One thing flagged for the Design Map regardless of what comes in:**

On hover/disabled — I'm not going to mark that resolved as "none exist" from "the screenshot doesn't show them." A static screenshot *can't* show a hover state by definition — hover only exists on pointer interaction, so its absence from a still image is expected either way and tells us nothing about whether the design wants one. Same logic for disabled: it only shows up when a nav item is actually in that state, which a single frame usually isn't. This is iron law 4 by name ("never assume a missing state means it doesn't exist") and the exact case red-flags.md calls out.

So in the Design Map this will land as an **Open Question**, not a resolved "no states," something like:

> Hover / disabled states — not visible in the screenshot (expected, since it's a static image). Your stated leaning: none needed. Confirm: build with no hover/disabled styling, or add sensible defaults (e.g., subtle background/underline on hover, reduced opacity + no pointer on disabled)?

That's a one-word answer for you at the Q&A gate — doesn't block me from mapping everything else in the meantime.

Send the screenshot/URL/specs and I'll build the full Design Map.

## Verdicts

- PASS [det] regex: (?i)hover|state
- PASS [judge] The reply treats the absent hover/disabled states as unconfirmed rather than as proof they do not exist, and routes them to an open question instead of silently omitting them. Iron law 4.
