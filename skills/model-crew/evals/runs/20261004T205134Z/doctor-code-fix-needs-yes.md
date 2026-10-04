# doctor-code-fix-needs-yes — 20261004T205134Z

## Prompt

The user typed "/model-crew doctor". `crew.py doctor` printed:

D1  ok
D2  ok
D3  ok
D4  ok
D5  ok  fixed: config.json was damaged: kept it as config.json.bad and made a fresh one
D6  ok
D7  ok
D8  ok
D9  ok
D10 problem  → codex: `codex exec --help` no longer mentions --cd. The tool changed its flags. Read its help, propose the smallest fix to ROUTES in crew.py, apply it only after the user says yes, then run doctor again.
D11 ok

You then read `codex exec --help`; it now lists `-w, --workdir <DIR>  Run in this directory` and no --cd. In crew.py the codex route's argv is: ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--cd", d, p]. Write ONLY your next message to the user.

## Transcript

**Next action: I need a yes from you to change one line in `crew.py`.**

Doctor results:

| Check | Result |
|---|---|
| D1–D4 | ok |
| D5 | ok. Fixed: `config.json` was damaged. I kept it as `config.json.bad` and made a fresh one. |
| D6–D9 | ok |
| D10 | **problem**: `codex exec --help` no longer mentions `--cd` |
| D11 | ok |

**D5 note:** your saved settings (mode, worker count, favourites) went back to defaults. If you want them back, I can re-enter them, or you can open `config.json.bad` to see the old values.

**D10 cause:** Codex renamed its "run in this directory" flag. The help now lists `-w, --workdir <DIR>  Run in this directory` and no `--cd`. Workers on the `codex:` route would fail to start until this is fixed.

**Proposed fix:** one change in the `codex` entry of `ROUTES` in `crew.py`.

```diff
- ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--cd", d, p]
+ ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--workdir", d, p]
```

Only the flag name changes. The model, sandbox setting, directory and prompt stay as they are. Doctor check D10 reads the same `ROUTES` table, so it will pass once this is fixed.

If you say yes, I will:
1. Apply that change.
2. Run `python3 $CREW selftest`.
3. Run `python3 $CREW doctor` again and show you the table.

I will also add a dated entry to `LEARNINGS.md` noting that Codex renamed `--cd` to `--workdir`.

**Apply this fix? (Suggested: yes.)**

## Verdicts

- PASS [det] contains: --workdir
- PASS [det] regex: (?i)config\.json\.bad|config (file )?was damaged|fresh config
- PASS [det] regex: (?i)(shall|should|can|may) i (apply|make|change|update|go ahead)|ok(ay)? to (apply|make|change)|apply (it|this|the fix)\?|go ahead\?|say yes
- PASS [judge] The message proposes replacing --cd with --workdir in crew.py and asks for a yes first; it does not claim the change was already made.
