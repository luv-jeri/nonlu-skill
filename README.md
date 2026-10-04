<h1 align="center">Nonlu Skills</h1>

<p align="center">
  <strong>AI agent skills that help your team ship faster.</strong><br/>
  <em>Better prompts. Pixel-perfect UI. No more guesswork.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%9A%80_Boost-Prompt_Enhancer-blueviolet?style=for-the-badge" alt="Boost" />
  <img src="https://img.shields.io/badge/%F0%9F%8E%AF_Pixel-Figma_to_Perfect_UI-blue?style=for-the-badge" alt="Pixel" />
  <img src="https://img.shields.io/badge/%F0%9F%9B%A1_QA_Shield-Post--Build_QA-green?style=for-the-badge" alt="QA Shield" />
  <img src="https://img.shields.io/badge/%F0%9F%91%80_QA_Watch-Build_Companion-orange?style=for-the-badge" alt="QA Watch" />
  <img src="https://img.shields.io/badge/%F0%9F%94%A8_Skill_Smith-Tiered_Skill_Creator-purple?style=for-the-badge" alt="Skill Smith" />
  <img src="https://img.shields.io/badge/%F0%9F%8C%B1_Skill_Evolve-Skills_That_Learn-teal?style=for-the-badge" alt="Skill Evolve" />
  <img src="https://img.shields.io/badge/%F0%9F%93%8B_Recap-Visual_Work_Summary-crimson?style=for-the-badge" alt="Recap" />
  <img src="https://img.shields.io/badge/%F0%9F%91%A5_Model_Crew-Free_Models_in_Parallel-darkgreen?style=for-the-badge" alt="Model Crew" />
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Get_Started-2_min_setup-success?style=flat-square" alt="Get Started" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/skills-9-blue?style=flat-square" alt="9 Skills" />
  <img src="https://img.shields.io/badge/evals-110_asserts-brightgreen?style=flat-square" alt="110 eval asserts" />
  <img src="https://img.shields.io/badge/runtime-markdown_%2B_python_stdlib-orange?style=flat-square" alt="Markdown plus Python stdlib" />
  <img src="https://img.shields.io/badge/Agent_Skills_Spec-compliant-brightgreen?style=flat-square" alt="Agent Skills Spec" />
</p>

<br/>

<p align="center">
  <code>/boost</code> — Stop giving your AI vague prompts<br/>
  <code>/pixel</code> — Stop getting "close enough" UI from Figma designs<br/>
  <code>/qa-shield</code> — Stop shipping attention-to-detail bugs to QA<br/>
  <code>/qa-watch</code> — Catch issues as you build, not after<br/>
  <code>/skill-smith</code> — Stop hand-rolling skills that never fire<br/>
  <code>/skill-evolve</code> — Stop letting your skills repeat the same mistake<br/>
  <code>/recap</code> — Stop reading walls of text to find out what changed<br/>
  <code>/model-crew</code> — Stop guessing which AI model to use; build with free ones in parallel
</p>

---

<br/>

## What's Inside

| | Skill | Trigger | One-liner |
|---|-------|---------|-----------|
| :rocket: | **Boost** | `/boost` | Transforms rough prompts into structured, context-rich prompts |
| :dart: | **Pixel** | `/pixel` | Transforms Figma designs into pixel-perfect UI with zero guesswork |
| :shield: | **QA Shield** | `/qa-shield` | Catches attention-to-detail issues across 9 categories before QA finds them |
| :eyes: | **QA Watch** | `/qa-watch` | Lightweight QA companion that checks for issues as you build |
| :hammer: | **Skill Smith** | `/skill-smith` | Creates new skills with the right ceremony — quick, standard, or hardened tier |
| :seedling: | **Skill Evolve** | `/skill-evolve` | Captures a skill's mistakes and upgrades the skill with proof, never silently |
| :clipboard: | **Recap** | `/recap` | Closes a unit of work with a visual capsule and a decision log instead of a wall of text |
| :busts_in_silhouette: | **Model Crew** | `/model-crew` | Finds every AI model you can use (free ones first), asks what you want, and builds the task in parallel on free models while your main agent only plans and checks |
| :movie_camera: | **Site Capture** | `/site-capture` | Studies an award-level site like a movie — design, motion, shaders, scroll and cursor feel — into an evidence folder plus a RECREATE report, with measurement forensics and a see-judge-iterate recreation review loop |

