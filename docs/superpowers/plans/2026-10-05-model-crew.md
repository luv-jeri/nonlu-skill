# Model Crew Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Owner chose 2026-10-05: "please continue and complete the task" → native execution, one independent review at the end.

**Goal:** Ship `skills/model-crew/`: a manager skill plus one stdlib Python helper (`crew.py`) that detects AI tools,
ranks live models (free first), runs task parts on them in parallel, and repairs itself.

**Architecture:** SKILL.md is the manager's process (setup, intake questions, plan, run, check, doctor). `crew.py`
is a single-file CLI with subcommands. The only contract between them is `.model-crew/plan.json` (spec §5) and the
`--json` outputs below. Plan style follows the owner's rule: interfaces and named tests, no function bodies.

**Tech Stack:** Python ≥ 3.9 standard library only (`argparse`, `json`, `subprocess`, `concurrent.futures`,
`urllib.request`, `getpass`, `difflib`, `signal`, `os`, `tempfile`). Markdown for the skill.

**Spec:** `docs/superpowers/specs/2026-10-05-model-crew-design.md`

## Global Constraints

- Standard library only; `python3 crew.py selftest` runs offline on a clean Mac.
- Never print, log or store a key. History stores `{model, result, seconds, at}` only (R13).
- Never `shell=True`; every worker command is an argv list; worker stdin is `/dev/null`.
- Workers use the most restrictive editing mode (verified 2026-10-05):
  - opencode `run -m M --dir D P`
  - codex `exec -m M -s workspace-write -C D P`
  - gemini `[-m M] --approval-mode auto_edit -p P`
  - agy `-p P --model M --mode accept-edits`
  - claude `-p --model M --permission-mode acceptEdits P`
- Paths: config `${XDG_CONFIG_HOME:-~/.config}/model-crew/`, cache `${XDG_CACHE_HOME:-~/.cache}/model-crew/`,
  project `.model-crew/` (self-ignored with a `*` `.gitignore`).
- Cache fresh window 600 s; live fetch timeout 20 s; history cap 500 lines; default part time limit 15 min.
- Exit codes: `run` 0 all done / 1 some not done / 2 plan refused; other commands 0 ok / 1 problem found.
- Script output is for the manager; SKILL.md tells the manager to repeat tables in its reply (R11).
- Repo rules: frontmatter `name`, `description` (triggers only), `user-invokable: true`; checklist at start;
  Learning-capture footer; `LEARNINGS.md`; `tests/eval-triggers.md`, `tests/eval-quality.md`; `evals/evals.json`
  green before merge; register in marketplace + package.json + README + repo CLAUDE.md.
- Commits carry no AI co-author trailer (owner memory).

## Review Focus

1. **A prompt containing quotes, `$()`, `;` or newlines** reaches the worker byte-for-byte and runs nothing in a
   shell. Test `test_prompt_passed_verbatim` (Task 3).
2. **A tool that waits for keyboard input** (a login prompt) gets end-of-input at once instead of hanging until the
   time limit. Test `test_worker_stdin_is_closed` (Task 3).
3. **Tool output with colour codes** (`opencode auth list` prints ANSI escapes) still parses. Test
   `test_ansi_stripped_before_parse` (Task 2).
4. **A worker printing megabytes** streams to its log file; the summary stays short. Test
   `test_big_output_goes_to_log` (Task 3).
5. **A plan file path outside the project** (`../x`, `/etc/x`) is refused. Test `test_plan_refuses_escaping_path`
   (Task 3).

---

### Task 1: Storage core: paths, atomic write, cache, history

**Files:** Create `skills/model-crew/scripts/crew.py` (sections: storage, selftest harness, `main` dispatch).

**Interfaces (produces):**
- `config_dir() -> Path`, `cache_dir() -> Path` (XDG-aware, created on demand)
- `write_json_atomic(path, obj) -> None` (temp file in same dir, then `os.replace`)
- `read_json(path) -> obj | None`; a damaged file is deleted and `None` is returned
- `cached_fetch(source: str, fetch: Callable[[], list], refresh=False, now=time.time) -> (models, info)` where
  `info = {"source", "fetched_at", "age_s", "live": bool, "error": str|None}` (R12)
- `history_add(model, result, seconds, now=...)`, `history_stats(model) -> (done, total)` over its last 10 (R13, R9.4)
- `selftest()` runs every `test_*` function in the file and prints `N passed`; exit 1 on any failure

**Named tests:** `test_atomic_write_leaves_no_temp`, `test_cache_fresh_is_used_without_fetch`,
`test_cache_stale_refetches`, `test_cache_falls_back_on_fetch_error_with_age`, `test_cache_missing_and_offline_reports_unavailable`,
`test_damaged_cache_is_deleted`, `test_history_trims_to_500`, `test_history_stats_last_10`.

- [ ] Write the tests (temp dirs via `XDG_*` env overrides, fake clock), run `selftest` → fail
- [ ] Implement, run `selftest` → pass
- [ ] Commit `feat(model-crew): storage core with cache and history`

### Task 2: Detect, keys, model sources, ranking (`detect`, `save-key`, `models`)

