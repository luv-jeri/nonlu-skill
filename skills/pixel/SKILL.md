---
name: pixel
description: Use when the user invokes /pixel, /pixel! or /pixel --relaxed, with a Figma URL, a design screenshot in context, a screen recording or video of a UI, or pasted design specs, to build UI that must match a design exactly.
user-invokable: true
disable-model-invocation: true
---

# Pixel — Figma to Pixel-Perfect UI

Transform Figma designs into pixel-perfect, production-ready UI through structured analysis and incremental build-verify cycles.

## Invocation

- `/pixel <figma-url>` — with Figma link
- `/pixel` — with screenshot in context
- `/pixel <specs>` — with pasted design specs
- `/pixel --relaxed` — checkpoint after sections, not components
- `/pixel!` — fast-track: no checkpoints, final audit only

## Process

Read `references/flow.md` for the complete two-phase process.

**Phase 1 — Design Map:** Input Detection → Design Map → Q&A Gate
**Phase 2 — Build:** Build Order → Build-Verify Loop → Final Audit

## Key References

- `references/input-detection.md` — Figma MCP, screenshots, dev exports
- `references/design-map.md` — 7-section design map structure
- `references/token-extraction.md` — CSS variable and token matching
- `references/verification.md` — checkpoint and final audit checklists
- `references/red-flags.md` — iron laws and rationalization prevention

## Iron Laws

Read `references/red-flags.md` before proceeding. Non-negotiable.

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve <skill-name>`.