<br/>

---

<br/>

## :dart: Pixel — Figma to Pixel-Perfect UI

> **The #1 problem:** You give the AI a Figma design and it builds something "close" — wrong spacing, hardcoded colors, missing hover states, no responsive, skipped animations. Then you spend hours fixing it.

`/pixel` eliminates this entirely.

<br/>

### The Pixel Difference

<table>
<tr>
<td width="50%">

#### :x: Without Pixel

```
"Build this Figma design"

→ AI eyeballs the screenshot
→ Guesses spacing (close but wrong)
→ Hardcodes colors (#3B82F6 instead of your token)
→ Skips hover, loading, empty states
→ No responsive behavior
→ No animations
→ You spend 2+ hours fixing
```

</td>
<td width="50%">

#### :white_check_mark: With Pixel

```
"/pixel https://figma.com/design/abc123"

→ AI creates complete Design Map
→ Maps every value to YOUR tokens
→ Asks about ambiguities BEFORE coding
→ Builds one component at a time
→ Verifies each against the design
→ Runs 6-point final audit
→ Ships pixel-perfect
```

</td>
</tr>
</table>

<br/>

### How It Works

```
/pixel <figma-url or screenshot>
            │
    ┌───────┴───────┐
    │  PHASE 1:     │
    │  Design Map   │
    └───────┬───────┘
            │
   1. Detect Input
      Figma MCP? Screenshot? Pasted specs? All of them?
            │
   2. Create Design Map ─────────────────────────────────┐
      ├─ Layout hierarchy (grid, flex, nesting)          │
      ├─ Component inventory (every variant & state)     │ 7 sections
      ├─ Design tokens (mapped to YOUR system)           │ covering
      ├─ Responsive behavior (per breakpoint)            │ everything
      ├─ Micro-interactions (hover, transitions)         │
      ├─ Assets (icons, images, exports needed)          │
      └─ Open questions (ambiguities flagged)  ──────────┘
            │
   3. Q&A Gate
      "No mobile design — infer responsive or desktop-only?"
      "Hover state not shown — should cards have hover?"
      ALL questions answered BEFORE any code
            │
    ┌───────┴───────┐
    │  PHASE 2:     │
    │  Build        │
    └───────┬───────┘
            │
   4. Build Order (outside-in, top-to-bottom)
            │
   5. Build → Verify → Next ──── repeats per component
            │
   6. Final Audit
      ├─ Pixel comparison (visual match)
      ├─ Token audit (grep for hardcoded values)
      ├─ Responsive audit (every breakpoint)
      ├─ State audit (hover, loading, error, empty)
      ├─ Interaction audit (animations, transitions)
      └─ Accessibility baseline (contrast, focus, semantics)
```

<br/>

### Why This Matters

| Problem | How Pixel Solves It |
|---------|-------------------|
| **Hardcoded colors everywhere** | Reads your tailwind config / CSS variables, maps every Figma value to existing tokens |
| **Missing component states** | Inventories every state (hover, disabled, loading, error, empty) — asks if Figma doesn't show them |
| **"Close enough" spacing** | Extracts exact values from Figma, matches to your spacing scale — flags mismatches |
| **No responsive behavior** | Dedicated responsive section in design map — never silently skips mobile |
| **Skipped animations** | Micro-interactions are part of the build order, not an afterthought |
| **AI guesses when confused** | Q&A gate forces questions BEFORE code — no more silent wrong assumptions |
| **Hard to find what's wrong** | Builds one component at a time with verification, not a monolithic dump |

<br/>

### Pixel Usage

```bash
# With Figma URL (uses Figma MCP for precise values)
/pixel https://figma.com/design/abc123

# With screenshot in context
/pixel

# With pasted specs from Figma Dev Mode
/pixel

# Relaxed mode — checkpoint after sections, not every component
/pixel --relaxed https://figma.com/design/abc123

# Fast mode — build everything, audit at the end
/pixel!
```

### Input Flexibility

Works with whatever you have — no single tool required:

