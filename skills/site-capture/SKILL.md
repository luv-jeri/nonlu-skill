---
name: site-capture
description: Capture a website's design, motion, timing, pointer response, and feel into an evidence folder plus a RECREATE report. Use when the user asks to capture, scan, study, or decode a site (or one page, section, or component) for design inspiration or an inspiration board; when they share a reference site whose look, scroll story, hover effects, animations, or sound need recording; or when a design session needs the mechanism behind an award-level site documented so an original version can be built without copying it. Do not use for a one-off screenshot of the user's own app, or for a Lighthouse/performance audit.
user_invocable: true
---

# site-capture - study a site like a movie, then report how it works

Driving idea: a deterministic engine captures the evidence; the agent supplies the judgment. You never hand-screenshot what the engine can capture, and you never claim what the evidence does not show.

## Iron laws

1. **The engine captures, you analyze.** Run `bin/site-capture.mjs` for all mechanical capture; hand-driving the browser for frames loses motion and hover evidence (RED baseline: every past ad-hoc capture produced static top-of-page shots only).
2. **Never bypass a login, CAPTCHA, paywall, or consent wall - queue it.** Write the blocked state into the gap notes and tell the user; those states are theirs to open.
3. **Harvested assets are evidence, never material.** Fonts, images, audio, models, shaders, and copy in `assets/` must not appear in any recreation. Steal the mechanism, never the execution.
4. **Coverage is a vector, never a percentage.** Report what was captured, what was sampled, and what was skipped, per dimension. "No audio" always means "none observed in covered states."
5. **Zero stray processes, zero secrets on disk.** After every run, confirm `logs/cleanup.json` has `"survivors": []` and `verification.json`'s secret scan passed. After a crashed run, execute `node <skill-dir>/bin/site-capture.mjs --reap <out-root>`. If the secret scan ever fails, delete that run folder and report it - never keep a capture containing credentials.

## Process

1. **First use (or after machine changes):** run `node <skill-dir>/bin/site-capture.mjs --selftest`. All checks must PASS before capturing.
2. **Run the engine** from the project that should own the capture:

   ```
     node ~/.agents/skills/site-capture/bin/site-capture.mjs <url> \
     ["css-selector"=level ...] [--level full|medium|quick] \
     [--thorough] [--smart-probes] [--out <dir>] [--headless] [--budget <seconds>]
   ```

   - One page per run. For several pages, run once per page with the level the user gave for that page (default `full`; the user may downgrade: "about = medium").
   - A quoted CSS selector target captures just that section or component.
   - Default output: `./captures/<site>/<timestamp>--<id>/`. Point `--out` at the folder the user named (for portfolio work: `portfolio/assets/inspiration/`).
   - Budgets: full 600s, medium 240s, quick 90s. The engine degrades gracefully at the cap and reports it; that is correct behavior, not an error.
   - Default mode retains the fast Phase A scroll atlas. `--thorough` is an additive slow overlay: 100–130px effective story steps; settle; six stationary frames over about 2.8s; every visible safe interactive target within the recorded caps through base/during/settled/reverse/focus/active/restored states; five section-local cursor positions; nine frame-plus-readable-data waypoints along each pointer path; pointer restoration; then a deep live style/runtime snapshot. Large controlled deltas queue native-safe 8px forensic refinement, explicitly separated from the faithful wheel track.
   - Without `--budget`, thorough mode receives a 20-minute browser-active budget and reserves finalization time. Recommend it for award sites, pinned/virtual scroll, canvas-heavy experiences, “capture everything,” and targeted component/section work. It is explicit because ordinary captures must stay practical.
   - `--smart-probes` (thorough only, opt-in) probes ONE representative per group of same-styled interactive elements (identical tag/role/class/cursor/listeners/size; label excluded) and records the clones as `SameAs` rows pointing at it. Big time saver on pages with long identical nav/index lists; default stays exhaustive because two same-styled elements CAN carry different JS behavior - coverage reports `probeMode` and `smartSkipped` so the tradeoff is always visible.
   - Every capture also produces `media/reference/human-walkthrough-30fps.mp4`: a separate Playwright `recordVideo` pass driven with slow real wheel motion, pauses, and cursor drift, normalized by ffmpeg to 30 fps. Each requested component selector gets a corresponding video under `media/components/`.
3. **While it runs, leave it alone.** It owns an isolated Chrome; interacting with that window contaminates the faithful pass.
4. **Gap-fill only declared Unknowns** after the engine exits. Read `gap-queue.json`; Phase B already captures authored/computed transition timing, keyframes, CSS/WAAPI, public GSAP/ScrollTrigger, pseudos, stagger systems, layout/SVG/3D, and—with `--thorough`—dwell/cursor/scroll-state evidence. Remaining gaps commonly include consent with no safe reject, closed/cross-origin realms, hidden runtimes, and semantic canvas/WebGL internals. Record any authorized manual findings as NDJSON lines in `gaps/supplemental.ndjson` and screenshots in `frames/gap-fill/`.
   - **Motion forensics runs automatically** and lands in `telemetry/motion-forensics.json`: scroll verdict (native / virtual / none) with the spring's fitted half-life and settle time from one wheel impulse; cursor verdict (`cursor: none`, follower elements with measured lag - lag near 0 is the exact dot, 50-250ms is the trailing ring); parallax depth rates (DOM rect factors, or optical band shifts for canvas pages). Read it before writing any motion judgment in RECREATE.md - these numbers ARE the feel.
