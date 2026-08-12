#!/bin/bash
# Fixture test: (1) normal capture completes with verified evidence;
# (2) a kill -9 mid-run leaves a readable partial folder and ZERO surviving processes.
set -u
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${TMPDIR:-/tmp}/site-capture-test-$$"
PORT=8973
FAIL=0
note() { echo "== $*"; }
assert() { if eval "$2"; then echo "PASS $1"; else echo "FAIL $1"; FAIL=1; fi; }

cd "$SKILL/tests/fixtures"
# refuse to run against someone else's server: two concurrent test runs share
# this hard-coded port, and the first one to finish kills the server under the
# second - which then fails ~40 assertions for a reason that has nothing to do
# with the skill (cost one full debugging round on 2026-08-12)
if nc -z 127.0.0.1 $PORT 2>/dev/null; then
  echo "FATAL: port $PORT already in use - another fixture run is active. Wait for it."
  exit 2
fi
python3 -m http.server $PORT >/dev/null 2>&1 &
HTTP_PID=$!
sleep 1

note "phase B pure helpers"
node "$SKILL/tests/evidence-unit-test.mjs"
UNIT_RC=$?
assert "evidence-unit-tests" "[ $UNIT_RC -eq 0 ]"
node "$SKILL/tests/phase-b-unit-test.mjs"
PHASE_B_UNIT_RC=$?
assert "phase-b-unit-tests" "[ $PHASE_B_UNIT_RC -eq 0 ]"

note "normal run (full, headless)"
SCAP_ALLOW_PRIVATE=1 node "$SKILL/bin/site-capture.mjs" "http://127.0.0.1:$PORT/scroll.html" \
  --headless --level full --budget 150 --out "$OUT" > "$OUT-run.json" 2>&1
