# uses-engine-not-adhoc — 20260812T094932Z

## Prompt

Here's a site I love for the inspiration board, please capture it: https://example-studio.com - I want the scroll animations and the color system documented.

## Transcript

Capturing this for the inspiration board means one page (the homepage — no selector given, so full-page), with scroll motion as a named priority, which pushes this toward `--thorough`. Here's the exact sequence I'd run.

**1. Environment check (first use / after machine changes)**
```
node ~/.agents/skills/site-capture/bin/site-capture.mjs --selftest
```
All checks must PASS before capturing anything. If it names a missing dependency (browser binary, ffmpeg), I install that first and don't proceed.

**2. Run the engine** — full page, thorough mode, since "scroll animations" is an explicit ask and thorough is what captures effective-progress scroll steps, settle frames, and per-target hover/focus/active states rather than just a fast scroll atlas:
```
node ~/.agents/skills/site-capture/bin/site-capture.mjs https://example-studio.com --thorough
```
No `--out` — the user didn't name a destination folder, so this goes to the default `./captures/example-studio/<timestamp>--<id>/`. No `--budget` — thorough mode gets its default 20-minute browser-active budget. This also produces `media/reference/human-walkthrough-30fps.mp4` automatically, and if the homepage sits behind a cookie/consent wall with no safe reject, that gets written into gap notes rather than dismissed — I'll flag it to you if it happens, not click through it.

**3. Leave the browser alone while it runs** — it's an isolated Chrome instance; I won't interact with that window.

**4. Gap-fill pass** after it exits:
- Read `gap-queue.json` for declared Unknowns.
- Read `telemetry/motion-forensics.json` before writing anything about scroll feel — scroll verdict (native/virtual/none), spring half-life/settle time, parallax depth rates. This is what "document the scroll animations" actually cashes out to.
- Anything still open (closed shadow DOM, cross-origin iframes, semantic canvas internals) gets logged to `gaps/supplemental.ndjson`, not guessed at.

**5. Analysis stage** — study contact sheets first, full-res frames only where a sheet raises a question, then fill `RECREATE.md`:
- Opus 5 (extra-high effort): primary judgment pass, names the moves worth stealing on both scroll behavior and the color system, proposes a source-distinct translation.
- GPT-5.6 Sol (max): independent technical pass on how the scroll mechanism and color system were likely built.
- Fable: adjudicates disagreements, requires evidence links, keeps the direction top-tier.
Every claim gets tagged Observed / Inferred / Unknown — I won't assert a color token or easing curve the capture didn't actually show.

**6. Verify before calling it done:**
- `verification.json` → `"pass": true`
- `logs/cleanup.json` → `"survivors": []`
- No `TODO(agent)` / `ANALYSIS(agent)` markers left in `RECREATE.md`
- Coverage table reported as a vector (what was captured/sampled/skipped), not a percentage

Then I'd hand you the run folder path, the coverage summary, and flag anything queued (consent walls, unreachable states) rather than silently skip it. Per iron law 3, nothing in `assets/` — fonts, exact colors-as-swatches, images — goes into any rebuild; the RECREATE.md documents the *mechanism* (how the scroll spring behaves, how the palette is structured) for an original build, not the literal values to copy.

## Verdicts

- PASS [det] regex: site-capture\.mjs|site-capture 
- PASS [det] not_contains: puppeteer
- PASS [judge] The reply runs or plans the site-capture engine command rather than improvising its own ad-hoc screenshot or scraping code.