**Interfaces (consumes Task 1; produces):**
- `ROUTES: dict[str, Route]` where `Route` holds `binary`, `edits: bool`, `login_check() -> "yes"|"no"|"unknown"`,
  `login_hint: str`, `install_hint: str`, `list_models() -> list[Model]`, `argv(model, prompt, cwd) -> list[str]`
- `Model = {"id": "<route>:<name>", "route", "name", "free": bool, "edits": bool, "tools": bool|None,
  "context": int|None, "released": "YYYY-MM-DD"|None, "expires": "YYYY-MM-DD"|None}`
- `openrouter_key() -> str|None` (env `OPENROUTER_API_KEY`, else key file)
- `detect() -> list[{"route", "installed", "logged_in", "hint"}]`; `cmd_detect --json`
- `cmd_save_key openrouter`: `getpass` → `GET /api/v1/key` must answer 200 → write file `0o600`
- `rank(models, mode, stats=history_stats) -> list[Model]` (sort key per R9; context < 64k and `edits=False` marked
  `check-only`) ; `cmd_models [--mode] [--free] [--refresh] [--json]` prints table + per-source cache info + R10 warnings
- `strip_ansi(text) -> str`
- `load_config() -> dict` (defaults `mode=balanced`, `workers=suggest_workers()`, `favourites={}`, `routes={}`; a damaged file is kept as `.bad`); `cmd_config [--mode] [--workers] [--favourite ROLE=MODEL] [--json]`; `detect` saves route states into `config.routes` (D3/D4 compare against it)

**Sources (verified 2026-10-05):**
- opencode: `opencode models --verbose`. A `provider/model` header line, then a JSON object; free means
  `cost.input == cost.output == 0`. Also includes `openrouter/*` when OpenRouter is connected in OpenCode.
- openrouter: public `GET /api/v1/models`; free means `pricing.prompt == pricing.completion == "0"`; `tools` comes from
  `supported_parameters`; `expiration_date` is used for the warning. These are listed as `opencode:openrouter/<id>`
  when OpenCode has OpenRouter, and otherwise as text-only `openrouter:<id>`.
- codex: `~/.codex/models_cache.json` `models[].slug`.
- agy: `agy models`, tab-separated `id\tname`.
- claude: `haiku`, `sonnet`, `opus`.
- gemini: `default` (no `-m`).
- Login checks:
  - opencode: `auth list` names a provider
  - codex: `login status` contains "Logged in"
  - claude: `auth status` JSON `loggedIn`
  - agy: `models` exits 0
  - gemini: env `GEMINI_API_KEY`/`GOOGLE_API_KEY` or `~/.gemini/oauth_creds.json`, else `unknown`

**Named tests:** `test_parse_opencode_verbose_marks_free`, `test_ansi_stripped_before_parse`,
`test_openrouter_free_filter_and_tools`, `test_openrouter_routes_via_opencode_when_connected`,
`test_rank_free_first_in_cheapest_mode`, `test_rank_uses_track_record_after_3_runs`, `test_small_context_is_check_only`,
`test_expiry_within_7_days_warns`, `test_detect_reports_missing_binary_with_install_hint`.

- [ ] Tests with inline sample text/JSON (no network, no real binaries) → fail
- [ ] Implement → pass; smoke `crew.py detect` and `crew.py models` on this Mac
- [ ] Commit `feat(model-crew): detect, save-key, live ranked models`

### Task 3: Plan validation and parallel run (`run`)

**Interfaces (consumes Tasks 1–2; produces):**
- `load_plan(path, known_ids, installed_routes, project) -> (plan, errors: list[str])`. It enforces R16 plus Review
  Focus 5; for an unknown model it suggests a name via `difflib.get_close_matches`.
- `classify(exit_code, timed_out, changed_own_files, log_tail) -> "done"|"no-changes"|"stuck"|"rate-limited"|"failed"`
  (R20; rate-limit pattern `429|rate.?limit|quota|too many requests`, case-insensitive)
- `run_part(part, brief, project, run_dir, time_limit_s) -> {"id", "model", "result", "seconds", "log"}`:
  - `Popen(argv, cwd=project, stdin=DEVNULL, stdout=log, stderr=STDOUT, start_new_session=True)`
  - on timeout, `os.killpg`
  - one retry on `fallback` when the result is `rate-limited`
- `cmd_run [plan] [--max-parallel N]`:
  - lock (R23) and `.model-crew/.gitignore` (R24)
  - stages in order through `ThreadPoolExecutor(max_workers)`; any part not done stops the later stages (R17)
  - unexpected changes (R21); SIGINT kills every process group (R22)
  - writes `status.json` with pids; prints a summary of 30 lines or fewer; exit codes (R25)
- `suggest_workers() -> int` (R14), shown in `models --json` as `suggested_workers`
- Worker prompt = brief + part prompt + rules (R18), built by `worker_prompt(brief, part) -> str`

