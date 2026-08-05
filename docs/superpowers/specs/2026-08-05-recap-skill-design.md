# Recap — design spec

**Date:** 2026-08-05
**Venture:** nonlu-skill (Banyan)
**Status:** awaiting Sanjay's approval — no skill files written yet
**Debate partner:** Codex `gpt-5.6-sol` @ `model_reasoning_effort=xhigh`

---

## 1. The problem, in Sanjay's words

Every agent reply in Claude Code, Codex CLI, and the Claude desktop app is a wall of
text. There is no summary when work finishes. He has ADHD, dislikes reading, and wants
to *see* three things instead of read them: what work was done, what architecture was
touched, and what decisions were taken and why. It must be cheap — no generating a
fresh HTML page every run. It must survive the output-shaping layers he already runs
(caveman, ponytail, i-have-adhd, token-optimizer, headroom).

## 2. The finding that decided the architecture

Before designing anything, we tested where Sanjay's eyes actually land. A script
printed a cyan ANSI box to stdout via the Bash tool. **He saw nothing** — Claude Code
collapsed it to the line `Ran 2 shell commands`. Screenshot confirmed.

**Consequence:** any design that renders through a script's stdout is invisible by
default. The only channel reliably visible to a human in all three harnesses is the
assistant's own reply text. Every other candidate has a disqualifying failure:

| Channel | Failure mode |
|---|---|
| Script stdout | Collapsed/hidden by default (proven); also re-enters model context, costing tokens twice |
| Terminal UI (TUI) | Does not exist in the desktop app; fragile; oversized for a recap |
| File written to disk, opened later | Breaks immediacy, leaves debris, most recaps never get opened |
| **Assistant reply text** | **Costs output tokens; can be mangled by shaping layers — both fixable** |

## 3. What the debate killed

Codex attacked the first design and won three points:

**3.1 — No JSON payload, no renderer.** The original idea had the model emit a JSON
payload that a Python script would render into a box. Codex's arithmetic, for a recap
covering four work items and three decisions:

| Approach | Arithmetic | Cost |
|---|---:|---:|
| Model writes the capsule directly | 800 chars ÷ 4 | **~200 tokens** |
| JSON → script stdout → reply | 300 JSON + 200 tool output + 200 reply | ~700 tokens |
| JSON → file, output suppressed | 300 + 30 + 15 | ~345 tokens, *but nothing visible* |
| JSON → file → result copied into reply | 300 + 30 + 200 + 200 | ~730 tokens |

Writing the capsule directly is 3.5x cheaper than the "clever" design, and it removes a
schema, its validation rules, and the repair turns that follow malformed generation.
**The terminal renderer is cut** — the model writes the capsule itself, in its reply.
Rendering was never the expensive part; the summarizing is, and that cost is
irreducible. (The HTML export in §4 does use template injection, but it runs only when
asked and its output never re-enters the model's context, so none of this arithmetic
applies to it.)

**3.2 — Decisions are logged when made, not recalled at the end.** Codex: *"End-of-task
reconstruction will lie. The model will forget rejected options, retrofit rationales,
and mistake implementation details for deliberate choices."* This is the difference
between a decision log that is trustworthy and one that is decoration. Decisions get
appended to a session journal on disk at the moment they are made.

**3.3 — "Tell caveman not to compress it" is wishful thinking.** A polite sentence in a
skill file is not a contract. The recap gets explicit start/end markers, and an eval
that runs the same input with caveman on and caveman off and compares the structure.

## 4. Where this spec overrules the debate

Codex recommended cutting the architecture view and the HTML export from v1. Sanjay
asked for both, and chose HTML-on-request explicitly when offered the alternative.
His call stands, with one modification that absorbs Codex's real objection:

- **Architecture is conditional, never forced.** Codex's warning was that a mandatory
  diagram section invents relationships to fill itself — it prints filenames dressed up
  as architecture. So the architecture block renders only when the journal actually
  recorded a structural change. No structural change, no block. This keeps the feature
  Sanjay asked for while removing the failure mode.
- **HTML export stays, on request only** (`/recap --open`). It costs zero tokens when
  unused: a fixed `template.html` ships with the skill, and a script injects the journal
  into it and opens the browser. No HTML is ever generated token-by-token.

## 5. The hidden failure mode

Codex named a failure worth designing against: Sanjay runs several agents, sometimes
against the same repository. A single shared "active recap" file would eventually mix
agent A's changed files with agent B's decisions. One confidently wrong recap destroys
trust, and after that every recap becomes decoration.

**Mitigation:** journals are keyed by repository identity *and* harness session id,
stored outside the repo, appended atomically, closed explicitly after a recap is
emitted, and expired when abandoned. There is no global `active.jsonl`. Files that were
already dirty before the session started are never claimed as this session's work.

## 6. The output format

Format C, chosen by Sanjay: a fenced monospace capsule for status, a markdown table for
decisions, emoji as the scanning aid.

