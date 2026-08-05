#!/usr/bin/env python3
"""motion.py — measure UI motion from a screen recording.

Pixel's design map has always had a Micro-interactions table (element, trigger,
animation, duration, easing) and an Interaction Audit. Neither can be filled from
a still image, so both were permanently "Unknown — ask designer". This script is
what fills them: it reads a video and prints NUMBERS.

    probe      <video>                     video facts (fps, size, duration)
    events     <video>                     find every motion event, with timings
    measure    <video> --event N           duration + easing fit for one event
    compare    <target> <rebuild>          numeric diff of two recordings
    keyframes  <video> --out DIR           write the few frames worth LOOKING at
    selftest                               prove the maths offline

IRON RULE — never read frames into the conversation. A 10s clip at 30fps is 300
images; loading them costs more than the whole build and tells you less than the
tables below. Every subcommand prints a small table. `keyframes` writes files and
prints PATHS, never pictures. Look at 2-3 frames, never 300.
"""
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

# Analysis runs on small grayscale frames. Timing and easing do not need full
# resolution, and 480px keeps a 20s clip under a second of processing.
ANALYSIS_W = 480
MAX_FRAMES = 900          # ~30s at 30fps; longer clips get sampled down
MERGE_GAP = 3             # frames of stillness that still belong to one event
MIN_EVENT_FRAMES = 2      # a single-frame blip is noise, not an animation

# CSS named easings, plus the two Material curves that show up constantly.
EASINGS = {
    "linear":                    (0.0,  0.0,  1.0,  1.0),
    "ease":                      (0.25, 0.1,  0.25, 1.0),
    "ease-in":                   (0.42, 0.0,  1.0,  1.0),
    "ease-out":                  (0.0,  0.0,  0.58, 1.0),
    "ease-in-out":               (0.42, 0.0,  0.58, 1.0),
    "cubic-bezier(.4,0,.2,1)":   (0.4,  0.0,  0.2,  1.0),   # material standard
    "cubic-bezier(0,0,.2,1)":    (0.0,  0.0,  0.2,  1.0),   # material decelerate
    "cubic-bezier(.4,0,1,1)":    (0.4,  0.0,  1.0,  1.0),   # material accelerate
}


def die(msg):
    print(f"motion.py: {msg}", file=sys.stderr)
    sys.exit(2)


def need_ffmpeg():
    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"{tool} not found. Install it (brew install ffmpeg) or say so in "
                f"the design map — do NOT guess timings instead.")


# ---------------------------------------------------------------- video facts