**Named tests:**
- Plan refusals:
  - `test_plan_refuses_unknown_model_with_suggestion`
  - `test_plan_refuses_duplicate_ids`
  - `test_plan_refuses_shared_file_in_stage`
  - `test_plan_refuses_empty_stage`
  - `test_plan_refuses_not_git`
  - `test_plan_refuses_dirty_tree`
  - `test_plan_refuses_escaping_path`
  - `test_plan_refuses_missing_route`
- Result classes:
  - `test_classify_done`
  - `test_classify_no_changes`
  - `test_classify_stuck`
  - `test_classify_rate_limited`
  - `test_classify_failed`
- Fake-route runs (the test injects a `fake` route whose argv runs `python3 -c ...` in a temp git repo):
  - `test_run_stages_in_order_and_parallel`
  - `test_run_stops_after_failed_stage`
  - `test_run_retries_rate_limited_on_fallback`
  - `test_run_flags_unexpected_changes`
  - `test_run_timeout_kills_process_group`
  - `test_prompt_passed_verbatim`
  - `test_worker_stdin_is_closed`
  - `test_big_output_goes_to_log`
  - `test_second_run_refused_while_locked`
  - `test_stale_lock_removed`

- [ ] Tests → fail; implement → pass
- [ ] Commit `feat(model-crew): validated parallel run with stages, timeouts, fallback`

### Task 4: Doctor (`doctor`, `doctor --quick`)

**Interfaces (consumes Tasks 1–3; produces):**
- `doctor(quick: bool) -> list[{"id": "D1".."D11", "ok": bool, "fixed": str|None, "action": str|None}]`. Safe fixes
  are applied in place: D5 renames the file to `.bad` and rebuilds it from `detect`; D6 deletes; D7 runs `chmod 600`;
  D9 swaps in the top-ranked model on the same route; D11 removes the lock and kills only the pids in `status.json`.
  Everything else is a report with an `action`.
- D10 checks: each installed route's `--help` (for opencode, `run --help`; for codex, `exec --help`) still contains its
  flags from Global Constraints.
- `--quick` = D1, D2 (files only), D5, D6, D7, D11. `cmd_doctor [--quick] [--json]`; exit 1 if any check is not ok
  after fixes.

**Named tests:** `test_doctor_rebuilds_damaged_config`, `test_doctor_deletes_damaged_cache`,
`test_doctor_chmods_open_key_file`, `test_doctor_replaces_missing_favourite`, `test_doctor_clears_stale_lock`,
`test_doctor_flags_changed_cli_flag`, `test_quick_doctor_calls_no_tools_or_network`.

- [ ] Tests → fail; implement → pass; smoke `crew.py doctor` on this Mac
- [ ] Commit `feat(model-crew): doctor with safe self-repair`

### Task 5: The skill itself

**Files:** Create `skills/model-crew/SKILL.md`, `LEARNINGS.md`, `tests/eval-triggers.md`, `tests/eval-quality.md`,
`evals/evals.json`.

**SKILL.md contract (self-contained pattern):**
- Frontmatter: description = triggers only (`/model-crew`, `/model-crew setup|models|doctor`, "which model should I
  use", "build this with free models").
- Iron laws:
  1. never ask for a key in chat
  2. one question at a time
  3. no run before the user's yes to the plan
  4. repeat script tables in the reply
  5. code fixes to the skill only after a yes
- Flows:
  - checklist
  - `doctor --quick`
  - setup (R1–R5)
  - intake Q1–Q9 (R6–R7)
  - models (R11)
  - plan (R15)
  - git check (R16)
  - run (R17–R25)
  - check (R26–R27)
  - report (R28)
  - doctor repair loop (R29–R30)
- Close with failure modes, a "what this skill does not do" list, and the Learning-capture footer.

**evals.json (deterministic first, one behaviour per assert):** `intake-asks-one-question`,
`intake-skips-answered`, `setup-never-asks-key-in-chat`, `plan-waits-for-yes`, `script-table-repeated-in-reply`,
`doctor-code-fix-needs-yes`; plus `triggers`.

- [ ] Write the files; check every requirement R1–R34 is named in SKILL.md or crew.py
- [ ] Commit `feat(model-crew): SKILL.md, learnings, evals`

### Task 6: Register and document

**Files:** Modify `.claude-plugin/marketplace.json` (`skills` += `model-crew`), `package.json` keywords, `README.md`
(table row, badge, section), `CLAUDE.md` (skills list and count).

- [ ] Edit; `python3 -m json.tool` both JSON files
- [ ] Commit `docs(model-crew): register and document`

### Task 7: Verify, review, ship

- [ ] `python3 skills/model-crew/scripts/crew.py selftest` → all pass
- [ ] `python3 skills/skill-evolve/scripts/run_evals.py skills/model-crew` (background) → exit 0; read any red
  transcript before editing (repo rule)
- [ ] End-to-end (T3): temp git repo, a one-part plan with a free OpenCode model, "make index.html with Hello",
  run it, then open the page
- [ ] Independent review: Codex `gpt-6-astra`, read-only, on the branch diff against the spec ids; fix Critical
  and Important findings
- [ ] Push the branch, open a PR, merge to `main` once evals are green and the review is clean