5. **Run the Analysis stage.** Capture creates evidence; analysis creates recreation direction. Study roughly 6–12 contact sheets first and open full-resolution frames only where a sheet raises a question.
   - **Primary: Opus 5 at extra-high effort.** Use native vision to read contact sheets → key frames → data, complete the judgment sections in `RECREATE.md`, name the moves worth stealing, and propose a source-distinct translation.
   - **Technical cross-pass: GPT-5.6 Sol at max.** Independently reason about how the observed mechanisms were built. Preserve disagreements with Opus because they expose evidence gaps.
   - **Adjudicator: Fable.** Resolve the two passes, require evidence links, and keep the final direction top-tier. This is the standing FABLE-FALLBACK pattern for design analysis.
   - Every material claim remains **Observed**, **Inferred**, or **Unknown**. Coverage remains a vector, never a percentage.
6. **Verify before reporting done.** `verification.json` says `"pass": true`; coverage table matches reality; `logs/cleanup.json` shows no survivors; the report has no unfilled `TODO(agent)`.

## Done means

RECREATE.md analysis complete with cited evidence and no `ANALYSIS(agent)` markers left; `verification.json` passes; every gap is resolved or explicitly open; the 30 fps walkthrough(s), rollups, and raw evidence collections exist; zero run-owned processes survive.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Engine exits: "Executable doesn't exist" / ffmpeg fail | environment drifted | run `--selftest`, install what it names |
| Frames exist but page never moved | scroll hijacking or no credible effective-progress signal | rerun with `--thorough`; if its bounded real-wheel retries also stall, keep the range Unknown |
| First frames blank | gesture-gated intro | open the site yourself, trigger the intro, screenshot into `frames/gap-fill/` |
| Run folder present, no cleanup.json | run was killed | `--reap <out-root>`, then rerun; partial evidence remains usable |
| Site blocks the isolated browser | anti-bot | do not evade; tell the user and capture only what your own browser tools can see |

## Recreation quality bar

When a capture feeds a rebuild, these gates decide whether the result reads agency-grade or flaky. Each one was paid for on a real rebuild review.

1. **Translate the captured shaders; never invent the mechanic.** The GLSL in `source-evidence/shaders/` is the ground truth for HOW the look is made. Extract the actual constants and mechanics (time quantization step, reveal method, hover response) and port those. The observed grammar on award sites: reveals are MASKED WINDOWS that grow (with a whisper of quantized noise on the edge), and an element at rest is rendered COMPLETELY CLEAN - a rebuild that keeps eroding or graining its art at rest reads chewed and unfinished.
2. **Asset resolution is a gate, not a taste call.** Run `bin/asset-qa.py <cutout-dir> --display-height <viewport-h> --dpr <dpr>` before wiring plates into a scene; it prints each plate's maximum honest display height. Never display art beyond 1.25x its source pixels - regenerate instead. When generating art, make the subject FILL the frame (a "lower third" strip prompt wastes the canvas and comes back as a 180px-tall smear).
3. **Any texture used more than twice needs variants.** Generate 2-3 distinct asymmetric versions and mirror instances; a repeated swirl is the fastest "this is fake" tell on a full-bleed page.
4. **Cutouts: flood-fill from the border, then decontaminate.** `bin/cutout-art.py <art-dir>` flood-fills background inward (enclosed whites stay opaque), erodes the contaminated rim, feathers, and unmixes the background color out of edge pixels so plates carry no halo on any ground.
5. **Painter's order must be monotonic with absolute depth.** With `depthWrite` off, occlusion is draw order; compute `renderOrder` from world z, never from a per-scene distance - the mismatch paints far layers over near ones exactly when two scenes crossfade.
6. **Transitions flow like water:** overlapping show windows (one scene dissolves INTO the next, no gap, no cut), slow spring (virtual scroll with an exponential approach), a beat magnet that settles and HOLDS on the nearest beat when the hand goes idle, and chrome that exits fast but enters late (entry delay on the `.on` state only, or leaving beats drag their titles along).
7. **Preload to the GPU.** Upload every texture at load time (`renderer.initTexture`); a first-use upload of a large plate is a visible >1s stall mid-scroll.
8. **The scene must fill the frame.** Award pages compose full-bleed: heroes crop against the viewport edges, supports bleed off-screen, one focal point per beat, and display type announces each beat. Floating small plates in empty space is the single fastest way to look like a student demo.

## Recreation review loop (see it, judge it, iterate)

A rebuild is never called done off green code. Run the review harness against the LIVE demo:

```
node <skill-dir>/bin/recreate-review.mjs <demo-url> --capture <capture-dir> [--beats 6] [--travel-px 16000]
```

It drives the demo with real wheel glides, shoots every beat AND the mid-transitions, probes FPS (p95 over 20ms = judder finding), computes per-beat grid deltas and an emptiness score against the reference scroll frames, and writes `review/REVIEW.md` with a judgment checklist. The loop is: run -> LOOK at the pairs -> fix the worst finding -> run again, until the checklist passes. Every finding that changed the rebuild is appended to `LEARNINGS.md` (dated), and `/skill-evolve site-capture` absorbs them - that is how each site scanned makes the next one better.

## What this skill does not do

Phase B does not perform deep audio-graph forensics or comprehensive GL/WebGPU call interception (Phase C); it does not invent a canvas scene graph, crawl multiple pages, enter login-walled content, publish, or reuse captured material. Hidden GSAP, closed shadow DOM, cross-origin rule association, unsampled responsive/input states, and semantic canvas internals remain explicitly Unknown. Report synthesis is the separate tiered Analysis stage above.

## Learning capture

When this skill errs, misfires, or the user corrects it: append a dated entry to `LEARNINGS.md` in this skill's folder (what happened, expected vs actual, root-cause guess, context). Do not edit this SKILL.md mid-task. To absorb learnings, run `/skill-evolve site-capture`.
