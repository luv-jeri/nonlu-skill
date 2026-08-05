#!/usr/bin/env python3
"""recap.py — journal, facts, format check, Stop gate, and HTML export for /recap.

One script, several subcommands. It never renders the terminal capsule: that is the
model's job, in its reply text, because tool stdout is not reliably visible to a human
(observed 2026-08-05 — Claude Code collapsed a formatted box to "Ran 2 shell commands").

  open   record a goal + a git baseline so pre-existing dirt is never claimed later
  log    append one material decision, at the moment it is made
  facts  decisions + baseline-diffed changed files + a material yes/no
  check  validate a capsule's format (markers, width, glyph rules)
  close  mark the journal finished
  gate   Stop-hook check: material work recorded => the reply must carry the marker
  export inject the journal into template.html and open it

Journals live outside any repo, keyed by repo + harness session id, so two agents
working the same checkout can never contaminate each other's recap.
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys
import time
import unicodedata

MARKER = "📋 RECAP"
MAX_COLS = 76  # fits an 80-column terminal with room for the prompt gutter
MAX_ITEMS = 6  # more than six and the recap becomes a scroll nobody reads
STATUS_GLYPHS = {"✅", "⚠", "❌", "⏳", "🔍"}
ALL_GLYPHS = STATUS_GLYPHS | {"🎯", "🧭", "💡", "🚫", "🏗", "📋"}
ROOT = pathlib.Path(os.environ.get("RECAP_HOME", "~/.claude/recap")).expanduser()


# ---------------------------------------------------------------- identity

def session_id() -> str:
    """Harness-provided session id. Falls back to the pid so two concurrent
    agents still get separate journals rather than one shared, mixed file."""
    for var in ("RECAP_SESSION", "CLAUDE_CODE_SESSION_ID", "CODEX_COMPANION_SESSION_ID"):
        if os.environ.get(var):
            return os.environ[var][:16]
    return f"pid{os.getppid()}"


def repo_root() -> pathlib.Path:
    try:
        out = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=5)
        if out.returncode == 0:
            return pathlib.Path(out.stdout.strip())
    except (OSError, subprocess.SubprocessError):
        pass
    return pathlib.Path.cwd()


def journal_path() -> pathlib.Path:
    slug = repo_root().name or "no-repo"
    d = ROOT / slug
    d.mkdir(parents=True, exist_ok=True)
    return d / f"{session_id()}.jsonl"


def append(event: dict) -> None:
    event["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    # O_APPEND on a single short line is atomic enough for concurrent agents.
    with open(journal_path(), "a", encoding="utf-8") as fh:
        fh.write(json.dumps(event, ensure_ascii=False) + "\n")


def read_journal(path: pathlib.Path = None) -> list:
    path = path or journal_path()
    if not path.exists():
        return []
    events = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # a torn line never invalidates the rest of the journal
    return events


# ---------------------------------------------------------------- git facts

def dirty_set() -> set:
    try:
        out = subprocess.run(["git", "status", "--porcelain"],
                             capture_output=True, text=True, timeout=10)
        if out.returncode != 0:
            return set()
        return {ln[3:].strip() for ln in out.stdout.splitlines() if ln.strip()}
    except (OSError, subprocess.SubprocessError):
        return set()


def changed_since_baseline(events: list) -> list:
    """Files this session touched = dirty now minus dirty at open. Law 5: a file
    that was already modified before we started is not our work to claim.

    With no open event there is no baseline, so nothing is attributable — return
    empty rather than handing back the whole dirty tree. (Caught in testing
    2026-08-05: without this, `facts` on a fresh session reported three
    pre-existing modified files as though this session had changed them.)"""
    for e in events:
        if e.get("t") == "open":
            return sorted(dirty_set() - set(e.get("baseline", [])))
    return []


# ---------------------------------------------------------------- width

def dwidth(s: str) -> int:
    """Display columns. Emoji occupy two cells; variation selectors and combining
    marks occupy none. Getting this wrong is what makes dotted leaders ragged."""
    w = 0
    for ch in s:
        if ch == "️" or unicodedata.combining(ch):
            continue
        if unicodedata.east_asian_width(ch) in ("W", "F"):
            w += 2
        elif ch in ALL_GLYPHS:  # e.g. ⚠ is "ambiguous" but renders wide with VS16
            w += 2
        else:
            w += 1
    return w


def capsule_region(lines: list) -> tuple:
    """(start, end) line indices of the capsule, inclusive, or (None, None).

    The capsule runs from the header line carrying the marker to the next all-━
    footer line. Everything outside it — the surrounding reply prose and the
    markdown decision table — is deliberately NOT width-checked: table rows are
    legitimately long and render as a table, not as monospace columns. (Caught
    2026-08-05: checking the whole file failed a perfectly good capsule because
    of the table row beneath it.)"""
    start = next((i for i, l in enumerate(lines) if MARKER in l), None)
    if start is None:
        return None, None
    for j in range(start + 1, len(lines)):
        bare = lines[j].strip()
        if bare and set(bare) == {"━"}:
            return start, j
    return start, len(lines) - 1


def check_capsule(text: str) -> list:
    """Return a list of problems; empty list means the capsule is well-formed."""
    problems = []
    lines = text.splitlines()
    if MARKER not in text:
        return [f"missing marker {MARKER!r}"]
    start, end = capsule_region(lines)
    items = 0
    for n in range(start, end + 1):
        line = lines[n]
        if dwidth(line) > MAX_COLS:
            problems.append(f"line {n + 1}: {dwidth(line)} cols > {MAX_COLS}")
        stripped = line.strip()
        glyphs = [c for c in line if c in ALL_GLYPHS]
        if not glyphs:
            continue
        if stripped.startswith(tuple(STATUS_GLYPHS)):
            items += 1
            if len(glyphs) != 1:
                problems.append(f"line {n + 1}: {len(glyphs)} glyphs, item lines take exactly 1")
        elif len(glyphs) > 1:
            problems.append(f"line {n + 1}: {len(glyphs)} glyphs on a non-item line")
    if items > MAX_ITEMS:
        problems.append(f"{items} item lines > {MAX_ITEMS}; collapse related items")
    if items == 0:
        problems.append("capsule has a header but no item lines")
    return problems


# ---------------------------------------------------------------- commands

def cmd_open(args):
    events = read_journal()
    if any(e.get("t") == "open" for e in events) and not any(e.get("t") == "close" for e in events):
        print(f"journal already open: {journal_path()}")
        return 0
    append({"t": "open", "goal": args.goal, "baseline": sorted(dirty_set())})
    print(f"opened: {journal_path()}")
    return 0


def cmd_log(args):
    if not read_journal():
        append({"t": "open", "goal": "(auto-opened by log)", "baseline": sorted(dirty_set())})
    append({"t": "decision", "chose": args.chose, "why": args.why,
            "over": args.over, "impact": args.impact})
    print("logged")
    return 0


def collect(events):
    decisions = [e for e in events if e.get("t") == "decision"]
    files = changed_since_baseline(events)
    goal = next((e.get("goal") for e in events if e.get("t") == "open"), "")
    impacts = [d["impact"] for d in decisions if d.get("impact")]
    return goal, decisions, files, impacts


def cmd_facts(args):
    events = read_journal()
    goal, decisions, files, impacts = collect(events)
    material = bool(decisions or files)
    if args.json:
        print(json.dumps({"goal": goal, "decisions": decisions, "files": files,
                          "impacts": impacts, "material": material}, ensure_ascii=False, indent=2))
        return 0
    print(f"goal: {goal}")
    print(f"material: {'yes' if material else 'no'}")
    print(f"files ({len(files)}): {', '.join(files) if files else '(none)'}")
    for i, d in enumerate(decisions, 1):
        print(f"{i}. chose={d.get('chose')} | why={d.get('why')} | over={d.get('over')}"
              + (f" | impact={d.get('impact')}" if d.get("impact") else ""))
    if impacts:
        print(f"impacts: {'; '.join(impacts)}")
    return 0


def cmd_check(args):
    text = sys.stdin.read() if args.file == "-" else pathlib.Path(args.file).read_text(encoding="utf-8")
    problems = check_capsule(text)
    if problems:
        for p in problems:
            print(f"FAIL {p}")
        return 1
    print("ok")
    return 0


def cmd_close(args):
    if not read_journal():
        print("no journal to close")
        return 0
    append({"t": "close"})
    print("closed")
    return 0


def cmd_gate(args):
    """Stop hook. Claude Code pipes JSON with transcript_path on stdin. If the journal
    holds material work but the last assistant message carries no marker, say so.
    It never summarizes anything — a hook has no idea what the work was about."""
    payload = {}
    try:
        raw = sys.stdin.read()
        if raw.strip():
            payload = json.loads(raw)
    except (json.JSONDecodeError, OSError):
        pass
    events = read_journal()
    _, decisions, files, _ = collect(events)
    if not (decisions or files):
        return 0  # nothing material happened; silence is correct
    tpath = payload.get("transcript_path")
    if tpath and pathlib.Path(tpath).expanduser().exists():
        tail = pathlib.Path(tpath).expanduser().read_text(encoding="utf-8", errors="ignore")[-20000:]
        if MARKER in tail:
            return 0
    print(f"recap: {len(decisions)} decision(s) and {len(files)} changed file(s) were "
          f"recorded but the reply carries no {MARKER} capsule.", file=sys.stderr)
    return 2 if args.block else 0


def cmd_export(args):
    events = read_journal()
    goal, decisions, files, impacts = collect(events)
    tpl = pathlib.Path(__file__).resolve().parent.parent / "template.html"
    if not tpl.exists():
        print(f"template missing: {tpl}", file=sys.stderr)
        return 1
    data = json.dumps({"goal": goal, "decisions": decisions, "files": files,
                       "impacts": impacts, "session": session_id(),
                       "repo": repo_root().name,
                       "generated": time.strftime("%Y-%m-%d %H:%M")}, ensure_ascii=False)
    html = tpl.read_text(encoding="utf-8").replace("/*RECAP_DATA*/null", data)
    out = journal_path().with_suffix(".html")
    out.write_text(html, encoding="utf-8")
    print(out)
    if args.open:
        opener = {"darwin": "open", "win32": "start"}.get(sys.platform, "xdg-open")
        try:
            subprocess.run([opener, str(out)], timeout=10)
        except (OSError, subprocess.SubprocessError) as exc:
            print(f"could not open browser ({exc}); file is at {out}", file=sys.stderr)
    return 0


# ---------------------------------------------------------------- selftest

def cmd_selftest(args):
    """Proves the format checker offline: a good capsule passes, and each rule
    it claims to enforce actually goes red when violated. A check that cannot
    fail is not a check."""
    good = (
        "━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "🎯 ship the thing          ·  done\n"
        "\n"
        "  ✅ wrote the parser .............. 12 tests green\n"
        "  ⚠️ docs updated .................. examples pending\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    )
    cases = [
        ("good capsule passes", good, True),
        ("missing marker fails", good.replace(MARKER, "SUMMARY"), False),
        ("over-wide line fails", good.replace("12 tests green", "x" * 60), False),
        ("mid-line emoji fails", good.replace("wrote the parser", "wrote ✅ the parser"), False),
        ("too many items fails", good.replace(
            "  ✅ wrote the parser .............. 12 tests green\n",
            "  ✅ item .......................... ok\n" * 7), False),
        ("header with no items fails",
         "━━━ 📋 RECAP ━━━\nnothing here\n", False),
        # Regression 2026-08-05: long prose and a markdown decision table around the
        # capsule are legitimate and must not be width-checked.
        ("long prose and a table around the capsule still passes",
         "Some quite long introductory sentence that runs well past seventy-six "
         "display columns without any trouble at all.\n" + good +
         "\n| # | 🧭 Decision | 💡 Why | 🚫 Rejected |\n|---|---|---|---|\n"
         "| 1 | Use the standard library json module because it needs no dependency "
         "| Handles it | A third-party JSON library |\n", True),
    ]
    failed = 0
    for name, text, expect_ok in cases:
        problems = check_capsule(text)
        ok = not problems
        verdict = "PASS" if ok == expect_ok else "FAIL"
        if verdict == "FAIL":
            failed += 1
        print(f"{verdict}  {name}" + (f"  -> {problems}" if ok != expect_ok else ""))
    # width sanity: the two literal border strings must agree
    hdr = "━━━ 📋 RECAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ftr = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if dwidth(hdr) != dwidth(ftr):
        print(f"FAIL  border widths differ: header={dwidth(hdr)} footer={dwidth(ftr)}")
        failed += 1
    else:
        print(f"PASS  border widths match at {dwidth(hdr)} cols")
    print(f"\n{'ALL GREEN' if not failed else str(failed) + ' FAILED'}")
    return 1 if failed else 0


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)

    o = sub.add_parser("open"); o.add_argument("--goal", required=True); o.set_defaults(fn=cmd_open)
    l = sub.add_parser("log")
    l.add_argument("--chose", required=True); l.add_argument("--why", required=True)
    l.add_argument("--over", default=""); l.add_argument("--impact", default="")
    l.set_defaults(fn=cmd_log)
    f = sub.add_parser("facts"); f.add_argument("--json", action="store_true"); f.set_defaults(fn=cmd_facts)
    c = sub.add_parser("check"); c.add_argument("file", nargs="?", default="-"); c.set_defaults(fn=cmd_check)
    sub.add_parser("close").set_defaults(fn=cmd_close)
    g = sub.add_parser("gate"); g.add_argument("--block", action="store_true"); g.set_defaults(fn=cmd_gate)
    e = sub.add_parser("export"); e.add_argument("--open", action="store_true"); e.set_defaults(fn=cmd_export)
    sub.add_parser("selftest").set_defaults(fn=cmd_selftest)

    args = p.parse_args()
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
