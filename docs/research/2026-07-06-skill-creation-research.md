# How to create the best skills — research synthesis (2026-07-06)

**Directive (Sanjay):** research how to create the best skills — articles, the best open-source skills, combining skills with tool calls/APIs, automation skills — watch Matt Pocock's videos + other credible sources, review our existing skill creators (tool-factory's skill-forge + skill-reviewer, the default Anthropic skill-creator plugin), and review /boost for generalization beyond coding. This document is the deliverable; building the "ultimate skill creator" is the NEXT step, not this one.

**How this was researched:** 5 parallel review/research agents (local skill reviews + official docs + ecosystem survey) + 7 videos watched (6 Matt Pocock + 1 Skill Creator v2 walkthrough). Sources listed at the end.

---

## 1. The twelve laws of great skills

Every credible source — Anthropic's official docs, Matt Pocock, Jesse Vincent's superpowers (the most-adopted skill pack, ~247k stars), Simon Willison — converges on the same core rules. Where they disagree, it's noted.

1. **The description is the trigger, never the summary.** The description field is the ONLY thing the model sees when deciding whether to load a skill. It must say what the skill does + the concrete situations/phrases that should fire it ("Use when…"). If it summarizes the process instead, agents follow the summary as a shortcut and never read the skill body — a tested, documented failure (superpowers ran the experiment). This is the #1 cause of skills that never fire or misfire.
2. **One trigger per branch, front-loaded.** Matt Pocock's rule: list the *branches* (distinct situations) that should trigger the skill, one trigger each, no synonym padding; put the skill's leading word first. Keep the description a single YAML line (a Prettier line-wrap once silently broke a skill's discovery).
3. **Progressive disclosure, three levels.** Level 1: name+description (always in context). Level 2: SKILL.md body (loads on trigger). Level 3: `references/`, `scripts/`, `assets/` (load only when used). Design for this: the body is a map, not an encyclopedia.
4. **Short bodies win.** Official cap: 500 lines. superpowers budgets: <150 words for frequently-loaded skills, <500 for the rest. Matt targets ~100 lines. Once loaded, every token competes with the actual conversation.
5. **References one level deep, with a table of contents.** Claude may partially read (`head -100`) a file referenced from another reference — nested chains silently lose information. Any file >100 lines gets a TOC so partial reads still show its full scope.
6. **Degrees of freedom = match strictness to fragility.** Judgment calls get prose; preferred patterns get pseudocode; fragile operations (migrations, publishing, money) get exact commands: "run exactly this, add no flags." (Official best-practices doc.)
7. **Ship scripts that solve, don't punt.** Bundled scripts handle their own errors instead of letting exceptions bubble up for the agent to improvise around. Reference them as `${CLAUDE_SKILL_DIR}/scripts/…` so paths survive any install location. No unexplained "voodoo constants."
8. **Evidence before instructions (RED first).** Run the task WITHOUT the skill, capture the actual failures verbatim, then write the minimal skill that fixes those observed failures. Both Anthropic ("build evals before documentation") and superpowers ("NO SKILL WITHOUT A FAILING TEST FIRST") state this independently. Our own skill-forge got this right.
9. **Positive instructions beat prohibitions.** Bare "don't do X" measurably backfires (superpowers' wording experiment: the prohibition arm produced MORE of the unwanted behavior than no guidance at all). Always pair or replace with "do Y instead." Matt's named failure mode: "negation."
10. **Know the named failure modes** (Matt's writing-great-skills): *premature completion* (skill declares done early), *duplication* (same rule in two places drifts), *sediment* (stale layers nobody removes because adding feels safe), *sprawl* (too many skills), *no-op* (a line the model already does by default — pure token waste).
11. **Mind the invocation axis.** User-invoked skills (`/name`, `disable-model-invocation`) are commands you type; model-invoked skills hold reusable discipline the agent applies on its own. Matt's hard rule: a user-invoked skill may call model-invoked ones, never another user-invoked one.
12. **Watch the fleet budget.** Community consensus: past ~8–12 installed skills the always-loaded metadata cost gets real. Claude Code silently truncates the combined description text at ~15,000 chars — skills past the cap become invisible with NO warning (`SLASH_COMMAND_TOOL_CHAR_BUDGET` raises it; `skillOverrides` can make low-priority skills name-only). A skill creator must check the fleet, not just the one skill.

**Security note (applies to a public skill library like ours):** `allowed-tools` pre-approves permissions — it is NOT a sandbox. Every credible source repeats: skills execute arbitrary code, install only from trusted sources. As publishers, our bar: never require broad tool grants, never bake credentials (env-var pattern only), document exactly what each script touches.

---

## 2. Choosing the right mechanism (skill vs everything else)

The distinction the whole ecosystem has settled on — hooks are *deterministic*, skills are *probabilistic* (the model decides):

| The instruction is… | Put it in |
|---|---|
| True on every single turn (identity, project map) | `CLAUDE.md` — but keep it SMALL; Matt: models have a limited "instruction budget" (~500 instructions), and irrelevant always-on rules make the model dumber |
| A procedure needed sometimes (a workflow, a checklist, tool know-how) | **A skill** |
| Something that must happen/never happen 100% of the time ("never git push", "block .env in commits") | **A hook** (`PreToolUse` block, exit code 2) — prose can only lower probability, hooks make it deterministic |
| Work that would flood the context (big searches, reviews) | **A subagent** (or a skill with `context: fork` + `agent:` — remember: a forked skill loses conversation history, so it must state its task fully) |
| A connection to an external system (live data, auth'd APIs) | **MCP server** — and skills then orchestrate those MCP tools by their fully-qualified names (`ServerName:tool_name`), which is how a skill "wraps" an API cleanly |

Matt's CLI video adds the sharp version: tool/CLI instructions ("use pnpm not npm") do NOT belong in CLAUDE.md — a hook redirects deterministically and costs zero instruction budget.

---

## 3. Skills + tools & APIs — the working patterns

- **Scope tools in frontmatter:** `allowed-tools: Read, Grep, Bash(python3:*)` — the skill declares exactly which tools/commands it may use.
- **Bundle real scripts** for anything deterministic; agent-side improvisation is slower, dearer, and less consistent than a script written once (Anthropic's own docx/pdf/pptx/xlsx skills — the ones powering Claude's document features — are the reference examples).
- **API credentials without secrets in the repo** (our constitution's rule 5, and the ecosystem agrees): resolve from env var first → interactive prompt as fallback → optional local config for regulars. Anthropic's `claude-api` skill documents a full resolution chain as the model to copy. OAuth inside a skill is awkward (callback URLs) — prefer keys/tokens via env.
- **Plan-validate-execute** for fragile multi-step operations: the agent writes a plan file, a bundled script validates it, only then execute. Errors get caught before they're applied.
- **MCP orchestration:** name MCP tools fully (`mcp__server__tool` / `ServerName:tool_name`) inside the skill text; unqualified names break when several servers are connected.
- **Stateful skills** (Matt's /teach is the masterclass): a skill can define a small file system as its memory — `MISSION.md` (why + success criteria + out-of-scope), `RESOURCES.md` (curated sources, continuously updated), `lessons/` (HTML for interactivity), `learning-records/` (progress). This turns a one-shot prompt into a system that survives across sessions. Directly reusable for non-coding skills.

## 4. Automation skills — what practitioners actually run

- **Skill + hook pairing:** a `UserPromptSubmit` hook can inject skill recommendations keyed off a `skill-rules.json` (keywords → skill), making discovery deterministic instead of hoping the description matches.
- **Headless cron:** `claude -p "…"` in crontab (env vars must be set explicitly — cron loads no shell profile; we learned the same lesson ourselves with the Banyan dream loop, lesson G7).
- **GitHub Actions:** official `anthropics/claude-code-action@v1` takes a skill name in its prompt, plus `--max-turns` / `--allowedTools` passthrough; scheduled audits are a proven pattern.
- **Native scheduling (2026):** `/loop` (open session), desktop tasks (machine on), cloud Routines (Anthropic infra, cron/webhook triggers).
- **Matt's AFK factory (Sandcastle):** orchestrator script + sandboxed agents (Docker/Podman/Vercel) + GitHub Issues as the backlog; skills chain PRD → issues → build ("Ralph loops"). The enabling insight: skills make each stage repeatable enough that no human needs to be in the loop mid-stage.
- **Guardrails that make unattended runs survivable:** `--allowedTools` scoping, turn/budget caps, idempotent + bounded + verifiable task scoping, deterministic hooks for the hard "never" rules. (Banyan's dream-loop cage is exactly this pattern.)
- **Human-steered by design:** Matt's "9 things people get wrong" video is really about this — a skill is a conversation, not an autopilot. Skills should distinguish low-fidelity questions (answerable by talking) from high-fidelity ones ("ungrillable" — only a prototype answers them), and users must know when to EXIT a skill. Passive users got 200–500 questions and exploded scope.

---

## 5. Our existing skill creators — review verdicts

### skill-forge (tool-factory) — "fix via tiering, keep the spine"
Its 8-stage process is genuinely strong engineering: RED baseline before writing, a ledger of evidence that survives the session, fail-closed self-tests that must *demonstrate refusal* of bad inputs, every law traced to a citing eval, and structural anti-self-approval (it cannot pass its own review). Keep all of that.
The "very very strict" complaint is real and precisely located in `skill_gate.py`: ONE fixed shape for every skill regardless of size — 4–8 laws (contiguous numbering enforced), mandatory dot-diagram, mandatory rationalization table (≥12 pipes), description must literally start "Use when", stdlib-only scripts (banning pip even when simpler), minimum character counts on evidence, ≥3 bad fixtures per check. Its own template admits this is deliberate ("the template is the floor, not a suggestion"). The cost: a trivial 30-line skill pays the same tax as a 12-stage pipeline gate.
**Fix:** add a declared complexity tier (e.g. `lightweight` / `standard` / `hardened`) that relaxes the shape checks while keeping the evidentiary spine. Don't rebuild from zero.

### skill-reviewer (tool-factory) — same story
Excellent core: the reviewer must RE-RUN the gates itself (never trusts the ledger — this caught a real crash), one adversarial loophole attempt per law, can't co-author. Weaknesses: the same regex rigidity (findings must match an exact punctuation pattern), the adversarial check is only a length floor (a wordy-but-shallow attempt passes), and the pair originally reviewed itself (bootstrap flaw, admitted in its own ledger).

### Official Anthropic skill-creator plugin (v2) — "wrong tool for authoring, right tool for optimizing"
Why it "isn't working for us": it's an **eval-engineering laboratory**, not a quick-authoring tool. Its minimum path is interview → draft → spawn 2 subagents per test case (parallel with/without-skill runs) → grader agent → benchmark aggregation with variance stats → a 44KB HTML review app in the browser → iterate; the description-optimization loop needs `claude -p` with a 60/40 train/test split over 5 iterations. Built for teams tuning high-stakes skills, not a solo director shipping skills frequently. There is no short exit for "write a 40-line playbook skill and move on."
**Verdict:** don't fight it and don't delete it — use it later, deliberately, to optimize the descriptions/evals of our few most important published skills. Never as the daily authoring path.
(Also: the `skill-creator` in `~/.claude/skills/` via obsidian-wiki is a **byte-for-byte vendored copy** of this same plugin — two installs of one tool, not a third option.)

### Matt Pocock's write-a-skill (installed at `~/.agents/skills/write-a-skill`) — "the right size, missing verification"
Three steps (gather requirements → draft → review with user), a clean template, good/bad description examples, and a mechanical 100-line rule for when to split out reference files. Zero infrastructure. Its gap: it never verifies the skill actually works — no baseline, no test, no adversarial pass.

### superpowers writing-skills — "best methodology, too heavy to load"
The most rigorous public thinking: skills = TDD applied to process documentation; pressure-test scenarios; the **"match the form to the failure"** table (choose prohibition/recipe/structure/condition wording based on the observed failure type — backed by an actual experiment). But it's 690 lines, depends on another skill, and demands subagent-graded scenarios. Steal the ideas, not the weight.

---

## 6. /boost — why it's coding-only today, and the generalization plan

**Diagnosis (full audit in the review):** the coding bias is structural, not cosmetic — all 6 task categories are dev categories (Debug/Feature/Refactor/Test/Review/Docs); all templates use dev nouns (Mocking Strategy, Integration Points, APIs); context discovery only reads code artifacts (package.json, pyproject.toml, git log) and has no branch for "find the brief / brand doc / prior draft"; even the passthrough check scores prompts by file paths, function names, and stack traces — a perfectly-structured marketing brief can't pass it. Net effect: any non-coding prompt falls into the thinnest template with no context injected — the opposite of what /boost promises.

**Plan (backward-compatible, additive only):**
1. **Two-tier categories:** keep the 6 dev categories; add domain-neutral ones — `Create`, `Revise`, `Diagnose`, `Evaluate`, `Verify`, `Explain`, `Research`, `Plan` — with a cheap domain hint (does the folder contain package.json vs .docx/Figma links vs nothing) checked BEFORE keyword counting, so "review" routes correctly for code vs content.
2. **Context discovery branches by artifact type:** writing → drafts/style guides/prior pieces; research → notes/source lists; design → Figma refs/brand guidelines; marketing/ops → briefs/calendars/SOPs. "Git context" generalizes to "change history" (`ls -lt` when there's no repo).
3. **Three new templates** (Research: Question/Sources/Findings/Confidence & Gaps/Recommendation · Plan: Objective/Constraints/Steps/Risks/Definition of Done · Create: Brief/Audience/Tone/Must-include/Must-avoid/Format/Success criteria); existing templates keep their skeleton with the bracket-language generalized. Split `task-templates.md` into dev + general files to protect the read budget.
4. **Passthrough generalized:** "specific file paths" → "specific named artifacts (paths, doc links, campaign names, dataset names)".
5. **Unchanged:** the 9-step flow, fast-track `!`, confirm/edit/skip, "Unknown — investigate" no-guessing law, the 2000-line discovery budget, `boost-patterns.md`.

---

## 7. Recommendation — what the "ultimate skill creator" should be

One creator, **three declared tiers** (the single biggest lesson: match ceremony to stakes — the official plugin fails by forcing maximum ceremony, skill-forge fails by forcing one fixed shape, write-a-skill fails by having no floor at all):

- **T1 · quick** (default; most skills): interview → draft ≤100 lines → description linter → one inline adversarial test → ship. Minutes, not hours. (Base: write-a-skill + our description rules.)
- **T2 · standard** (skills others will install — the nonlu library bar): T1 + RED baseline (run the task without the skill, capture real failures) + 2–3 `evals/evals.json` cases + the 8-point review checklist + fleet check (dedupe against existing skills, metadata budget).
- **T3 · hardened** (skills guarding irreversible/dangerous operations): T2 + a tiered skill-forge-style gate + independent adversarial review (evolved skill-reviewer as the reviewing arm).

Built-in regardless of tier: a **description linter** (triggers-only, "Use when", one trigger per branch, front-loaded, single-line YAML, ≤1024 chars); a **structure scaffolder** (progressive disclosure decisions made mechanically: 100-line split rule, one-level references, TOC >100 lines); the **form-matches-failure table**; a **wiring section** for tools/APIs (allowed-tools, `${CLAUDE_SKILL_DIR}/scripts`, fully-qualified MCP names, env-var credentials — never secrets in repo); an optional **automation packaging** step (pair the skill with a hook/cron/Action recipe when the user says "this should run by itself"); and Matt's failure-mode checklist as the final review lens (premature completion, duplication, sediment, sprawl, no-op, negation).

The official skill-creator v2 stays in the toolbox as the *optimization lab* we point at our top skills occasionally; skill-forge's gate becomes T3's engine after the tiering fix.

---

## 8. Sources

**Videos watched (2026-07-06):**
- Matt Pocock — [5 Claude Code skills I use every single day](https://www.youtube.com/watch?v=EJyuu6zlQCg) · [9 Things People Get Wrong With My /grill-* skills](https://www.youtube.com/watch?v=UzMNBN6xLLA) · [Skills Changelog: /handoff /prototype /review /writing-*](https://www.youtube.com/watch?v=DNqsMXH6Eog) · [Learn anything with the /teach skill](https://www.youtube.com/watch?v=s5T5oQJcJ6U) · [How to force Claude Code to use the right CLI](https://www.youtube.com/watch?v=3CSi8QAoN-s) · [I Open-Sourced My Own AFK Software Factory](https://www.youtube.com/watch?v=E5-QK3CDVQM)
- [Build Better AI Agent Skills With Skill Creator v2](https://www.youtube.com/watch?v=WplS5lycPHM) (third-party walkthrough)

**Written:**
- Anthropic: [Agent Skills docs](https://code.claude.com/docs/en/skills) · [authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) · [engineering blog: Equipping agents for the real world](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) · [anthropics/skills](https://github.com/anthropics/skills) · [scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks)
- The open standard: [agentskills.io](https://agentskills.io) (incl. [evaluating skills](https://agentskills.io/skill-creation/evaluating-skills))
- [mattpocock/skills](https://github.com/mattpocock/skills) (incl. writing-great-skills) · [obra/superpowers](https://github.com/obra/superpowers) (incl. writing-skills) · [Simon Willison on skills](https://simonwillison.net/2025/Oct/16/claude-skills/) · travisvn/awesome-claude-skills · hooks-vs-skills analysis (rikuq.com) · credential patterns (Ducky AI, Medium)

**Local reviews (same day):** `tool-factory-skills/skills/skill-forge` + `skill-reviewer` · official plugin at `~/.claude/plugins/cache/claude-plugins-official/skill-creator` · `~/.agents/skills/write-a-skill` · superpowers `writing-skills` · this repo's `skills/boost`.
