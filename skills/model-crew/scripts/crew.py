#!/usr/bin/env python3
"""crew.py — Model Crew helper: detect AI tools, rank live models, run task parts in parallel, self-check.

Usage: crew.py detect [--json] | save-key openrouter | config [--mode M] [--workers N] [--favourite ROLE=MODEL] |
       models [--mode M] [--free] [--refresh] [--limit N] [--json] | run [PLAN] [--max-parallel N] |
       doctor [--quick] [--json] | selftest

Standard library only. Output is for the manager agent, which repeats tables to the user: Claude Code collapses tool
output to "Ran N shell commands" (measured 2026-08-05, see skills/recap).
Verified 2026-10-05: opencode 1.18.34, codex-cli 0.159.2, gemini 0.58.0, agy 1.2.16, claude 2.x.
"""
import argparse
import concurrent.futures as cf
import contextlib
import difflib
import getpass
import hashlib
import io
import json
import math
import os
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import urllib.error
import urllib.request
from pathlib import Path

FRESH_S = 600          # a saved model list counts as fresh for 10 minutes (R12)
FETCH_TIMEOUT_S = 20   # live list fetch limit (R12)
HISTORY_CAP = 500      # track-record lines kept (R13)
MIN_CONTEXT = 64_000   # smaller context = check parts only (R9)
PART_LIMIT_MIN = 15    # default time limit per part (R20)
FREE_MODEL_SLOTS = 2   # free models have per-minute limits: at most 2 workers on one at once (R14)
MODES = ("cheapest", "balanced", "best")
OPENROUTER = "https://openrouter.ai/api/v1"
RATE_RE = re.compile(r"429|rate.?limit|quota|too many requests", re.I)
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)")
SELF = Path(__file__).resolve()
SAVE_KEY_CMD = f"python3 {shlex.quote(str(SELF))} save-key openrouter"


# ── storage ──────────────────────────────────────────────────────────────────────────────────────────────────────────

def _xdg_dir(var, fallback):
    d = Path(os.environ.get(var) or Path.home() / fallback) / "model-crew"
    d.mkdir(parents=True, exist_ok=True)
    return d


def config_dir():
    return _xdg_dir("XDG_CONFIG_HOME", ".config")


def cache_dir():
    return _xdg_dir("XDG_CACHE_HOME", ".cache")


def _write_atomic(path, text):
    """Temp file in the same folder, then rename: a crash never leaves half a file. Files are owner-only (0600)."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            f.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


def write_json_atomic(path, obj):
    _write_atomic(path, json.dumps(obj, indent=1) + "\n")


def read_json(path, keep_bad=False):
    """Parsed JSON, or None when missing. A damaged file is deleted (or kept as <name>.bad) and reads as None."""
    path = Path(path)
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return None
    except (ValueError, UnicodeDecodeError):
        if keep_bad:
            os.replace(path, path.with_name(path.name + ".bad"))
        else:
            path.unlink(missing_ok=True)
        return None


def _good_cache(d):
    keys = _model("claude", "x").keys()  # every field the listing and ranking code reads
    return (isinstance(d, dict) and isinstance(d.get("models"), list)
            and isinstance(d.get("fetched_at"), (int, float)) and math.isfinite(d["fetched_at"])
            and all(isinstance(m, dict) and isinstance(m.get("id"), str) and keys <= m.keys() for m in d["models"]))


def cached_fetch(source, fetch, refresh=False, now=time.time):
    """Model list for one source: fresh cache, else live fetch, else the stale copy with its age and the reason (R12)."""
    path = cache_dir() / f"models-{source}.json"
    saved = read_json(path)
    if saved is not None and not _good_cache(saved):
        path.unlink(missing_ok=True)
        saved = None
    t = now()
    info = {"source": source, "fetched_at": None, "age_s": None, "live": False, "error": None}
    if saved:
        info.update(fetched_at=saved["fetched_at"], age_s=int(t - saved["fetched_at"]))
        if not refresh and t - saved["fetched_at"] < FRESH_S:
            return saved["models"], info
    try:
        models = fetch()
    except Exception as e:  # any failure of a tool or the network falls back to the saved copy
        info["error"] = _hide_key(f"{type(e).__name__}: {e}")[:300]
        return (saved["models"] if saved else []), info
    write_json_atomic(path, {"fetched_at": t, "models": models})
    info.update(fetched_at=t, age_s=0, live=True)
    return models, info


_history_lock = threading.Lock()


def history_path():
    return cache_dir() / "history.jsonl"


def _history():
    try:
        lines = history_path().read_text(errors="replace").splitlines()  # a damaged line is skipped, not fatal
    except FileNotFoundError:
        return []
    out = []
    for line in lines:
        with contextlib.suppress(ValueError):
            d = json.loads(line)
            if isinstance(d, dict):
                out.append(d)
    return out


def history_add(model, result, seconds, now=time.time):
    """One line per finished worker: model, result, seconds, time. Never prompts, code or keys (R13)."""
    entry = {"model": model, "result": result, "seconds": round(seconds, 1), "at": int(now())}
    # ponytail: thread lock only; two crew.py runs finishing in the same instant can drop a line. Fine for a track record.
    with _history_lock:
        rows = (_history() + [entry])[-HISTORY_CAP:]
        _write_atomic(history_path(), "".join(json.dumps(r) + "\n" for r in rows))


def history_stats(model):
    """(done, total) over the model's last 10 runs."""
    runs = [h for h in _history() if h.get("model") == model][-10:]
    return sum(h.get("result") == "done" for h in runs), len(runs)


# ── tools, logins and model lists ────────────────────────────────────────────────────────────────────────────────────

def strip_ansi(text):
    return ANSI_RE.sub("", text)


def _sh(argv, timeout=30):
    """Run a tool quietly. Returns (exit code, output without colour codes); -1 when it cannot start or hangs."""
    try:
        p = subprocess.run(argv, stdin=subprocess.DEVNULL, capture_output=True, timeout=timeout)
    except (OSError, subprocess.TimeoutExpired) as e:
        return -1, str(e)
    return p.returncode, strip_ansi((p.stdout + p.stderr).decode("utf-8", "replace"))