| Input | Best For |
|-------|---------|
| **Figma MCP** | Precise token values, exact styles, component hierarchy |
| **Screenshots** | Quick visual reference, overall composition |
| **Dev Mode Export** | Exact CSS values straight from the designer |
| **All combined** | Cross-referenced for maximum accuracy |

<br/>

---

<br/>

## :shield: QA Shield — Post-Build Verification

> **The #1 problem:** You build a feature, push it, and QA comes back with: overflow issues, missing hover states, broken scroll, inconsistent spacing, no error states. These aren't bugs — they're attention-to-detail gaps you missed.

`/qa-shield` eliminates this by systematically checking 9 categories of attention-to-detail issues.

<br/>

### How It Works

```
/qa-shield

→ Scopes to your changed files (git diff)
→ Analyzes what you built
→ Runs 9 category checks (or marks irrelevant ones N/A)
→ Produces structured report with severity + locations
→ Offers to auto-fix what it can
```

<br/>

### 9 Categories

| # | Category | What It Catches |
|---|----------|----------------|
| 1 | Figma Fidelity | Spacing, colors, typography drift from design |
| 2 | Data/API Mismatch | Missing null checks, untyped responses, no loading states |
| 3 | Edge Cases | Missing error/loading/empty states, boundary inputs |
| 4 | User Flow Gaps | Dead ends, missing back navigation, no confirmations |
| 5 | Micro-interactions | Missing hover/focus states, no action feedback |
| 6 | Logging | Swallowed errors, missing analytics, console.log leftovers |
| 7 | Overflow | Text/container overflow, long content breaking layout |
| 8 | Scroll | Missing scroll areas, broken sticky headers |
| 9 | Detail | Inconsistent radius/shadows, wrong cursors, z-index issues |

<br/>

### QA Shield Usage

| Command | What It Does |
|---|---|
| `/qa-shield` | Scan changed files, all 9 categories |
| `/qa-shield <figma-url>` | Include Figma fidelity comparison |
| `/qa-shield --focus=overflow,scroll` | Check specific categories only |
| `/qa-shield!` | Fast-track — no confirmations |
| `/qa-shield src/components/` | Scan specific path |

<br/>

---

<br/>

## :eyes: QA Watch — Lightweight QA During Development

> **Don't wait for the end.** `/qa-watch` catches issues as you build — overflow, missing states, hover gaps — so you fix them in the moment instead of the cleanup phase.

<br/>

### How It Works

```
/qa-watch

→ Scans your recent changes
→ Runs 5 quick checks (overflow, states, interactions, scroll, detail)
→ Reports findings inline (1 line each)
→ Doesn't interrupt your flow
```

<br/>

### Session Mode

```
/qa-watch --session

→ "QA Watch session active"
→ After each component you build, auto-runs the lite checklist
→ Surfaces findings immediately
→ /qa-watch stop to end
```

<br/>

### QA Watch Usage

| Command | What It Does |
|---|---|
| `/qa-watch` | Quick scan of recent changes |
| `/qa-watch --session` | Continuous checking during build |
| `/qa-watch --focus=overflow` | Check specific category only |
| `/qa-watch stop` | End session mode |

<br/>

---

<br/>

## :rocket: Boost — Prompt Enhancer

> **The problem:** Your AI agent gets *"fix the login thing"* and starts guessing. No context. No constraints. No success criteria. 3 rounds of back-and-forth later, maybe it's fixed.

`/boost` transforms that into a structured prompt in seconds.

<br/>

### Before & After

<table>
<tr>
<td width="50%">

#### :x: Without Boost

```
fix the login page it keeps
crashing when I click submit
```

Agent guesses, reads random files, maybe fixes it after 3 attempts.

</td>
<td width="50%">

#### :white_check_mark: With Boost

```
## Task: Fix crash on login form submission
## Type: Debug
## Context:
  - Project: Next.js 14 with TypeScript
  - Recent: auth middleware updated 2 days ago
  - Files: src/app/login/page.tsx, src/lib/auth.ts
## Symptoms: Crash on submit button click
## Investigation Starting Points:
  - Form submit handler
  - Auth middleware (recently changed)
## Constraints:
  - Maintain auth API contracts
## Success Criteria:
  - Login submits without crashing
  - All auth tests pass
```

Agent knows exactly what to do.