def probe(video):
    need_ffmpeg()
    if not pathlib.Path(video).exists():
        die(f"no such file: {video}")
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,r_frame_rate,nb_read_frames,duration",
         "-count_frames", "-of", "json", video],
        capture_output=True, text=True)
    if out.returncode != 0:
        die(f"ffprobe failed: {out.stderr.strip()[:200]}")
    st = json.loads(out.stdout)["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    fps = float(num) / float(den or 1)
    n = int(st.get("nb_read_frames") or 0)
    dur = float(st.get("duration") or (n / fps if fps else 0))
    return {"width": int(st["width"]), "height": int(st["height"]),
            "fps": round(fps, 3), "frames": n, "duration_s": round(dur, 3)}


def extract_gray(video, fps=None):
    """Frames as a (n, h, w) float array, grayscale, ANALYSIS_W wide."""
    need_ffmpeg()
    info = probe(video)
    use_fps = fps or info["fps"]
    if info["frames"] > MAX_FRAMES:
        use_fps = use_fps * MAX_FRAMES / info["frames"]
    tmp = tempfile.mkdtemp(prefix="motion-")
    try:
        cmd = ["ffmpeg", "-v", "error", "-i", video,
               "-vf", f"fps={use_fps},scale={ANALYSIS_W}:-1", "-f", "image2",
               os.path.join(tmp, "f%05d.png")]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            die(f"ffmpeg failed: {r.stderr.strip()[:200]}")
        files = sorted(pathlib.Path(tmp).glob("f*.png"))
        if not files:
            die("no frames extracted")
        arr = np.stack([np.asarray(Image.open(f).convert("L"), dtype=np.float32)
                        for f in files])
        return arr, use_fps, info
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------------------------------------- event finding

def classify_clip(d):
    """'discrete' (UI: still frames + transitions) or 'continuous' (cinematic).

    The event finder below derives its noise floor from the MEDIAN frame-to-frame
    change, which is correct only when most frames are still. In a continuously
    moving shot — a camera flythrough, a looping background, a video hero — every
    frame differs from the last, so the median IS the motion, the threshold lands
    above it, and the tool reports "nothing moved". That is confidently wrong in
    the dangerous direction.

    Measured 2026-08-06 on two real clips:
        UI recording   76% still frames, peak/floor ratio 2.7e6
        camera flight   0% still frames, peak/floor ratio 3.6
    Six orders of magnitude apart, so the split is safe.
    """
    still = float((d < 0.35).mean())
    floor = float(np.percentile(d, 10))
    peak = float(np.percentile(d, 90))
    ratio = peak / max(floor, 1e-6)
    return "discrete" if (still >= 0.05 or ratio >= 100) else "continuous"


def find_events(gray, fps):
    """Runs of frames where the picture is changing. One run = one animation.

    Returns [] for a continuous clip BY DESIGN — there are no discrete events in
    one. Callers must check clip_kind() first and not read [] as "no motion".
    """
    if len(gray) < 3:
        return []
    d = np.abs(np.diff(gray, axis=0)).mean(axis=(1, 2))
    if classify_clip(d) == "continuous":
        return []
    # Most frames of a UI recording are dead still, so the median IS the noise
    # floor. Scaling it beats a fixed constant across codecs and compression.
    floor = float(np.median(d))
    thr = max(floor * 4.0, 0.35)
    active = d > thr

    runs, start = [], None
    for i, a in enumerate(active):
        if a and start is None:
            start = i
        elif not a and start is not None:
            runs.append([start, i - 1])
            start = None
    if start is not None:
        runs.append([start, len(active) - 1])

    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] <= MERGE_GAP:
            merged[-1][1] = r[1]
        else:
            merged.append(r)

    events = []
    for k, (s, e) in enumerate(merged):
        if e - s + 1 < MIN_EVENT_FRAMES:
            continue
        lo = merged[k - 1][1] + 2 if k else 0
        hi = merged[k + 1][0] - 1 if k + 1 < len(merged) else len(gray) - 1
        f0, f1, box = refine_bounds(gray, s, e, lo, hi, fps, thr)
        if box is None:
            # Nothing measurably changed between the endpoints. This is the
            # recorder settling (first paint, cursor blink), not a UI animation.
            continue
        events.append({
            "frame_start": f0, "frame_end": f1,
            "t_start_ms": round(1000 * f0 / fps),
            "duration_ms": round(1000 * (f1 - f0) / fps),
            "region": box,
            "peak_change": round(float(d[s:e + 1].max()), 2),
        })
    return events


def refine_bounds(gray, s, e, lo, hi, fps, thr):
    """Widen a coarse event to its true start and end.

    Coarse bounds come from FRAME-TO-FRAME change, which silently truncates any
    easing with a slow tail: at the end of an ease-out the per-frame delta drops
    under the threshold while the property is still moving, so the tail is cut —
    and a tail-less ease-out is indistinguishable from linear. Measured against a
    known 400ms ease-out (2026-08-06): coarse gave 360ms and called it "linear".
    So: pad outward into the neighbouring stillness, then cut using the CUMULATIVE
    progress curve (first frame off 0, last frame short of 1) instead.
    """
    pad = max(3, int(round(fps * 0.2)))
    f0 = max(lo, s - pad)
    f1 = min(hi, min(e + 1 + pad, len(gray) - 1))
    if f1 <= f0:
        return s, min(e + 1, len(gray) - 1), None
    box = changed_box(gray[f0], gray[f1], thr)
    if box is None:
        return f0, f1, None
    p, err = progress_curve(gray, f0, f1, box, "diff")
    if p is None:
        return s, min(e + 1, len(gray) - 1), box
    on = np.where(p >= 0.02)[0]
    off = np.where(p <= 0.98)[0]
    if not len(on) or not len(off):
        return f0, f1, box
    i0 = max(0, int(on[0]) - 1)
    i1 = min(len(p) - 1, int(off[-1]) + 1)
    # UNION with the coarse bounds, never intersection. Refinement exists to
    # recover a truncated tail, so it may only widen. For a translation the diff
    # signal pegs (the element clears its own footprint), the curve-based cut
    # lands inside the motion, and intersecting would delete most of the event —
    # measured 2026-08-06: a known 700ms slide collapsed to 200ms.
    return min(s, f0 + i0), max(min(e + 1, len(gray) - 1), f0 + i1), box


