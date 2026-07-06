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
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Get_Started-2_min_setup-success?style=flat-square" alt="Get Started" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/platforms-16%2B_AI_tools-blue?style=flat-square" alt="16+ Platforms" />
  <img src="https://img.shields.io/badge/zero_dependencies-pure_markdown-orange?style=flat-square" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/Agent_Skills_Spec-compliant-brightgreen?style=flat-square" alt="Agent Skills Spec" />
</p>

<br/>

<p align="center">
  <code>/boost</code> — Stop giving your AI vague prompts<br/>
  <code>/pixel</code> — Stop getting "close enough" UI from Figma designs<br/>
  <code>/qa-shield</code> — Stop shipping attention-to-detail bugs to QA<br/>
  <code>/qa-watch</code> — Catch issues as you build, not after<br/>
  <code>/skill-smith</code> — Stop hand-rolling skills that never fire<br/>
  <code>/skill-evolve</code> — Stop letting your skills repeat the same mistake
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

## :zap: Quick Start

### 1. Clone

```bash
git clone https://github.com/luv-jeri/nonlu-skill.git
cd nonlu-skill
```

### 2. Install

<details open>
<summary><strong>Claude Code</strong></summary>

```bash
cp -r skills/boost/ ~/.claude/skills/boost/
cp -r skills/pixel/ ~/.claude/skills/pixel/
```
</details>

<details>
<summary><strong>Cursor</strong></summary>

```bash
cp -r skills/boost/ ~/.cursor/skills/boost/
cp -r skills/pixel/ ~/.cursor/skills/pixel/
```
</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

```bash
cp -r skills/boost/ ~/.gemini/skills/boost/
cp -r skills/pixel/ ~/.gemini/skills/pixel/
```
</details>

<details>
<summary><strong>OpenAI Codex</strong></summary>

```bash
cp -r skills/boost/ ~/.agents/skills/boost/
cp -r skills/pixel/ ~/.agents/skills/pixel/
```
</details>

<details>
<summary><strong>Any Agent Skills-compatible tool</strong></summary>

This package follows the [Agent Skills spec](https://agentskills.io). Copy `skills/` to your tool's skills directory.

Works with: Claude Code, Cursor, Gemini CLI, Codex, Copilot, Windsurf, and 10+ more.
</details>

### 3. Use

```bash
# Open a new session in any project, then:
/boost fix the auth bug          # structured prompt
/pixel https://figma.com/...     # pixel-perfect UI
```

<br/>

---

<br/>

## :building_construction: Architecture

```
nonlu-skill/
├── skills/
│   ├── boost/                       # Prompt Enhancer
│   │   ├── SKILL.md                 # Complete self-contained skill
│   │   │                            #   (process, iron laws, detection,
│   │   │                            #    context discovery, red flags)
│   │   ├── references/
│   │   │   └── task-templates.md    #   7 category templates (loaded per-category)
│   │   ├── examples/
│   │   │   └── before-after.md      #   Complete transformations
│   │   └── tests/                   #   Trigger + quality evals
│   │
│   └── pixel/                       # Figma to Pixel-Perfect UI
│       ├── SKILL.md                 # Complete self-contained skill
│       │                            #   (2-phase process, iron laws,
│       │                            #    input detection, token extraction,
│       │                            #    build flow, red flags)
│       ├── references/
│       │   ├── design-map.md        #   Detailed 7-section table formats
│       │   └── verification.md      #   Detailed audit checklists
│       ├── examples/
│       │   └── design-map-example.md #  Complete design map example
│       └── tests/                   #   Trigger + quality evals
│
├── patterns/
│   └── boost-patterns.md            # Team shared knowledge (git-tracked)
├── CLAUDE.md                        # Contributor conventions
└── package.json                     # Package metadata
```

**Zero dependencies. Pure markdown.** Each `SKILL.md` is fully self-contained — all essential process logic, iron laws, and enforcement inline. Reference files are supplementary only (detailed templates, table formats). Your AI executes the full skill without needing extra file reads.

<br/>

---

<br/>

## :test_tube: Built-in Quality Assurance

Every skill ships with its own evaluation framework:

| | Eval Type | What It Tests | Threshold |
|---|-----------|--------------|-----------|
| :dart: | **Trigger Tests** | Does the skill activate correctly? (20 scenarios each) | 90% accuracy |
| :bar_chart: | **Quality Rubric** | Is the output good enough? (multi-dimension scoring) | Minimum score per dimension |

Run evals by reviewing the test files in each skill's `tests/` directory.

<br/>

---

<br/>

## :globe_with_meridians: Platform Support

Built on the [Agent Skills spec](https://agentskills.io) — works with every major AI coding tool:

| Platform | Status |
|----------|--------|
| Claude Code | :white_check_mark: Supported |
| Cursor | :white_check_mark: Supported |
| Gemini CLI | :white_check_mark: Supported |
| OpenAI Codex | :white_check_mark: Supported |
| GitHub Copilot | :white_check_mark: Supported |
| Windsurf | :white_check_mark: Supported |
| Any Agent Skills tool | :white_check_mark: Supported |

<br/>

---

<br/>

## :handshake: Contributing

We'd love contributions! This is **all markdown** — no app code, easy to jump in.

- **Have a skill idea?** [Open an issue](https://github.com/luv-jeri/nonlu-skill/issues)
- **Found a bug?** [Report it](https://github.com/luv-jeri/nonlu-skill/issues)
- **Want to build a skill?** Check `CLAUDE.md` for conventions

### Key Rules

- Each skill lives in `skills/<name>/`
- `SKILL.md` is self-contained (all essential logic inline, 200-500 lines)
- Reference files are supplementary only (detailed templates, examples)
- Iron laws and red flags MUST be inline in SKILL.md
- Every skill needs trigger tests + quality rubric

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