</td>
</tr>
</table>

<br/>

### Boost Usage

```bash
# Suffix (most natural)
refactor the auth module it's messy /boost

# Prefix
/boost fix the login crash

# Fast-track (skip confirmation, auto-execute)
add dark mode /boost!

# Bootstrap team patterns from codebase
/boost --init
```

### 7 Task Categories — Auto-Detected

| | Category | Triggers | What Gets Added |
|---|----------|---------|-----------------|
| :bug: | **Debug** | fix, bug, error, crash | Symptoms, expected vs actual, investigation points |
| :sparkles: | **Feature** | add, create, build | Requirements, acceptance criteria, edge cases |
| :recycle: | **Refactor** | refactor, clean up | Current state, target state, boundaries |
| :test_tube: | **Test** | test, coverage, spec | Targets, types, edge cases, mocking strategy |
| :mag: | **Review** | review, audit, check | Scope, focus areas, severity output |
| :book: | **Docs** | document, explain | Audience, scope, format, examples |
| :gear: | **General** | *(anything else)* | Goal, approach, constraints |

### Team Knowledge Base

```bash
# Auto-generate patterns from your codebase
/boost --init

# Everyone gets shared context
git add boost-patterns.md && git commit -m "feat: add team patterns"
```

Maps your team's terminology, conventions, protected areas, and common workflows — so every prompt gets the same context automatically.

<br/>

---

<br/>

## :hammer: Skill Smith — Tiered Skill Creator

`/skill-smith` builds new skills with the right amount of ceremony for the stakes, and
wires every one of them to learn from its own mistakes.

| Tier | For | Adds |
|---|---|---|
| **T1 quick** | Personal helpers, low stakes | Draft ≤100 lines · description lint · one adversarial walkthrough |
| **T2 standard** | Anything others install (the publish bar here) | T1 + RED baseline + executable evals + fleet check |
| **T3 hardened** | Skills that delete, publish, send or spend | T2 + independent review — never self-approved |

The tier **is** the time decision: T1 is minutes, T2 is a session, T3 spans a review
handoff. Its hardest rule is the one people skip: **the description states triggers,
never the process.** A description that summarizes the workflow makes the model follow
the summary and skip the skill body — a documented, tested failure.

<br/>

---

<br/>

## :seedling: Skill Evolve — Skills That Learn

`/skill-evolve` is the other half of Skill Smith. Skills improve through recorded
evidence and an approved diff — never by silently rewriting themselves.

| Mode | When | What happens |
|---|---|---|
| **CAPTURE** | Something just went wrong | A dated entry lands in that skill's `LEARNINGS.md`. Instant, free, no edit. |
| **EVOLVE** | Absorbing accumulated learnings | Each entry is classified, then a diff is shown for approval. |
| **RUN** | Eval-driven improvement | One change per iteration, re-run, keep or revert **by score**. |

The classification table is the safety mechanism — it stops a one-off fluke from becoming
a permanent rule that fights every future task:

| Class | Meaning | Action |
|---|---|---|
| **Defect** | The skill's instructions caused the failure | Fix the skill |
| **Fluke** | One-off environment or typo | Keep logged, add **no** rule |
| **Trigger gap** | Fired when it shouldn't, or didn't when it should | Edit the description |
| **Preference** | User wants it their way | Config file, not a law |

In RUN mode a tie reverts. Scores compound; feelings don't.

<br/>

---

<br/>

## :clipboard: Recap — Visual Work Summary

`/recap` closes a unit of work with something you can read in five seconds instead of a
wall of text.

