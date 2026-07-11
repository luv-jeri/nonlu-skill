#!/usr/bin/env python3
"""run_evals.py — execute a skill's evals/evals.json against a live model and grade it.

Usage:
    python3 run_evals.py <skill-dir> [--exec-model sonnet] [--judge-model haiku]
                         [--eval ID] [--triggers] [--timeout 300]
    python3 run_evals.py --selftest

Exit codes: 0 all graded asserts pass · 1 any fail · 2 load/usage error.

What it does: inlines SKILL.md (+ optional `include` reference files, for
thin-router skills) into a harness prompt, runs each eval prompt through
`claude -p` (the session's Claude Code auth — no API key), grades the asserts
— deterministic checks natively, prose asserts via ONE batched judge call per
eval — and writes sidecar evidence:
    evals/runs/<ts>/<eval-id>.md   transcript + verdicts (the audit trail)
    evals/last-run.json            score + content_hash (gate F8 reads this)

evals.json schema — a superset of the existing house schema (old files stay
valid): each `asserts` entry is either a prose string (LLM-judge tier) or a
deterministic object {"check": "contains|not_contains|regex|not_regex|
max_words|min_words", "value": ...}. Optional top-level or per-eval
"include": ["references/x.md"]. Optional "triggers" {should_trigger,
should_not_trigger} graded only with --triggers.

HARD RULES
    1. FAIL CLOSED — a judge reply that cannot be parsed grades FAIL, never PASS.
    2. DETERMINISTIC FIRST — an assert expressible as a string/regex/count check
       never goes to the judge (tier order: deterministic beats LLM-judge).
    3. READ-ONLY ON THE SKILL — writes only evals/runs/ and evals/last-run.json.
       Editing SKILL.md is skill-evolve's job: ONE change per iteration,
       commit/reset by score.
    4. EVERY RUN LEAVES EVIDENCE — no sidecar transcript, no result.
    5. STDLIB ONLY — house engines must run on a clean machine (gate F4).

FAILURE MODES (symptom -> fix)
    'claude' not found (exit 2)      -> install Claude Code CLI / fix PATH
    exec call times out (FAIL)       -> raise --timeout, or split a mega-eval
    judge output unparseable (FAIL)  -> stronger --judge-model; keep asserts
                                        one observable behavior per line
    gate F8 says "stale"             -> SKILL.md/evals edited after the last
                                        run — re-run this script
    KNOWN LIMIT: text-mode runs grade the agent's STATED plan, not real side
    effects — phrase behavioral asserts as observable statements/commitments.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time

VERSION = "1.0.0"
HARNESS = (
    "You are an AI agent. The skill below is loaded and you MUST follow it "
    "exactly. Ignore any other style or persona instructions from your "
    "environment; only the skill governs this response.\n\n<skill>\n{skill}\n"
    "</skill>\n\nUser message:\n{prompt}\n\nRespond exactly as the agent "
    "would. If the skill requires actions plain text cannot perform (running "
    "commands, creating files), state each action you would take, in order, "
    "with concrete arguments."
)
JUDGE = (
    "You are a strict binary grader. Below is an agent transcript and numbered "
    "assertions about it.\n\n<transcript>\n{out}\n</transcript>\n\nAssertions:"
    "\n{asserts}\n\nFor EACH assertion output exactly one line '<n>: PASS' or "
    "'<n>: FAIL' (an assertion counts as PASS only if the transcript clearly "
    "satisfies or explicitly commits to it). No other text."
)
TRIGGER_JUDGE = (
    "You are a skill router. A skill has this description:\n\n{desc}\n\n"
    "For EACH numbered user query below, output exactly one line '<n>: YES' "
    "if the description alone should activate this skill for that query, or "
    "'<n>: NO'. No other text.\n\n{queries}"
)


def call_claude(prompt, model, timeout):
    """Run `claude -p` headless. Returns (ok, text). G7: strip MCP servers."""
    cmd = ["claude", "-p", "--model", model,
           "--strict-mcp-config", "--mcp-config", '{"mcpServers":{}}']
    try:
        proc = subprocess.run(cmd, input=prompt, capture_output=True,
                              text=True, timeout=timeout)
    except FileNotFoundError:
        print("LOAD ERROR: 'claude' CLI not found on PATH")
        sys.exit(2)
    except subprocess.TimeoutExpired:
        return False, f"[timeout after {timeout}s]"
    if proc.returncode != 0:
        return False, f"[claude exit {proc.returncode}] {proc.stderr.strip()[-400:]}"
    return True, proc.stdout.strip()


def collect_includes(data):
    seen = []
    for lst in [data.get("include", [])] + [e.get("include", [])
                                            for e in data.get("evals", [])]:
        for p in lst:
            if p not in seen:
                seen.append(p)
    return seen


def content_hash(skill_dir, data):
    """sha256 over SKILL.md + evals.json + every include file, in order.
    skill_gate.py F8 recomputes this exact recipe — keep them identical."""
    h = hashlib.sha256()
    paths = ["SKILL.md", os.path.join("evals", "evals.json")] + \
        collect_includes(data)
    for rel in paths:
        p = os.path.join(skill_dir, rel)
        h.update(rel.encode() + b"\0")
        h.update(open(p, "rb").read() if os.path.isfile(p) else b"<missing>")
        h.update(b"\0")
    return h.hexdigest()


def det_check(a, out):
    c, v = a.get("check"), a.get("value")
    words = len(out.split())
    table = {"contains": lambda: v in out,
             "not_contains": lambda: v not in out,
             "regex": lambda: re.search(v, out) is not None,
             "not_regex": lambda: re.search(v, out) is None,
             "max_words": lambda: words <= int(v),
             "min_words": lambda: words >= int(v)}
    if c not in table:
        return False, f"unknown check '{c}' (fail-closed)"
    return bool(table[c]()), f"{c}: {v}"


def parse_verdicts(reply, n, yes="PASS"):
    """Fail-closed: any index the reply doesn't clearly mark <yes> is False."""
    got = {}
    for m in re.finditer(r"^\s*(\d+)\s*[:.)-]\s*([A-Z]+)", reply, re.MULTILINE):
        got[int(m.group(1))] = m.group(2)
    return [got.get(i + 1, "") == yes for i in range(n)]


