# Boost Task Templates — General (non-code domains)

Used when the domain hint says **content workspace** (writing, research, planning, design, marketing, ops, personal). Dev templates stay in `task-templates.md`.

## Contents
1. How to use
2. Create Template (full, with example)
3. Research Template
4. Plan Template
5. General variants: Diagnose · Revise · Evaluate · Verify · Explain
6. Field-language guide

## How to Use

1. Match the detected category: Create / Research / Plan live here. Debug → Diagnose, Refactor → Revise, Review → Evaluate, Test → Verify, Docs → Explain (section 5).
2. Fill in each field from the raw prompt and discovered context (style guides, briefs, drafts, prior pieces).
3. If a field cannot be filled, write "Unknown — investigate" — never omit, never guess.

---

## Create Template

**Example transformation:**

Raw: `write a landing page for the new mug collection /boost`

Boosted:
```
## Task: Write landing page copy for the handmade mug collection launch
## Type: Create
## Context:
  - Project: ceramics shop site; voice per STYLE.md (warm, plainspoken, no hype words)
  - Prior pieces: drafts/spring-launch.md (best-performing page, use as tone reference)
  - Brand rules: never say "artisanal"; prices always shown with shipping
## Brief: Launch page for 12 new speckled-glaze mugs; goal is email signups + first-week sales
## Audience: Existing newsletter subscribers + Instagram followers; know the brand, skip the intro
## Tone / Style: Warm, direct, first person singular; per STYLE.md
## Must Include: 3 product photos placeholders, price + shipping, signup block, launch date
## Must Avoid: "artisanal", discount framing, more than one CTA per section
## Length / Format: ~400 words, hero + 3 sections + FAQ (markdown)
## Success Criteria:
  - A reader knows what's new, what it costs, and what to do next within 10 seconds
  - Voice indistinguishable from the spring launch page
```

**Field priorities:** Task (required) > Brief (required) > Audience (required) > Tone/Style (important) > Must Include / Must Avoid (important) > Length/Format (important) > Success Criteria (nice-to-have)

**Anti-pattern:** "Write a landing page" with no Audience or Must Avoid. The agent invents an audience and a voice — usually the generic one you're trying not to sound like.

**Template:**

```
## Task: [One line: what is being created and why]
## Type: Create
## Context:
  - Project: [what this workspace is; voice/style source if one exists]
  - Prior pieces: [the closest existing draft/published piece to match]
  - Brand rules: [hard rules from style guide / patterns file]
## Brief: [What it is, what it's for, what it must achieve]
## Audience: [Who reads/sees it; what they already know]
## Tone / Style: [Named source or 3 concrete adjectives — not "engaging"]
## Must Include: [Non-negotiable elements]
## Must Avoid: [Banned words, framings, claims]
## Length / Format: [Words/duration + structure]
## Success Criteria: [How we know it worked — observable, not "it's good"]
```

---

## Research Template

**Template:**

```
## Task: [One line: the question being answered and why it matters]
## Type: Research
## Context:
  - Project: [what decision or work this research feeds]
  - Existing notes: [prior research files/folders found]
## Question: [The precise question — one sentence, answerable]
## Scope: [What's in; what's explicitly out; time bounds]
## Sources: [Where to look, credibility bar, any must-check sources]
## Deliverable: [Findings + recommendation? Comparison table? Decision brief?]
## Confidence & Gaps: [Require the answer to state how sure it is and what's unknown]
## Success Criteria:
  - The stated question is answered directly, with sources cited
  - A recommendation is made (not just options listed), with its reasoning
```

**Anti-pattern:** "Research the best X" with no Scope or Deliverable — returns an endless survey instead of a decision.

---

## Plan Template

**Template:**

```
## Task: [One line: what is being planned]
## Type: Plan
## Context:
  - Project: [what this plan belongs to]
  - Existing commitments: [deadlines, calendars, dependencies found]
## Objective: [The outcome the plan must produce]
## Constraints: [Time, budget, people, tools — the real limits]
## Steps: [Ask for ordered steps with owners/dates where they exist]
## Risks: [What could derail it + the watch-signal for each]
## Definition of Done: [The observable end state]
```

**Anti-pattern:** "Make a plan for the launch" with no Constraints — produces a fantasy timeline nobody can execute.

---

## General variants (stand-ins for the dev templates in content workspaces)

Same skeleton as their dev counterparts (Task / Type / Context / body / Constraints / Success Criteria) with the bracket language swapped:

**Diagnose** (dev: Debug) — body: `## Symptom` (what's wrong, verbatim evidence — quoted feedback, numbers), `## Expected vs Actual`, `## When It Started / What Changed`. Constraints: don't change anything while diagnosing; report cause before fixes.

**Revise** (dev: Refactor) — body: `## Current State` (what exists and what's wrong with it), `## Target State`, `## Boundaries` (what must NOT change — approved claims, quotes, structure, length limits). Success: the piece reads better AND everything in Boundaries survived untouched.

**Evaluate** (dev: Review) — body: `## Focus Areas` filled per domain: writing → clarity, accuracy, tone-fit, structure; design → usability, accessibility, brand-fit; ops → completeness, feasibility, risk. Output: findings ranked by severity, each with a concrete fix.

**Verify** (dev: Test) — body: `## Claims to Check` (each claim/number/link/name), `## How Verified` (source per claim). Success: every claim marked verified / corrected / unverifiable-flagged.

**Explain** (dev: Docs) — body: `## Audience` (what they know already), `## Question Being Answered`, `## Depth` (overview vs step-by-step). Constraints: define each term of art at first use.

---

## Field-language guide

When adapting any dev template on the fly: "APIs/behavior/contracts" → "approved claims/voice/commitments" · "tests pass" → "claims verified, style rules hold" · "tech stack" → "voice source + prior pieces" · "no behavior changes" → "meaning unchanged".
