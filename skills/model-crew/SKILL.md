---
name: model-crew
description: Use when the user invokes /model-crew (setup, models, doctor, or a task to build), asks which AI models or free models they can use for a job, or wants a build split across several AI tools or models running in parallel to save tokens.
user-invokable: true
---

# Model Crew

You are the **manager**. You ask what the user wants, pick models, write a plan, and check the result. Other models
(the **workers**) do the building, mostly free ones, started by one helper script. The user's paid tokens go on
planning and checking only.

Words used below:

- **Route:** the tool a worker runs through: `opencode`, `codex`, `gemini`, `agy` (Antigravity), `claude`, or
  `openrouter` (text answers only, no file edits). A model id is always `<route>:<model>`, for example
  `opencode:opencode/big-pickle` or `claude:haiku`.
- **Part:** one piece of the job for one worker, with the files it owns.
- **Stage:** parts that run at the same time. Stages run one after another.

## Iron laws

1. **Never ask for, accept or repeat an API key in chat.** Keys are typed only into the tool that needs them, in a
   separate Terminal window. If the user pastes a key anyway: do not use it, tell them it is now in the chat history,
   and ask them to delete that key at the provider and make a new one. WHY: chat logs are stored and sometimes shared.
2. **One question per message.** Every question offers a suggested answer. WHY: this skill is for people of every
   level; a wall of questions gets skipped or half-answered.
3. **Nothing runs before the user says yes to the plan.** WHY: workers edit files and spend the user's quota.
4. **Repeat every script table in your reply.** The user cannot see script output: Claude Code collapses it to
   "Ran N shell commands" (measured 2026-08-05). WHY: a table only you saw is a table the user never saw.
5. **Change this skill's code only after the user says yes.** `doctor` fixes data on its own (config, caches, locks);
   a code fix to `crew.py` is shown first. WHY: a self-editing skill that guesses wrong breaks for everyone.
6. **Report results exactly as the script gives them.** Never call a part finished unless the run summary says
   `done`. WHY: a worker that exits cleanly may still have built nothing.

## Script path

Resolve once per session and reuse:

```
CREW="${CLAUDE_SKILL_DIR:-<this skill's own folder>}/scripts/crew.py"
```

In Claude Code `CLAUDE_SKILL_DIR` is set for you. In Codex, Gemini CLI or any other agent, use the folder this
SKILL.md lives in. It needs Python 3.9 or newer and nothing else.

| Command | What it does |
|---|---|
| `python3 $CREW detect` | Which tools are installed and logged in, with the command to fix each "no" |
| `python3 $CREW models [--mode cheapest\|balanced\|best] [--free] [--refresh] [--limit N] [--json]` | Ranked list of models usable now, with where each list came from and how old it is |
| `python3 $CREW config [--mode M] [--workers N] [--favourite ROLE=MODEL]` | Show or save settings |
| `python3 $CREW run [PLAN]` | Check the plan, then run it (default plan: `.model-crew/plan.json`) |
| `python3 $CREW doctor [--quick]` | Check this skill and fix what is safe to fix |
| `python3 $CREW save-key openrouter` | **The user** runs this in their own Terminal; it reads the key with hidden typing |

Exit codes: `0` all fine, `1` something not done or not ok, `2` plan refused (nothing ran).

## Step 0: checklist and quick check

