# Model Crew — design spec

**Date:** 2026-10-05
**Repo:** `luv-jeri/nonlu-skill`, branch `model-crew`
**Status:** design approved in chat by Sanjay (2026-10-05); this written spec awaits his review
**Skill name:** `model-crew` (commands `/model-crew setup`, `/model-crew <task>`, `/model-crew models`, `/model-crew doctor`)

---

## 1. The problem, in Sanjay's words

> "Somebody wants to build their own portfolio or an e-commerce project, and now they don't actually know what agents
> or what model is best for them to work with."

People have several AI tools (OpenRouter, OpenCode, Gemini, Antigravity, Codex, Claude Code) but no easy way to know
which models they can use, which are free, which are good, or how to split a job across several of them to save
tokens. Model Crew does that: one setup, then for each task it asks what the user wants, suggests models, and runs the
work in parallel, mostly on free models.

**Who it is for:** developers of any level who share this skill, starting from Sanjay's friends. It must work for
someone who has never heard of a headless CLI.

**Success:** a stranger installs the skill, runs setup, says "build my portfolio with free models", and gets a working
site built by free models in parallel, while their main (paid) agent spends only planning and checking tokens.

## 2. Decisions already made (quote them, do not re-open)

| Id | Decision | Source |
|---|---|---|
| DEC1 | **Approach A: manager plus one helper script.** The main agent (the "manager") plans, asks, and checks. One Python script does the repeated mechanical work: detect tools, list and rank models, run workers in parallel. | Sanjay 2026-10-05: "the recommendation looks good to me" |
| DEC2 | **The manager asks follow-up questions before it plans,** so the plan matches what the user wants: how quickly, how many agents at once, and whatever else a plan needs. | Sanjay 2026-10-05: "we want to make sure that the plans it is generating are as per the user's requirement. Please have some follow-up questions" |
| DEC3 | **The script handles the likely edge cases** (not every possible one), **always shows the latest model list, and caches results.** | Sanjay 2026-10-05: "handle all the possible edge cases. We don't have to cover each and everything … always shows the latest model reports and caches the results of the models" |
| DEC4 | **The manager checks the skill for broken things and fixes them.** Safe data fixes happen automatically; code fixes are shown and applied after the user says yes. | Sanjay 2026-10-05: "it also needs to check for any broken things in this skill, and if it finds something broken, it can also fix it" |
| DEC5 | **API keys never go into the chat.** The user types keys only into the tool that needs them, in a separate Terminal window. | Design point 4, approved 2026-10-05 |
| DEC6 | **Works in any agent that reads skills; script uses only the Python standard library.** | Approved design, matches the repo's "markdown + python stdlib" rule |
| DEC7 | "Caches the results of the models" means both: a cached copy of each model list **and** a per-model track record of past jobs. | Stated in the approved design; Sanjay said yes |

## 3. Words used in this spec

- **Manager:** the user's main agent (Claude Code, Codex, Gemini CLI…) running this skill.
- **Worker:** another model doing one part of the job through its tool, started by the script with no chat window
  (a "headless" run: one prompt in, edits on disk, then it exits).
- **Route:** the tool a worker runs through. A model id in a plan is always `<route>:<model>`, for example
  `opencode:opencode/big-pickle` or `claude:haiku`.
- **Part:** one piece of the task given to one worker, with the files it owns.
- **Stage:** a group of parts that run at the same time. Stages run one after another.

## 4. Requirements

### 4.1 Setup (`/model-crew setup`)

- **R1** `crew.py detect` reports, for each route: installed (yes/no), logged in (yes/no/unknown), and the exact
  command to install or log in when the answer is no. The manager shows this as a table.
- **R2** The manager asks only what detect cannot see (for example "Do you have an OpenRouter key?"), one question at
  a time.
- **R3** For each missing login the manager gives the command to run **in a separate Terminal window**, waits for the
  user to say "done", then runs `detect` again to confirm. It never asks for a key in chat (DEC5).
- **R4** OpenRouter key without OpenCode: `crew.py save-key openrouter` reads the key with hidden typing
  (`getpass`), checks it against OpenRouter, and saves it to the key file with owner-only permissions (`chmod 600`).
  The `OPENROUTER_API_KEY` environment variable, when set, wins over the file.