def grade_eval(ev, skill_text, args, caller):
    ok, out = caller(HARNESS.format(skill=skill_text, prompt=ev["prompt"]),
                     args.exec_model, args.timeout)
    results = []                      # (passed, tier, label)
    prose = []
    for a in ev.get("asserts", []):
        if isinstance(a, dict):
            passed, label = (False, "no transcript") if not ok \
                else det_check(a, out)
            results.append([passed, "det", label])
        else:
            prose.append(a)
            results.append([None, "judge", a])
    if prose:
        if not ok:
            verdicts = [False] * len(prose)
        else:
            jok, reply = caller(
                JUDGE.format(out=out, asserts="\n".join(
                    f"{i + 1}. {p}" for i, p in enumerate(prose))),
                args.judge_model, args.timeout)
            verdicts = parse_verdicts(reply, len(prose)) if jok \
                else [False] * len(prose)
        it = iter(verdicts)
        for r in results:
            if r[0] is None:
                r[0] = next(it)
    return out, results


def grade_triggers(data, skill_dir, args, caller):
    trig = data.get("triggers", {})
    cases = [(q, True) for q in trig.get("should_trigger", [])] + \
            [(q, False) for q in trig.get("should_not_trigger", [])]
    if not cases:
        return None
    fm = open(os.path.join(skill_dir, "SKILL.md"), encoding="utf-8").read()
    m = re.search(r"^description:\s*(.+)$", fm, re.MULTILINE)
    desc = m.group(1).strip() if m else "(no description found)"
    ok, reply = caller(TRIGGER_JUDGE.format(
        desc=desc, queries="\n".join(f"{i + 1}. {q}" for i, (q, _) in
                                     enumerate(cases))),
        args.judge_model, args.timeout)
    yeses = parse_verdicts(reply, len(cases), yes="YES") if ok \
        else [False] * len(cases)
    hits = [(q, want, got == want) for (q, want), got in zip(cases, yeses)]
    return {"passed": sum(1 for *_, h in hits if h), "total": len(hits),
            "misses": [q for q, _, h in hits if not h]}


