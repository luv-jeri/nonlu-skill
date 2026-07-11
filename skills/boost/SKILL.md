---
name: boost
description: Use when user appends or prefixes /boost or /boost! to their prompt — any kind of task, coding or not (writing, research, planning, design, ops).
user-invokable: true
disable-model-invocation: true
---

# Boost — Prompt Enhancer

Transform rough prompts into structured, context-rich prompts before execution.

## Invocation

- **Prefix:** `/boost refactor the auth module`
- **Suffix:** `refactor the auth module /boost`
- **Fast-track:** `refactor the auth module /boost!` (skip confirmation)

## Process

Read `references/flow.md` for the complete enhancement process.

1. CAPTURE — strip /boost trigger
2. PASSTHROUGH CHECK — already structured? (`references/prompt-passthrough.md`)
3. DETECT — classify task type
4. DISCOVER — read project context (`references/context-discovery.md`)
5. STRUCTURE — apply template (`references/task-templates.md` for code · `references/task-templates-general.md` for everything else)
6. PRESENT — show enhanced prompt
7. DECIDE — confirm, edit, skip, or auto-execute
8. EXECUTE — work on the structured prompt
9. SUGGEST — offer pattern additions

## Team Bootstrap

- **`/boost --init`** — Auto-generate `boost-patterns.md` by scanning the codebase (see `references/flow.md` → Auto-Generate Patterns)

## Iron Laws

Read `references/red-flags.md` before proceeding. Non-negotiable.

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve <skill-name>`.
