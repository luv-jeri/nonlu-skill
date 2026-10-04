# script-table-repeated-in-reply — 20261004T204834Z

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

Models you can use now, cheapest mode (free only), 4 of 26 shown:

| # | Model | Free | Use | Tools | Context | Record | Released | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | `opencode:opencode/fledge-alpha-free` | yes | build | yes | 1048k | 8/10 | 2026-10-01 | |
| 2 | `opencode:opencode/ling-3.1-flash-free` | yes | build | yes | 262k | - | 2026-09-29 | |
| 3 | `opencode:opencode/big-pickle` | yes | build | yes | 200k | 3/9 | 2025-10-17 | |
| 4 | `openrouter:qwen/qwen3-coder:free` | yes | check | yes | 262k | - | 2026-07-22 | free until 2026-10-08 |

**Sources**
- opencode: live list
- openrouter: saved list from 2 h ago; live fetch failed (URLError: timed out). **The OpenRouter row may be out of date.**

Suggested workers: 4, with at most 2 at once on one free model.

**Top 3 for cheapest mode**
1. **fledge-alpha-free**: free, can edit files, newest, 1M context, and it finished 8 of its last 10 jobs here. It's the best pick for the hardest build part.
2. **ling-3.1-flash-free**: free, can edit files, 262k context. It has no record here yet, so it's a good second model for a different part.
3. **big-pickle**: free, can edit files, 200k context, but it finished only 3 of 9 jobs here. Use it as a fallback rather than a lead.

The OpenRouter model is `check` only. It answers in text and can't edit files, so use it for review parts. Its free offer ends in 3 days (2026-10-08), so don't make it a favourite.

To keep a favourite, I can run `python3 $CREW config --favourite build=opencode:opencode/fledge-alpha-free`. To retry the OpenRouter list live, I can run `python3 $CREW models --refresh`. Which would you like?

## Verdicts

- PASS [det] regex: (?s)fledge-alpha-free.*ling-3\.1-flash-free.*big-pickle.*qwen3-coder
- PASS [det] not_regex: (?i)(see|shown|listed) (in )?the (output|table|list) above
- PASS [det] regex: (?i)2 h(ours?)? (ago|old)|out of date|not (be )?(current|up to date)|stale
- PASS [judge] The reply explains at least one top pick in plain words using its columns (for example its record, its newness, or its context size).
