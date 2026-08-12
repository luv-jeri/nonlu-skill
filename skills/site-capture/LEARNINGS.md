# LEARNINGS - site-capture

Raw observations captured while using this skill. Any session appends here the
moment the skill errs or the user corrects it. `/skill-evolve` reads Unabsorbed,
turns real defects into skill edits (with human approval), and moves entries to
Absorbed. Entries are dated; newest first.

## Unabsorbed

### 2026-08-12 - duplicate webgl row in technology fingerprint
- **What happened:** first real capture (an award-level spirits brand site) listed webgl twice in technology.detected.
- **Expected vs actual:** one webgl row with its confidence; got a runtime-global row plus the dedicated webgl row.
- **Root-cause guess:** mergeTechnology's names loop included runtime.webgl before the explicit webgl push. Fixed same day in src/evidence.mjs (names set now excludes webgl).
- **Context:** portfolio inspiration capture, level full.


<!--
### YYYY-MM-DD - one-line title
- **What happened:**
- **Expected vs actual:**
- **Root-cause guess:**
- **Context:** task / project / anything relevant
-->

## Absorbed

<!-- moved here by /skill-evolve: "absorbed YYYY-MM-DD -> <what changed in the skill>" -->

### 2026-08-12 - browser traversal must not run inside a codex sandbox
- **What happened:** delegated the live virtual-scroll traversal to a GPT-5.6 Sol codex-exec worker; Chrome aborted with SIGABRT before navigation (the crash dialog Sanjay saw). Sol honestly recorded the failure instead of fabricating frames.
- **Expected vs actual:** expected a headless traversal inside the worker; got a hard Chrome abort because codex's seatbelt sandbox blocks Chrome from creating its own sandbox.
- **Root-cause guess:** Chrome cannot initialize its sandbox inside codex workspace-write; needs a direct (non-sandboxed) process. Confirmed by running the identical script directly via Bash (headed, --use-gl=angle) - 27 frames, 0 survivors, clean.
- **Context:** division of labor - Sol writes the report from captured evidence (works great); browser-driving (engine runs + gap-fill traversal) must be a direct process, never a codex worker. Phase B gap-fill automation should encode this. Also: headed + angle GL is more stable than headless on heavy WebGL sites.

## 2026-08-12 - recreation review round (Sanjay: "quality of these assets is really bad ... shader used is wrong")
- **Erosion-at-rest mistranslation.** The rebuild kept subtracting grain from plate alpha permanently; the CAPTURED transition shader (043-fragment.glsl) shows reveals are a growing masked window with quantized edge noise, and elements at rest are rendered clean. Expected: read the captured GLSL before writing the recreation shader. Actual: the shader was written from memory of the look. Now law 1 of "Recreation quality bar" in SKILL.md.
- **Asset resolution never checked against display size.** A "lower third" generation prompt produced a 183px-tall mountains strip that was displayed at ~600px+ - the loudest quality complaint of the review. Added `bin/asset-qa.py` gate + prompt rule (subject fills the frame).
- **Single reused texture read as tiling.** One mist band reused 8 times was visibly repeated art. Rule: 2-3 asymmetric variants + mirrored instances for anything used more than twice.
- **renderOrder from per-scene distance, not absolute z**, painted far plates of the next scene over near plates of the current one during crossfades.
- **Raycaster hits invisible meshes** when targets are passed directly to intersectObjects - a hidden beat's hover target answered ENTER from every scene.

## 2026-08-12 - report stage crashed on a 1GB telemetry file (Node string ceiling)
- **What happened:** a giant-DOM production page thorough capture completed its browser phases, then died in the report stage with `Cannot create a string longer than 0x1fffffe8 characters`. `readNdjson` slurped whole files via `readFileSync`; `telemetry/cursor-probes.ndjson` was 1.0GB (15 rows, ~200MB each - a huge-DOM page makes per-waypoint readable snapshots balloon), read four separate times.
- **Expected vs actual:** report stage should consume telemetry of any size; instead one oversized file aborted the run after ~18 minutes of good capture.
- **Fix:** chunked reader (32MB reads + StringDecoder for multibyte safety, per-line JSON parse) plus a `projectCursorRow` projection at all cursor-probes call sites - the report only uses light fields (ids, refs, statuses, sample counts), so 1.0GB on disk becomes ~171KB retained. Regression-tested against the exact failing file: 15 rows, 7s, 864MB peak heap.
- **Open observation (not fixed):** the WRITER side let one row reach ~200MB despite `compactReadableSnapshot` - on giant-DOM pages the readable-snapshot compaction is weak. If single lines ever approach the 512MB string ceiling, the writer needs a cap; watch for it on the next heavy site.

## 2026-08-12 - fixed the named slurp, missed three siblings in verify (rerun died the same death)
- **What happened:** after fixing `readNdjson`, the full rerun crashed at the SAME string ceiling in `verify()` - `all-ndjson-parseable`, the network-ledger check, and the secret scan each had their own raw `readFileSync` over unbounded run files. 20 more minutes of capture lost to a defect class I had already diagnosed.
- **Expected vs actual:** the first fix should have swept every whole-file text read in the codebase; instead it patched only the crash site the stack trace named.
- **Fix:** shared `eachFileLine` + `fileContainsPattern` (chunked, StringDecoder-safe, 8KB overlap for boundary-straddling secrets) in `util.mjs`; rewired report/evidence/network slurps. Controls: 1GB file parses (14 lines, 9.4s), secret scan 0.75s, and a planted secret straddling the 32MB chunk boundary IS detected.
- **Root-cause guess:** classic sibling blindness (the G33 lesson) - the stack trace names one path and the fix follows the trace instead of grepping the pattern.

## 2026-08-12 - verification contradicted the engine's own graceful-degradation contract
- **What happened:** a long-story production run finished cleanly (24/25 asserts green) but was stamped verification-failed because `human-walkthrough-30fps` demands `status === 'Observed'`, while on a 12-chapter wheel-driven pinned story the human-paced walkthrough can NEVER reach the end inside its hard-capped ~3-minute reserve window - the engine correctly produced a partial video labelled with `terminalReason: walkthrough-deadline` and a caveat. Two runs (exhaustive and smart-probes) produced the identical honest partial.
- **Expected vs actual:** SKILL.md says budget degradation "is correct behavior, not an error"; verification treated it as a hard failure.
- **Fix:** the assert now accepts a deadline-degraded partial WHEN the video exists at 30fps AND the degradation is honestly recorded (named reason + caveat); a missing or unlabelled video stays red (the wiring-bug case the assert exists for). Same acceptance applied to the component-walkthrough sibling.
