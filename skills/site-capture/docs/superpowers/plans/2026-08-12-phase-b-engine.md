# Phase B Site-Capture Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add state-aware motion evidence, thorough dwell/cursor traversal, hierarchical rollups, and human walkthrough video without changing the default Phase A path.

**Architecture:** Keep `collectPageEvidence()` as the initial in-page inventory, expand it into explicit Phase B collections, and expose `snapshotDeepState()`/`snapshotRuntimeMotion()` for thorough stops. Keep the current `scrollAtlas()` body as the non-thorough branch; a separate atomic-stop controller owns all slow behavior. Build compact evidence rollups after browser closure while raw state series stay in NDJSON.

**Tech Stack:** Node.js ESM, pinned Playwright 1.57, pngjs 7, external ffmpeg, shell fixture harness.

## Global Constraints

- Do not launch a browser in the implementation sandbox; Fable runs browser acceptance.
- Add no npm dependencies and create no commits.
- Preserve default `--level` behavior; activate the new controller only with `--thorough`.
- Preserve secret redaction, fail-closed verification, and zero run-owned survivors.
- Canvas/WebGL internals remain Unknown unless a public runtime exposes them.
- Coverage is a vector, never a percentage; material evidence is Observed, Inferred, or Unknown.

---

### Task 1: Fixture Contracts and Pure Helper Tests

**Files:**
- Create: `tests/evidence-unit-test.mjs`
- Create: `tests/fixtures/transitions.html`, `keyframes.html`, `gsap.html`, `threeD.html`, `stagger.html`, `bg-motion.html`, `cursor-parallax.html`
- Modify: `tests/run-fixture-test.sh`

**Interfaces:**
- Consumes: existing CLI fixture output.
- Produces: literal assertions for transition tracks, easing parsing, keyframes, GSAP/ScrollTrigger, pseudos, 3D, layout/SVG/stagger, technology, and thorough atomic-stop records.

- [ ] Write fixtures and assertions before implementation.
- [ ] Run `node tests/evidence-unit-test.mjs`; expect failure because helper exports do not exist.
- [ ] Run only `bash -n tests/run-fixture-test.sh`; browser execution is delegated to Fable.

### Task 2: Phase B Evidence Extractors

**Files:**
- Modify: `src/evidence.mjs`

**Interfaces:**
- Produces: `DEEP_PROPS`, `splitCssList(value)`, `resolveCssEasing(token)`, in-page `walkCssRules`, `extractTransitions`, `extractKeyframes`, `extractRuntimeAnimations`, `extractPseudo`, `extractGsap`, `extractScrollTriggers`, `detectStagger`, `extractLayout`, `extractSvgPaint`, `extractTransform3D`, `extractTransformAncestorChain`, `snapshotElementState`, `snapshotDeepState`, and `snapshotRuntimeMotion`.

- [ ] Implement pure CSS list/time/easing normalization and make the unit test green.
- [ ] Expand computed snapshots with supported/value wrappers and stable element/component/section IDs.
- [ ] Add static CSS, runtime motion, pseudo, stagger, layout/SVG/3D extractors with scoped Unknown records.
- [ ] Expand technology runtime/resource signals while preserving confidence scoring and honest `custom-webgl-engine` fallback.
- [ ] Run `node --check src/evidence.mjs` and the pure unit test.

### Task 3: Additive Thorough Scroll Controller

**Files:**
- Modify: `src/scroll.mjs`
- Create: `src/visual-diff.mjs`

**Interfaces:**
- Consumes: `snapshotDeepState(page, options)` and `snapshotRuntimeMotion(page, options)`.
- Produces: atomic stop records with settle, six dwell samples, five cursor terminal records, 8–10 sampled waypoints per cursor path, restore, deep snapshot, and causal deltas.

- [ ] Leave the current `scrollAtlas()` branch unchanged when `opts.thorough !== true`.
- [ ] Implement content hashing/diff summaries and autonomous masks without causal overclaiming.
- [ ] Implement small real-wheel steps, stationary sampling, path waypoint frame+data sampling, scroll-state capture, and atomic NDJSON records.
- [ ] Run syntax checks for both modules.

### Task 4: Orchestration, Rollups, Video, and Verification

**Files:**
- Modify: `src/run.mjs`, `src/report.mjs`, `templates/RECREATE.template.md`

**Interfaces:**
- Consumes: initial evidence collections and thorough stop output.
- Produces: source-evidence collections, element/component/section/site rollups, expanded coverage vector, 30 fps walkthrough MP4(s), and thorough completion checks.

- [ ] Persist raw evidence collections and wire per-stop extraction.
- [ ] Build element, component, section, and site rollups without filling missing evidence by analogy.
- [ ] Record a separate human-paced walkthrough context, normalize WebM to 30 fps MP4 with owned ffmpeg, and support targeted component videos.
- [ ] Extend evidence/report/template and make verification reject incomplete complete-stops and missing walkthrough deliverables.
- [ ] Re-run syntax and pure tests.

### Task 5: CLI and Skill Documentation

**Files:**
- Modify: `bin/site-capture.mjs`, `SKILL.md`

**Interfaces:**
- Produces: `--thorough` parsing/profile and documented Opus 5 xhigh → Sol max → Fable analysis stage.

- [ ] Add `--thorough` without changing `--level` defaults.
- [ ] Document thorough cadence, generous capture, walkthrough deliverables, Unknown boundary, and analysis roles.
- [ ] Run syntax checks for every edited `.mjs` and `bash -n` for the fixture harness.

### Task 6: Diff Review and Handoff

**Files:** all changed files.

- [ ] Inspect all modifications for standards and Phase B spec compliance.
- [ ] Run `node --check` over every `.mjs`, pure unit tests, shell syntax, and non-browser CLI help checks.
- [ ] Confirm no browser was launched and no commit was created.
- [ ] Hand Fable the exact normal fixture, thorough fixture, forced-cap/interruption, video/ffprobe, secret scan, and process-cleanup acceptance list.