```
━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <one-line goal>          ·  <status>

  ✅ <item> ......................... <result>
  ✅ <item> ......................... <result>
  ⚠️ <item> ......................... <result>
  ❌ <item> ......................... <result>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| # | 🧭 Decision | 💡 Why | 🚫 Rejected |
|---|---|---|---|
| 1 | ... | ... | ... |

**Alignment rule (load-bearing):** emoji are double-width in a monospace block. Every
item line carries **exactly one emoji, at the start**, so all lines shift by the same
amount and the dotted leaders stay aligned. Never place an emoji mid-line inside the
fenced block. Inside the markdown table emoji are free — there is no alignment to break.

**Line budget:** capsule lines cap at 76 characters so nothing wraps at 80 columns.

**Status glyph vocabulary** (fixed, so it is scannable without a legend):

| Glyph | Meaning |
|---|---|
| ✅ | done and verified |
| ⚠️ | done but with a caveat, or partially done |
| ❌ | failed or blocked |
| ⏳ | in progress / handed off |
| 🎯 | the goal line |
| 🧭 | a decision |
| 💡 | the reason for a decision |
| 🚫 | the alternative that was rejected |
| 🏗 | architecture impact (conditional block) |
| 🔍 | verification evidence |

## 7. How it fires

Codex's division of labour, adopted:

- **The skill** owns semantics: what counts as material, how decisions are journalled,
  and the exact shape of the capsule.
- **A Stop hook** (where the harness supports one) owns enforcement: it checks whether
  material work was recorded and whether the final reply contains the recap marker. It
  never tries to summarize anything — it has no idea what the work was about.
- **The always-on output layer** must recognise the recap markers as protected.

Honest limitation to state plainly: hooks are harness-specific. Claude Code supports
them (Sanjay already runs `PreToolUse` and `SessionStart`). The desktop app and Codex
CLI need an instruction-level equivalent instead. **One portable skill cannot promise
automatic enforcement in all three environments**, and this spec does not pretend it can.

Invocation surface:

| Command | Does |
|---|---|
| *(automatic)* | Capsule at the end of a material unit of work |
| `/recap` | Re-emit the recap for the current session on demand |
| `/recap --open` | Inject the journal into `template.html` and open it in the browser |

## 8. Materiality — when a recap is suppressed

A recap that fires after every trivial exchange becomes noise, and noise gets ignored
within two weeks. Nothing is emitted unless the session journal recorded at least one
material event. Material means: a file changed, a command that mutates state ran, a
decision affecting behaviour / interface / data / dependencies / security / scope, or a
verification result. Naming choices, command retries, and reading files are not material.

## 9. Files to create

```
skills/recap/
  SKILL.md                  self-contained; triggers-only description; the format spec,
                            materiality rules, journal protocol, iron laws
  scripts/journal.py        open · append decision · append impact · close · read
  scripts/facts.py          baseline-relative changed files + verification outcomes
  scripts/gate.py           Stop-hook check: material work recorded => marker required
  scripts/export_html.py    injects the journal into template.html, opens the browser
  template.html             fixed HTML shell for --open; never generated per run
  LEARNINGS.md              dated mistake log (repo iron law)
  tests/eval-triggers.md
  tests/eval-quality.md
  evals/evals.json          executable, run by skill-evolve's runner
```

Registration: `.claude-plugin/marketplace.json` `skills` array, plus `package.json`
keywords. A skill is not shipped until it is registered.

## 10. Evals (the acceptance bar)

1. **No-material-work case** — trivial exchange produces no capsule at all.
2. **Material work case** — capsule present, markers present, glyphs from the fixed set.
3. **Caveman on vs off** — same input both ways, identical structure between markers.
4. **Dirty baseline** — files dirty before the session are not claimed as this session's.
5. **Concurrent sessions** — two journals do not contaminate each other.
6. **Compacted context** — after compaction, decisions come from the journal, not memory.
7. **Alignment** — capsule lines ≤76 chars; exactly one leading emoji per item line.
8. **Conditional architecture** — no structural change means no architecture block.

Green is `python3 skills/skill-evolve/scripts/run_evals.py skills/recap` exiting 0.

## 11. Explicitly out of scope for v1

Terminal colors (invisible in the reply channel anyway), width adaptation beyond the
76-char cap, a session start/stop ritual, and any general-purpose diagramming. The one
thing that must be excellent is the capsule itself: truthful, readable in five seconds,
one screen, and absent when nothing happened.

## 12. Open risk

Codex's own stated weakest claim, recorded here rather than buried: assistant-reply
rendering is the only universally visible channel, but *how* markdown renders still
differs between the three clients. Tables in particular may degrade in Codex CLI. The
fenced capsule is safe everywhere; the decision table is the part that carries this
risk. If it renders badly in Codex CLI in practice, the fallback is to move decisions
into the capsule as indented rows — a format change, not an architecture change.