def changed_box(a, b, thr):
    """Bounding box of what differs between two frames, in ANALYSIS_W space."""
    m = np.abs(a - b) > max(thr * 3, 8)
    if not m.any():
        return None
    ys, xs = np.where(m)
    return {"x": int(xs.min()), "y": int(ys.min()),
            "w": int(xs.max() - xs.min() + 1), "h": int(ys.max() - ys.min() + 1)}


# ------------------------------------------------------- progress and easing

def progress_curve(gray, f0, f1, region=None, signal="diff"):
    """Normalised 0->1 progress of one event, one value per frame.

    signal=diff     distance from the final frame. Right for fades, colour,
                    opacity, size. SATURATES for a long translation once the
                    element clears its own starting footprint — the caller is
                    warned and should re-run with --signal centroid.
    signal=centroid centre of mass of the changed pixels. Right for movement.
    """
    sl = slice(None)
    if region:
        r = region
        sl = (slice(r["y"], r["y"] + r["h"]), slice(r["x"], r["x"] + r["w"]))
    seq = [g[sl] if region else g for g in gray[f0:f1 + 1]]
    first, last = seq[0], seq[-1]

    if signal == "centroid":
        base = np.abs(last - first) > 8
        if not base.any():
            return None, "no pixels changed in region"
        vals = []
        for g in seq:
            m = np.abs(g - first)
            w = m.sum()
            vals.append(float((m * np.arange(m.shape[1])[None, :]).sum() / w) if w > 5 else np.nan)
        v = np.array(vals, dtype=float)
        if np.isnan(v).all():
            return None, "centroid undefined"
        v = np.nan_to_num(v, nan=np.nanmin(v))
    else:
        denom = np.abs(first - last).mean()
        if denom < 0.5:
            return None, "start and end frames are identical"
        v = np.array([1.0 - np.abs(g - last).mean() / denom for g in seq])

    lo, hi = float(v.min()), float(v.max())
    if hi - lo < 1e-6:
        return None, "flat signal"
    p = (v - lo) / (hi - lo)
    if p[0] > p[-1]:
        p = 1.0 - p
    return p, None


def bezier_y(x1, y1, x2, y2, x):
    lo, hi = 0.0, 1.0
    for _ in range(40):
        s = (lo + hi) / 2
        bx = 3 * (1 - s) ** 2 * s * x1 + 3 * (1 - s) * s ** 2 * x2 + s ** 3
        if bx < x:
            lo = s
        else:
            hi = s
    s = (lo + hi) / 2
    return 3 * (1 - s) ** 2 * s * y1 + 3 * (1 - s) * s ** 2 * y2 + s ** 3


def fit_easing(p):
    """Nearest standard easing, by RMS error, with the runner-up for honesty."""
    n = len(p)
    if n < 4:
        return [("too-few-frames", 9.99)]
    t = np.linspace(0, 1, n)
    scored = []
    for name, (x1, y1, x2, y2) in EASINGS.items():
        model = np.array([bezier_y(x1, y1, x2, y2, ti) for ti in t])
        scored.append((name, float(np.sqrt(((p - model) ** 2).mean()))))
    scored.sort(key=lambda kv: kv[1])
    return scored


