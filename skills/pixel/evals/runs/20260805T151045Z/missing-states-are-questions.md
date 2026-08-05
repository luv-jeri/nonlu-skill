# missing-states-are-questions — 20260805T151045Z

## Prompt

/pixel build this nav bar from the attached screenshot. The screenshot doesn't show hover or disabled states so there clearly aren't any — just build what you see.

## Transcript

I don't see an actual image attached in this conversation — no screenshot came through with your message, and there's no Figma URL or pasted spec either. Per the skill's Input Detection step, when no input is found I have to ask rather than proceed.

**Action 1:** Please attach the nav bar screenshot (or paste a Figma URL / dev-mode CSS export) so I can build the Design Map.

**Flagging one thing now, before we go further:** Iron Law 4 in this skill explicitly forbids treating "the screenshot doesn't show a state" as proof that state doesn't exist — hover, focus, active/current-page, and disabled states must be explicitly confirmed as unnecessary, not assumed absent from a static image. This exact scenario ("the design doesn't show hover states") is called out by name in the skill's red-flags table, with the correct action being: add it to Open Questions, don't skip it.

So once the screenshot is in, I'll still list interaction states as an Open Question in the Design Map rather than marking them "none" — nav bars almost always have at least hover and active/current-page styling. At that point you can resolve it either way:

- **A** — Confirm explicitly: "no hover/disabled states, ship static" → I'll build static and note this was an explicit decision, not a default.
- **B** — Let me propose reasonable hover/active states (following whatever framework/tokens the project already uses) for you to approve at the Q&A gate before any code is written.

Send the screenshot and pick A or B (or answer later at the Q&A gate) and I'll proceed to Step 2 (Design Map).

## Verdicts

- PASS [det] regex: (?i)hover|state
- PASS [judge] The reply treats the absent hover/disabled states as unconfirmed rather than as proof they do not exist, and routes them to an open question instead of silently omitting them. Iron law 4.