def run(args, caller=call_claude):
    skill_dir = os.path.abspath(args.skill_dir)
    epath = os.path.join(skill_dir, "evals", "evals.json")
    if not os.path.isfile(epath):
        print(f"LOAD ERROR: {epath} missing")
        return 2
    try:
        data = json.load(open(epath, encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"LOAD ERROR: evals.json does not parse: {e}")
        return 2
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(skill_md):
        print("LOAD ERROR: SKILL.md missing")
        return 2
    base = open(skill_md, encoding="utf-8").read()
    ts = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    runs_dir = os.path.join(skill_dir, "evals", "runs", ts)
    os.makedirs(runs_dir, exist_ok=True)

    per_eval, passed, total = [], 0, 0
    for ev in data.get("evals", []):
        if args.eval and ev.get("id") != args.eval:
            continue
        inc = data.get("include", []) + ev.get("include", [])
        skill_text = base + "".join(
            f"\n\n--- {p} ---\n" + (open(os.path.join(skill_dir, p),
                                         encoding="utf-8").read()
                                    if os.path.isfile(os.path.join(skill_dir, p))
                                    else "<missing include>") for p in inc)
        out, results = grade_eval(ev, skill_text, args, caller)
        ok_n = sum(1 for r in results if r[0])
        passed += ok_n
        total += len(results)
        fails = [f"[{t}] {lbl}" for p, t, lbl in results if not p]
        per_eval.append({"id": ev.get("id"), "passed": ok_n,
                         "total": len(results), "fails": fails})
        with open(os.path.join(runs_dir, f"{ev.get('id')}.md"), "w",
                  encoding="utf-8") as f:
            f.write(f"# {ev.get('id')} — {ts}\n\n## Prompt\n\n{ev['prompt']}"
                    f"\n\n## Transcript\n\n{out}\n\n## Verdicts\n\n")
            for p, t, lbl in results:
                f.write(f"- {'PASS' if p else 'FAIL'} [{t}] {lbl}\n")
        print(f"eval {ev.get('id')}: {ok_n}/{len(results)}"
              + (f"  FAILS: {'; '.join(fails)}" if fails else ""))

    triggers = grade_triggers(data, skill_dir, args, caller) \
        if args.triggers else None
    if triggers:
        print(f"triggers: {triggers['passed']}/{triggers['total']}"
              + (f"  MISSES: {triggers['misses']}" if triggers["misses"] else ""))

    head = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, cwd=skill_dir)
    summary = {"ts": ts, "runner_version": VERSION,
               "exec_model": args.exec_model, "judge_model": args.judge_model,
               "git_head": head.stdout.strip() if head.returncode == 0 else None,
               "content_hash": content_hash(skill_dir, data),
               "score": {"passed": passed, "failed": total - passed,
                         "total": total},
               "pass_rate": round(passed / total, 3) if total else 0.0,
               "evals": per_eval, "triggers": triggers,
               "partial": bool(args.eval)}
    with open(os.path.join(skill_dir, "evals", "last-run.json"), "w",
              encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    trig_bad = bool(triggers and triggers["misses"])
    if total == 0:
        print("LOAD ERROR: no evals matched")
        return 2
    if passed == total and not trig_bad:
        print(f"EVALS RESULT: PASS ({passed}/{total} asserts)")
        return 0
    print(f"EVALS RESULT: FAIL ({passed}/{total} asserts"
          + (f", {len(triggers['misses'])} trigger misses" if trig_bad else "")
          + ")")
    return 1


# ================================================================ selftest
def selftest():
    """Prove the grader itself: no network, canned model replies."""
    import tempfile
    good = bad = inv = 0

    def fake(reply_map):
        def caller(prompt, model, timeout):
            for key, reply in reply_map.items():
                if key in prompt:
                    return True, reply
            return True, reply_map.get("*", "")
        return caller

    def mkskill(tmp, asserts, body="# t\nRules here.\n"):
        d = os.path.join(tmp, "tskill")
        os.makedirs(os.path.join(d, "evals"), exist_ok=True)
        open(os.path.join(d, "SKILL.md"), "w").write(
            "---\nname: tskill\ndescription: Use when testing.\n---\n" + body)
        json.dump({"skill": "tskill", "evals": [
            {"id": "e1", "prompt": "do the thing properly now",
             "asserts": asserts}]},
            open(os.path.join(d, "evals", "evals.json"), "w"))
        return d

    ns = argparse.Namespace(exec_model="x", judge_model="x", timeout=5,
                            eval=None, triggers=False)
    with tempfile.TemporaryDirectory() as tmp:
        # good: det asserts + judge assert all pass -> exit 0
        ns.skill_dir = mkskill(tmp, [{"check": "contains", "value": "alpha"},
                                     {"check": "max_words", "value": 50},
                                     "States the plan first."])
        rc = run(ns, caller=fake({"User message": "alpha beta gamma",
                                  "binary grader": "1: PASS"}))
        good += rc == 0
        lr = json.load(open(os.path.join(ns.skill_dir, "evals",
                                         "last-run.json")))
        # bad 1: deterministic miss -> exit 1
        ns.skill_dir = mkskill(tmp, [{"check": "contains", "value": "zzz"}])
        bad += run(ns, caller=fake({"*": "alpha"})) == 1
        # bad 2: judge replies garbage -> fail-closed exit 1
        ns.skill_dir = mkskill(tmp, ["Uses a calm tone."])
        bad += run(ns, caller=fake({"User message": "hi",
                                    "binary grader": "sure, looks fine!"})) == 1
        # bad 3: unknown check type -> fail-closed exit 1
        ns.skill_dir = mkskill(tmp, [{"check": "vibes", "value": "good"}])
        bad += run(ns, caller=fake({"*": "anything"})) == 1
        # bad 4: missing evals.json -> exit 2
        ns.skill_dir = os.path.join(tmp, "empty")
        os.makedirs(ns.skill_dir, exist_ok=True)
        bad += run(ns) == 2
        # invariant: content_hash changes when SKILL.md changes, stable otherwise
        d = mkskill(tmp, ["x"])
        data = json.load(open(os.path.join(d, "evals", "evals.json")))
        h1, h2 = content_hash(d, data), content_hash(d, data)
        open(os.path.join(d, "SKILL.md"), "a").write("\nmore\n")
        inv += (h1 == h2) and (content_hash(d, data) != h1) and \
            lr["score"]["passed"] == 3
    if good >= 1 and bad >= 3 and inv >= 1:
        print(f"SELFTEST RESULT: PASS ({good} good, {bad} bad, {inv} invariant)")
        return 0
    print(f"SELFTEST RESULT: FAIL ({good} good, {bad} bad, {inv} invariant)")
    return 1


def main():
    if "--selftest" in sys.argv:
        return selftest()
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("skill_dir")
    ap.add_argument("--exec-model", default="sonnet")
    ap.add_argument("--judge-model", default="haiku")
    ap.add_argument("--eval", default=None, help="run a single eval id")
    ap.add_argument("--triggers", action="store_true",
                    help="also grade the triggers block")
    ap.add_argument("--timeout", type=int, default=300)
    return run(ap.parse_args())


if __name__ == "__main__":
    sys.exit(main())
