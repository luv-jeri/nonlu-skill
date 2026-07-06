# Boost — Complete Process

## Flow

```dot
digraph boost_flow {
    rankdir=TB;
    node [shape=box];

    capture [label="1. Capture raw prompt"];
    passthrough [label="2. Passthrough check" shape=diamond];
    execute_asis [label="Execute as-is"];
    detect [label="3. Detect task type"];
    discover [label="4. Discover context"];
    structure [label="5. Structure prompt"];
    fasttrack [label="6. Fast-track?" shape=diamond];
    present [label="7. Present to user"];
    confirm [label="User confirms?" shape=diamond];
    execute [label="8. Execute enhanced prompt"];
    suggest [label="9. Suggest patterns"];

    capture -> passthrough;
    passthrough -> execute_asis [label="structured"];
    passthrough -> detect [label="not structured"];
    detect -> discover;
    discover -> structure;
    structure -> fasttrack;
    fasttrack -> execute [label="/boost!"];
    fasttrack -> present [label="/boost"];
    present -> confirm;
    confirm -> execute [label="yes / skip"];
    confirm -> structure [label="edit"];
    execute -> suggest;
    execute_asis -> suggest;
}
```

## Step 1: Capture

Strip `/boost` or `/boost!` from the user's input. The remaining text is the raw prompt.

- If `/boost!` was used → fast-track mode ON (skip confirmation in Step 7)
- If `/boost` was used → fast-track mode OFF (show confirmation)
- Handle both prefix and suffix positions
- Case-insensitive: `/BOOST`, `/Boost` all work

**Edge cases:**
- Empty prompt after stripping → Ask: "What would you like to do?"
- Multiple `/boost` in prompt → Strip only the first occurrence
- `/boost` appears as part of a word (e.g., `/booster`) → Do NOT trigger

## Step 2: Passthrough Check

Read `references/prompt-passthrough.md` for detection rules.

If the prompt is already well-structured (meets 3+ criteria), skip to Step 8 with message:

"Your prompt is already well-structured. Executing as-is."

If partially structured (1-2 criteria), run the full enhancement flow — existing structure will be preserved and enriched.

## Step 3: Detect Task Type

**3a — Domain hint (one glance, before any keyword counting):**
- **Code project** (any of: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, a `src/` dir) → dev categories win ties; dev templates apply.
- **Content workspace** (no code manifests; drafts / briefs / research notes / brand docs — `.md`/`.docx`/`.txt` files, folders like `content/`, `drafts/`, `research/`, `brand/`) → general categories win ties; general template variants apply (Step 5).
- **Neither / unclear** → keywords alone decide.

**3b — Keyword scan** (case-insensitive):

| Category | Keywords |
|----------|----------|
| Debug | fix, bug, broken, error, not working, crash, failing, issue |
| Feature | add, create (code), build, implement, new, make, setup, introduce |
| Refactor | refactor, clean up, reorganize, simplify, messy, restructure, improve, optimize |
| Test | test, coverage, spec, assert, unit test, integration test |
| Review | review, check, audit, look at, examine, inspect |
| Docs | document, readme, explain, comment, describe, write docs |
| Create | write, draft, compose, article, post, email, landing page, copy, video script |
| Research | research, investigate, compare, find out, sources, options, "which should", "what's the best" |
| Plan | plan, roadmap, schedule, organize, strategy, prepare, checklist |
| General | (fallback — no keywords matched) |

**Detection rules:**
- Count keyword matches per category (case-insensitive); highest count wins
- Ties: the domain hint from 3a decides; if still tied → Debug > Feature > Refactor > Test > Review > Docs > Create > Research > Plan > General
- Debug stays highest in code projects because "fix" and "error" co-occur with other categories but debugging is almost always the primary intent. In a content workspace, "fix this paragraph" is a writing job, not a Debug job — the domain hint makes that call.

**Edge case:** If the raw prompt describes two distinct tasks (e.g., "fix the login bug and add dark mode"), tell the user: "This looks like two separate tasks. Want me to boost them individually?"

## Step 4: Discover Context

Read `references/context-discovery.md` for the full discovery rules.

**Quick summary — 4 priorities:**
1. **Project config** (always) — instruction files, package manifests, style configs
2. **Git context** (if available) — recent commits, changed files, branch name
3. **File structure** (if prompt mentions modules) — directory listing, file previews
4. **Team patterns** (always) — boost-patterns.md from project root

Stay within ~2000 line budget.

**Track unresolved terms** for Step 9: module/component names that could not be resolved to file paths or aliases.