def saturated(p):
    """True when the diff signal pegged — easing from it would be a lie."""
    return bool((p > 0.98).mean() > 0.25 or (p < 0.02).mean() > 0.25)


# ------------------------------------------------------------- subcommands

def cmd_probe(a):
    info = probe(a.video)
    print(f"{'size':12s} {info['width']}x{info['height']}")
    print(f"{'fps':12s} {info['fps']}")
    print(f"{'frames':12s} {info['frames']}")
    print(f"{'duration':12s} {info['duration_s']}s")
    if info["fps"] < 24:
        print(f"\nWARNING: {info['fps']}fps gives {round(1000/info['fps'])}ms "
              f"resolution. Durations under ~100ms cannot be measured reliably.")


def cmd_events(a):
    gray, fps, info = extract_gray(a.video, a.fps)
    d = np.abs(np.diff(gray, axis=0)).mean(axis=(1, 2))
    kind = classify_clip(d)
    ev = find_events(gray, fps)
    sx = info["width"] / gray.shape[2]
    print(f"{info['width']}x{info['height']} @ {fps:.1f}fps   clip type: {kind.upper()}")
    if kind == "continuous":
        print(f"\nThis is a CONTINUOUSLY MOVING shot — {100*(d < 0.35).mean():.0f}% still "
              f"frames. It has no discrete UI transitions to time, so the event\n"
              f"table does not apply. Run instead:\n\n"
              f"    motion.py camera {a.video}\n\n"
              f"and read references/video-input.md 'Continuous shots' before building.")
        return
    print(f"->  {len(ev)} motion event(s)\n")
    if not ev:
        print("Nothing moved. If you expected motion, the recording may have "
              "missed it — re-record, do not assume the animation is absent.")
        return
    print(f"{'#':>2}  {'starts':>8}  {'lasts':>8}  {'changed region (source px)':<30}")
    print("-" * 62)
    for i, e in enumerate(ev):
        r = e["region"]
        reg = (f"x{round(r['x']*sx)} y{round(r['y']*sx)} "
               f"{round(r['w']*sx)}x{round(r['h']*sx)}") if r else "(none)"
        print(f"{i:>2}  {e['t_start_ms']:>7}ms  {e['duration_ms']:>7}ms  {reg:<30}")
    print(f"\nNext: motion.py measure {a.video} --event <#>")


def cmd_measure(a):
    gray, fps, info = extract_gray(a.video, a.fps)
    ev = find_events(gray, fps)
    if not ev:
        die("no motion events found")
    if a.event >= len(ev):
        die(f"event {a.event} out of range (found {len(ev)})")
    e = ev[a.event]
    p, err = progress_curve(gray, e["frame_start"], e["frame_end"],
                            e["region"], a.signal)
    sx = info["width"] / gray.shape[2]
    r = e["region"]
    print(f"event {a.event}")
    print(f"  starts at     {e['t_start_ms']}ms")
    print(f"  duration      {e['duration_ms']}ms   "
          f"(+/- {round(1000/fps)}ms, one frame at {fps:.0f}fps)")
    if r:
        print(f"  region        x{round(r['x']*sx)} y{round(r['y']*sx)} "
              f"{round(r['w']*sx)}x{round(r['h']*sx)} source px")
    if err:
        print(f"  easing        UNMEASURABLE ({err})")
        return
    if a.signal == "diff" and saturated(p):
        print("  NOTE          diff signal saturated — likely a translation. "
              "Re-run with --signal centroid before trusting the easing.")
    ranked = fit_easing(p)
    best, second = ranked[0], ranked[1]
    print(f"  easing        {best[0]}   (rms {best[1]:.3f})")
    print(f"  runner-up     {second[0]}   (rms {second[1]:.3f})")
    if second[1] - best[1] < 0.02:
        print("  CONFIDENCE    LOW — top two are within 0.02. Report both to the "
              "designer rather than picking one.")
    else:
        print("  CONFIDENCE    clear winner")
    print(f"  samples       {len(p)} frames")


