# script-table-repeated-in-reply — 20261004T202142Z

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

Mode: **cheapest** (free models only). 26 models found, top 4 shown. `build` means the model can edit files. `check` means text only or small context.

| # | Model | Free | Use | Tools | Context | Record | Released | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | `opencode:opencode/fledge-alpha-free` | yes | build | yes | 1048k | 8/10 | 2026-10-01 | |
| 2 | `opencode:opencode/ling-3.1-flash-free` | yes | build | yes | 262k | - | 2026-09-29 | |
| 3 | `opencode:opencode/big-pickle` | yes | build | yes | 200k | 3/9 | 2025-10-17 | |
| 4 | `openrouter:qwen/qwen3-coder:free` | yes | check | yes | 262k | - | 2026-07-22 | free until 2026-10-08 |

- **source opencode:** live list.
- **source openrouter:** saved list from 2 h ago. The live fetch failed (`URLError: timed out`), so row 4 may be out of date.
- **Suggested workers:** 4 (at most 2 at once on one free model).

**Top 3 for cheapest mode:**

1. **fledge-alpha-free:** the best pick. It's free, can edit files, has the best record (finished 8 of its last 10 jobs here), and has a 1M context window.
2. **ling-3.1-flash-free:** free, can edit files, and is newer, with 262k context. It has no record here yet, so it's untested. Good as a second worker.
3. **big-pickle:** free and can edit files, but it only finished 3 of 9 jobs here. Use it as a fallback, not a lead.

`qwen3-coder:free` is for check parts only. It's text-only on the OpenRouter route, and its free offer ends in 3 days (2026-10-08). That's fine for today but not for a favourite.

To keep a favourite, say so and I'll run `python3 $CREW config --favourite build=opencode:opencode/fledge-alpha-free`. Say "refresh" if you want me to retry the OpenRouter live fetch (`models --refresh`).

## Verdicts

- PASS [det] regex: (?s)fledge-alpha-free.*ling-3\.1-flash-free.*big-pickle.*qwen3-coder
- PASS [det] not_regex: (?i)(see|shown|listed) (in )?the (output|table|list) above
- PASS [det] regex: (?i)2 h(ours?)? (ago|old)|out of date|not (be )?(current|up to date)|stale
- PASS [judge] The reply explains at least one top pick in plain words using its columns (for example its record, its newness, or its context size).
