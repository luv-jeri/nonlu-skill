# script-table-repeated-in-reply — 20261004T203314Z

## Prompt

The user typed "/model-crew models". You ran `crew.py models --mode cheapest --limit 4`; its output was:

mode: cheapest. 26 models, showing 4. use: build = can edit files, check = text or small context only
 #  model                                   free  use    tools  context  record  released    note
 1  opencode:opencode/fledge-alpha-free     yes   build  yes    1048k    8/10    2026-10-01
 2  opencode:opencode/ling-3.1-flash-free   yes   build  yes    262k     -       2026-09-29
 3  opencode:opencode/big-pickle            yes   build  yes    200k     3/9     2025-10-17
 4  openrouter:qwen/qwen3-coder:free        yes   check  yes    262k     -       2026-07-22  free until 2026-10-08
source opencode: live list
source openrouter: saved list from 2 h ago; live fetch failed: URLError: timed out
suggested workers: 4 (at most 2 at once on one free model)

Write ONLY your reply to the user.

## Transcript

**Next action:** pick a favourite, or say nothing and run `/model-crew <what you want to build>`.

Mode is **cheapest** (free models only). 26 models are usable, and these are the top 4:

| # | model | free | use | tools | context | record | released | note |
|---|---|---|---|---|---|---|---|---|
| 1 | opencode:opencode/fledge-alpha-free | yes | build | yes | 1048k | 8/10 | 2026-10-01 | |
| 2 | opencode:opencode/ling-3.1-flash-free | yes | build | yes | 262k | - | 2026-09-29 | |
| 3 | opencode:opencode/big-pickle | yes | build | yes | 200k | 3/9 | 2025-10-17 | |
| 4 | openrouter:qwen/qwen3-coder:free | yes | check | yes | 262k | - | 2026-07-22 | free until 2026-10-08 |

- source opencode: live list
- source openrouter: saved list from 2 h ago; live fetch failed: URLError: timed out
- suggested workers: 4 (at most 2 at once on one free model)

**Top 3 for cheapest mode:**

1. **fledge-alpha-free**: free, can edit files, newest, and finished 8 of its last 10 jobs here. It's the safest pick.
2. **ling-3.1-flash-free**: free, can edit files, 262k context. It has no record yet, so it's untested here, but it's a good second model so parts don't pile onto one.
3. **big-pickle**: free, can edit files, but only 3 of 9 finished. Use it as a fallback, not a lead.

**Two things to know:**

- **The OpenRouter row may be out of date.** The live fetch timed out, so that row comes from a list saved 2 h ago. `--refresh` would retry it.
- **Row 4 is a `check` model, not a `build` model.** It's text only (OpenRouter models can't edit files), so it can review work but not build it. Its free offer also ends 2026-10-08, which is fine for a quick review but not for a favourite.

**Context** is how much text a model can read at once (its context window). 1048k is about a million tokens, enough to hold a whole small project in one go.

To keep a favourite, say which one and I'll run `python3 $CREW config --favourite build=<model id>`.

## Verdicts

- PASS [det] regex: (?s)fledge-alpha-free.*ling-3\.1-flash-free.*big-pickle.*qwen3-coder
- PASS [det] not_regex: (?i)(see|shown|listed) (in )?the (output|table|list) above
- PASS [det] regex: (?i)2 h(ours?)? (ago|old)|out of date|not (be )?(current|up to date)|stale
- PASS [judge] The reply explains at least one top pick in plain words using its columns (for example its record, its newness, or its context size).
