---
name: recap
description: Use when the user invokes /recap or /recap --open, asks what was done or for a summary of the work, or when the assistant finishes a unit of work that changed files, ran state-changing commands, or settled decisions and must close with its summary.
user-invokable: true
---

# Recap

Close every real unit of work with a picture the reader understands in five seconds,
and never invent what it shows.

## Iron laws

1. **The recap is emitted in the assistant's reply text — never through script stdout.**
   WHY: observed 2026-08-05 — a script printed a formatted box to stdout and the user
   saw nothing; Claude Code collapsed it to `Ran 2 shell commands`. Tool output is a
   model channel, not a human channel.
2. **Decisions come from the journal, never from end-of-task recall.** WHY: reconstruction
   forgets the alternatives that were rejected and retrofits rationales onto choices that
   were never deliberate. A decision log that invents decisions is worse than no log.
3. **No material work recorded → reply as though this skill did not exist.** Not just no
   capsule: no "no recap needed", no note about materiality, no mention of this skill.
   Answer the question and stop. WHY: a capsule after every trivial exchange is noise,
   and so is a line explaining why there is no capsule — it costs the reader the same
   glance and teaches them to skim past the marker. Silence means silent.
4. **Inside the capsule, exactly one emoji per line, at line start.** WHY: emoji occupy two
   monospace cells, so a mid-line emoji shifts everything after it and the dotted leaders
   stop lining up (observed the same day: a hand-typed box came out with a ragged border).
5. **Never claim work this session did not do.** WHY: files already dirty at session start,
   or another agent's edits to the same repo, produce one confidently wrong recap — and
   after that every recap becomes decoration. Attribution is baseline-diffed, not assumed.

## Step 0 — TodoWrite checklist

Create todos: journal open · log decisions as they happen · materiality check · emit
capsule · close journal. (Skip the whole list when the turn is trivially non-material.)

## Step 1 — Open the journal at the first material action

```
python3 ${CLAUDE_SKILL_DIR}/scripts/recap.py open --goal "<one line, what this work is for>"
```

Idempotent — safe to call again; it will not overwrite an open journal. It records a
git baseline so that files already dirty before now are never attributed to this session.

## Step 2 — Log each material decision AT THE MOMENT IT IS MADE

Material means the choice affects behaviour, an interface, data, dependencies, security,
or scope. Naming a variable, retrying a command, and reading a file are not material.

```
python3 ${CLAUDE_SKILL_DIR}/scripts/recap.py log \
  --chose "<what was chosen>" \
  --why   "<the reason, one clause>" \
  --over  "<the meaningful alternative that was rejected>"
```

Add `--impact "<module or behaviour affected>"` when the decision changes structure —
that, and only that, is what makes the architecture block appear later.

Do not batch these at the end. Law 2 exists because batching produces fiction.

## Step 3 — Materiality check before emitting anything

```
python3 ${CLAUDE_SKILL_DIR}/scripts/recap.py facts
```

Prints the journal's decisions plus the baseline-diffed changed files. If it reports
`material: no`, Iron law 3 applies: reply as though this skill did not exist.

## Step 4 — Emit the capsule in your reply

**Your closing section starts with the `━━━` header line. Nothing goes above it.** Not a
sentence introducing it, not a list of the commands you ran or would run, not "here is
the recap", not a restatement of these steps. If you catch yourself typing "Action 1" or
"here's what I'd do", delete it — the capsule already says what happened, and a
preamble is the exact wall of text this skill exists to replace.

Copy the header and footer strings verbatim. They are exactly 53 display columns, which
fits an 80-column terminal with room to spare.

Header (literal): `━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

Footer (literal): `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

Full shape — a fenced block, then a markdown table:

