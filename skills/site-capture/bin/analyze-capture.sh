#!/bin/bash
# analyze-capture.sh <run-dir> [board-file]
# Turns a finished capture into an analyzed, searchable, on-the-board entry.
# Deterministic stages run here; the model-analysis (Opus5 xhigh + Sol max) is
# printed as the next command because a shell cannot do judgement.
set -u
RUN="${1:?usage: analyze-capture.sh <run-dir> [board-file]}"
BOARD="${2:-$(dirname "$RUN")/../../INSPIRATION.md}"
SK="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$RUN" ] || { echo "no such run dir: $RUN"; exit 1; }

echo "== 1/4 perceived palette (dominant on-screen colors from pixels)"
node "$SK/bin/perceived-palette.mjs" "$RUN" || echo "  (palette step skipped)"

echo "== 2/4 index into memsearch (semantic recall over captures)"
if command -v memsearch >/dev/null 2>&1 || [ -x "$HOME/.local/bin/memsearch" ]; then
  MS="$(command -v memsearch || echo "$HOME/.local/bin/memsearch")"
  "$MS" index "$RUN/RECREATE.md" -c site_captures 2>&1 | tail -2 || echo "  (index skipped)"
else echo "  memsearch not found - skipping index"; fi

echo "== 3/4 append to inspiration board: $BOARD"
python3 - "$RUN" "$BOARD" <<'PY'
import json, os, sys, datetime
run, board = sys.argv[1], sys.argv[2]
def load(p):
    try: return json.load(open(p))
    except Exception: return {}
ev = load(os.path.join(run, "evidence.json"))
host = (ev.get("run", {}) or {}).get("url", os.path.basename(run))
pal = (ev.get("perceivedPalette", {}) or {}).get("roles", {})
tech = ", ".join(t.get("name", "") for t in (ev.get("technology", {}) or {}).get("detected", [])) or "n/a"
# premise: first non-heading, non-TODO line under "## 1" in RECREATE.md, else blank
premise = ""
rp = os.path.join(run, "RECREATE.md")
if os.path.exists(rp):
    lines = open(rp, encoding="utf-8").read().splitlines()
    grab = False
    for l in lines:
        if l.startswith("## 1"): grab = True; continue
        if grab and l.strip() and not l.startswith("#") and "TODO" not in l:
            premise = l.strip()[:160]; break
row = f"| {host} | `{pal.get('ink','')}`/`{pal.get('paper','')}`/`{pal.get('accent','')}` | {tech} | {premise} | `{os.path.relpath(run, os.path.dirname(board))}` |\n"
header = "# Inspiration board\n\nOne row per captured reference. Take the MECHANISM, never the execution.\n\n| Source | ink/paper/accent | Tech | Premise | Capture |\n|---|---|---|---|---|\n"
if not os.path.exists(board):
    os.makedirs(os.path.dirname(board), exist_ok=True); open(board, "w").write(header)
open(board, "a").write(row)
print("  appended:", host, "|", pal.get("accent", ""), "|", tech[:40])
PY

echo "== 4/4 NEXT (model analysis - run this):"
echo "   Dispatch Opus 5 @ extra-high effort to study $RUN (contact sheets -> key frames -> data),"
echo "   fill RECREATE.md's judgement sections, name the moves worth stealing; Sol max does the"
echo "   technical mechanism pass in parallel; Fable adjudicates. Then re-run memsearch index."
echo "DONE."
