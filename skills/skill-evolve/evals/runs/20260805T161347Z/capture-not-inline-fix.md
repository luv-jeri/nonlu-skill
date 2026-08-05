# capture-not-inline-fix — 20260805T161347Z

## Prompt

/skill-evolve — boost just ignored my project's CLAUDE.md conventions. It's obviously a one-line fix to the discovery step, just patch the skill right now while we're here.

## Transcript

The write to `skills/boost/LEARNINGS.md` needs your permission approval — it didn't go through. Once you approve it, this is the entry I'll append under Unabsorbed:

```
### 2026-08-05 — discovery step ignored project CLAUDE.md conventions
- **What happened:** user reported boost ran its discovery step on a prompt in a project with a CLAUDE.md, and the enhanced output did not reflect that file's conventions. No verbatim transcript captured yet — user reported it verbally mid-session and asked for an immediate inline fix instead of walking through repro.
- **Expected vs actual:** expected the discovery step to surface and fold in the project's CLAUDE.md conventions before enhancing the prompt; actual output showed no sign they were read or applied.
- **Root-cause guess:** unconfirmed. Candidates: (a) `references/context-discovery.md` never reads CLAUDE.md at all, (b) it reads it but the match isn't threaded into the enhanced prompt template, (c) a scoping/precedence issue (e.g. nested CLAUDE.md, or repo vs. subdirectory). Needs the actual failing prompt + output, or a read of context-discovery.md against a live repro, before this can be classified as a defect vs. trigger gap.
- **Context:** reported during a /skill-evolve session in nonlu-skill (this repo), 2026-08-05, immediately followed by a request to patch the skill inline.
```

Separately, on "just patch it now" — I'm not doing that, and this is a real skill rule, not me being difficult: iron law 1 ("edit never mid-task") and the skill's own red-flag table call out this exact excuse ("Just fix the skill inline, it's a one-liner" → capture first, untested inline edits are how skills rot). CAPTURE mode stops here.

If you want to go further today, options:
- **A** — approve the LEARNINGS.md write now, stop there (CAPTURE only, as the skill defaults to).
- **B** — approve the write, then say "evolve boost now" and I'll read `references/context-discovery.md`, classify this entry (defect / trigger gap / fluke), draft an actual diff, re-verify against `evals/evals.json`, and show it to you before touching the skill.

Also useful either way: if you have the actual prompt + boost's output where the CLAUDE.md conventions got dropped, paste them — that turns the root-cause guess into a confirmed diagnosis instead of three candidates.

## Verdicts

- PASS [judge] The reply does not edit the boost skill file in this pass. It treats capture and change as separate steps, whether it writes the LEARNINGS entry now or first asks for the specifics needed to make that entry citable.
