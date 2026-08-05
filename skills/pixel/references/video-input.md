# Pixel — Video Input (screen recordings)

## Why video exists in this skill

Sections 4 and 5 of the design map (Responsive Behavior, Micro-interactions) and
audit step 4 (State Audit) ask for things a still image physically cannot show:
duration, easing, trigger, hover, focus, loading, empty. From a screenshot the only
honest answer is "Unknown — ask designer", and iron law 6 forbids inventing one.

A screen recording answers them. This reference is how to read one.

## IRON RULE — frames never enter the conversation

A 10-second clip at 30fps is 300 images. Reading them costs more than the entire
build and tells you less than one table of numbers.

- **All frame analysis happens in `scripts/motion.py`.** It prints numbers.
- **Read at most 2–3 keyframes as images**, and only ones `motion.py keyframes`
  selected for you.
- Never `ffmpeg`-dump a folder of frames and read them.
- Never describe a video by "watching" it frame by frame.

Violating this is the video equivalent of pasting a 150KB JSON blob into context.

## Detection

A video input is: a path to `.mp4`, `.mov`, `.webm`, `.gif`, or the user saying
"here's a recording / screen capture / video of the interaction".

Video ranks **above** a screenshot when both are present — it contains every frame
the screenshot has, plus time. Use the video for motion and states; still use a
provided screenshot or Figma for exact token values, because video compression
shifts colour (see Limits).

## The five commands

Run them in this order. Each one's output is small.

```bash
S="<this skill's folder>/scripts/motion.py"

python3 $S probe     <video>                  # fps, size, duration — read FIRST
python3 $S events    <video>                  # every motion event + timings
python3 $S measure   <video> --event N        # duration + easing for one event
python3 $S keyframes <video> --out <dir>      # the 2-3 frames worth looking at
python3 $S compare   <design.mp4> <build.webm> # audit: numeric, exits 1 on fail
```

`selftest` proves the maths offline and needs no video.

### 1. `probe` — read this before trusting any number

Prints fps. **Frame rate is the measurement resolution.** At 25fps one frame is
40ms, so any duration is `±40ms` and a 100ms animation is 2–3 samples. If probe
warns about a low frame rate, carry that warning into the design map rather than
quoting timings as if they were exact.

### 2. `events` — the inventory of motion

One row per animation: when it starts, how long it lasts, and which part of the
screen changed. If the count looks wrong, the recording is wrong — ask for a new
one. Do not reason about animations the tool did not find.

### 3. `measure` — duration and easing for one event

Reports the best-fitting standard easing, **the runner-up, and a confidence line**.

- `CONFIDENCE clear winner` → record that easing in the map.
- `CONFIDENCE LOW` → the top two curves are within 0.02 rms. **Record both and
  ask.** A coin-flip written down as fact is exactly iron law 6's failure mode.
- `NOTE ... saturated` → the element moved far enough to clear its own starting
  position, so the default signal pegged. Re-run with `--signal centroid` before
  believing the easing. Proven necessary: a known 700ms `linear` slide reads as
  `ease-in` on the default signal and `linear` on centroid.

### 4. `keyframes` — the only images you may open

Writes rest-before, and start/mid/end of the first three events. Open two or three.
Use them for layout and token work exactly like a screenshot.

### 5. `compare` — the interaction audit, as numbers

Record the built UI (Playwright `recordVideo`, or any screen capture), then diff it
against the design recording. Prints per-event target vs rebuild vs delta, flags an
event-count mismatch first, and exits non-zero when anything is out of tolerance
(2 frames, floor 34ms). This replaces "does the animation look smooth?" — which is
not a check, because it cannot fail.

## What a video CAN and CANNOT tell you

| Answers | Does NOT answer |
|---|---|
| Duration of each transition (±1 frame) | Exact colour values — codecs shift them |
| Easing curve, with a confidence rating | Any state never performed on camera |
| Which region changed, and when | Why a state exists, or its name |
| Order and overlap of animations | Breakpoints not resized during the recording |
| Whether a state exists at all | Whether motion respects `prefers-reduced-motion` |

## Limits — state these in the design map, do not paper over them

1. **Frame rate is a hard floor.** Sub-100ms animations need 60fps to measure.
2. **Compression shifts colour.** Never take tokens from a video when a screenshot
   or Figma is available; if the video is the ONLY input, mark every colour
   "approximate — from video, confirm with designer".
3. **A recording only proves what was performed.** If nobody hovered the button on
   camera, hover is still Unknown. It is not "absent".
4. **`prefers-reduced-motion` is invisible on video.** It stays an open question,
   always, and the built UI must honour it regardless.
5. **Easing fitting picks the nearest of 8 standard curves.** A bespoke spring or
   a custom bezier will report LOW confidence — that is the tool working, not
   failing. Escalate to the designer.

## Recording the rebuild, for `compare`

```js
const ctx = await browser.newContext({
  recordVideo: { dir: 'out/', size: { width: 1440, height: 900 } }
});
// drive the same interactions, in the same order, then:
await ctx.close();               // the file is only written on close
```

Drive the **same interactions in the same order** as the design recording, or the
event indices will not line up and `compare` will report nonsense.
