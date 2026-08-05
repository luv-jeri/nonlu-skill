# Trigger evals — recap

## Should fire

1. "/recap"
2. "/recap --open"
3. "summarise what we just did"
4. *(implicit)* the assistant has just finished editing three files and running the
   test suite, and is about to write its closing reply

## Should NOT fire

1. "recap the plot of the movie for me" — no leading slash, and the subject is not this
   session's work
2. "what time is it?" — trivial, nothing material happened, no closing summary owed

Run mentally on description changes: does the description alone route each prompt
correctly?

## Description as shipped

> Use when the user invokes /recap or /recap --open, asks what was done or for a summary
> of the work, or when the assistant finishes a unit of work that changed files, ran
> state-changing commands, or settled decisions and must close with its summary.

Lint check (all eight, per skill-smith Step 5):

| # | Rule | Status |
|---|---|---|
| 1 | Single YAML line, no wrapping | pass |
| 2 | ≤1024 characters | pass (261) |
| 3 | Trigger conditions front and center | pass — opens with "Use when" |
| 4 | One trigger per distinct branch, no synonym padding | pass — three branches: typed, `--open`, end-of-work |
| 5 | Subject word front-loaded | pass — "recap" is the fifth word |
| 6 | Zero process summary | pass — no step names, no mention of journals or capsules |
| 7 | Third person | pass |
| 8 | Dry-run 3 fire / 2 near-miss | pass — listed above |

**Model-invocable justification** (skill-smith Step 1.3 requires this in writing when
`disable-model-invocation` is omitted): the automatic end-of-work branch is the user's
primary request — he asked for a summary that appears without being typed. A
user-only skill cannot satisfy that branch. The `/recap` and `/recap --open` branches
are user-typed; the third is necessarily model-noticed, so the skill stays
model-invocable and pays the metadata cost deliberately.