def _http(path, key=None, body=None, timeout=FETCH_TIMEOUT_S):
    headers = {"Accept": "application/json", "X-Title": "model-crew"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(OPENROUTER + path, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def _model(route, name, free=False, edits=None, tools=None, context=None, released=None, expires=None):
    return {"id": f"{route}:{name}", "route": route, "name": name, "free": free,
            "edits": ROUTES[route]["edits"] if edits is None else edits, "tools": tools,
            "context": context, "released": released, "expires": expires}


HEADER_RE = re.compile(r'^([A-Za-z0-9][\w.@-]*/[^\s"{},]+)[ \t]*\r?\n(?=\{)', re.M)


def parse_opencode_verbose(text):
    """`opencode models --verbose`: a `provider/model` line, then a JSON object. Free = input and output cost 0."""
    text, dec, out = strip_ansi(text), json.JSONDecoder(), []
    for m in HEADER_RE.finditer(text):
        try:
            d, _ = dec.raw_decode(text, m.end())
        except ValueError:
            continue
        if not isinstance(d, dict) or d.get("status") == "deprecated":
            continue
        cost, caps, lim = d.get("cost") or {}, d.get("capabilities") or {}, d.get("limit") or {}
        out.append(_model("opencode", m.group(1), free=cost.get("input") == 0 and cost.get("output") == 0,
                          tools=caps.get("toolcall"), context=lim.get("context"), released=d.get("release_date")))
    return out


def parse_openrouter(data):
    """`GET /api/v1/models`. Free = prompt and completion price "0"; tools from supported_parameters."""
    out = []
    for d in data.get("data") or []:
        if not isinstance(d, dict) or not d.get("id"):
            continue
        price = d.get("pricing") or {}
        created = d.get("created")
        out.append(_model("openrouter", d["id"],
                          free=str(price.get("prompt")) == "0" and str(price.get("completion")) == "0",
                          tools="tools" in (d.get("supported_parameters") or []), context=d.get("context_length"),
                          released=time.strftime("%Y-%m-%d", time.gmtime(created))
                          if isinstance(created, (int, float)) else None,
                          expires=d.get("expiration_date")))
    return out


def _via_opencode(m):
    """An OpenRouter model run through OpenCode, so it can edit files."""
    return dict(m, id=f"opencode:openrouter/{m['name']}", route="opencode", name=f"openrouter/{m['name']}", edits=True)


def parse_auth_list(text):
    """`opencode auth list` → (number of credentials, OpenRouter connected?)."""
    text = strip_ansi(text)
    m = re.search(r"(\d+)\s+credentials?", text)
    return (int(m.group(1)) if m else 0), bool(re.search(r"openrouter", text, re.I))


def _fetch_opencode():
    code, out = _sh(["opencode", "models", "--verbose"], timeout=60)
    models = parse_opencode_verbose(out) if code == 0 else []
    if not models:
        raise RuntimeError(f"opencode models gave no list (exit {code}): {out.strip()[:200]}")
    return models


def _fetch_openrouter():
    return parse_openrouter(_http("/models"))


def _fetch_agy():
    code, out = _sh(["agy", "models"], timeout=60)
    names = [line.split("\t", 1)[0].strip() for line in out.splitlines() if "\t" in line] if code == 0 else []
    if not names:
        raise RuntimeError(f"agy models gave no list (exit {code}): {out.strip()[:200]}")
    return [_model("agy", n, tools=True) for n in names]


def _codex_models():
    """Codex keeps its model list in ~/.codex/models_cache.json (verified 2026-10-05); else the configured default."""
    home = Path.home() / ".codex"
    try:
        data = json.loads((home / "models_cache.json").read_text())
        rows = [m for m in data.get("models", []) if isinstance(m, dict) and m.get("slug")
                and m.get("visibility", "list") == "list"]
        if rows:
            return [_model("codex", m["slug"], tools=True, context=m.get("context_window")) for m in rows]
    except (OSError, ValueError, AttributeError):
        pass
    with contextlib.suppress(OSError):
        m = re.search(r'^model\s*=\s*"([^"]+)"', (home / "config.toml").read_text(), re.M)
        if m:
            return [_model("codex", m.group(1), tools=True)]
    return []


def _login_opencode():
    code, out = _sh(["opencode", "auth", "list"])
    if code != 0:
        return "unknown", {"openrouter": False}
    n, has_openrouter = parse_auth_list(out)
    # No credentials can still mean "works": OpenCode's own free models need no login.
    return ("yes" if n else "unknown"), {"openrouter": has_openrouter}


def _login_codex():
    code, out = _sh(["codex", "login", "status"])
    if code == -1:
        return "unknown", {}
    if re.search(r"not logged in", out, re.I) or code != 0:
        return "no", {}
    return ("yes" if "logged in" in out.lower() else "unknown"), {}


def _login_claude():
    code, out = _sh(["claude", "auth", "status"])
    if re.search(r'"loggedIn"\s*:\s*true', out):
        return "yes", {}
    return ("no" if re.search(r'"loggedIn"\s*:\s*false', out) else "unknown"), {}


def _login_gemini():
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
        return "yes", {}
    return ("yes" if (Path.home() / ".gemini" / "oauth_creds.json").exists() else "unknown"), {}


def _login_agy():
    models, info = cached_fetch("agy", _fetch_agy)
    if not models:
        return "no", {}
    return ("yes" if info["error"] is None else "unknown"), {}


# Worker commands use each tool's most restrictive mode that still edits files in the project (verified 2026-10-05).
# Every worker prompt starts with "You are", so it can never be mistaken for a flag. doctor D10 checks these argv
# tokens against each tool's --help, so the flags live in exactly one place.
ROUTES = {
    "opencode": {"binary": "opencode", "edits": True, "help": ["run", "--help"],
                 "argv": lambda m, p, d: ["opencode", "run", "--model", m, "--dir", d, p],
                 "login": _login_opencode,
                 "install": "curl -fsSL https://opencode.ai/install | bash",
                 "login_hint": "opencode auth login"},
    "codex": {"binary": "codex", "edits": True, "help": ["exec", "--help"],
              "argv": lambda m, p, d: ["codex", "exec", "--model", m, "--sandbox", "workspace-write", "--cd", d, p],
              "login": _login_codex,
              "install": "npm install -g @openai/codex",
              "login_hint": "codex login"},
    "gemini": {"binary": "gemini", "edits": True, "help": ["--help"],
               "argv": lambda m, p, d: ["gemini", *([] if m == "default" else ["--model", m]),
                                        "--approval-mode", "auto_edit", "--prompt", p],
               "login": _login_gemini,
               "install": "npm install -g @google/gemini-cli",
               "login_hint": "gemini   (then choose: Sign in with Google)"},
    "agy": {"binary": "agy", "edits": True, "help": ["--help"],
            "argv": lambda m, p, d: ["agy", "--print", p, "--model", m, "--mode", "accept-edits"],
            "login": _login_agy,
            "install": "Install Antigravity from https://antigravity.google and open it once",
            "login_hint": "agy   (sign in when it asks)"},
    "claude": {"binary": "claude", "edits": True, "help": ["--help"],
               "argv": lambda m, p, d: ["claude", "--print", "--model", m, "--permission-mode", "acceptEdits", p],
               "login": _login_claude,
               "install": "curl -fsSL https://claude.ai/install.sh | bash",
               "login_hint": "claude auth login"},
    # Text only: no file edits, so it is offered for check parts. The worker is this script's own `ask` command.
    "openrouter": {"binary": None, "edits": False, "help": None,
                   "argv": lambda m, p, d: [sys.executable, str(SELF), "ask", m, p],
                   "login": None,
                   "install": "Get a key at https://openrouter.ai/keys, then in a separate Terminal run: "
                              f"{SAVE_KEY_CMD}   (or connect OpenRouter inside OpenCode: opencode auth login)",
                   "login_hint": "OpenRouter refused the saved key. Make a new one at https://openrouter.ai/keys and "
                                 f"run in a separate Terminal: {SAVE_KEY_CMD}"},
}
OPEN_NAMES = {"gemini"}  # gemini takes any model name the user types (R8); other routes must match a listed model


def key_path():
    return config_dir() / "openrouter-key"


def openrouter_key():
    """OPENROUTER_API_KEY wins over the saved file (R4). Never printed or logged."""
    key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not key:
        try:
            key = key_path().read_text(errors="replace").strip()
        except OSError:
            return None
    # A key with spaces, line breaks or odd bytes would end up quoted inside urllib's "Invalid header" error.
    return key if re.fullmatch(r"[\x21-\x7e]+", key) else None


def _hide_key(text):
    """An error message that quotes the OpenRouter key (an echoed request, a proxy page) never reaches a log or chat."""
    key = openrouter_key()
    return text.replace(key, "[key hidden]") if key else text


def _key_status(key):
    """HTTP status of GET /key with this key; 0 when OpenRouter cannot be reached."""
    try:
        _http("/key", key=key)
        return 200
    except urllib.error.HTTPError as e:
        return e.code
    except (OSError, ValueError):
        return 0


def _detect_tool(name):
    r = ROUTES[name]
    if not shutil.which(r["binary"]):
        return {"route": name, "installed": False, "logged_in": "no", "hint": r["install"]}
    state, extra = r["login"]()
    return {"route": name, "installed": True, "logged_in": state, "hint": "" if state == "yes" else r["login_hint"],
            **extra}


def _detect_openrouter(rows):
    via = any(r["route"] == "opencode" and r.get("openrouter") for r in rows)
    key = openrouter_key()
    if key:
        status = _key_status(key)
        state = "yes" if status == 200 else "no" if status in (401, 403) else "unknown"
        return {"route": "openrouter", "installed": True, "logged_in": state,
                "hint": "" if state != "no" else ROUTES["openrouter"]["login_hint"], "via_opencode": via}
    if via:
        return {"route": "openrouter", "installed": True, "logged_in": "yes", "hint": "", "via_opencode": True}
    return {"route": "openrouter", "installed": False, "logged_in": "no", "hint": ROUTES["openrouter"]["install"],
            "via_opencode": False}


def detect(save=True):
    """One row per route: installed, logged in (yes/no/unknown), and the command to fix it (R1)."""
    names = [n for n in ROUTES if n != "openrouter" and ROUTES[n]["binary"]]
    with cf.ThreadPoolExecutor(len(names)) as ex:
        rows = list(ex.map(_detect_tool, names))
    rows.append(_detect_openrouter(rows))
    if save:
        cfg = load_config()
        cfg["routes"] = {r["route"]: {"installed": r["installed"], "logged_in": r["logged_in"]} for r in rows}
        save_config(cfg)
    return rows


def list_models(rows, refresh=False):
    """Every model usable now, from routes that are installed and not logged out. Returns (models, source infos)."""
    ready = {r["route"]: r for r in rows if r["installed"] and r["logged_in"] != "no"}
    via = ready.get("openrouter", {}).get("via_opencode", False)
    models, infos = [], []

    def fetch(source, fn):
        ms, info = cached_fetch(source, fn, refresh)
        infos.append(info)
        return ms

    if "opencode" in ready:
        ms = fetch("opencode", _fetch_opencode)
        # The live OpenRouter list replaces OpenCode's copy of it (it has expiry dates and is fresher).
        models += [m for m in ms if not (via and m["name"].startswith("openrouter/"))]
    if "openrouter" in ready:
        ms = fetch("openrouter", _fetch_openrouter)
        models += [_via_opencode(m) for m in ms] if via else ms
    if "agy" in ready:
        models += fetch("agy", _fetch_agy)
    if "codex" in ready:
        models += _codex_models()
    if "claude" in ready:
        models += [_model("claude", a, tools=True, context=200_000) for a in ("haiku", "sonnet", "opus")]
    if "gemini" in ready:
        models.append(_model("gemini", "default", tools=True, context=1_000_000))
    return models, infos


def suggest_workers():
    """min(4, cpu // 2), at least 1 (R14)."""
    return max(1, min(4, (os.cpu_count() or 2) // 2))


def config_path():
    return config_dir() / "config.json"


def load_config():
    """Saved settings over defaults. A damaged file is kept as config.json.bad and defaults are used."""
    cfg = {"mode": "balanced", "workers": suggest_workers(), "favourites": {}, "routes": {}}
    saved = read_json(config_path(), keep_bad=True)
    if isinstance(saved, dict):
        cfg.update({k: v for k, v in saved.items() if k in cfg and type(v) is type(cfg[k])})
    if cfg["mode"] not in MODES:
        cfg["mode"] = "balanced"
    return cfg


def save_config(cfg):
    write_json_atomic(config_path(), cfg)


def rank(models, mode="balanced", stats=None, now=time.time):
    """Plain sort (R9): mode filter, can build (edits + context ≥ 64k), tool calls, track record, newer first."""
    stats = stats or history_stats
    today = time.strftime("%Y-%m-%d", time.gmtime(now()))
    soon = time.strftime("%Y-%m-%d", time.gmtime(now() + 7 * 86400))
    items = []
    for m in models:
        if mode == "cheapest" and not m["free"]:
            continue
        expires = (m.get("expires") or "")[:10]
        if expires and expires < today:
            continue
        m = dict(m)
        done, total = stats(m["id"])
        m["record"] = f"{done}/{total}" if total else ""
        m["check_only"] = not m["edits"] or (m["context"] or MIN_CONTEXT) < MIN_CONTEXT
        m["warning"] = f"free until {expires}" if m["free"] and expires and expires <= soon else ""
        score = done / total if total >= 3 else 0.5  # counted from 3 runs; unknown sits between good and bad
        key = (0 if m["free"] or mode == "best" else 1, m["check_only"], {True: 0, None: 1}.get(m["tools"], 2), -score)
        items.append((key, m))
    items.sort(key=lambda km: km[1].get("released") or "", reverse=True)  # newest first …
    items.sort(key=lambda km: km[0])  # … inside the stronger keys (sort is stable)
    return [m for _, m in items]


# ── commands: detect, save-key, config, models ───────────────────────────────────────────────────────────────────────

def cmd_detect(args):
    rows = detect()
    if args.json:
        print(json.dumps(rows, indent=1))
        return 0
    print(f"{'tool':<12}{'installed':<11}{'logged in':<11}next step")
    for r in rows:
        name = r["route"] + (" (via opencode)" if r.get("via_opencode") and not openrouter_key() else "")
        print(f"{name:<12}{'yes' if r['installed'] else 'no':<11}{r['logged_in'] if r['installed'] else '-':<11}"
              f"{r['hint']}")
    return 0


def cmd_save_key(args):
    if not sys.stdin.isatty():
        print(f"This needs a real terminal so your key stays hidden. Open a separate Terminal window and run:\n"
              f"  {SAVE_KEY_CMD}")
        return 1
    key = getpass.getpass("Paste your OpenRouter key (typing stays hidden), then press Enter: ").strip()
    if not key:
        print("No key entered. Nothing saved.")
        return 1
    if not re.fullmatch(r"[\x21-\x7e]+", key):
        print("That does not look like a key: it has spaces, line breaks or unusual characters. Nothing saved.")
        return 1
    status = _key_status(key)
    if status != 200:
        print("OpenRouter could not be reached. Nothing saved." if status == 0 else
              f"OpenRouter did not accept that key (HTTP {status}). Nothing saved.")
        return 1
    _write_atomic(key_path(), key + "\n")  # 0600: only you can read it
    print(f"Key checked and saved to {key_path()} (only your user can read it). Go back to your agent and say done.")
    return 0


def cmd_config(args):
    cfg = load_config()
    if args.mode:
        cfg["mode"] = args.mode
    if args.workers is not None:
        if not 1 <= args.workers <= 16:
            print("workers must be between 1 and 16")
            return 1
        cfg["workers"] = args.workers
    for fav in args.favourite:
        role, sep, mid = fav.partition("=")
        if not (sep and role and ":" in mid and mid.split(":", 1)[0] in ROUTES):
            print(f"--favourite needs ROLE=route:model, for example build=opencode:opencode/big-pickle; got {fav!r}")
            return 1
        cfg["favourites"][role] = mid
    if args.mode or args.workers is not None or args.favourite:
        save_config(cfg)
    print(json.dumps(cfg, indent=1))
    return 0


def _age(s):
    return f"{s} s" if s < 90 else f"{s // 60} min" if s < 5400 else f"{s // 3600} h" if s < 172800 \
        else f"{s // 86400} days"


def _source_line(info):
    src = info["source"]
    if info["live"]:
        return f"{src}: live list"
    if info["fetched_at"] is None:
        return f"{src}: unavailable: {info['error']}"
    line = f"{src}: saved list from {_age(info['age_s'])} ago"
    return line + (f"; live fetch failed: {info['error']}" if info["error"] else "")


def cmd_models(args):
    mode = "cheapest" if args.free else (args.mode or load_config()["mode"])
    models, infos = list_models(detect(save=False), refresh=args.refresh)
    ranked = rank(models, mode)
    shown = ranked[:args.limit] if args.limit else ranked
    if args.json:
        print(json.dumps({"mode": mode, "suggested_workers": suggest_workers(), "sources": infos,
                          "count": len(ranked), "models": shown}, indent=1))
        return 0 if ranked else 1
    if not ranked:
        print("No models available. Run detect, then install or log in to at least one tool.")
    else:
        w = min(60, max(len(m["id"]) for m in shown))
        print(f"mode: {mode}. {len(ranked)} models, showing {len(shown)}. use: build = can edit files, "
              "check = text or small context only")
        print(f" #  {'model':<{w}}  free  use    tools  context  record  released    note")
        for i, m in enumerate(shown, 1):
            ctx = f"{m['context'] // 1000}k" if m["context"] else "?"
            tools = {True: "yes", False: "no"}.get(m["tools"], "?")
            print(f"{i:>2}  {m['id']:<{w}}  {'yes' if m['free'] else 'no':<4}  {'check' if m['check_only'] else 'build':<5}"
                  f"  {tools:<5}  {ctx:<7}  {m['record'] or '-':<6}  {m['released'] or '-':<10}  {m['warning']}")
    for info in infos:
        print("source " + _source_line(info))
    print(f"suggested workers: {suggest_workers()} (at most {FREE_MODEL_SLOTS} at once on one free model)")
    return 0 if ranked else 1


# ── plan and run ─────────────────────────────────────────────────────────────────────────────────────────────────────

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$")


def _git_root(path):
    try:
        r = subprocess.run(["git", "-C", str(path), "rev-parse", "--show-toplevel"], capture_output=True, text=True)
    except OSError:
        return None
    return Path(r.stdout.strip()).resolve() if r.returncode == 0 and r.stdout.strip() else None


def _git_status(root):
    """Changed and untracked paths (porcelain -z), minus this skill's own .model-crew/ folder; None if git fails."""
    r = subprocess.run(["git", "-C", str(root), "status", "--porcelain", "-z", "-uall"], capture_output=True)
    if r.returncode:
        return None
    out, skip = [], False
    for item in r.stdout.decode("utf-8", "replace").split("\0"):
        if skip:
            skip = False
            continue
        if len(item) < 4:
            continue
        skip = item[0] in "RC"  # a rename is followed by its old path
        if not item[3:].startswith(".model-crew/"):
            out.append(item[3:])
    return out


def _digest(path):
    try:
        return hashlib.sha1(Path(path).read_bytes()).hexdigest()
    except OSError:
        return None


def _dirty(root):
    return {p: _digest(root / p) for p in _git_status(root) or ()}


def _changed(before, after):
    return sorted(p for p in before.keys() | after.keys() if before.get(p, "clean") != after.get(p, "clean"))


def _owns(entry, path):
    """A part owns a file, or a whole folder when its entry ends with '/'."""
    entry = Path(entry).as_posix()
    return path == entry or path.startswith(entry + "/")


def _snapshot(project, entries):
    out = {}
    for e in entries:
        p = project / e
        # ponytail: walks a whole owned folder each time; fine for source folders, slow if a part owns node_modules.
        targets = sorted(q for q in p.rglob("*") if q.is_file()) if p.is_dir() else [p]
        out.update((str(q), _digest(q)) for q in targets)
    return out


def _bad_path(root, f):
    p = Path(f)
    if p.is_absolute() or ".." in p.parts or not p.parts:
        return "must be a path inside the project, like src/app.js"
    real = (root / p).resolve()
    if not real.is_relative_to(root):
        return "points outside the project (through a link)"
    if p.parts[0] in (".git", ".model-crew") or real.relative_to(root).parts[:1] in ((".git",), (".model-crew",)):
        return "is a tool folder, not a project file"
    if real != root / p:  # two names for one file would let two parts edit it at once, and git reports the real one
        return f"goes through a link; name the real path, {real.relative_to(root).as_posix()}"
    # ponytail: links inside an owned folder are not followed here; this check routes work, it is not a sandbox.
    return None


def _check_model(mid, known_ids, installed_routes):
    if not isinstance(mid, str) or ":" not in mid:
        return f"{mid!r} must look like route:model, for example opencode:opencode/big-pickle"
    route = mid.split(":", 1)[0]
    if route not in ROUTES:
        return f"{mid!r} uses an unknown tool {route!r} (known: {', '.join(ROUTES)})"
    if route not in installed_routes:
        return f"{mid!r}: {route} is not installed or not logged in (run detect)"
    if route not in OPEN_NAMES and mid not in known_ids:
        close = difflib.get_close_matches(mid, list(known_ids), n=1, cutoff=0.6)
        return f"{mid!r} is not a model you can use now" + (f"; did you mean {close[0]}?" if close else
                                                          " (run models to see the list)")
    return None


def load_plan(path, known_ids, installed_routes, project, free_ids=None):
    """Check the whole plan; any error refuses all of it (R16). Returns (plan, errors)."""
    try:
        plan = json.loads(Path(path).read_text())
    except FileNotFoundError:
        return None, [f"no plan file at {path}"]
    except (ValueError, UnicodeDecodeError) as e:
        return None, [f"the plan file is not valid JSON ({e})"]
    if not isinstance(plan, dict):
        return None, ["the plan file must hold one JSON object"]
    errors, root = [], Path(project).resolve()
    if not isinstance(plan.get("brief"), dict) or not plan["brief"].get("task"):
        errors.append('"brief" must be an object with at least a "task"')
    w = plan.setdefault("workers", suggest_workers())
    if not isinstance(w, int) or isinstance(w, bool) or w < 1:
        errors.append('"workers" must be a whole number, 1 or more')
    t = plan.setdefault("time_limit_min", PART_LIMIT_MIN)
    if not isinstance(t, (int, float)) or isinstance(t, bool) or t <= 0:
        errors.append('"time_limit_min" must be a number above 0')
    cheapest = free_ids is not None and isinstance(plan.get("brief"), dict) and plan["brief"].get("mode") == "cheapest"
    stages = plan.get("stages")
    if not isinstance(stages, list) or not stages:
        errors.append('"stages" must be a non-empty list of stages')
        stages = []
    seen = set()
    for si, stage in enumerate(stages, 1):
        if not isinstance(stage, list) or not stage:
            errors.append(f"stage {si} is empty")
            continue
        owned = {}
        for part in stage:
            pid = part.get("id") if isinstance(part, dict) else None
            if not isinstance(pid, str) or not ID_RE.match(pid):
                errors.append(f"stage {si}: part id {pid!r} must be letters, digits, '-', '_' or '.'")
                continue
            if pid in seen:
                errors.append(f"part id {pid!r} is used twice")
            seen.add(pid)
            if not isinstance(part.get("prompt"), str) or not part["prompt"].strip():
                errors.append(f"{pid}: needs a prompt")
            err = _check_model(part.get("model"), known_ids, installed_routes)
            if err:
                errors.append(f"{pid}: model {err}")
                continue
            text_only = not ROUTES[part["model"].split(":", 1)[0]]["edits"]
            if part.get("fallback") is not None:
                err = _check_model(part["fallback"], known_ids, installed_routes)
                if err:
                    errors.append(f"{pid}: fallback {err}")
                elif ROUTES[part["fallback"].split(":", 1)[0]]["edits"] == text_only:
                    errors.append(f"{pid}: the fallback must be the same kind as the model (file-editing or text-only)")
            if cheapest:
                paid = [m for m in (part["model"], part.get("fallback")) if isinstance(m, str) and m not in free_ids]
                if paid:
                    errors.append(f"{pid}: {paid[0]} is not free, but the mode is cheapest (free models only)")
            files = part.get("files")
            if not isinstance(files, list) or not all(isinstance(f, str) and f for f in files) \
                    or (not files and not text_only):
                errors.append(f'{pid}: "files" must list the files this part owns')
                continue
            for f in files:
                bad = _bad_path(root, f)
                if bad:
                    errors.append(f"{pid}: file {f!r} {bad}")
                    continue
                if text_only:
                    continue  # text-only parts read their files; they never write them
                for other_f, other in owned.items():
                    if other != pid and (_owns(other_f, Path(f).as_posix()) or _owns(f, Path(other_f).as_posix())):
                        errors.append(f"stage {si}: {f!r} is owned by both {other!r} and {pid!r}")
                owned[f] = pid
    if _git_root(root) is None:
        errors.append("this folder is not a git repository (or git is missing), so changes could not be undone; "
                      "run git init and make a first commit")
    else:
        dirty = _git_status(root)
        if dirty is None:
            errors.append("git status failed here, so uncommitted work could not be checked; run git status to see why")
        elif dirty:
            errors.append(f"uncommitted changes in {len(dirty)} file(s), for example {dirty[0]}; commit a checkpoint "
                          "first so every worker change can be undone")
    return plan, errors


def classify(exit_code, timed_out, changed_own_files, log_tail):
    """R20 result of one part."""
    if timed_out:
        return "stuck"
    if exit_code == 0 and changed_own_files:
        return "done"
    if RATE_RE.search(log_tail or ""):  # some tools exit 0 on a usage limit, so this is checked before no-changes
        return "rate-limited"
    return "no-changes" if exit_code == 0 else "failed"


def worker_prompt(brief, part, project=None):
    """Brief + part prompt + rules (R18). `project` is given only for text-only routes: their files go inline."""
    lines = ["You are one worker in a small team of AI models building one project. Do only your part.", "",
             "Project brief:"]
    lines += [f"- {k}: {'; '.join(map(str, v)) if isinstance(v, list) else v}" for k, v in brief.items()]
    lines += ["", f"Your part ({part['id']}):", part["prompt"], "", "Rules:"]
    if project is None:
        lines += [f"- Edit only these files: {', '.join(part['files'])}. Create them if they do not exist.",
                  "- Do not run git commands.",
                  "- Do not install packages unless your part says so.",
                  "- When you finish, reply with one short line saying what you changed."]
        return "\n".join(lines)
    lines += ["- You cannot edit files. Answer in plain text only.",
              "- Be specific: name the file and the line for every point."]
    budget = 100_000
    for f in part["files"]:
        try:
            text = (project / f).read_text(errors="replace")
        except OSError as e:
            text = f"(could not read: {e.strerror})"
        if len(text) > budget:
            text = text[:max(budget, 0)] + "\n(cut here: too long)"
        budget -= len(text)
        lines += ["", f"--- {f} ---", text]
    return "\n".join(lines)


def _alive(pid):
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def _kill_group(pgid, proc=None, grace=3.0):
    """SIGTERM the whole process group, wait a little, then SIGKILL whatever is left (R20, R22)."""
    with contextlib.suppress(ProcessLookupError, PermissionError):
        os.killpg(pgid, signal.SIGTERM)
    end = time.monotonic() + grace
    while time.monotonic() < end and (proc.poll() is None if proc else _alive(pgid)):
        time.sleep(0.05)
    with contextlib.suppress(ProcessLookupError, PermissionError):
        os.killpg(pgid, signal.SIGKILL)


def _tail(path, n=4000):
    with open(path, "rb") as f:
        f.seek(max(0, os.fstat(f.fileno()).st_size - n))
        return strip_ansi(f.read().decode("utf-8", "replace"))


class _Run:
    """One run's folder, live worker processes and status.json."""

    def __init__(self, project, plan_path):
        base = project / ".model-crew" / "runs"
        run_id = time.strftime("%Y%m%d-%H%M%S")
        n = 1
        while (base / run_id).exists():
            n += 1
            run_id = f"{time.strftime('%Y%m%d-%H%M%S')}-{n}"
        self.dir = base / run_id
        self.dir.mkdir(parents=True)
        self.lock = threading.RLock()  # re-entrant: the Ctrl-C handler runs on the main thread, which may hold it
        self.procs, self.stopping = {}, False
        self.status = {"run": run_id, "state": "running", "plan": str(plan_path), "started": int(time.time()),
                       "stages": [], "pids": {}}

    def save(self):
        with self.lock:
            write_json_atomic(self.dir / "status.json", self.status)

    def spawn(self, key, argv, cwd, log_path, limit_s):
        """Start one worker in its own process group; stdin closed, all output to its log. Returns (code, timed_out)."""
        env = dict(os.environ, NO_COLOR="1")
        env.pop("CLAUDECODE", None)  # lets a claude worker start from inside a Claude Code session
        with open(log_path, "wb") as log:
            with self.lock:  # start and register in one step, so stop_all never misses a worker
                if self.stopping:
                    return 130, False
                try:
                    p = subprocess.Popen(argv, cwd=cwd, stdin=subprocess.DEVNULL, stdout=log,
                                         stderr=subprocess.STDOUT, start_new_session=True, env=env)
                except OSError as e:
                    log.write(f"could not start {argv[0]}: {e}\n".encode())
                    return 127, False
                self.procs[key] = p
                self.status["pids"][key] = {"pid": p.pid, "binary": Path(argv[0]).name, "started": _started(p.pid)}
            try:
                self.save()
                return p.wait(timeout=limit_s), False
            except subprocess.TimeoutExpired:
                _kill_group(p.pid, p)
                p.wait()
                return -9, True
            except BaseException:  # e.g. the status file could not be written: never leave the worker behind
                _kill_group(p.pid, p, grace=1.0)
                raise
            finally:
                with self.lock:
                    self.procs.pop(key, None)
                    self.status["pids"].pop(key, None)

    def stop_all(self):
        with self.lock:
            self.stopping = True
            procs = list(self.procs.values())
        for p in procs:
            _kill_group(p.pid, p, grace=1.0)
        return len(procs)


def run_part(part, brief, project, run, limit_s, slots):
    """Run one part; on a usage limit, once more on its fallback model (R20). Returns its result row."""
    models = [part["model"]] + ([part["fallback"]] if part.get("fallback") else [])
    for attempt, model in enumerate(models):
        route, name = model.split(":", 1)
        text_only = not ROUTES[route]["edits"]
        argv = ROUTES[route]["argv"](name, worker_prompt(brief, part, project if text_only else None), str(project))
        log = run.dir / f"{part['id']}{'.fallback' if attempt else ''}.log"
        before = None if text_only else _snapshot(project, part["files"])
        with slots.get(model) or contextlib.nullcontext():
            t0 = time.monotonic()
            code, timed_out = run.spawn(part["id"], argv, project, log, limit_s)
            secs = time.monotonic() - t0
        changed = code == 0 if text_only else _snapshot(project, part["files"]) != before
        tail = _tail(log)
        result = classify(code, timed_out, changed, tail)
        history_add(model, result, secs)
        if result != "rate-limited":
            break
    # Files changed and the tool said it finished, so `done` stands; but a limit message may mean it stopped early.
    # ponytail: not retried, because a part that builds a rate limiter prints the same words.
    check = result == "done" and bool(RATE_RE.search(tail))
    return {"id": part["id"], "model": model, "result": result, "seconds": round(secs),
            "log": os.path.relpath(log, project), "fallback_used": attempt > 0, "check": check}


def _take_lock(lock):
    """Returns None when the lock is ours, else the pid holding it. A lock left by a dead process is removed (R23).
    The pid is written to a private file first and hard-linked into place, so the lock is never seen empty."""
    mine = lock.with_name(f"{lock.name}.{os.getpid()}")
    _write_atomic(mine, str(os.getpid()))
    try:
        for _ in range(3):
            try:
                os.link(mine, lock)
                return None
            except FileExistsError:
                pid = _read_pid(lock)
                if pid and _alive(pid):
                    return pid
                # ponytail: two runs starting in the same instant over a stale lock can both remove it; rare enough.
                lock.unlink(missing_ok=True)
        return _read_pid(lock) or -1
    finally:
        mine.unlink(missing_ok=True)


def _read_pid(path):
    try:
        return int(Path(path).read_text().strip())
    except (OSError, ValueError):
        return None


def run_plan(plan_path, project, known_ids, installed_routes, max_parallel=None, free_ids=()):
    """Validate, then run stages in order and parts in parallel. Exit 0 all done, 1 some not done, 2 refused (R25)."""
    project = Path(project).resolve()
    mc = project / ".model-crew"
    links = [p.name for p in (mc, mc / ".gitignore", mc / "runs", mc / "run.lock") if p.is_symlink()]
    if links:
        print(f"Refused: {', '.join(links)} in .model-crew is a link, so run files could land outside this project. "
              "Delete the link and run again.")
        return 2
    mc.mkdir(exist_ok=True)
    if not (mc / ".gitignore").exists():
        (mc / ".gitignore").write_text("*\n")  # run files never get committed (R24)
    lock = mc / "run.lock"
    holder = _take_lock(lock)
    if holder:
        print(f"Refused: another run (process {holder}) is still working in this folder. Wait for it to finish, "
              "or stop it with Ctrl-C in its window.")
        return 2
    try:
        plan, errors = load_plan(plan_path, known_ids, installed_routes, project, set(free_ids))
        if errors:
            print("Plan refused, nothing ran:")
            print("\n".join(f"- {e}" for e in errors))
            return 2
        return _execute(plan, plan_path, project, max_parallel, free_ids)
    finally:
        lock.unlink(missing_ok=True)


def _execute(plan, plan_path, project, max_parallel, free_ids):
    run = _Run(project, plan_path)
    workers = min(plan["workers"], max_parallel or plan["workers"])
    limit_s = plan["time_limit_min"] * 60
    slots = {m: threading.Semaphore(FREE_MODEL_SLOTS) for m in free_ids}
    stages, stopped_at = plan["stages"], None

    def on_signal(signum, frame):  # Ctrl-C: stop every worker, record it, leave nothing running (R22)
        n = run.stop_all()
        run.status["state"] = "interrupted"
        run.save()
        (project / ".model-crew" / "run.lock").unlink(missing_ok=True)
        print(f"Interrupted: stopped {n} worker(s). Details: {os.path.relpath(run.dir / 'status.json', project)}")
        sys.stdout.flush()
        os._exit(130)

    old = {s: signal.signal(s, on_signal) for s in (signal.SIGINT, signal.SIGTERM)}
    try:
        run.save()
        for si, stage in enumerate(stages, 1):
            before = _dirty(project)
            with cf.ThreadPoolExecutor(min(workers, len(stage))) as ex:
                results = list(ex.map(lambda p: run_part(p, plan["brief"], project, run, limit_s, slots), stage))
            owned = [f for p in stage if ROUTES[p["model"].split(":", 1)[0]]["edits"] for f in p["files"]]
            unexpected = [p for p in _changed(before, _dirty(project)) if not any(_owns(f, p) for f in owned)]
            with run.lock:
                run.status["stages"].append({"stage": si, "parts": results, "unexpected": unexpected})
            run.save()
            if any(r["result"] != "done" for r in results):
                if si < len(stages):
                    stopped_at = si
                break
        run.status["state"] = "finished"
    except BaseException:
        run.status["state"] = "crashed"
        raise
    finally:
        run.save()
        for s, h in old.items():
            signal.signal(s, h)
    print(_summary(run, sum(len(s) for s in stages), stopped_at, project))
    parts = [p for s in run.status["stages"] for p in s["parts"]]
    return 0 if len(parts) == sum(len(s) for s in stages) and all(p["result"] == "done" for p in parts) else 1


def _summary(run, total, stopped_at, project):
    st = run.status
    parts = [p for s in st["stages"] for p in s["parts"]]
    lines = [f"run {st['run']}: {st['state']}, {sum(p['result'] == 'done' for p in parts)} of {total} parts done"]
    for s in st["stages"]:
        lines.append(f"stage {s['stage']}:")
        for p in s["parts"]:
            note = " (on its fallback)" if p["fallback_used"] else ""
            if p.get("check"):
                note += " (its log mentions a usage limit: check it is complete)"
            log = "" if p["result"] == "done" and not p.get("check") else f"  log: {p['log']}"
            lines.append(f"  {p['result']:<12} {p['id']:<16} {p['model']}{note}  {p['seconds']}s{log}")
        if s["unexpected"]:
            more = len(s["unexpected"]) - 8
            lines.append("  unexpected changes (no part owns them): " + ", ".join(s["unexpected"][:8])
                         + (f" and {more} more" if more > 0 else ""))
    if stopped_at:
        lines.append(f"stopped after stage {stopped_at}: a part there was not done, so later stages did not run")
    lines.append(f"details: {os.path.relpath(run.dir / 'status.json', project)}")
    if len(lines) > 30:
        lines = lines[:28] + [f"... {len(lines) - 29} more lines in status.json", lines[-1]]
    return "\n".join(lines)


def cmd_run(args):
    if args.max_parallel is not None and args.max_parallel < 1:
        print("--max-parallel must be 1 or more")
        return 2
    project = _git_root(Path.cwd()) or Path.cwd().resolve()
    plan_path = Path(args.plan).resolve() if args.plan else project / ".model-crew" / "plan.json"
    rows = detect(save=False)
    ready = {r["route"] for r in rows if r["installed"] and r["logged_in"] != "no"}
    models, _ = list_models(rows)
    return run_plan(plan_path, project, {m["id"] for m in models}, ready, args.max_parallel,
                    {m["id"] for m in models if m["free"]})


def cmd_ask(args):
    """Text-only OpenRouter worker: one chat call, the answer goes to stdout (the part's log)."""
    key = openrouter_key()
    if not key:
        print("No OpenRouter key saved. Run setup first.")
        return 1
    body = {"model": args.model, "messages": [{"role": "user", "content": args.prompt}]}
    try:
        data = _http("/chat/completions", key=key, body=body, timeout=900)
    except urllib.error.HTTPError as e:
        # hidden before cutting, so a key that straddles the cut leaves no prefix behind
        print(f"OpenRouter answered HTTP {e.code}: {_hide_key(e.read(65536).decode('utf-8', 'replace'))[:300]}")
        return 1
    except (OSError, ValueError) as e:
        print(_hide_key(f"Could not reach OpenRouter: {e}"))
        return 1
    if data.get("error"):
        print(_hide_key(f"OpenRouter error: {json.dumps(data['error'])}")[:500])
        return 1
    text = (((data.get("choices") or [{}])[0].get("message") or {}).get("content") or "").strip()
    if not text:
        print("OpenRouter returned an empty answer.")
        return 1
    print(text)
    return 0


# ── doctor ───────────────────────────────────────────────────────────────────────────────────────────────────────────

QUICK = ("D1", "D2", "D5", "D6", "D7", "D11")  # no network, no AI tool calls (R30)


def _rows(ctx):
    if "rows" not in ctx:
        ctx["rows"] = detect(save=False)
    return ctx["rows"]


def _d1(ctx):
    ok = sys.version_info >= (3, 9)
    return ok, None, None if ok else "Install Python 3.9 or newer from https://www.python.org/downloads/"


def _d2(ctx):
    skill = SELF.parent.parent
    missing = [f for f in ("SKILL.md", "LEARNINGS.md", "scripts/crew.py") if not (skill / f).exists()]
    if missing:
        return False, None, f"skill files missing in {skill}: {', '.join(missing)}. Reinstall the skill."
    if ctx["quick"]:
        return True, None, None
    code, out = _sh([sys.executable, str(SELF), "selftest"], timeout=300)
    if code == 0:
        return True, None, None
    return False, None, (f"crew.py selftest failed: {out.strip().splitlines()[-1] if out.strip() else code}. "
                         "Read crew.py, propose the smallest fix, apply it only after the user says yes, "
                         "then run doctor again.")


def _d3(ctx):
    was = load_config()["routes"]
    now = {r["route"]: r for r in _rows(ctx)}
    gone = [n for n, r in was.items() if r.get("installed") and n in now and not now[n]["installed"]]
    if not gone:
        return True, None, None
    return False, None, "no longer installed: " + "; ".join(f"{n} → {now[n]['hint']}" for n in gone)


def _d4(ctx):
    was = load_config()["routes"]
    now = {r["route"]: r for r in _rows(ctx)}
    out = [n for n, r in was.items() if r.get("logged_in") == "yes" and n in now and now[n]["installed"]
           and now[n]["logged_in"] == "no"]
    if not out:
        return True, None, None
    return False, None, "logged out: " + "; ".join(f"{n} → run in a separate Terminal: {now[n]['hint']}" for n in out)


def _d5(ctx):
    path = config_path()
    if not path.exists():
        return True, None, None
    try:
        ok = isinstance(json.loads(path.read_text()), dict)
    except (ValueError, UnicodeDecodeError):
        ok = False
    if ok:
        return True, None, None
    os.replace(path, path.with_name("config.json.bad"))
    cfg = load_config()
    if not ctx["quick"]:
        cfg["routes"] = {r["route"]: {"installed": r["installed"], "logged_in": r["logged_in"]} for r in _rows(ctx)}
    save_config(cfg)
    return True, "config.json was damaged: kept it as config.json.bad and made a fresh one" + \
        ("" if not ctx["quick"] else " (run detect to refill your tools)"), None


def _d6(ctx):
    deleted = 0
    for p in cache_dir().glob("models-*.json"):
        if not _good_cache(read_json(p)):
            p.unlink(missing_ok=True)
            deleted += 1
    fixed = [f"deleted {deleted} damaged model list(s)"] if deleted else []
    hp = history_path()
    if hp.exists():
        good = _history()
        if len(good) != len(hp.read_text(errors="replace").splitlines()):
            with _history_lock:
                _write_atomic(hp, "".join(json.dumps(r) + "\n" for r in good))
            fixed.append("dropped damaged lines from history.jsonl")
    return True, "; ".join(fixed) or None, None


def _d7(ctx):
    p = key_path()
    if not p.exists() or p.stat().st_mode & 0o077 == 0:
        return True, None, None
    os.chmod(p, 0o600)
    return True, "the OpenRouter key file was readable by others: now owner-only (chmod 600)", None


def _d8(ctx):
    try:
        _http("/key")
    except urllib.error.HTTPError:
        return True, None, None  # any HTTP answer means it is reachable
    except (OSError, ValueError) as e:
        return False, None, f"OpenRouter did not answer ({e}). Saved model lists still work."
    return True, None, None


def _d9(ctx):
    cfg = load_config()
    if not cfg["favourites"]:
        return True, None, None
    models, infos = list_models(_rows(ctx))
    ids, fixed, problems = {m["id"] for m in models}, [], []
    offline = [i["source"] for i in infos if i["error"]]  # an old saved list cannot prove a model is gone
    for role, mid in list(cfg["favourites"].items()):
        if mid in ids:
            continue
        route = mid.split(":", 1)[0]
        same = rank([m for m in models if m["route"] == route], "best")
        if same and offline:
            problems.append(f"favourite {role}: {mid} is not in the saved model list, and {', '.join(offline)} could "
                            "not be reached to check; run doctor again when online")
        elif same:
            cfg["favourites"][role] = same[0]["id"]
            fixed.append(f"favourite {role}: {mid} is gone, now {same[0]['id']}")
        else:  # kept: the tool may be logged out or offline for now
            problems.append(f"favourite {role}: {mid} is not available now and {route} lists no models; run setup, "
                            "or pick a new one")
    if fixed or problems:
        save_config(cfg)
    return not problems, "; ".join(fixed) or None, "; ".join(problems) or None


def _flag_tokens(name):
    """The argv words a worker command depends on (everything but the tool name and the placeholders)."""
    argv = ROUTES[name]["argv"]("MODEL_X", "PROMPT_X", "/DIR_X")
    return [t for t in argv[1:] if t not in ("MODEL_X", "PROMPT_X", "/DIR_X")]


def _d10(ctx):
    problems = []
    for name, r in ROUTES.items():
        if not r["help"] or not r["binary"] or not shutil.which(r["binary"]):
            continue
        code, text = _sh([r["binary"], *r["help"]])
        missing = [t for t in _flag_tokens(name) if t not in text]
        if missing:
            problems.append(f"{name}: `{r['binary']} {' '.join(r['help'])}` no longer mentions {', '.join(missing)}")
    if not problems:
        return True, None, None
    return False, None, ("; ".join(problems) + ". The tool changed its flags. Read its help, propose the smallest fix "
                         "to ROUTES in crew.py, apply it only after the user says yes, then run doctor again.")


def _session_leader(pid):
    try:
        return os.getsid(pid) == pid
    except OSError:
        return False


def _started(pid):
    """When this pid's process started, as ps prints it; "" once it has exited. A reused pid has a later start."""
    r = subprocess.run(["ps", "-o", "lstart=", "-p", str(pid)], capture_output=True, text=True)
    return r.stdout.strip()


def _d11(ctx):
    mc = ctx["project"] / ".model-crew"
    lock = mc / "run.lock"
    holder = _read_pid(lock) if lock.exists() else None
    if holder and _alive(holder):
        return True, None, None  # a run is working right now; leave it alone
    fixed, problems = [], []
    if lock.exists():
        lock.unlink(missing_ok=True)
        fixed.append("removed a run lock left by a stopped run")
    for status_path in sorted(mc.glob("runs/*/status.json")):
        if not status_path.resolve().is_relative_to(ctx["project"] / ".model-crew" / "runs"):
            problems.append(f"run {status_path.parent.name} links outside this project, so doctor left it alone")
            continue
        st = read_json(status_path)
        if not isinstance(st, dict) or st.get("state") != "running":
            continue
        killed = 0
        pids = st.get("pids")
        for entry in (pids.values() if isinstance(pids, dict) else ()):
            pid, started = (entry.get("pid"), entry.get("started")) if isinstance(entry, dict) else (None, None)
            # Only pids this run recorded, only while the same process still runs (same start time, so a reused pid
            # never matches), and only if it still leads its own session as every worker does.
            if isinstance(pid, int) and started and _started(pid) == started and _session_leader(pid):
                _kill_group(pid)
                killed += 1
        st["state"], st["pids"] = "interrupted", {}
        write_json_atomic(status_path, st)
        fixed.append(f"marked run {st.get('run')} interrupted" + (f" and stopped {killed} leftover worker(s)"
                                                                  if killed else ""))
    return not problems, "; ".join(fixed) or None, "; ".join(problems) or None


CHECKS = [("D1", _d1), ("D2", _d2), ("D3", _d3), ("D4", _d4), ("D5", _d5), ("D6", _d6), ("D7", _d7), ("D8", _d8),
          ("D9", _d9), ("D10", _d10), ("D11", _d11)]


def doctor(quick=False, project=None, only=None):
    """D1–D11 (R29). Safe fixes are applied and reported as `fixed`; the rest come back with an `action`."""
    ctx = {"quick": quick, "project": Path(project or _git_root(Path.cwd()) or Path.cwd()).resolve()}
    out = []
    for cid, fn in CHECKS:
        if (quick and cid not in QUICK) or (only and cid not in only):
            continue
        try:
            ok, fixed, action = fn(ctx)
        except Exception as e:  # a broken check is itself a finding, never a crash
            ok, fixed, action = False, None, f"the check itself failed ({type(e).__name__}: {e}); read crew.py"
        out.append({"id": cid, "ok": ok, "fixed": fixed, "action": action})
    return out


def cmd_doctor(args):
    results = doctor(args.quick)
    if args.json:
        print(json.dumps(results, indent=1))
    else:
        for r in results:
            state = "ok" if r["ok"] else "problem"
            line = f"{r['id']:<4}{state}"
            if r["fixed"]:
                line += f"  fixed: {r['fixed']}"
            if r["action"]:
                line += f"  → {r['action']}"
            print(line)
    return 0 if all(r["ok"] for r in results) else 1


# ── selftest ─────────────────────────────────────────────────────────────────────────────────────────────────────────

_PATCHES = []
M = sys.modules[__name__]


def _patch(obj, attr, value):
    _PATCHES.append((obj, attr, getattr(obj, attr)))
    setattr(obj, attr, value)


def selftest():
    """Every test_* below, each in fresh temp config/cache folders. Offline; no real AI tools are called."""
    tests = [(n, f) for n, f in list(globals().items()) if n.startswith("test_") and callable(f)]
    failed = []
    env_keys = ("XDG_CONFIG_HOME", "XDG_CACHE_HOME", "OPENROUTER_API_KEY")
    for name, fn in tests:
        saved_env, saved_routes = {k: os.environ.get(k) for k in env_keys}, dict(ROUTES)
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp).resolve()
            os.environ["XDG_CONFIG_HOME"], os.environ["XDG_CACHE_HOME"] = str(tmp / "config"), str(tmp / "cache")
            os.environ.pop("OPENROUTER_API_KEY", None)
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    fn(tmp)
            except Exception:
                failed.append(name)
                print(f"FAIL {name}\n{traceback.format_exc()}", file=sys.stderr)
            finally:
                for k, v in saved_env.items():
                    os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)
                ROUTES.clear()
                ROUTES.update(saved_routes)
                while _PATCHES:
                    obj, attr, value = _PATCHES.pop()
                    setattr(obj, attr, value)
    print(f"{len(tests) - len(failed)} passed, {len(failed)} failed" + (f": {', '.join(failed)}" if failed else ""))
    return 1 if failed else 0


# Task 1: storage

def test_atomic_write_leaves_no_temp(tmp):
    p = tmp / "a" / "x.json"
    write_json_atomic(p, {"a": 1})
    write_json_atomic(p, {"a": 2})
    assert read_json(p) == {"a": 2}
    assert [f.name for f in p.parent.iterdir()] == ["x.json"]


def test_cache_fresh_is_used_without_fetch(tmp):
    cached_fetch("s", lambda: [_model("claude", "x")], now=lambda: 1000)
    models, info = cached_fetch("s", lambda: 1 / 0, now=lambda: 1000 + FRESH_S - 1)
    assert models == [_model("claude", "x")] and not info["live"] and info["error"] is None


def test_cache_stale_refetches(tmp):
    cached_fetch("s", lambda: [_model("claude", "1")], now=lambda: 1000)
    models, info = cached_fetch("s", lambda: [_model("claude", "2")], now=lambda: 1000 + FRESH_S + 1)
    assert models == [_model("claude", "2")] and info["live"]


def _offline():
    raise OSError("no network")


def test_cache_falls_back_on_fetch_error_with_age(tmp):
    cached_fetch("s", lambda: [_model("claude", "1")], now=lambda: 1000)
    models, info = cached_fetch("s", _offline, now=lambda: 1000 + 7200)
    assert models == [_model("claude", "1")] and info["age_s"] == 7200 and "no network" in info["error"]
    assert _source_line(info) == "s: saved list from 2 h ago; live fetch failed: OSError: no network"


def test_cache_missing_and_offline_reports_unavailable(tmp):
    models, info = cached_fetch("s", _offline)
    assert models == [] and info["fetched_at"] is None and _source_line(info).startswith("s: unavailable: ")


def test_damaged_cache_is_deleted(tmp):
    p = cache_dir() / "models-s.json"
    p.write_text("{half a file")
    models, _ = cached_fetch("s", lambda: [{"id": "3"}], now=lambda: 5)
    assert models == [{"id": "3"}] and read_json(p)["models"] == [{"id": "3"}]
    p.write_text("garbage")
    assert read_json(p) is None and not p.exists()


def test_history_trims_to_500(tmp):
    for i in range(HISTORY_CAP + 5):
        history_add("m", "done", 1, now=lambda: i)
    lines = history_path().read_text().splitlines()
    assert len(lines) == HISTORY_CAP and json.loads(lines[0])["at"] == 5


def test_history_stats_last_10(tmp):
    for r in ["failed"] * 5 + ["done"] * 8 + ["failed"] * 2:
        history_add("m", r, 1)
    history_add("other", "done", 1)
    assert history_stats("m") == (8, 10)
    assert set(json.loads(history_path().read_text().splitlines()[0])) == {"model", "result", "seconds", "at"}


# Task 2: detect, sources, ranking

OPENCODE_SAMPLE = """opencode/big-pickle
{
  "id": "big-pickle",
  "status": "active",
  "cost": {"input": 0, "output": 0, "cache": {"read": 0}},
  "limit": {"context": 200000, "output": 32000},
  "capabilities": {"toolcall": true},
  "release_date": "2026-09-01"
}
anthropic/claude-x
{
  "id": "claude-x",
  "cost": {"input": 3, "output": 15},
  "limit": {"context": 200000},
  "capabilities": {"toolcall": true},
  "release_date": "2026-08-01"
}
"""
AUTH_SAMPLE = ("\x1b[0m\n┌  Credentials \x1b[90m~/.local/share/opencode/auth.json\n│\n●  Google \x1b[90moauth\n│\n"
               "●  OpenCode Zen \x1b[90mapi\n│\n└  2 credentials\n")
OPENROUTER_SAMPLE = {"data": [
    {"id": "a/free-tools:free", "created": 1790000000, "context_length": 131072,
     "pricing": {"prompt": "0", "completion": "0"}, "supported_parameters": ["tools", "temperature"],
     "expiration_date": "2026-10-08"},
    {"id": "b/free-plain:free", "context_length": 32768, "pricing": {"prompt": "0", "completion": "0"},
     "supported_parameters": ["temperature"]},
    {"id": "c/paid", "context_length": 200000, "pricing": {"prompt": "0.000003", "completion": "0.000015"},
     "supported_parameters": ["tools"]},
]}


def test_parse_opencode_verbose_marks_free(tmp):
    models = parse_opencode_verbose(OPENCODE_SAMPLE)
    assert [m["id"] for m in models] == ["opencode:opencode/big-pickle", "opencode:anthropic/claude-x"]
    assert models[0]["free"] and not models[1]["free"]
    assert models[0]["context"] == 200000 and models[0]["tools"] and models[0]["edits"]


def test_ansi_stripped_before_parse(tmp):
    assert parse_auth_list(AUTH_SAMPLE) == (2, False)
    assert parse_auth_list(AUTH_SAMPLE.replace("Google", "OpenRouter")) == (2, True)
    coloured = OPENCODE_SAMPLE.replace("opencode/big-pickle\n", "\x1b[1mopencode/big-pickle\x1b[0m\n")
    assert parse_opencode_verbose(coloured)[0]["id"] == "opencode:opencode/big-pickle"


def test_openrouter_free_filter_and_tools(tmp):
    models = {m["name"]: m for m in parse_openrouter(OPENROUTER_SAMPLE)}
    assert models["a/free-tools:free"]["free"] and models["a/free-tools:free"]["tools"]
    assert models["b/free-plain:free"]["free"] and not models["b/free-plain:free"]["tools"]
    assert not models["c/paid"]["free"]
    assert all(m["route"] == "openrouter" and not m["edits"] for m in models.values())
    assert models["a/free-tools:free"]["expires"] == "2026-10-08"


def test_openrouter_routes_via_opencode_when_connected(tmp):
    stale_copy = _model("opencode", "openrouter/a/free-tools:free", free=True)
    _patch(M, "_fetch_opencode", lambda: parse_opencode_verbose(OPENCODE_SAMPLE) + [stale_copy])
    _patch(M, "_fetch_openrouter", lambda: parse_openrouter(OPENROUTER_SAMPLE))
    rows = [{"route": "opencode", "installed": True, "logged_in": "yes", "openrouter": True},
            {"route": "openrouter", "installed": True, "logged_in": "yes", "via_opencode": True}]
    ids = [m["id"] for m in list_models(rows, refresh=True)[0]]
    assert ids.count("opencode:openrouter/a/free-tools:free") == 1 and "openrouter:a/free-tools:free" not in ids
    rows[1]["via_opencode"] = False
    models = {m["id"]: m for m in list_models(rows, refresh=True)[0]}
    assert "openrouter:a/free-tools:free" in models and not models["openrouter:a/free-tools:free"]["edits"]


def test_rank_free_first_in_cheapest_mode(tmp):
    paid = _model("opencode", "x/paid-new", tools=True, released="2026-10-01")
    free = _model("opencode", "x/free-old", free=True, tools=True, released="2025-01-01")
    no_stats = lambda mid: (0, 0)  # noqa: E731
    assert [m["name"] for m in rank([paid, free], "cheapest", no_stats)] == ["x/free-old"]
    assert [m["name"] for m in rank([paid, free], "balanced", no_stats)] == ["x/free-old", "x/paid-new"]
    assert [m["name"] for m in rank([paid, free], "best", no_stats)] == ["x/paid-new", "x/free-old"]


def test_rank_uses_track_record_after_3_runs(tmp):
    a = _model("opencode", "x/a", free=True, tools=True, released="2026-10-01")
    b = _model("opencode", "x/b", free=True, tools=True, released="2026-01-01")
    assert [m["name"] for m in rank([a, b], "cheapest", {a["id"]: (0, 3), b["id"]: (3, 3)}.get)] == ["x/b", "x/a"]
    assert [m["name"] for m in rank([a, b], "cheapest", {a["id"]: (0, 2), b["id"]: (2, 2)}.get)] == ["x/a", "x/b"]


def test_small_context_is_check_only(tmp):
    small = _model("opencode", "x/small", free=True, tools=True, context=32_000, released="2026-10-01")
    big = _model("opencode", "x/big", free=True, tools=True, context=128_000, released="2025-01-01")
    text = _model("openrouter", "x/text", free=True, tools=True, context=128_000, released="2026-10-01")
    ranked = rank([small, text, big], "cheapest", lambda mid: (0, 0))
    assert [m["name"] for m in ranked][0] == "x/big"
    assert all(m["check_only"] for m in ranked[1:]) and not ranked[0]["check_only"]


def test_expiry_within_7_days_warns(tmp):
    now = 1_800_000_000
    day = lambda d: time.strftime("%Y-%m-%d", time.gmtime(now + d * 86400))  # noqa: E731
    soon = _model("openrouter", "x/soon", free=True, expires=day(3))
    later = _model("openrouter", "x/later", free=True, expires=day(30))
    gone = _model("openrouter", "x/gone", free=True, expires=day(-1))
    ranked = {m["name"]: m for m in rank([soon, later, gone], "cheapest", lambda mid: (0, 0), now=lambda: now)}
    assert ranked["x/soon"]["warning"] == f"free until {day(3)}" and ranked["x/later"]["warning"] == ""
    assert "x/gone" not in ranked


def test_detect_reports_missing_binary_with_install_hint(tmp):
    _patch(shutil, "which", lambda *a, **k: None)
    _patch(M, "_sh", lambda *a, **k: (_ for _ in ()).throw(AssertionError("no tool should run")))
    rows = {r["route"]: r for r in detect(save=False)}
    assert not rows["opencode"]["installed"] and "opencode.ai/install" in rows["opencode"]["hint"]
    assert not rows["openrouter"]["installed"] and "save-key openrouter" in rows["openrouter"]["hint"]


# Task 3: plan and run

FAKE_WORKER = r'''
import os, shutil, subprocess, sys, time
kind, _, arg = sys.argv[1].partition("=")
prompt = sys.argv[2]
if kind == "writes": open(arg, "a").write("x\n")
elif kind == "slow": time.sleep(1.5); open(arg, "w").write("x")
elif kind == "copy":
    src, dst = arg.split(">")
    if not os.path.exists(src): sys.exit(4)
    shutil.copy(src, dst)
elif kind == "echo": open(arg, "w").write(prompt)
elif kind == "stray": open(arg, "a").write("x\n"); open("stray.txt", "w").write("x")
elif kind == "ratelimit": print("Error: 429 Too Many Requests"); sys.exit(1)
elif kind == "limitdone": open(arg, "w").write("half"); print("Error: 429 rate limit reached")
elif kind == "fail": sys.exit(3)
elif kind == "stdin": sys.stdin.read(); open(arg, "w").write("ok")
elif kind == "big": sys.stdout.write("y" * 5_000_000); open(arg, "w").write("ok")
elif kind == "sleep":
    c = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
    open(arg, "w").write(str(c.pid)); time.sleep(60)
'''


def _fake_route():
    ROUTES["fake"] = {"binary": sys.executable, "edits": True, "help": None, "login": None, "install": "",
                      "login_hint": "", "argv": lambda m, p, d: [sys.executable, "-c", FAKE_WORKER, m, p]}


def _git_repo(tmp):
    d = tmp / "proj"
    d.mkdir()
    g = ["git", "-C", str(d), "-c", "user.email=t@example.com", "-c", "user.name=t", "-c", "commit.gpgsign=false",
         "-c", "core.hooksPath=/dev/null"]
    subprocess.run(["git", "init", "-q", str(d)], check=True)
    (d / "README.md").write_text("test\n")
    subprocess.run(g + ["add", "-A"], check=True)
    subprocess.run(g + ["commit", "-qm", "init"], check=True)
    return d


def _part(pid, kind, files, **kw):
    return {"id": pid, "model": "fake:" + kind, "files": files, "prompt": f"do {pid}", **kw}


def _write_plan(proj, stages, **extra):
    plan = {"brief": {"task": "test"}, "workers": 4, "time_limit_min": 1, "stages": stages, **extra}
    path = proj / ".model-crew" / "plan.json"
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(plan))
    ids = {p[k] for s in stages for p in s if isinstance(p, dict) for k in ("model", "fallback") if p.get(k)}
    return path, ids


def _run(proj, stages, **extra):
    path, ids = _write_plan(proj, stages, **extra)
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = run_plan(path, proj, ids, {"fake"})
    runs = sorted((proj / ".model-crew").glob("runs/*/status.json"))
    return code, (read_json(runs[-1]) if runs else None), out.getvalue()


def _refusals(tmp, stages, known=None, installed=("fake",), proj=None):
    _fake_route()
    proj = proj or _git_repo(tmp)
    path, ids = _write_plan(proj, stages)
    return " | ".join(load_plan(path, set(known if known is not None else ids), set(installed), proj)[1])


def test_plan_refuses_unknown_model_with_suggestion(tmp):
    stages = [[{"id": "a", "model": "opencode:opencode/big-pickel", "files": ["a.txt"], "prompt": "x"}]]
    errors = _refusals(tmp, stages, known={"opencode:opencode/big-pickle"}, installed={"opencode"})
    assert "did you mean opencode:opencode/big-pickle?" in errors, errors


def test_plan_refuses_duplicate_ids(tmp):
    assert "used twice" in _refusals(tmp, [[_part("a", "writes=a", ["a"])], [_part("a", "writes=b", ["b"])]])


def test_plan_refuses_shared_file_in_stage(tmp):
    errors = _refusals(tmp, [[_part("a", "writes=x", ["src/x.js"]), _part("b", "writes=y", ["src/"])]])
    assert "owned by both" in errors, errors


def test_plan_refuses_empty_stage(tmp):
    assert "stage 2 is empty" in _refusals(tmp, [[_part("a", "writes=a", ["a"])], []])


def test_plan_refuses_not_git(tmp):
    plain = tmp / "plain"
    plain.mkdir()
    assert "not a git repository" in _refusals(tmp, [[_part("a", "writes=a", ["a"])]], proj=plain)


def test_plan_refuses_dirty_tree(tmp):
    proj = _git_repo(tmp)
    (proj / "new.txt").write_text("unsaved")
    assert "uncommitted changes in 1 file" in _refusals(tmp, [[_part("a", "writes=a", ["a"])]], proj=proj)


def test_plan_refuses_escaping_path(tmp):
    proj = _git_repo(tmp)
    (proj / "link").symlink_to(tmp)
    subprocess.run(["git", "-C", str(proj), "-c", "user.email=t@example.com", "-c", "user.name=t", "-c",
                    "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(proj), "-c", "user.email=t@example.com", "-c", "user.name=t", "-c",
                    "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "link"], check=True)
    errors = _refusals(tmp, [[_part("a", "writes=a", ["../x"]), _part("b", "writes=b", ["/etc/x"]),
                              _part("c", "writes=c", ["link/x"])]], proj=proj)
    assert errors.count("inside the project") == 2 and "outside the project" in errors, errors


def test_plan_refuses_missing_route(tmp):
    stages = [[{"id": "a", "model": "codex:gpt-x", "files": ["a"], "prompt": "x"}]]
    assert "codex is not installed" in _refusals(tmp, stages, installed={"fake"})


def test_classify_done(tmp):
    assert classify(0, False, True, "") == "done"


def test_classify_no_changes(tmp):
    assert classify(0, False, False, "all good") == "no-changes"


def test_classify_stuck(tmp):
    assert classify(-9, True, True, "") == "stuck"


def test_classify_rate_limited(tmp):
    assert classify(1, False, False, "HTTP 429") == "rate-limited"
    assert classify(0, False, False, "You exceeded your current Quota") == "rate-limited"


def test_classify_failed(tmp):
    assert classify(2, False, True, "TypeError") == "failed"


def test_run_stages_in_order_and_parallel(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    t0 = time.monotonic()
    code, st, _ = _run(proj, [[_part("a", "slow=a.txt", ["a.txt"])],
                              [_part("b", "copy=a.txt>b.txt", ["b.txt"]), _part("c", "slow=c.txt", ["c.txt"]),
                               _part("d", "slow=d.txt", ["d.txt"])]])
    took = time.monotonic() - t0
    assert code == 0, st
    assert [p["result"] for s in st["stages"] for p in s["parts"]] == ["done"] * 4
    assert took < 4.2, f"stage 2 did not run in parallel ({took:.1f}s)"


def test_run_stops_after_failed_stage(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, out = _run(proj, [[_part("a", "fail", ["a.txt"])], [_part("b", "writes=b.txt", ["b.txt"])]])
    assert code == 1 and len(st["stages"]) == 1 and st["stages"][0]["parts"][0]["result"] == "failed"
    assert not (proj / "b.txt").exists() and "stopped after stage 1" in out


def test_run_retries_rate_limited_on_fallback(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, _ = _run(proj, [[_part("a", "ratelimit", ["a.txt"], fallback="fake:writes=a.txt")]])
    p = st["stages"][0]["parts"][0]
    assert code == 0 and p["result"] == "done" and p["model"] == "fake:writes=a.txt" and p["fallback_used"]
    assert history_stats("fake:ratelimit") == (0, 1)


def test_run_flags_unexpected_changes(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, out = _run(proj, [[_part("a", "stray=a.txt", ["a.txt"])]])
    assert st["stages"][0]["unexpected"] == ["stray.txt"] and "stray.txt" in out


def test_run_timeout_kills_process_group(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, _ = _run(proj, [[_part("a", "sleep=pid.txt", ["pid.txt"])]], time_limit_min=0.03)
    assert code == 1 and st["stages"][0]["parts"][0]["result"] == "stuck"
    child = int((proj / "pid.txt").read_text())
    for _ in range(40):
        if not _alive(child):
            break
        time.sleep(0.1)
    assert not _alive(child), "the worker's child process survived"


def test_prompt_passed_verbatim(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    nasty = 'He said "hi" & $(touch pwned) ; `touch pwned2`\nline 2 \'q\' \\ end -- --help'
    code, st, _ = _run(proj, [[dict(_part("a", "echo=out.txt", ["out.txt"]), prompt=nasty)]])
    assert code == 0 and nasty in (proj / "out.txt").read_text()
    assert not (proj / "pwned").exists() and not (proj / "pwned2").exists()


def test_worker_stdin_is_closed(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    r, w = os.pipe()  # a stdin that never ends: a worker reading it would hang until the time limit
    saved = os.dup(0)
    os.dup2(r, 0)
    try:
        code, st, _ = _run(proj, [[_part("a", "stdin=s.txt", ["s.txt"])]], time_limit_min=0.05)
    finally:
        os.dup2(saved, 0)
        for fd in (saved, r, w):
            os.close(fd)
    assert st["stages"][0]["parts"][0]["result"] == "done"


def test_big_output_goes_to_log(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, out = _run(proj, [[_part("a", "big=a.txt", ["a.txt"])]])
    p = st["stages"][0]["parts"][0]
    assert code == 0 and (proj / p["log"]).stat().st_size >= 5_000_000
    assert len(out.splitlines()) <= 30 and len(out) < 3000


def test_second_run_refused_while_locked(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    lock = proj / ".model-crew" / "run.lock"
    lock.parent.mkdir()
    lock.write_text(str(os.getpid()))
    code, _, out = _run(proj, [[_part("a", "writes=a.txt", ["a.txt"])]])
    assert code == 2 and "another run" in out and lock.exists() and not (proj / "a.txt").exists()


def test_stale_lock_removed(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    dead = subprocess.Popen([sys.executable, "-c", "pass"])
    dead.wait()
    lock = proj / ".model-crew" / "run.lock"
    lock.parent.mkdir()
    lock.write_text(str(dead.pid))
    code, _, _ = _run(proj, [[_part("a", "writes=a.txt", ["a.txt"])]])
    assert code == 0 and not lock.exists()


# Task 4: doctor

def test_doctor_rebuilds_damaged_config(tmp):
    config_path().write_text("{not json")
    r = doctor(quick=True, project=tmp, only={"D5"})[0]
    assert r["ok"] and "config.json.bad" in r["fixed"]
    assert config_dir().joinpath("config.json.bad").exists() and read_json(config_path())["mode"] == "balanced"


def test_doctor_deletes_damaged_cache(tmp):
    bad = cache_dir() / "models-x.json"
    bad.write_text("{")
    history_add("m", "done", 1)
    with history_path().open("a") as f:
        f.write("{broken\n")
    r = doctor(quick=True, project=tmp, only={"D6"})[0]
    assert r["ok"] and "deleted 1" in r["fixed"] and not bad.exists()
    assert len(history_path().read_text().splitlines()) == 1


def test_doctor_chmods_open_key_file(tmp):
    key_path().write_text("sk-test\n")
    os.chmod(key_path(), 0o644)
    r = doctor(quick=True, project=tmp, only={"D7"})[0]
    assert r["ok"] and r["fixed"] and key_path().stat().st_mode & 0o777 == 0o600


def test_doctor_replaces_missing_favourite(tmp):
    cfg = load_config()
    cfg["favourites"] = {"build": "opencode:opencode/gone", "check": "opencode:opencode/big-pickle"}
    save_config(cfg)
    _patch(M, "detect", lambda save=False: [{"route": "opencode", "installed": True, "logged_in": "yes", "hint": ""}])
    _patch(M, "list_models", lambda rows, refresh=False: (
        [_model("opencode", "opencode/small", free=True, tools=True, context=8000, released="2026-10-01"),
         _model("opencode", "opencode/big-pickle", free=True, tools=True, context=200000)], []))
    r = doctor(quick=False, project=tmp, only={"D9"})[0]
    assert r["ok"] and "opencode/gone is gone" in r["fixed"]
    assert load_config()["favourites"] == {"build": "opencode:opencode/big-pickle",
                                           "check": "opencode:opencode/big-pickle"}


def test_doctor_clears_stale_lock(tmp):
    run_dir = tmp / "p" / ".model-crew" / "runs" / "r1"
    run_dir.mkdir(parents=True)
    dead = subprocess.Popen([sys.executable, "-c", "pass"])
    dead.wait()
    lock = tmp / "p" / ".model-crew" / "run.lock"
    lock.write_text(str(dead.pid))
    write_json_atomic(run_dir / "status.json", {"run": "r1", "state": "running", "stages": [],
                                                "pids": {"a": {"pid": dead.pid, "binary": "opencode"}}})
    r = doctor(quick=True, project=tmp / "p", only={"D11"})[0]
    assert r["ok"] and "removed a run lock" in r["fixed"] and not lock.exists()
    assert read_json(run_dir / "status.json")["state"] == "interrupted"


def test_doctor_flags_changed_cli_flag(tmp):
    ROUTES["fake"] = {"binary": sys.executable, "edits": True, "help": ["-c", "print('usage: run --model M')"],
                      "login": None, "install": "", "login_hint": "",
                      "argv": lambda m, p, d: ["fake", "run", "--model", m, "--dir", d, p]}
    _patch(shutil, "which", lambda b, *a, **k: b if b == sys.executable else None)
    r = doctor(quick=False, project=tmp, only={"D10"})[0]
    assert not r["ok"] and "no longer mentions --dir." in r["action"], r


def test_quick_doctor_calls_no_tools_or_network(tmp):
    def boom(*a, **k):
        raise AssertionError("quick doctor must not call tools or the network")
    for name in ("_sh", "_http", "detect", "list_models"):
        _patch(M, name, boom)
    results = doctor(quick=True, project=tmp)
    assert [r["id"] for r in results] == list(QUICK)
    assert all("check itself failed" not in (r["action"] or "") for r in results), results


# ── main ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

# Review fixes (2026-10-05)

def test_atomic_write_is_owner_only(tmp):
    p = tmp / "k"
    write_json_atomic(p, {"a": 1})
    assert p.stat().st_mode & 0o777 == 0o600


def test_cache_with_damaged_records_is_deleted(tmp):
    p = cache_dir() / "models-s.json"
    write_json_atomic(p, {"fetched_at": 1, "models": [None]})
    models, _ = cached_fetch("s", _offline, now=lambda: 2)
    assert models == [] and not p.exists()


def test_history_with_bad_bytes_keeps_good_lines(tmp):
    history_add("m:a", "done", 1)
    with open(history_path(), "ab") as f:
        f.write(b"\xff\xfe broken\n")
    assert history_stats("m:a") == (1, 1)


def test_key_with_line_break_is_never_used(tmp):
    os.environ["OPENROUTER_API_KEY"] = "sk-or-v1-abc\nX-Other: 1"
    assert openrouter_key() is None
    os.environ["OPENROUTER_API_KEY"] = " sk-or-v1-abc "
    assert openrouter_key() == "sk-or-v1-abc"


def test_plan_refuses_link_into_git_folder(tmp):
    proj = _git_repo(tmp)
    (proj / "src").symlink_to(proj / ".git")
    subprocess.run(["git", "-C", str(proj), "add", "-A"], check=True)
    subprocess.run(["git", "-C", str(proj), "-c", "user.email=t@e", "-c", "user.name=t", "-c", "commit.gpgsign=false",
                    "-c", "core.hooksPath=/dev/null", "commit", "-qm", "link"], check=True)
    assert "tool folder" in _refusals(tmp, [[_part("a", "writes=src/config", ["src/config"])]], proj=proj)


def test_cheapest_plan_refuses_paid_model(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    path, ids = _write_plan(proj, [[_part("a", "writes=a.txt", ["a.txt"])]], brief={"task": "t", "mode": "cheapest"})
    assert "not free" in " ".join(load_plan(path, ids, {"fake"}, proj, free_ids=set())[1])
    assert not load_plan(path, ids, {"fake"}, proj, free_ids=ids)[1]


def test_failed_git_status_refuses_plan(tmp):
    _patch(M, "_git_status", lambda root: None)
    assert "git status failed" in _refusals(tmp, [[_part("a", "writes=a.txt", ["a.txt"])]])


def test_linked_model_crew_folder_refused(tmp):
    _fake_route()
    proj, elsewhere = _git_repo(tmp), tmp / "elsewhere"
    elsewhere.mkdir()
    (proj / ".model-crew").symlink_to(elsewhere)
    plan = tmp / "plan.json"
    plan.write_text(json.dumps({"brief": {"task": "t"}, "stages": [[_part("a", "writes=a.txt", ["a.txt"])]]}))
    out = io.StringIO()
    with contextlib.redirect_stdout(out):
        code = run_plan(plan, proj, {"fake:writes=a.txt"}, {"fake"})
    assert code == 2 and "is a link" in out.getvalue() and not list(elsewhere.iterdir())


def test_lock_holds_pid_and_leaves_no_private_file(tmp):
    lock = tmp / "run.lock"
    assert _take_lock(lock) is None and lock.read_text() == str(os.getpid())
    assert _take_lock(lock) == os.getpid() and [f.name for f in tmp.iterdir() if f.name.startswith("run.")] == \
        ["run.lock"]


def test_no_worker_starts_after_stop(tmp):
    proj = _git_repo(tmp)
    run = _Run(proj, "plan.json")
    run.stop_all()
    marker = tmp / "started"
    code, timed_out = run.spawn("a", [sys.executable, "-c", f"open({str(marker)!r}, 'w')"], proj, tmp / "a.log", 5)
    assert (code, timed_out) == (130, False) and not marker.exists()


def test_done_with_limit_message_is_flagged_for_checking(tmp):
    _fake_route()
    proj = _git_repo(tmp)
    code, st, out = _run(proj, [[_part("a", "limitdone=a.txt", ["a.txt"])]])
    p = st["stages"][0]["parts"][0]
    assert p["result"] == "done" and p["check"] and "check it is complete" in out and p["log"] in out


def test_doctor_keeps_favourite_when_its_tool_is_away(tmp):
    cfg = load_config()
    cfg["favourites"] = {"build": "codex:gpt-x"}
    save_config(cfg)
    _patch(M, "detect", lambda save=False: [])
    _patch(M, "list_models", lambda rows, refresh=False: ([], []))
    r = doctor(quick=False, project=tmp, only={"D9"})[0]
    assert not r["ok"] and load_config()["favourites"] == {"build": "codex:gpt-x"}


def test_session_leader_tells_workers_from_reused_pids(tmp):
    own = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(5)"], start_new_session=True)
    plain = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(5)"])
    try:
        assert _session_leader(own.pid) and not _session_leader(plain.pid)
    finally:
        for c in (own, plain):
            c.kill()
            c.wait()


# Second review (2026-10-05)

def test_key_is_hidden_in_error_text(tmp):
    os.environ["OPENROUTER_API_KEY"] = "sk-or-v1-secret"

    def fail():
        raise OSError("proxy said: bad token sk-or-v1-secret")
    _, info = cached_fetch("s", fail, now=lambda: 1)
    assert "sk-or-v1-secret" not in info["error"] and "[key hidden]" in info["error"]


def test_cache_needs_every_model_field_and_a_real_time(tmp):
    assert _good_cache({"fetched_at": 1, "models": [_model("claude", "x")]})
    assert not _good_cache({"fetched_at": 1, "models": [{"id": "claude:x"}]})
    assert not _good_cache({"fetched_at": float("nan"), "models": []})


def test_plan_refuses_two_names_for_one_file(tmp):
    proj = _git_repo(tmp)
    (proj / "src").mkdir()
    (proj / "alias").symlink_to(proj / "src")
    out = _refusals(tmp, [[_part("a", "writes=src/a.txt", ["src/a.txt"]),
                           _part("b", "writes=alias/a.txt", ["alias/a.txt"])]], proj=proj)
    assert "goes through a link; name the real path, src/a.txt" in out


def test_doctor_waits_to_change_favourites_while_offline(tmp):
    cfg = load_config()
    cfg["favourites"] = {"build": "opencode:opencode/old"}
    save_config(cfg)
    _patch(M, "detect", lambda save=False: [])
    _patch(M, "list_models", lambda rows, refresh=False: ([_model("opencode", "opencode/new")],
                                                          [{"source": "opencode", "error": "URLError: offline"}]))
    r = doctor(quick=False, project=tmp, only={"D9"})[0]
    assert not r["ok"] and "could not be reached" in r["action"]
    assert load_config()["favourites"] == {"build": "opencode:opencode/old"}


def test_doctor_stops_only_the_recorded_worker(tmp):
    run_dir = tmp / "p" / ".model-crew" / "runs" / "r1"
    run_dir.mkdir(parents=True)
    sleep = [sys.executable, "-c", "import time; time.sleep(30)"]
    worker, reused = (subprocess.Popen(sleep, start_new_session=True) for _ in range(2))
    try:
        write_json_atomic(run_dir / "status.json", {"run": "r1", "state": "running", "stages": [], "pids": {
            "a": {"pid": worker.pid, "started": _started(worker.pid)},
            "b": {"pid": reused.pid, "started": "Thu Jan  1 00:00:00 1970"}}})
        r = doctor(quick=True, project=tmp / "p", only={"D11"})[0]
        assert "stopped 1 leftover" in r["fixed"] and worker.wait(timeout=10) is not None and reused.poll() is None
    finally:
        for c in (worker, reused):
            c.kill()
            c.wait()


def test_doctor_leaves_a_linked_run_folder_alone(tmp):
    outside = tmp / "outside"
    write_json_atomic(outside / "status.json", {"run": "x", "state": "running", "pids": {}})
    runs = tmp / "p" / ".model-crew" / "runs"
    runs.mkdir(parents=True)
    (runs / "r1").symlink_to(outside)
    r = doctor(quick=True, project=tmp / "p", only={"D11"})[0]
    assert not r["ok"] and "links outside" in r["action"]
    assert read_json(outside / "status.json")["state"] == "running"


def main(argv=None):
    p = argparse.ArgumentParser(prog="crew.py", description=__doc__.splitlines()[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("detect", help="which AI tools are installed and logged in")
    s.add_argument("--json", action="store_true")
    s = sub.add_parser("save-key", help="save an API key with hidden typing (run it in your own Terminal)")
    s.add_argument("provider", choices=["openrouter"])
    s = sub.add_parser("config", help="show or change saved settings")
    s.add_argument("--mode", choices=MODES)
    s.add_argument("--workers", type=int)
    s.add_argument("--favourite", action="append", default=[], metavar="ROLE=MODEL")
    s = sub.add_parser("models", help="ranked list of models you can use now")
    s.add_argument("--mode", choices=MODES)
    s.add_argument("--free", action="store_true", help="free models only")
    s.add_argument("--refresh", action="store_true", help="ignore saved lists and fetch live")
    s.add_argument("--limit", type=int, default=20, help="rows to show; 0 = all")
    s.add_argument("--json", action="store_true")
    s = sub.add_parser("run", help="check a plan, then run its parts")
    s.add_argument("plan", nargs="?", help="default: .model-crew/plan.json")
    s.add_argument("--max-parallel", type=int)
    s = sub.add_parser("doctor", help="check this skill and fix what is safe to fix")
    s.add_argument("--quick", action="store_true", help="no network, no tool calls")
    s.add_argument("--json", action="store_true")
    sub.add_parser("selftest", help="run the built-in tests (offline)")
    s = sub.add_parser("ask", help="internal: one text-only OpenRouter worker call")
    s.add_argument("model")
    s.add_argument("prompt")
    args = p.parse_args(argv)
    commands = {"detect": cmd_detect, "save-key": cmd_save_key, "config": cmd_config, "models": cmd_models,
                "run": cmd_run, "doctor": cmd_doctor, "selftest": lambda a: selftest(), "ask": cmd_ask}
    return commands[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