def cmd_compare(a):
    ga, fa, ia = extract_gray(a.target, a.fps)
    gb, fb, ib = extract_gray(a.rebuild, a.fps)
    ea, eb = find_events(ga, fa), find_events(gb, fb)
    print(f"target  : {len(ea)} event(s)  @ {fa:.0f}fps")
    print(f"rebuild : {len(eb)} event(s)  @ {fb:.0f}fps\n")
    if len(ea) != len(eb):
        print(f"MISMATCH: {len(ea)} events in the design, {len(eb)} in the build. "
              f"An animation is missing or extra — fix that before timings.\n")
    print(f"{'#':>2}  {'target':>9}  {'rebuild':>9}  {'delta':>8}   verdict")
    print("-" * 52)
    worst, n = 0, min(len(ea), len(eb))
    for i in range(n):
        ta, tb = ea[i]["duration_ms"], eb[i]["duration_ms"]
        d = tb - ta
        worst = max(worst, abs(d))
        tol = max(round(2000 / min(fa, fb)), 34)   # 2 frames, floor of ~34ms
        print(f"{i:>2}  {ta:>8}ms  {tb:>8}ms  {d:>+7}ms   "
              f"{'ok' if abs(d) <= tol else 'OFF'}")
    print(f"\nworst duration delta: {worst}ms")
    sys.exit(0 if (len(ea) == len(eb) and worst <= max(round(2000/min(fa, fb)), 34)) else 1)


def dominant_motion(a_frame, b_frame):
    """Is the camera pushing IN, or panning? Residual after each candidate move.

    Deliberately crude — three hypotheses, whichever leaves the least residual
    wins. Enough to answer "what kind of camera move is this", which is what you
    need to rebuild it. Not optical flow, and does not claim to be.
    """
    h, w = a_frame.shape
    cy, cx = h // 2, w // 2
    m = 12  # margin so shifted comparisons stay in bounds
    base = a_frame[m:h - m, m:w - m]
    trials = {"static": float(np.abs(base - b_frame[m:h - m, m:w - m]).mean())}
    for name, dy, dx in [("pan-left", 0, -4), ("pan-right", 0, 4),
                         ("tilt-up", -4, 0), ("tilt-down", 4, 0)]:
        shifted = b_frame[m + dy:h - m + dy, m + dx:w - m + dx]
        trials[name] = float(np.abs(base - shifted).mean())
    # push-in: crop b's centre and rescale to compare against a
    z = 0.96
    zh, zw = int(h * z), int(w * z)
    y0, x0 = (h - zh) // 2, (w - zw) // 2
    crop = b_frame[y0:y0 + zh, x0:x0 + zw]
    im = Image.fromarray(crop.astype(np.uint8)).resize((w, h))
    trials["push-in"] = float(np.abs(base - np.asarray(im, dtype=np.float32)[m:h - m, m:w - m]).mean())
    best = min(trials, key=trials.get)
    return best, trials


