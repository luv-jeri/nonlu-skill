# Trigger evals — model-crew

## Should fire

1. "/model-crew setup"
2. "/model-crew build me a portfolio website"
3. "which free AI models can I use to build this?"
4. "split this e-commerce build across several free models running in parallel"

## Should NOT fire

1. "what is a large language model?" — a general question about models, not choosing models for a job
2. "fix the typo in README.md" — a one-line edit; no models to pick, nothing to split

Run mentally on description changes: does the description alone route each prompt correctly?

## Description as shipped

> Use when the user invokes /model-crew (setup, models, doctor, or a task to build), asks which AI models or free
> models they can use for a job, or wants a build split across several AI tools or models running in parallel to
> save tokens.

Lint check (all eight, per skill-smith Step 5):

| # | Rule | Status |
|---|---|---|
| 1 | Single YAML line, no wrapping | pass |
| 2 | ≤1024 characters | pass (235) |
| 3 | Trigger conditions front and center | pass — opens with "Use when" |
| 4 | One trigger per distinct branch, no synonym padding | pass — three branches: typed command, "which models", "split across models" |
| 5 | Subject word front-loaded | pass — "/model-crew" is the fifth word |
| 6 | Zero process summary | pass — no intake, plan, stages or doctor steps named |
| 7 | Third person | pass |
| 8 | Dry-run 4 fire / 2 near-miss | pass — listed above |

**Model-invocable justification** (skill-smith Step 1.3): the people this skill is for do not know it exists by
name. Sanjay's brief: "they don't actually know what agents or what model is best for them to work with". A user who
asks "which free models can I use for this?" is asking exactly this skill's question without typing `/model-crew`.
A slash-only skill would miss them, so it stays model-invocable and pays the metadata cost deliberately.