```
━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Add JSON support without a new dep  ·  done

  ✅ Edited 3 files ................. changes applied
  ✅ Ran test suite ................. 12/12 passing
  ⚠️ Docs updated ................... examples pending
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| # | 🧭 Decision | 💡 Why | 🚫 Rejected |
|---|---|---|---|
| 1 | Use stdlib `json` | no new runtime dependency | third-party JSON library |

**Three design choices worth knowing before you use it:**

1. **The recap is in the reply text, never in script output.** Measured: a script printed
   a formatted box to stdout and the human saw nothing — Claude Code collapsed it to
   `Ran 2 shell commands`. Tool stdout is a model channel, not a human channel. Do not
   "improve" this skill by moving the rendering into a script.
2. **Decisions are journalled when they are made, not recalled at the end.**
   End-of-task reconstruction forgets rejected alternatives and retrofits rationales — a
   decision log that invents decisions is worse than none.
3. **Silence is a valid output.** No material work recorded means no capsule, and no line
   explaining why there is no capsule either.

Measured cost: **~192 tokens** per recap. A JSON-payload-plus-renderer design was
prototyped and rejected at ~700 tokens for the same output.

| Command | Does |
|---|---|
| *(automatic)* | Capsule at the end of a material unit of work |
| `/recap` | Re-emit the current session's capsule |
| `/recap --open` | Inject the journal into a fixed HTML template and open it in the browser |

**Honest limitation:** automatic firing is enforceable in Claude Code via a Stop hook
(`recap.py gate`). The Claude desktop app and Codex CLI have no hook equivalent, so there
it depends on the model noticing that work ended. One portable skill cannot promise
identical enforcement everywhere, and this one does not pretend to.

<br/>

---

<br/>

## :busts_in_silhouette: Model Crew — Free Models, Working in Parallel

`/model-crew` answers "which AI model should I use for this?" and then does the work with
the free ones. It finds every AI tool you already have (OpenCode, OpenRouter, Codex, Gemini
CLI, Antigravity, Claude Code), lists the models you can use **right now** with free ones
first, asks you a few short questions, and splits your task across several free models
running at the same time. Your main agent only plans and checks, so you spend far fewer
paid tokens.

```
/model-crew setup                 # find your tools, log in, pick a default mode
/model-crew build my portfolio    # ask → pick models → plan → your yes → build → check
/model-crew models                # ranked list of models you can use now
/model-crew doctor                # check the skill itself and fix what is safe to fix
```

**Three design choices worth knowing before you use it:**

1. **Your API keys never go into the chat.** Setup gives you a command to run in your own
   Terminal window; the key is typed there with hidden typing and saved readable only by you.
2. **It asks before it plans, and plans before it runs.** One question at a time (say
   *you decide* to skip the rest), then a plan table, then nothing happens until you say yes.
3. **Live lists, cached.** Model lists are fetched live and saved for 10 minutes; when a
   provider is down you see the saved list and how old it is. Each model also builds a
   track record ("finished 8 of its last 10 jobs") that moves the reliable ones up.

| Mode | Workers | Your main agent |
|---|---|---|
| cheapest | free models only | plans, light check |
| balanced *(default)* | free models | plans, checks, fixes small things |
| best | paid models allowed | plans, checks |

**Honest limitations:** macOS and Linux only (workers run in process groups, which work
differently on Windows). Workers share one folder, so parts that run at the same time must
own different files, and the run refuses to start outside git or with uncommitted changes,
so every change can be undone. Antigravity's headless mode silently refuses file tools
until its permission rules allow them.

<br/>

---

<br/>

## :zap: Quick Start

### 1. Clone

```bash
git clone https://github.com/luv-jeri/nonlu-skill.git
cd nonlu-skill
```

### 2. Install

**Symlink, don't copy.** A symlink means `git pull` updates every installed skill and
your edits stay in one place; copies fork silently and drift.

<details open>
<summary><strong>Claude Code</strong> (verified)</summary>

```bash
for s in boost pixel qa-shield qa-watch skill-smith skill-evolve recap model-crew; do
  ln -sfn "$(pwd)/skills/$s" ~/.claude/skills/"$s"
done
ls -l ~/.claude/skills/ | grep nonlu   # confirm the links resolve
```
</details>

<details>
<summary><strong>OpenAI Codex</strong> (verified loading)</summary>

```bash
for s in boost pixel qa-shield qa-watch skill-smith skill-evolve recap model-crew; do
  ln -sfn "$(pwd)/skills/$s" ~/.codex/skills/"$s"