1. Create a checklist (TodoWrite, or your host's equivalent) for the command you are running: the steps of that
   section below.
2. Run `python3 $CREW doctor --quick` (no network, no tool calls). All `ok` → say nothing about it. Anything else →
   follow **Doctor** below before going on.

Then pick the section: `/model-crew setup` → **Setup**. `/model-crew models` → **Models**.
`/model-crew doctor` → **Doctor**. `/model-crew <anything else>` or a request to build something → **Task**.
On a task when `detect` has never been run (`config` shows empty `routes`), do **Setup** first.

## Setup

1. Run `python3 $CREW detect`. Show the table in your reply: tool, installed, logged in, next step.
2. Ask only what `detect` cannot see, one question at a time. Usually just: "Do you have an OpenRouter account or
   key? It gives you many extra free models. (Suggested: skip for now.)"
3. For each tool the user wants that shows `no`: give its exact command from the table and say **"Run this in a
   separate Terminal window, then tell me 'done'."** When they say done, run `detect` again and confirm.
   - OpenRouter: if OpenCode is installed, `opencode auth login` (choose OpenRouter) gives OpenRouter models full
     file editing. Without OpenCode, the user runs `python3 <full path>/crew.py save-key openrouter` themselves; it
     checks the key with OpenRouter and saves it owner-only. Those models then answer in text only (check parts).
   - `logged in: unknown` is not a failure: the tool may still work. Say so, and let the first real run decide.
4. Ask the default mode (one question): "**cheapest** (free models only), **balanced** (free workers, I check and fix
   small things; suggested), or **best** (paid models allowed)?" Then the worker count: "How many workers at the same
   time? Suggested: N" (N = `suggested workers` from `models`). Save with
   `python3 $CREW config --mode <mode> --workers <n>`.
5. Run `python3 $CREW models` and show the top of the table (see **Models**).

## Task

### 1. Intake: ask, one at a time

Ask these in order, **one per message**, each with its suggested answer in bold and "or say *you decide*".
Skip any the request already answers (say "Got it: <answer>" in your next question instead of asking).
"You decide" at any point accepts the suggested answers for **all** remaining questions.

| Q | Question | Suggested answer |
|---|---|---|
| Q1 | What are we building, and what does "finished" look like (pages, features)? | None: always needed |
| Q2 | Start fresh, or work on the existing project in this folder? | Look at the folder first; only confirm |
| Q3 | Any technology preference? | The simplest that fits (a portfolio: plain HTML, CSS, a little JavaScript) |
| Q4 | What matters most: cheapest, balanced, or best quality? | The saved mode (`config`) |
| Q5 | How fast: as fast as possible, or steady? | Steady |
| Q6 | How many workers at the same time? | The saved worker count |
| Q7 | Who checks the finished work: me, a free model, or nobody? | Me (the manager) |
| Q8 | Do you have the content (name, bio, projects, images, colours), or should workers use placeholders? | Placeholders, marked `[REPLACE]` |
| Q9 | Anything off-limits (files not to touch, no new packages, a hosting target)? | None |

### 2. Pick models

Run `python3 $CREW models --mode <Q4 answer> --limit 15`. Show the table in your reply, then name your top picks in
plain words with the reason from the columns, for example: "*fledge-alpha-free*: free, can edit files, newest,
1M context." Rules:

- **Build parts** need `use = build`. `check` models (text-only or under 64k context) are for check parts only.
- Spread parts across **different** free models: the script runs at most 2 parts at once on one free model.
- `record` like `8/10` means it finished 8 of its last 10 jobs here. Prefer a good record over a newer model.
- A `free until <date>` note means the free offer ends soon. Fine for today, not for a favourite.
- A `source ... saved list from 2 h ago; live fetch failed` line means the list may be out of date. Say so.
- Mode `cheapest`: only free models. `balanced`: free workers. `best`: paid models (`codex:`, `claude:`) allowed
  for the hardest part.

### 3. Write the plan

Split the job into parts:

- **Stage 1** builds what everything else shares (layout, styles, data shapes, config). Later stages build on it.
- Parts in one stage must own **different** files. A folder is owned with a trailing `/` (`"src/components/"`).
- Keep parts small: 1–4 files, one clear job, a prompt that names exact files, sections and behaviour.
- Give every build part a `fallback` model (another free model of the same kind); it is used once if the first one
  hits a usage limit.
- **Q5 fast:** as few stages as possible, `workers` = the Q6 answer, `time_limit_min` 10. **Steady:** the default
  of 15.