- **R5** Setup ends by asking the default mode and worker count, saving them to the config, and showing
  `crew.py models`.

### 4.2 Intake questions (`/model-crew <task>`, before any plan)

- **R6** The manager asks these questions **one at a time**, each with a suggested answer. It skips any the user's
  request already answers. "You decide" at any point accepts the suggested answers for all remaining questions.

| Q | Question | Suggested answer |
|---|---|---|
| Q1 | What are we building, and what does "finished" look like (pages, features)? | none; this one is always needed |
| Q2 | Start fresh, or work on the existing project in this folder? | Detected from the folder; the manager only confirms |
| Q3 | Technology preference? | "You decide": the simplest that fits the job |
| Q4 | What matters most: cheapest, balanced, or best quality? | The config default (balanced: free workers, manager checks) |
| Q5 | How fast: as fast as possible, or steady? | Steady |
| Q6 | How many workers at the same time? | The script's suggestion (R14) |
| Q7 | Who checks the finished work: the manager, a free model, or nobody? | The manager |
| Q8 | Do you have the content (name, bio, projects, images, colours), or use placeholders? | Placeholders, clearly marked |
| Q9 | Anything off-limits (files, new packages, hosting target)? | None |

- **R7** Answers go into the plan's `brief` (section 5) so every worker gets them.

### 4.3 Models (`crew.py models`)

- **R8** Lists every model the user can use now, from every route that is installed and logged in:

| Route | Edits files | Installed | Logged in (verified 2026-10-05 unless marked) | Model list | Free means |
|---|---|---|---|---|---|
| `opencode` | yes | `opencode` on PATH | `opencode auth list` names a provider | `opencode models --verbose` | `cost.input` and `cost.output` are 0 |
| `opencode` with OpenRouter | yes | same | `opencode auth list` names OpenRouter | OpenRouter API (below) | same as OpenRouter |
| `openrouter` (API only) | **no, text jobs only** | key file or env var | key accepted by OpenRouter | `GET https://openrouter.ai/api/v1/models` (public, no key) | `pricing.prompt` and `pricing.completion` are `"0"` |
| `codex` | yes | `codex` on PATH | `codex login status` says "Logged in" | configured default plus names the user types (list command: verify at build) | never free |
| `gemini` | yes | `gemini` on PATH | verify at build | known names plus names the user types | free tier depends on the account |
| `agy` (Antigravity) | yes | `agy` on PATH | `agy models` succeeds | `agy models` | depends on the account |
| `claude` | yes | `claude` on PATH | `claude auth status` → `"loggedIn": true` | aliases `haiku`, `sonnet`, `opus` | never free |

- **R9** Ranking, in this order (a plain sort, no weighted formula):
  1. Mode filter: cheapest = free only; balanced = free workers; best = paid allowed.
  2. Can edit files (build parts need this; text-only routes are offered only for check parts).
  3. Supports tool calls (OpenRouter `supported_parameters` contains `tools`; OpenCode `tool_call: true`).
  4. Track record: share of finished jobs in its last 10 runs, counted once it has 3 or more runs.
  5. Context size: under 64k tokens is not offered for build parts.
  6. Newer first (release or created date).