RC=$?
RUN_DIR=$(find "$OUT" -name manifest.json 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
assert "exit-code-0" "[ $RC -eq 0 ]"
assert "run-dir-exists" "[ -n \"$RUN_DIR\" ]"
assert "manifest-complete" "grep -q mechanical-complete '$RUN_DIR/manifest.json'"
assert "verification-pass" "python3 -c \"import json;d=json.load(open('$RUN_DIR/verification.json'));exit(0 if d['pass'] else 1)\""
KEYS=$(ls "$RUN_DIR/frames/desktop/keyframes/" 2>/dev/null | wc -l | tr -d ' ')
assert "keyframes>=3 (got $KEYS)" "[ $KEYS -ge 3 ]"
assert "tokens-captured" "grep -q -- '--ink' '$RUN_DIR/evidence.json'"
assert "hover-selector-found" "grep -q 'card:hover' '$RUN_DIR/evidence.json'"
assert "animation-inventoried" "grep -q 'pulse' '$RUN_DIR/evidence.json'"
assert "recreate-md-exists" "[ -s '$RUN_DIR/RECREATE.md' ]"
assert "coverage-table-in-report" "grep -q 'Scroll states' '$RUN_DIR/RECREATE.md'"
assert "reference-video" "[ -s '$RUN_DIR/media/reference/primary-path.webm' ]"
assert "human-walkthrough-30fps" "[ -s '$RUN_DIR/media/reference/human-walkthrough-30fps.mp4' ]"
assert "mobile-smoke" "[ $(ls "$RUN_DIR/frames/mobile-smoke/" 2>/dev/null | wc -l) -ge 4 ]"
assert "cleanup-zero-survivors" "python3 -c \"import json;d=json.load(open('$RUN_DIR/logs/cleanup.json'));exit(0 if d['survivors']==[] else 1)\""

run_fixture() {
  NAME="$1"
  shift
  TARGET_OUT="$OUT-$NAME"
  SCAP_ALLOW_PRIVATE=1 node "$SKILL/bin/site-capture.mjs" "http://127.0.0.1:$PORT/$NAME.html" \
    --headless --level quick --budget 90 --out "$TARGET_OUT" "$@" > "$TARGET_OUT-run.json" 2>&1
  find "$TARGET_OUT" -name manifest.json 2>/dev/null | head -1 | xargs dirname 2>/dev/null
}

note "phase B extractor fixtures"
TRANS_RUN=$(run_fixture transitions --thorough)
assert "transition-tracks" "grep -q '\"durationMs\": 420' '$TRANS_RUN/source-evidence/transition-inventory.json'"
assert "transition-easing-resolved" "grep -q 'cubic-bezier' '$TRANS_RUN/source-evidence/transition-inventory.json'"
assert "pseudo-before-captured" "grep -q 'phase-b-pseudo' '$TRANS_RUN/source-evidence/pseudo-states.ndjson'"
assert "interactive-state-machine" "python3 -c \"import json;rows=[json.loads(x) for x in open('$TRANS_RUN/source-evidence/interactive-states.ndjson') if x.strip()];r=next(x for x in rows if x.get('target',{}).get('tag')=='button');p=r['phases'];exit(0 if len(p['hover']['series'])==5 and len(p['reverse']['series'])==6 and len(p['active']['series'])==3 and p['focus']['state']['matches']['focus'] and p['restored']['status'] in ('restored','not-restored-in-window') else 1)\""
assert "transition-track-id-stable" "python3 -c \"import json;rows=[json.loads(x) for x in open('$TRANS_RUN/source-evidence/interactive-states.ndjson') if x.strip()];r=next(x for x in rows if x.get('target',{}).get('tag')=='button');states=[r['phases']['base']['state'],*[x['state'] for x in r['phases']['hover']['series']],*[x['state'] for x in r['phases']['reverse']['series']]];ids=[tuple(t['trackId'] for t in s['transitions']['tracks']) for s in states];exit(0 if ids and len(set(ids))==1 else 1)\""
assert "transition-lifecycle-correlated" "grep -Eq 'transition(run|start|end|cancel)' '$TRANS_RUN/source-evidence/interactive-states.ndjson'"
assert "hidden-gsap-is-unknown" "grep -q 'no public window.gsap global' '$TRANS_RUN/source-evidence/gsap.ndjson'"

KEY_RUN=$(run_fixture keyframes)
assert "nested-keyframes" "grep -q 'phase-b-orbit' '$KEY_RUN/source-evidence/keyframes.json'"
assert "adopted-keyframes" "grep -q 'phase-b-adopted' '$KEY_RUN/source-evidence/keyframes.json'"
assert "open-shadow-adopted-keyframes" "grep -q 'phase-b-shadow' '$KEY_RUN/source-evidence/keyframes.json'"
assert "keyframe-duplicate-not-guessed" "python3 -c \"import json;rows=[json.loads(x) for x in open('$KEY_RUN/source-evidence/style-states.ndjson') if x.strip()];links=[l for r in rows for l in r.get('observation',{}).get('cssAnimations',{}).get('keyframeLinks',[]) if l.get('animationName')=='phase-b-orbit'];exit(0 if links and any(l.get('status') in ('Inferred','Unknown') and len(l.get('candidateRuleRefs',[]))>=2 for l in links) else 1)\""
assert "cross-origin-css-scoped-unknown" "grep -q 'crossOriginCSS.ruleAssociation' '$KEY_RUN/evidence.json'"
assert "waapi-keyframes-and-timing" "grep -q 'phase-b-waapi' '$KEY_RUN/source-evidence/animation-inventory.json'"

GSAP_RUN=$(run_fixture gsap)
assert "gsap-public-tween" "grep -q 'power2.out' '$GSAP_RUN/source-evidence/gsap.ndjson'"
assert "scrolltrigger-public-data" "grep -q 'phase-b-trigger' '$GSAP_RUN/source-evidence/scroll-triggers.ndjson'"

THREED_RUN=$(run_fixture threeD)
assert "3d-exact-matrix" "grep -q 'matrix3d' '$THREED_RUN/source-evidence/style-states.ndjson'"
assert "3d-ancestor-flatten-boundary" "grep -q '\"flatteningBoundary\":true' '$THREED_RUN/source-evidence/style-states.ndjson'"

STAGGER_RUN=$(run_fixture stagger --thorough)
assert "variable-stagger-system" "grep -q 'calc(var(--i) \* 80ms)' '$STAGGER_RUN/source-evidence/stagger-systems.json'"
assert "stagger-resolved-per-state" "grep -q 'transitionTracks' '$STAGGER_RUN/source-evidence/stagger-states.ndjson'"
assert "layout-grid-captured" "grep -q 'repeat(3' '$STAGGER_RUN/source-evidence/style-states.ndjson'"
assert "svg-paint-captured" "grep -q 'linearGradient' '$STAGGER_RUN/source-evidence/style-states.ndjson'"

note "phase B thorough causal fixtures"
BG_RUN=$(run_fixture bg-motion --thorough)
assert "thorough-manifest-profile" "python3 -c \"import json;d=json.load(open('$BG_RUN/manifest.json'));exit(0 if d.get('thorough') and d.get('stylePropertySet')=='phase-b-v1' else 1)\""
assert "six-sample-dwell" "python3 -c \"import json;rows=[json.loads(x) for x in open('$BG_RUN/telemetry/dwell.ndjson') if x.strip()];exit(0 if rows and all(len(r['samples'])==6 for r in rows) else 1)\""
assert "autonomous-not-scroll-caused" "python3 -c \"import json;rows=[json.loads(x) for x in open('$BG_RUN/telemetry/causal-deltas.ndjson') if x.strip()];exit(0 if any(r.get('label') in ('autonomous-observed','time-caused') for r in rows) and not any(r.get('source')=='stationary-dwell' and r.get('label') in ('scroll-caused','pointer-caused') for r in rows) else 1)\""
assert "scroll-labels-use-autonomous-control" "python3 -c \"import json;rows=[json.loads(x) for x in open('$BG_RUN/telemetry/causal-deltas.ndjson') if x.strip() and json.loads(x).get('source')=='scroll-step'];bad=[r for r in rows if r.get('label') in ('scroll-caused','probably-scroll-caused') and not (r.get('controlledReadableDelta',{}).get('changed') or r.get('pixelDiff',{}).get('outsideAutonomousMask'))];exit(1 if bad else 0)\""
assert "scroll-state-deep-snapshot" "grep -q 'phase-b-scroll-state' '$BG_RUN/source-evidence/style-states.ndjson'"

CURSOR_RUN=$(run_fixture cursor-parallax --thorough)
assert "five-cursor-terminal-records" "python3 -c \"import json;rows=[json.loads(x) for x in open('$CURSOR_RUN/telemetry/cursor-probes.ndjson') if x.strip()];exit(0 if rows and all(len(r['positions'])==5 for r in rows) else 1)\""
assert "cursor-path-samples-frame-data-canvas" "python3 -c \"import json;rows=[json.loads(x) for x in open('$CURSOR_RUN/telemetry/cursor-probes.ndjson') if x.strip()];positions=[p for r in rows for p in r['positions'] if p.get('status')=='captured'];ok=positions and all((len(p.get('pathSamples',[]))==9 if p.get('pathSampling')=='continuous-nine-waypoint' else len(p.get('pathSamples',[]))==1) for p in positions) and all(s.get('frameRef') and s.get('frameHash') and s.get('readableData') and s.get('canvasReaction') for p in positions for s in p['pathSamples']);exit(0 if ok else 1)\""
assert "cursor-target-and-full-view-diffs" "python3 -c \"import json;rows=[json.loads(x) for x in open('$CURSOR_RUN/telemetry/cursor-probes.ndjson') if x.strip()];positions=[p for r in rows for p in r['positions'] if p.get('status')=='captured' and p.get('targetIdentity')];exit(0 if positions and all(p.get('pixelDiff',{}).get('comparable') and p.get('targetPixelDiff',{}).get('comparable') for p in positions) else 1)\""
assert "cursor-target-chain-and-canvas-unknown" "python3 -c \"import json;rows=[json.loads(x) for x in open('$CURSOR_RUN/telemetry/cursor-probes.ndjson') if x.strip()];positions=[p for r in rows for p in r['positions'] if p.get('status')=='captured'];e=json.load(open('$CURSOR_RUN/evidence.json'));exit(0 if positions and all('ancestors' in p.get('targetIdentity',{}) and 'hitTestStack' in p.get('targetIdentity',{}) for p in positions) and any(x.get('field')=='canvas.sceneGraph' and x.get('status')=='Unknown' for x in e.get('unknownLedger',[])) else 1)\""
assert "cursor-interactive-element-series" "grep -q 'hover-during' '$CURSOR_RUN/source-evidence/interactive-states.ndjson'"
assert "pointer-causal-label" "grep -Eq 'pointer-caused|probably-pointer-caused|mixed' '$CURSOR_RUN/telemetry/causal-deltas.ndjson'"
assert "thorough-verification-pass" "python3 -c \"import json;d=json.load(open('$CURSOR_RUN/verification.json'));exit(0 if d['pass'] else 1)\""

note "kill test (SIGKILL mid-run)"
SCAP_ALLOW_PRIVATE=1 node "$SKILL/bin/site-capture.mjs" "http://127.0.0.1:$PORT/scroll.html" \
  --headless --level full --budget 150 --out "$OUT-kill" >/dev/null 2>&1 &
MAIN_PID=$!
sleep 10
KILL_RUN=$(find "$OUT-kill" -name pids.json 2>/dev/null | head -1)
CHROME_PIDS=$(python3 -c "import json;print(' '.join(map(str,json.load(open('$KILL_RUN'))['owned'])))" 2>/dev/null || echo "")
kill -9 $MAIN_PID 2>/dev/null
sleep 8
SURVIVORS=0
for p in $CHROME_PIDS; do kill -0 "$p" 2>/dev/null && SURVIVORS=$((SURVIVORS+1)); done
assert "killtest-zero-survivors (owned: $CHROME_PIDS)" "[ $SURVIVORS -eq 0 ]"
assert "killtest-partial-readable" "python3 -c \"import json;json.load(open('$(dirname "$KILL_RUN")/../manifest.json'))\" 2>/dev/null || python3 -c \"import json;json.load(open('$(find "$OUT-kill" -name manifest.json | head -1)'))\""
assert "killtest-watchdog-fired" "[ -f '$(dirname "$KILL_RUN")/watchdog-fired.json' ]"

note "supervisor kill test (SIGKILL the watchdog mid-run; main must still clean up)"
SCAP_ALLOW_PRIVATE=1 node "$SKILL/bin/site-capture.mjs" "http://127.0.0.1:$PORT/scroll.html" \
  --headless --level quick --budget 120 --out "$OUT-wdkill" >/dev/null 2>&1 &
MAIN2_PID=$!
sleep 8
WD_PIDS=$(find "$OUT-wdkill" -name pids.json 2>/dev/null | head -1)
WD_PID=$(python3 -c "import json;print(json.load(open('$WD_PIDS'))['watchdog'] or '')" 2>/dev/null)
[ -n "$WD_PID" ] && kill -9 "$WD_PID" 2>/dev/null
wait $MAIN2_PID
RC2=$?
CLEANUP2=$(find "$OUT-wdkill" -name cleanup.json | head -1)
assert "wdkill-run-still-exits-0" "[ $RC2 -eq 0 ]"
assert "wdkill-zero-survivors" "python3 -c \"import json;d=json.load(open('$CLEANUP2'));exit(0 if d['survivors']==[] else 1)\""

kill $HTTP_PID 2>/dev/null
note "output kept at $OUT for inspection"
[ $FAIL -eq 0 ] && echo "FIXTURE TEST PASS" || echo "FIXTURE TEST FAIL"
exit $FAIL