def cmd_camera(a):
    """Describe a continuously-moving shot well enough to rebuild it."""
    gray, fps, info = extract_gray(a.video, a.fps)
    d = np.abs(np.diff(gray, axis=0)).mean(axis=(1, 2))
    kind = classify_clip(d)
    n = len(gray)
    dur = n / fps
    print(f"{info['width']}x{info['height']} @ {fps:.1f}fps   {dur:.2f}s   "
          f"{n} frames   clip type: {kind.upper()}")
    if kind == "discrete":
        print("\nThis clip has still frames and discrete transitions — use "
              "`motion.py events` instead.")
        return

    # Velocity profile: is the move constant, or does it ease?
    seg = 8
    chunks = np.array_split(d, seg)
    speeds = [float(c.mean()) for c in chunks]
    mx = max(speeds) or 1.0
    print("\nCAMERA SPEED over the shot (bar = relative rate of change)")
    for i, s in enumerate(speeds):
        t0, t1 = i * dur / seg, (i + 1) * dur / seg
        print(f"  {t0:5.2f}-{t1:5.2f}s  {'#' * max(1, round(28 * s / mx)):<28} {s:6.2f}")
    first, last = speeds[0], speeds[-1]
    spread = (max(speeds) - min(speeds)) / mx
    if spread < 0.18:
        verdict = "CONSTANT — linear scrub. No easing to reproduce."
    elif last < first * 0.75:
        verdict = "DECELERATING — ease-out. Camera settles at the end."
    elif first < last * 0.75:
        verdict = "ACCELERATING — ease-in. Camera builds speed."
    else:
        verdict = "VARIABLE — speed changes mid-shot; scrub, do not re-time."
    print(f"\n  verdict: {verdict}")

    # What kind of move?
    votes = {}
    for i in range(0, n - 1, max(1, n // 12)):
        b, _ = dominant_motion(gray[i], gray[i + 1])
        votes[b] = votes.get(b, 0) + 1
    order = sorted(votes.items(), key=lambda kv: -kv[1])
    print(f"\nDOMINANT MOVE: {order[0][0]}   (votes: "
          f"{', '.join(f'{k} {v}' for k, v in order)})")

    # Does it loop? Compare the last frame to the first.
    seam = float(np.abs(gray[-1] - gray[0]).mean())
    mid = float(np.abs(gray[n // 2] - gray[0]).mean()) or 1.0
    print(f"\nLOOP SEAM: last-vs-first difference {seam:.2f} "
          f"(mid-vs-first {mid:.2f}, ratio {seam/mid:.2f})")
    print("  " + ("loops cleanly — safe to repeat seamlessly" if seam < mid * 0.35
                  else "does NOT loop — a repeat will visibly jump. Fade, "
                       "ping-pong, or end the scroll here."))

    print(f"\nBUDGET REALITY")
    sz = pathlib.Path(a.video).stat().st_size / 1024
    print(f"  this file            {sz:>8.0f} kb")
    print(f"  a 60fps code rebuild {'':>8}   typically 20-80 kb")
    print(f"  frame sequence @ 1x  {'':>8}   ~{n * 45:>6} kb as webp stills")
    print("\n  Shipping the video is the fast build and the slow page. Read "
          "references/video-input.md 'Continuous shots' for the trade.")


def cmd_keyframes(a):
    """Write the handful of frames worth looking at. Prints paths, not images."""
    need_ffmpeg()
    gray, fps, info = extract_gray(a.video, a.fps)
    ev = find_events(gray, fps)
    out = pathlib.Path(a.out).expanduser()
    out.mkdir(parents=True, exist_ok=True)
    picks = [("rest-before", 0)]
    for i, e in enumerate(ev[:3]):
        mid = (e["frame_start"] + e["frame_end"]) // 2
        picks += [(f"event{i}-start", e["frame_start"]),
                  (f"event{i}-mid", mid),
                  (f"event{i}-end", e["frame_end"])]
    picks.append(("rest-after", len(gray) - 1))
    written = []
    for name, idx in picks:
        t = idx / fps
        p = out / f"{name}.png"
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}",
                            "-i", a.video, "-frames:v", "1", str(p)],
                           capture_output=True, text=True)
        if r.returncode == 0 and p.exists():
            written.append(str(p))
    print(f"{len(written)} keyframe(s) written to {out}")
    for w in written:
        print(f"  {w}")
    print("\nOpen at most 2-3 of these. Never read every frame of a video.")


def cmd_selftest(_):
    """Proves the maths without touching ffmpeg or any video file."""
    fails = []

    # 1. every easing must fit ITSELF best
    for name, (x1, y1, x2, y2) in EASINGS.items():
        t = np.linspace(0, 1, 30)
        p = np.array([bezier_y(x1, y1, x2, y2, ti) for ti in t])
        got = fit_easing(p)[0][0]
        if got != name:
            fails.append(f"{name} identified as {got}")

    # 2. the fitter must TELL THEM APART, not just match itself
    t = np.linspace(0, 1, 30)
    lin = np.array([bezier_y(*EASINGS["linear"], ti) for ti in t])
    eout = np.array([bezier_y(*EASINGS["ease-out"], ti) for ti in t])
    if np.sqrt(((lin - eout) ** 2).mean()) < 0.05:
        fails.append("linear and ease-out are indistinguishable — fitter is useless")

    # 3. saturation detector
    if not saturated(np.array([0.0] * 10 + list(np.linspace(0, 1, 10)) + [1.0] * 10)):
        fails.append("saturation not detected on a pegged signal")
    if saturated(np.linspace(0, 1, 30)):
        fails.append("clean ramp wrongly reported as saturated")

    # 4. event finder on a synthetic clip: still, 10-frame move, still
    g = np.zeros((40, 40, 60), dtype=np.float32)
    for i in range(40):
        pos = 5 if i < 15 else (45 if i > 24 else 5 + 4 * (i - 15))
        g[i, 10:30, pos:pos + 10] = 255.0
    ev = find_events(g, 30.0)
    if len(ev) != 1:
        fails.append(f"event finder found {len(ev)} events in a 1-event clip")
    elif not (8 <= ev[0]["frame_end"] - ev[0]["frame_start"] <= 12):
        fails.append(f"event span {ev[0]['frame_end']-ev[0]['frame_start']} frames, expected ~10")

    # 5. a still clip must yield ZERO events (a check that cannot fail is not a check)
    if find_events(np.full((30, 40, 60), 120.0, dtype=np.float32), 30.0):
        fails.append("found motion in a completely static clip")

    # 6. clip classifier: it must tell a UI recording from a cinematic shot.
    #    Regression guard for the 2026-08-06 defect where a 10s camera flythrough
    #    was reported as "nothing moved".
    ui = np.array([0.0] * 80 + [3.0] * 12 + [0.0] * 60)          # still, burst, still
    cine = np.linspace(8.0, 14.0, 150) + np.random.default_rng(7).normal(0, .4, 150)
    if classify_clip(ui) != "discrete":
        fails.append("UI-style diff signal misread as continuous")
    if classify_clip(cine) != "continuous":
        fails.append("continuous camera motion misread as discrete — the exact "
                     "2026-08-06 'nothing moved' bug")
    if find_events(np.stack([np.full((30, 40), 40.0 + 3 * i, dtype=np.float32)
                             for i in range(40)]), 24.0):
        fails.append("continuous clip produced discrete events")

    if fails:
        print("SELFTEST FAILED")
        for f in fails:
            print(f"  - {f}")
        sys.exit(1)
    print(f"ALL GREEN — {len(EASINGS)} easings identified, distinguishable, "
          f"saturation caught, event finder correct on moving and static clips")


def main():
    ap = argparse.ArgumentParser(prog="motion.py", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("probe"); p.add_argument("video"); p.set_defaults(fn=cmd_probe)
    p = sub.add_parser("events"); p.add_argument("video")
    p.add_argument("--fps", type=float); p.set_defaults(fn=cmd_events)
    p = sub.add_parser("measure"); p.add_argument("video")
    p.add_argument("--event", type=int, default=0)
    p.add_argument("--fps", type=float)
    p.add_argument("--signal", choices=["diff", "centroid"], default="diff")
    p.set_defaults(fn=cmd_measure)
    p = sub.add_parser("compare"); p.add_argument("target"); p.add_argument("rebuild")
    p.add_argument("--fps", type=float); p.set_defaults(fn=cmd_compare)
    p = sub.add_parser("camera"); p.add_argument("video")
    p.add_argument("--fps", type=float); p.set_defaults(fn=cmd_camera)
    p = sub.add_parser("keyframes"); p.add_argument("video")
    p.add_argument("--out", required=True); p.add_argument("--fps", type=float)
    p.set_defaults(fn=cmd_keyframes)
    p = sub.add_parser("selftest"); p.set_defaults(fn=cmd_selftest)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
