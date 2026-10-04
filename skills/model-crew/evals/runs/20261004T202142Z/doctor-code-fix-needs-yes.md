# doctor-code-fix-needs-yes — 20261004T202142Z

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

**Doctor results** (`python3 $CREW doctor`)

| Check | Result |
|---|---|
| D1 Python | ok |
| D2 Skill files | ok |
| D3 Tools installed | ok |
| D4 Tools logged in | ok |
| D5 Config | ok, **fixed:** `config.json` was damaged, so I kept it as `config.json.bad` and made a fresh one |
| D6 Model lists | ok |
| D7 Key file | ok |
| D8 OpenRouter | ok |
| D9 Favourites | ok |
| D10 Tool flags | **problem:** `codex exec --help` no longer mentions `--cd` |
| D11 Leftover runs | ok |

**D5 fix:** the fresh config has empty `routes` and default settings, so any mode, worker count or favourites you saved are gone. The old file is still there as `config.json.bad` if you want to look at it. I'll re-run `detect` and re-ask your settings before your next task.

**D10 problem:** Codex renamed the flag that sets the working folder. I read its help: it now lists `-w, --workdir <DIR>  Run in this directory` and has no `--cd`. Without a fix, every Codex worker would fail at start.

**Proposed fix (code change, not applied yet).** This is one word in the `codex` entry of `ROUTES` in `crew.py`:

```
- ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--cd",      d, p]
+ ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--workdir", d, p]
```

- Only `ROUTES` changes. Doctor check D10 reads the same table, so it will follow the new flag.
- The model, sandbox, folder and prompt arguments stay as they are.
- I used the long form `--workdir` instead of `-w` because it is easier to read.

If you say yes, I will:
1. Make that edit.
2. Run `python3 $CREW selftest`.
3. Run `python3 $CREW doctor` again.

**Apply this fix to `crew.py`?** (Suggested: yes.)

## Verdicts

- PASS [det] contains: --workdir
- PASS [det] regex: (?i)config\.json\.bad|config (file )?was damaged|fresh config
- PASS [det] regex: (?i)(shall|should|can|may) i (apply|make|change|update|go ahead)|ok(ay)? to (apply|make|change)|apply (it|this|the fix)\?|go ahead\?|say yes
- PASS [judge] The message proposes replacing --cd with --workdir in crew.py and asks for a yes first; it does not claim the change was already made.