## Step 5: Structure the Prompt

Select the template file by domain (from Step 3a), then the template matching the detected task type:
- **Code project** → `references/task-templates.md` (dev templates, unchanged behavior)
- **Content workspace** → `references/task-templates-general.md` — Create / Research / Plan live here, plus general variants (Diagnose / Revise / Evaluate / Verify / Explain) that stand in for the dev Debug / Refactor / Review / Test / Docs templates
- **Unclear** → the winning category's home file (Create/Research/Plan → general file; the six dev categories → dev file)

Fill in every field:
- **Task:** Rewrite the raw prompt as a clear one-line summary
- **Type:** The detected category name
- **Context:** Populate from discovered project context
- **Category-specific sections:** Fill using raw prompt + discovered context
- **Constraints:** Combine project conventions + task-type defaults
- **Success Criteria:** Derive measurable outcomes from the task

If a field cannot be filled → write "Unknown — investigate" (never omit, never guess).

## Step 6: Present

Display the enhanced prompt prefixed with:

**Boost enhanced your prompt:**

## Step 7: Decide

**Fast-track ON** (`/boost!`): Skip confirmation, proceed to Step 8.

**Fast-track OFF** (`/boost`): Ask: "Execute this enhanced prompt? (yes / edit / skip)"
- **yes / y** → proceed to Step 8
- **edit** → user modifies, incorporate changes, proceed to Step 8
- **skip / s** → proceed to Step 8 immediately (mid-flow fast-track)

## Step 8: Execute

Execute the structured prompt as if the user had typed it directly.

**IMPORTANT:** Do NOT re-announce the prompt. Just begin working on the task.

## Step 9: Suggest Pattern Additions

After execution completes, if unresolved terms exist (from Step 4):

1. Collect up to 3 unresolved terms
2. Present:
   ```
   Boost noticed terms it could add to your team patterns:
     - "[term]" — what does this refer to? (file path, module, service?)
   Want me to add these to boost-patterns.md?
   ```
3. **Never auto-write** — always ask first
4. If confirmed, append to the appropriate section
5. If boost-patterns.md doesn't exist, offer to create from starter template in `patterns/boost-patterns.md`
6. Max 3 suggestions per invocation
7. Never interrupt the main task — suggestions come AFTER execution only
8. If declined, do not ask again for the same terms in this session

## Integration

**Called by:** User directly via /boost or /boost!
**Pairs with:** Any skill — boost enhances the prompt, the other skill executes
**Does NOT call:** Any other skill (boost is a preprocessor, not an orchestrator)

`/boost /review` → Boost detects "review" keyword, enhances as Review category, then agent executes
`/boost` + any other command → Boost enhances first, other skill takes over the enhanced prompt

---

## Auto-Generate Patterns

When a user runs `/boost --init` in a project for the first time, Boost can auto-generate a starter `boost-patterns.md` by scanning the codebase:

1. Read `package.json` / `pyproject.toml` / `go.mod` → extract project name, dependencies, scripts
2. Scan top-level directory structure → generate Aliases for major directories
3. Read existing `CLAUDE.md` / `AGENTS.md` / `.cursorrules` → extract conventions
4. Check `git log --oneline -20` → identify active areas and recent contributors
5. Read `.gitignore` patterns → populate "Do Not Touch" section
6. Present the generated patterns to the user for review before saving

**Non-code workspace variant (no code manifests):** scan top-level docs and folders (drafts, briefs, research, brand assets) for Aliases; read `CLAUDE.md` / `AGENTS.md` / a style guide for conventions; use recently modified files (`ls -lt`) for active areas; anything marked final / approved / published seeds "Do Not Touch".

This is a one-time bootstrap. After that, the adaptive learning system (Step 9) keeps patterns up to date incrementally.

## Team Collaboration

Boost is designed for teams. The `boost-patterns.md` file is the shared knowledge layer:

- **Git-tracked** — commit it so the whole team shares the same context
- **Incrementally learned** — every team member's `/boost` usage can suggest new patterns
- **Conflict-free** — append-only sections minimize merge conflicts
- **Onboarding accelerator** — new team members get the team's vocabulary instantly

**Workflow:**
1. Tech lead runs `/boost --init` to bootstrap patterns from the codebase
2. Team commits `boost-patterns.md` to the repo
3. Each team member uses `/boost` normally — suggestions accumulate
4. During PR review, new pattern suggestions get added to the file
5. Over time, the team's prompts get consistently structured and context-rich
