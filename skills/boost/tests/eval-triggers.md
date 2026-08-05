# Trigger evals — boost

## Should fire

1. "/boost fix the login bug"
2. "/boost! draft the launch email"
3. "refactor the auth module /boost" — suffix position
4. "/BOOST research which vector database to use" — case-insensitive

## Should NOT fire

1. "how do I boost my wifi signal strength" — the word "boost" without a leading slash
2. "what does the /boost skill do?" — asking ABOUT boost, not invoking it
3. "/booster pack pricing page copy" — `/boost` as part of a longer word

Run mentally on description changes: does the description alone route each prompt
correctly?

## Description as shipped

> Use when user appends or prefixes /boost or /boost! to their prompt — any kind of
> task, coding or not (writing, research, planning, design, ops).

Lint check (all eight, per skill-smith Step 5):

| # | Rule | Status |
|---|---|---|
| 1 | Single YAML line, no wrapping | pass |
| 2 | ≤1024 characters | pass (145) |
| 3 | Trigger conditions front and center | pass — opens with "Use when" |
| 4 | One trigger per distinct branch, no synonym padding | pass — two branches: `/boost`, `/boost!`; prefix and suffix noted as positions, not separate triggers |
| 5 | Subject word front-loaded | pass — "/boost" is the fifth word |
| 6 | Zero process summary | pass — no mention of detection, discovery, templates or structuring |
| 7 | Third person | pass |
| 8 | Dry-run 3 fire / 2 near-miss | pass — listed above |

**Invocation mode:** user-typed only (`disable-model-invocation: true`, set in commit
`cb144b2` for menu hygiene). Boost is a preprocessor the user reaches for deliberately;
there is no situation where Claude should decide on its own to restructure a prompt.

## Executable coverage

`evals/evals.json` carries the machine-checked trigger lists. This file is the human
record of why each entry is there; the JSON is the source of truth for the runner.