- **R10** A free model whose OpenRouter `expiration_date` is within 7 days is shown with a warning.
- **R11** Output is a short table plus `--json`. Script output is a model channel, not a human one: Claude Code
  collapses it to "Ran N shell commands" (measured in this repo, 2026-08-05, see Recap). So the manager **repeats the
  table in its own reply** and explains the top picks in plain words ("finished 8 of its last 10 jobs; newest; big
  context"). The same applies to `detect`, `run` and `doctor` output.

### 4.4 Cache and track record (DEC3, DEC7)

- **R12** Model lists: one cache file per source in `~/.cache/model-crew/` (respects `XDG_CACHE_HOME`), holding
  `fetched_at` and the models.
  - Under 10 minutes old → use it.
  - Older → fetch live (20 s limit). Success → save. Failure → show the saved copy with its age and the reason
    ("list from 2 h ago; OpenRouter did not answer").
  - No saved copy and no network → that source shows "unavailable: <reason>"; other sources still show.
  - `--refresh` always fetches live.
  - A damaged cache file counts as missing and is deleted.
  - Writes are atomic (write a temp file, then rename), so a crash never leaves half a file.
- **R13** Track record: `~/.cache/model-crew/history.jsonl`, one line per finished worker:
  `{model, result, seconds, at}`. Kept to the newest 500 lines. It never stores prompts, code or keys.

### 4.5 Plan and run (`crew.py run`)

- **R14** Worker suggestion: `min(4, cpu_count // 2)`, at least 1, and at most 2 workers on the same free model at
  once, because free models have per-minute and per-day limits.
- **R15** The manager writes `.model-crew/plan.json` (section 5), shows the plan in plain words (each part, its model,
  its files), and **runs nothing until the user says yes**.
- **R16** Before running, the script checks the whole plan and refuses all of it on any error:
  - unknown model (it suggests the closest real name)
  - route not installed
  - duplicate part ids
  - a file owned by two parts in the same stage
  - an empty stage
  - the folder is not a git repository, or has uncommitted changes
  The manager then offers `git init` or a checkpoint commit, so every change can be undone.
- **R17** Stages run in order; parts inside a stage run at the same time, up to `workers`. A stage with any part not
  finished stops the later stages.
- **R18** Each worker gets one prompt with three pieces: the brief; its part prompt; and the rules "edit only these
  files", "do not run git", and "do not install packages unless your part says so". It runs in the project folder,
  using the route's most restrictive mode that still lets it edit files there (exact flags: verify at build).
- **R19** Every worker's output goes to `.model-crew/runs/<run-id>/<part>.log`. The script prints only a short summary
  table and writes `status.json`. The manager reads the summary and diffs, not the logs, unless a part failed.
  This saves tokens.
- **R20** Result of each part:

| Result | When |
|---|---|
| `done` | exit 0 and at least one of its files changed |
| `no-changes` | exit 0 and none of its files changed |
| `stuck` | passed its time limit (default 15 min, the plan may change it); the whole process group is stopped |
| `rate-limited` | the log shows a usage-limit error (HTTP 429, "rate limit", "quota") → retried once on the part's `fallback` model |
| `failed` | any other non-zero exit |

- **R21** After a stage, changed files that belong to no part are listed as `unexpected changes`. Parts in one stage
  share the folder, so these cannot be blamed on one worker; the manager reviews them.
- **R22** Ctrl-C stops every worker's process group, marks the run `interrupted`, and writes `status.json`. Nothing
  keeps running in the background.
- **R23** A lock file `.model-crew/run.lock` holds the run's process id. A second run refuses while that process is
  alive; a lock left by a dead process is removed.
- **R24** `.model-crew/.gitignore` contains `*`, so run files never get committed.
- **R25** Exit codes: 0 every part done; 1 some part not done; 2 plan refused.

### 4.6 Checking the work

- **R26** As Q7 decides:
  - **Manager:** reads `git diff --stat` and the diffs of finished parts, then builds and starts the app.
  - **Free model:** runs a check stage with a text or agent route.
  - **Nobody:** skips the check, and the report says so.
- **R27** Retrying failed parts: on their fallback model; or the manager fixes small things itself, only in
  balanced or best mode.
- **R28** The final report says, in plain words: what was built, which model built each part, what failed or was
  skipped, and how to open the result.

### 4.7 Doctor (DEC4)

- **R29** `crew.py doctor` runs these checks. Safe fixes are applied automatically and listed as "fixed".

| Id | Check | If broken |
|---|---|---|
| D1 | Python 3.9 or newer | Report |
| D2 | Skill files present; `crew.py selftest` passes | Report. The manager reads the script, proposes the smallest fix, applies it **after the user says yes**, and runs doctor again |
| D3 | Each configured tool still installed | Report, with install command |
| D4 | Each configured tool still logged in | Report, with login command |
| D5 | Config file readable | **Auto:** keep it as `config.json.bad`, rebuild from `detect` |
| D6 | Cache files readable | **Auto:** delete them |
| D7 | Key file is owner-only | **Auto:** `chmod 600` |
| D8 | OpenRouter reachable | Report (the cache still works) |
| D9 | Saved favourite models still listed | **Auto:** replace with the top-ranked model on the same route, and say so |
| D10 | Each route's headless flags still appear in its `--help` | Report. The manager proposes a code fix, applied after a yes (as D2) |
| D11 | Stale run lock or leftover workers | **Auto:** remove the lock; stop only the process ids recorded in that run's `status.json` |

- **R30** `doctor --quick` runs D1, D2 (files only), D5, D6, D7 and D11: no network, no tool calls. The manager runs
  it at the start of every `/model-crew` command.

### 4.8 Skill packaging (this repo's rules)

- **R31** SKILL.md frontmatter has `name`, `description` (trigger conditions only), `user-invokable: true`. It follows
  the **self-contained** pattern: the whole process lives in SKILL.md. Per-tool login steps come from `detect`'s
  output, so no reference file is needed.
- **R32** SKILL.md starts each run with a checklist (TodoWrite or the host's equivalent) and ends with the
  "Learning capture" footer; `LEARNINGS.md` ships with its header and no entries yet.
- **R33** `tests/eval-triggers.md`, `tests/eval-quality.md` and `evals/evals.json` ship, using deterministic asserts
  where possible, and pass with `python3 skills/skill-evolve/scripts/run_evals.py skills/model-crew` before merge.
- **R34** Register in `.claude-plugin/marketplace.json` `skills`, add `package.json` keywords, add the README table
  row and section, and add the skill to the repo `CLAUDE.md` skills list.

## 5. Plan file (interface)

`.model-crew/plan.json`. The manager writes it; the script reads it.

```json
{
  "brief": {
    "task": "Personal portfolio: home, projects, about, contact form",
    "tech": "Plain HTML, CSS and a little JavaScript",
    "mode": "balanced",
    "content": "placeholders, marked with [REPLACE]",
    "off_limits": ["do not add npm packages"]
  },
  "workers": 3,
  "time_limit_min": 15,
  "stages": [
    [ { "id": "base", "model": "opencode:opencode/big-pickle",
        "fallback": "opencode:opencode/fledge-alpha-free",
        "files": ["index.html", "styles.css"],
        "prompt": "Create the shared layout, header, footer and colour variables." } ],
    [ { "id": "projects", "model": "opencode:opencode/fledge-alpha-free",
        "files": ["projects.html"], "prompt": "..." },
      { "id": "contact", "model": "codex:gpt-6.1-sol",
        "files": ["contact.html", "contact.js"], "prompt": "..." } ]
  ]
}
```

## 6. Files

```
skills/model-crew/
  SKILL.md              manager process: setup, intake, models, plan, run, check, doctor
  scripts/crew.py       detect | save-key | models | run | doctor | selftest
  LEARNINGS.md
  tests/eval-triggers.md
  tests/eval-quality.md
  evals/evals.json
```

User machine: `~/.config/model-crew/config.json`, `~/.config/model-crew/openrouter-key`,
`~/.cache/model-crew/models-*.json`, `~/.cache/model-crew/history.jsonl` (both folders respect the XDG variables).
Project: `.model-crew/` (self-ignored).

## 7. Testing

- **T1** `crew.py selftest`: offline, assert-based, using small inline sample data. It covers:
  - OpenCode verbose parsing and OpenRouter free filtering
  - ranking order and the expiry warning
  - cache freshness, stale fallback and damaged-file handling, with a fake clock
  - each plan-refusal rule in R16
  - result classification in R20
  - history trimming
- **T2** `evals/evals.json` asserts the manager's behaviour, one behaviour per assert:
  - asks intake questions one at a time
  - skips questions already answered
  - never asks for a key in chat
  - shows the plan and waits for a yes before running
  - setup gives a login command rather than asking for a key
- **T3** End-to-end, once, at the end: a tiny real job ("make a hello page") in a temp folder, built by one free
  model through `crew.py run`, then the page opened.

## 8. Not in this version

| Left out | Add when |
|---|---|
| Windows support (process groups differ) | someone on Windows asks |
| Separate git worktrees per worker and automatic merging | parts sharing files becomes a real need |
| Money and token accounting | a user asks what a run cost |
| Benchmark scraping for rankings | live metadata plus the track record proves too weak |
| Automatic deploy | after the build flow is trusted |

## 9. To verify at build time

The model list commands and login checks in R8 marked "verify at build", the exact headless flags per route (R18,
D10), and OpenRouter's current free-model limits (R14). Write each verified command into `crew.py` with the date it
was checked.