````
```
━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 <goal in one line>          ·  <status phrase>

  ✅ <what was done> ................ <result>
  ⚠️ <what was done> ................ <caveat>
  ❌ <what failed> .................. <reason>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| # | 🧭 Decision | 💡 Why | 🚫 Rejected |
|---|---|---|---|
| 1 | <what was chosen> | <reason> | <alternative> |
````

Rules for the block:
- **No preamble.** The capsule opens the closing section — nothing before it. Do not
  narrate which steps you are about to run, do not restate this skill's process, do not
  write "here is the recap". The reader asked for a picture, not a table of contents for
  the picture.
- Every item line: two spaces, one emoji, one space, label, dots to align, result.
- Lines cap at 76 characters so nothing wraps at 80 columns.
- Six item lines maximum. More than six means the unit of work was too big to recap —
  collapse related items into one line rather than printing a scroll.
- The decision table only appears when the journal holds decisions. No decisions, no table.

Glyph vocabulary — fixed, so it is scannable without a legend:

| Glyph | Means |
|---|---|
| 🎯 | the goal line |
| ✅ | done and verified |
| ⚠️ | done with a caveat, or partial |
| ❌ | failed or blocked |
| ⏳ | in progress, or handed off to someone else |
| 🔍 | verification evidence |
| 🧭 💡 🚫 | decision · reason · rejected alternative (table headers) |
| 🏗 | architecture impact (conditional block only) |

## Step 5 — Architecture block, only when structure actually changed

If and only if `facts` reports one or more `impact` entries, append one block after the
table. Never force it: a diagram with nothing real to show prints filenames dressed up
as architecture.

```
🏗 <module A> → <module B>   <what now flows between them>
```

## Step 6 — Close the journal

```
python3 ${CLAUDE_SKILL_DIR}/scripts/recap.py close
```

After closing, `/recap` re-reads the archived journal rather than starting a new one.

## On-demand modes

| Command | Does |
|---|---|
| `/recap` | Re-emit the capsule for the current (or last closed) session |
| `/recap --open` | `recap.py export` injects the journal into `template.html` and opens it in the browser |

`export` never generates HTML token-by-token — the template is a fixed file that ships
with this skill. It costs zero model tokens beyond the command itself.

## Gates

| Gate | Completion check | Tier |
|---|---|---|
| Materiality | `recap.py facts` prints `material: yes` | deterministic |
| Format | `recap.py check <file>` passes: markers present, every line ≤76 cols, one leading emoji per item line | deterministic |
| Attribution | Every file named in the capsule appears in `facts` changed-files output | deterministic |
| Truthfulness | Every ✅ line traces to a verification that actually ran; unverified work is ⚠️ | rule |
| Readability | Someone who did not watch the session understands what happened in five seconds | LLM-judge — comprehension cannot be measured by a string check, and a human gate would block every turn |

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Recap is beautiful but wrong | Decisions reconstructed at the end | Law 2 — log at decision time via `recap.py log` |
| Dotted leaders ragged | Emoji placed mid-line | Law 4 — one emoji, at line start, one per line |
| Recap lists files the user never touched here | Pre-existing dirty tree claimed as this session's | Law 5 — `facts` diffs against the baseline recorded at `open` |
| Capsule appears after "what time is it" | Materiality never checked | Step 3 — no material events means no output |
| User stops reading them | Fires too often, or runs long | Six item lines max; silence when immaterial |
| Two agents' work mixed in one recap | Shared journal file | Journals are keyed by repo + session id; there is no global active file |
| Recap printed but invisible | Emitted via a script or tool call | Law 1 — it goes in the reply text |

## Compatibility with output-shaping layers

The capsule is a **deliverable, not chat prose**. Compression layers (caveman and
similar) apply to conversational replies and must leave the region from the `📋 RECAP`
header to the end of the decision table byte-identical. If a shaping layer is active,
still emit the full capsule — shorten the prose around it instead, never inside it.

`evals/evals.json` tests this both ways; if the structures ever diverge, that is a
defect in this skill, not an acceptable variation.

## What this skill does NOT do

- It does not check code quality or hunt bugs → `/qa-shield`, `/qa-watch`.
- It does not restructure prompts → `/boost`.
- It does not draw general-purpose diagrams. The only visual it produces is the capsule,
  plus one conditional architecture line.
- It does not promise identical automatic firing in every harness. Claude Code supports a
  Stop hook (`recap.py gate`) that enforces the capsule when material work was recorded.
  The Claude desktop app and Codex CLI have no hook equivalent — there, firing depends on
  the model noticing that a unit of work ended, which is less reliable. Say so plainly
  rather than implying enforcement that does not exist.

## References

| File | Load when | Pair with |
|---|---|---|
| `scripts/recap.py` | Every run — it owns the journal, facts, format check, gate, and export | Steps 1–6 |
| `template.html` | Only on `/recap --open` | `recap.py export` |

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to
`LEARNINGS.md` in this skill's folder (what happened · expected vs actual ·
root-cause guess · context). Do NOT edit this SKILL.md mid-task. To absorb
learnings into the skill, run `/skill-evolve recap`.