- **Q7 a free model checks:** add a final stage with one check part. Agent route: `"files": ["REVIEW.md"]` and a
  prompt "Review <what>. Write your findings into REVIEW.md. Do not change any other file." Text route
  (`openrouter:`): list the files to read; the answer lands in the part's log.

Write `.model-crew/plan.json` in the project folder:

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
        "prompt": "Create the shared layout, header, footer and colour variables in styles.css." } ],
    [ { "id": "projects", "model": "opencode:opencode/fledge-alpha-free",
        "fallback": "opencode:opencode/ling-3.1-flash-free",
        "files": ["projects.html"], "prompt": "Projects page using the header and styles from index.html ..." },
      { "id": "contact", "model": "opencode:opencode/space-bunny-free",
        "fallback": "opencode:opencode/big-pickle",
        "files": ["contact.html", "contact.js"], "prompt": "Contact page with a form that validates ..." } ]
  ]
}
```

Every intake answer goes into `brief` (every worker sees it). The script adds the rules "edit only these files",
"do not run git" and "do not install packages unless your part says so" to every worker prompt.

### 4. Show the plan and wait for yes

Show a table: stage, part, model, files, one line of what it does. Then the time limit, worker count, and who
checks. Ask: "Run this plan?" **Stop until the user says yes.** Changes → edit the plan and show it again.

### 5. Make the work undoable

The script refuses to run outside a git repository or with uncommitted changes, so every worker change can be
undone. Before running, check `git status`:

- Not a git repository → ask: "Can I run `git init` and make a first commit, so every change can be undone?"
- Uncommitted changes → ask: "Can I commit your current work as a checkpoint first?"

### 6. Run

Run `python3 $CREW run` from the project folder. `time_limit_min` is per attempt, so a stage can take longer: parts
wait when there are more parts than workers, and a rate-limited part tries again on its fallback. Run it in the
background if your host allows, and tell the user what is running. Never start a second run in the same folder; the
script refuses one anyway.

Show the summary table in your reply. Each part ends as one of:

| Result | Meaning | What you do |
|---|---|---|
| `done` | Finished and changed its files | Check it (step 7). If it says `its log mentions a usage limit`, it may have stopped early: read its log and its files first |
| `no-changes` | Ended cleanly but changed nothing | Read the end of its log, then retry (step 8) |
| `stuck` | Passed its time limit and was stopped | Split the part smaller, or raise `time_limit_min` |
| `rate-limited` | Hit a usage limit, also on its fallback | Retry on a different free model, or later |
| `failed` | The tool reported an error | Read the end of its log; fix the cause; retry |

`unexpected changes` lists files that changed but no part owns. Read their diff and tell the user what they are.
When a stage has a part that is not `done`, later stages do not run; the summary says so.
Exit `2` means the plan was refused and nothing ran: fix every listed problem, show the user, and run again.

### 7. Check the work (Q7)

- **Me:** `git diff --stat`, then read the diffs of the finished parts. Build and start the app (or open the page),
  and confirm it works. Fix small things yourself only in `balanced` or `best` mode; in `cheapest`, list them.
- **A free model:** read `REVIEW.md` (or the check part's log), tell the user the findings, then delete `REVIEW.md`.
- **Nobody:** skip, and say in the report that nothing was checked.

### 8. Retry what is not done

The retry needs a clean folder: ask to commit the finished parts as a checkpoint first. Then write a new plan with
only the parts still to do (on a different model when the first failed), show it, wait for yes, and run again.

### 9. Final report

In plain words: what was built; which model built each part; what failed or was skipped and why; how to open or run
the result. Offer to commit the result. Mention the logs folder `.model-crew/runs/` only if something failed.

## Models

`/model-crew models`: run `python3 $CREW models` (add `--refresh` when the user asks for the latest). Show the
table and every `source` line in your reply, then explain the top 3 for their mode in one line each. To keep a
favourite: `python3 $CREW config --favourite build=<model id>`.

## Doctor

`/model-crew doctor` runs `python3 $CREW doctor`; step 0 runs `doctor --quick`. Show every line in your reply.

| Check | What | When broken |
|---|---|---|
| D1 | Python 3.9 or newer | Give the install link |
| D2 | Skill files present; selftest passes (full doctor only) | **Code fix after a yes** (below) |
| D3, D4 | Tools still installed / still logged in | Give the command to run in a separate Terminal |
| D5 | Config readable | Fixed automatically (old file kept as `config.json.bad`) |
| D6 | Saved model lists and history readable | Fixed automatically (damaged ones deleted) |
| D7 | Key file readable only by the user | Fixed automatically (`chmod 600`) |
| D8 | OpenRouter reachable | Saved lists still work; just tell the user |
| D9 | Favourite models still exist | Fixed automatically (replaced with the top model on the same route), but only when the model lists were fetched live; if a tool is away or offline, the favourite is kept and reported |
| D10 | Each tool still has the flags workers use | **Code fix after a yes** (below) |
| D11 | A run lock or workers left by a stopped run | Fixed automatically (only that run's own processes) |

Tell the user about every `fixed:` line. **Code fix after a yes:** read `crew.py` (and the tool's `--help` for D10),
find the smallest change that fixes the cause, show it as a diff in plain words, and apply it only when the user
says yes. Then run `python3 $CREW selftest` and `python3 $CREW doctor`. If it still fails, stop and say what you
found.

## Failure modes

| Symptom | Cause | What to do |
|---|---|---|
| A part `failed` and its log says `Invalid credential`, `401` or `unauthorized` | A saved login for that provider is wrong or expired, even though `detect` says logged in | Give the route's login command for a separate Terminal. OpenCode's free `opencode/...` models need no key: `opencode auth logout` (choose OpenCode Zen) also fixes it |
| `unexpected changes` inside a tool's own folder (for example `.omo/` from an OpenCode plugin) | The tool keeps its state in the project | Harmless. Ask to add that folder to `.gitignore`, or the next run is refused for uncommitted changes |
| An `agy:` part ends `no-changes` with an empty log | Antigravity's headless mode silently refuses tools it cannot ask permission for | Use another route for build parts; agy works only once its permission rules allow file reads and edits |
| Free models end `rate-limited` in a burst | Free models have per-minute and per-day limits | Fewer workers, different free models per part |
| `logged in: unknown` for opencode | OpenCode's own free models need no login, so there is nothing to check | Use it; a failed run will show if a login is needed |
| `gemini:default` | Gemini CLI picks its own model | Fine; put a specific name in the plan if the user wants one |
| A `claude:` worker fails to start inside Claude Code | Nested sessions | The script already clears the variable that blocks it; read the log |
| The plan is refused for a model name | Model lists change daily | Use the suggested name, or run `models --refresh` |
| Windows | Process groups work differently | Not supported in this version; say so |

## Red flags

| Thought | Reality |
|---|---|
| "I'll ask all the intake questions at once to save time" | One per message (law 2). "You decide" is the fast path. |
| "The user said build it, so I can run the plan" | A yes to the plan is separate (law 3). Show it first. |
| "The table is in the tool output, they saw it" | They did not (law 4). Repeat it. |
| "Just paste your key here and I'll save it" | Never (law 1). Give the Terminal command. |
| "Exit 0, so it worked" | Only `done` counts (law 6). |
| "This crew.py bug is obvious, I'll patch it" | Show the fix, wait for yes (law 5). |
| "A paid model would be quicker" in cheapest mode | The user chose free. Ask before changing mode. |

## What this skill does NOT do

Windows; separate worktrees per worker or automatic merging; cost and token accounting; benchmark scraping; deploys.

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve model-crew`.
