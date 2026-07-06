# Skill Smith — templates

Supplementary boilerplate. The full process lives in SKILL.md; these are the blanks it fills.

## Contents
1. Generated SKILL.md skeleton (T1)
2. T2/T3 additions
3. LEARNINGS.md template
4. Learning-capture footer
5. tests/ file skeletons

---

## 1. Generated SKILL.md skeleton (T1)

```markdown
---
name: <kebab-name, ≤64 chars>
description: <single line: what it does + "Use when …" triggers, one per branch>
user-invokable: true            # omit/adjust per invocation answer
# disable-model-invocation: true   # only if it must NEVER auto-fire
# allowed-tools: Read, Grep       # narrowest set that works — only if limiting
---

# <Name> — <one-line job>

## Process
1. <numbered, concrete steps — match wording form to expected failure>
2. …

## Done means
<explicit completion definition — prevents premature completion>
```

## 2. T2/T3 additions

- `## Iron laws` section (2–5 max — each one traceable to an observed failure from the RED baseline; cite it in a comment).
- `## Red flags` rationalization table (excuse → reality), only for excuses actually observed or strongly expected.
- `tests/eval-triggers.md` + `tests/eval-quality.md` (skeletons below).
- T3 only: reviewer's verdict block appended at the bottom of eval-quality.md — reviewer name/session, date, loophole attempts made, PASS/RETURNED.

## 3. LEARNINGS.md template

```markdown
# LEARNINGS — <skill-name>

Raw observations captured while using this skill. Any session appends here the
moment the skill errs or the user corrects it. `/skill-evolve` reads Unabsorbed,
turns real defects into skill edits (with human approval), and moves entries to
Absorbed. Entries are dated; newest first.

## Unabsorbed

<!--
### YYYY-MM-DD — one-line title
- **What happened:**
- **Expected vs actual:**
- **Root-cause guess:**
- **Context:** task / project / anything relevant
-->

## Absorbed

<!-- moved here by /skill-evolve: "absorbed YYYY-MM-DD → <what changed in the skill>" -->
```

## 4. Learning-capture footer (append to every generated SKILL.md)

```markdown
## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve <skill-name>`.
```

## 5. tests/ file skeletons

`tests/eval-triggers.md`:
```markdown
# Trigger evals — <skill-name>

## Should fire
1. "<realistic prompt 1>"
2. "<realistic prompt 2>"
3. "<realistic prompt 3>"

## Should NOT fire
1. "<near-miss prompt 1>"
2. "<near-miss prompt 2>"

Run mentally on description changes: does the description alone route each
prompt correctly?
```

`tests/eval-quality.md`:
```markdown
# Quality evals — <skill-name>

## RED baseline (observed failures without the skill) — T2+
1. <verbatim failure 1> → answered by SKILL.md line/section <cite>
2. <verbatim failure 2> → answered by <cite>

## Grading rubric
- <what a good output must contain / must never contain>
```
