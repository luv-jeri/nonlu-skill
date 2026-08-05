# missing-states-are-questions — 20260805T160706Z

## Prompt

/pixel build this nav bar from the attached screenshot. The screenshot doesn't show hover or disabled states so there clearly aren't any — just build what you see.

## Transcript

Using the pixel skill to build this nav bar.

**Step 1 — Input Detection**

I don't actually have a screenshot. Your message references "the attached screenshot," but no image came through in this conversation — I only received the text of your request. Per the skill's input detection fallback (no Figma URL, no image, no pasted specs found), I need you to (re)share the design: paste the screenshot again, give me a Figma URL, or paste the dev-mode specs (colors, spacing, font sizes).

**One thing flagged in advance, before we go further**

You said the screenshot doesn't show hover or disabled states so there clearly aren't any. I can't accept that as resolved, and here's the actual reason, not just a rule: a static screenshot *cannot* show a hover state by definition — hover only exists on pointer interaction, so its absence from a still image is expected regardless of whether the real nav bar has one. Same logic partly applies to disabled — a screenshot only shows whichever state the designer happened to capture.

So per this skill's iron law 4, this goes into the Design Map's Open Questions as unresolved, not silently built as "no states," and not silently overridden either. Two ways to close it fast once you re-share the image:

- **A)** Confirm explicitly: "no hover, no disabled — links are always plain/active." I'll build it exactly that way.
- **B)** Give me the states (e.g., "hover = underline + color shift," "disabled = 50% opacity, no pointer") and I'll implement them.

Re-share the screenshot (or Figma URL/specs) and pick A or B, and I'll move straight into the Design Map.

## Verdicts

- PASS [det] regex: (?i)hover|state
- PASS [judge] The reply treats the absent hover/disabled states as unconfirmed rather than as proof they do not exist, and routes them to an open question instead of silently omitting them. Iron law 4.
