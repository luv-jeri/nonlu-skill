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