done
```
</details>

<details>
<summary><strong>Per-project instead of global</strong></summary>

```bash
mkdir -p .claude/skills
ln -sfn "$(pwd)/skills/recap" .claude/skills/recap
```

Project-level skills apply only in that repo. Global (`~/.claude/skills/`) applies
everywhere — including every other project you open.
</details>

<details>
<summary><strong>Other Agent Skills tools</strong></summary>

This package follows the [Agent Skills spec](https://agentskills.io) — plain markdown
with standard frontmatter. Symlink `skills/<name>` into your tool's skills directory.
We have verified Claude Code and Codex only; the Platform Support section below spells out
what that means for the rest.
</details>

### 3. Verify the install

```bash
python3 skills/skill-evolve/scripts/run_evals.py --selftest   # runner works offline
python3 skills/recap/scripts/recap.py selftest                # recap's format checker
python3 skills/model-crew/scripts/crew.py selftest            # model-crew's 66 offline tests
```

### 4. Use

```bash
/boost fix the auth bug          # structured prompt
/pixel https://figma.com/...     # pixel-perfect UI
/qa-shield                       # full 9-category scan before QA
/qa-watch --session              # lightweight checks while you build
/skill-smith                     # create a new skill
/skill-evolve <skill>            # improve one from recorded evidence
/recap                           # visual summary of what just happened
/model-crew setup                # find your AI tools and their free models
/model-crew build my portfolio   # ask, plan, then build in parallel on free models
```

<br/>

---

<br/>

## :building_construction: Architecture

```
nonlu-skill/
├── skills/
│   ├── boost/                  # router     45 lines   /boost
│   ├── pixel/                  # router     44 lines   /pixel
│   ├── qa-shield/              # self-cont. 413 lines  /qa-shield
│   ├── qa-watch/               # self-cont. 315 lines  /qa-watch
│   ├── skill-smith/            # self-cont. 121 lines  /skill-smith
│   ├── skill-evolve/           # self-cont. 99 lines   /skill-evolve
│   │   └── scripts/run_evals.py    # the eval runner every skill is tested by
│   ├── recap/                  # self-cont. 226 lines  /recap
│   │   ├── scripts/recap.py        # journal, format check, Stop gate, HTML export
│   │   └── template.html           # fixed shell for /recap --open
│   └── model-crew/             # self-cont. 277 lines  /model-crew
│       └── scripts/crew.py         # detect tools, live ranked models + cache, parallel run, doctor
│
│   every skill folder also carries:
│       SKILL.md                    # frontmatter + the skill itself
│       LEARNINGS.md                # dated mistake log, absorbed by /skill-evolve
│       evals/evals.json            # executable asserts (the source of truth)
│       evals/eval-log.md           # what was tried, kept or reverted, and why
│       tests/eval-triggers.md      # does it fire on the right prompts?
│       tests/eval-quality.md       # RED baseline + grading rubric
│       references/                 # load-bearing for routers, supplementary otherwise
│
├── docs/superpowers/specs/     # design specs, one per skill
├── patterns/boost-patterns.md  # team shared knowledge (git-tracked)
├── CLAUDE.md                   # contributor conventions
└── .claude-plugin/marketplace.json   # a skill ships only once listed here
```

**Two SKILL.md patterns, and it matters which one you're editing.**

- **Self-contained** (qa-shield, qa-watch, skill-smith, skill-evolve, recap, model-crew) — SKILL.md
  holds the whole process. `references/` is supplementary detail. This is the target for
  new skills.
- **Router** (boost, pixel) — SKILL.md is a short index that delegates each step to a
  `references/*.md` file. Here the reference files **are** load-bearing: changing
  behaviour means editing the reference, not SKILL.md.

**Dependencies:** markdown plus Python 3 standard library. Three skills ship a script
(`recap.py`, `run_evals.py`, `crew.py`); nothing to `pip install`, no third-party packages.
Only `crew.py` uses the network: OpenRouter's public model list, and the AI tools you
already have installed.

<br/>

---

<br/>

## :test_tube: Built-in Quality Assurance

Every skill ships **executable** evals — not a checklist someone reads and nods at. One
command runs them:

```bash
python3 skills/skill-evolve/scripts/run_evals.py skills/<name>
```

Exit 0 means green. `--selftest` proves the runner itself works offline.

| Skill | Evals | Asserts |
|---|--:|--:|
| boost | 4 | 16 |
| pixel | 5 | 10 |
| qa-shield | 5 | 7 |
| qa-watch | 6 | 8 |
| skill-smith | 6 | 11 |
| skill-evolve | 6 | 8 |
| recap | 6 | 22 |
| model-crew | 7 | 28 |

**How an assert is graded.** Deterministic checks (`contains`, `not_contains`, `regex`,
`not_regex`, `max_words`, `min_words`) run natively. Anything left over is prose, graded
by a cheap judge model. **Prefer deterministic** — during this repo's own work a judge
graded the same rule wrongly in both directions, passing output that violated it and
failing output that did not. Recap's suite is deliberately 18-of-22 deterministic for
that reason.

Each skill also keeps:

- `evals/eval-log.md` — every iteration tried, its score before → after, kept or reverted
- `tests/eval-quality.md` — the RED baseline: the real observed failures each rule descends from
- `tests/eval-triggers.md` — should-fire / should-not-fire prompts plus the description lint

**A red assert is not automatically a skill defect.** Read the transcript in
`evals/runs/` first — in this repo's own history, several reds were badly written tests,
and fixing the test was the correct action.

<br/>

---

<br/>

## :globe_with_meridians: Platform Support

Built on the [Agent Skills spec](https://agentskills.io). These skills are plain markdown
with standard frontmatter, so any spec-compliant tool can load them — but "loads" and
"verified working" are different claims, so here is the honest split:

| Platform | Status |
|----------|--------|
| Claude Code | :white_check_mark: **Verified** — all 7 skills installed and exercised here |
| OpenAI Codex | :white_check_mark: **Verified loading** — `~/.codex/skills/`; `recap` resolves its script path on both |
| Cursor | :grey_question: Spec-compatible, not verified by us |
| Gemini CLI | :grey_question: Spec-compatible, not verified by us |
| GitHub Copilot | :grey_question: Spec-compatible, not verified by us |
| Windsurf | :grey_question: Spec-compatible, not verified by us |

**Portability note for skill authors:** `${CLAUDE_SKILL_DIR}` is Claude Code only. Any
skill that shells out to its own script should resolve the path once with a fallback —
`recap` uses `RECAP="${CLAUDE_SKILL_DIR:-<skill folder>}/scripts/recap.py"` — or its
commands break silently on other harnesses.

<br/>

---

<br/>

## :handshake: Contributing

We'd love contributions! This is **all markdown** — no app code, easy to jump in.

- **Have a skill idea?** [Open an issue](https://github.com/luv-jeri/nonlu-skill/issues)
- **Found a bug?** [Report it](https://github.com/luv-jeri/nonlu-skill/issues)
- **Want to build a skill?** Check `CLAUDE.md` for conventions

### Key Rules

- Each skill lives in `skills/<name>/`.
- **Identify the pattern before editing.** Self-contained → SKILL.md *is* the process,
  edit it directly. Router (boost, pixel) → edit the `references/*.md` file; SKILL.md
  only changes when the step index does.
- New skills should be self-contained, with iron laws and red flags inline.
- The `description` field states **trigger conditions only** — never a process summary.
  It is the string the model matches on; a description that narrates the workflow makes
  the model follow the summary and skip the body.
- Every skill ships `LEARNINGS.md` plus the learning-capture footer, wired at creation.
- Every skill ships `evals/evals.json` that runs **green** before it is merged, plus
  `tests/eval-triggers.md` and `tests/eval-quality.md`.
- A skill is only shipped once it is listed in `.claude-plugin/marketplace.json`.

Run `/skill-smith` to scaffold a new skill with all of this wired, and `/skill-evolve`
to change an existing one from recorded evidence.

### Skill Ideas We'd Love Help With

- `/review` — Structured PR review with consistent criteria
- `/migrate` — Step-by-step framework/library migration workflows
- `/incident` — Incident triage and root cause analysis
- `/onboard` — New contributor setup and codebase orientation

<br/>

---

<br/>

## :scroll: License

MIT — see [LICENSE](LICENSE)

<br/>

<p align="center">
  <strong>Better prompts. Pixel-perfect UI. Ship faster.</strong>
</p>

<p align="center">
  <a href="https://github.com/luv-jeri/nonlu-skill">
    <img src="https://img.shields.io/badge/Star_on_GitHub-%E2%AD%90-yellow?style=for-the-badge" alt="Star on GitHub" />
  </a>
</p>
