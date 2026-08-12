#!/usr/bin/env python3
"""Asset QA gate for recreation art. Run BEFORE wiring plates into a scene.

Born from a real failure: a mountain range was generated as a "lower third"
strip, auto-trimmed to 183px tall, then displayed near full-screen - pure
mush, and the single loudest quality complaint on the whole demo. This gate
makes that class of mistake visible before it costs a review round.

Usage:
  asset-qa.py <cutout-dir> [--display-height 900] [--dpr 1.5]

Checks per PNG:
  RESOLUTION - the largest on-screen height (in CSS px at the given DPR) this
    plate can support before it upscales past 1.25x. Anything that will be
    shown taller than that number is a regeneration, not a scale-up.
  HALO - mean alpha-edge luminance vs interior luminance. A bright rim means
    the cutout still carries background contamination (unmix it).
  COVERAGE - fraction of the bounding box that is opaque. Below ~15% the
    generation wasted its canvas (subject too small in frame; regenerate with
    the subject filling the frame).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

args = sys.argv[1:]
if not args:
    sys.exit("usage: asset-qa.py <cutout-dir> [--display-height 900] [--dpr 1.5]")
src = Path(args[0])
display_h = int(args[args.index("--display-height") + 1]) if "--display-height" in args else 900
dpr = float(args[args.index("--dpr") + 1]) if "--dpr" in args else 1.5

UPSCALE_LIMIT = 1.25

rows = []
for p in sorted(src.glob("*.png")):
    if p.name.startswith("_"):
        continue
    im = Image.open(p).convert("RGBA")
    a = np.asarray(im)[..., 3].astype(np.float32) / 255.0
    rgb = np.asarray(im)[..., :3].astype(np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    solid = a > 0.9
    edge = (a > 0.05) & (a < 0.9)
    interior_lum = float(lum[solid].mean()) if solid.any() else 0.0
    edge_lum = float(lum[edge].mean()) if edge.any() else interior_lum
    halo = edge_lum - interior_lum
    coverage = float(solid.mean())

    # max CSS-px display height before the texture upscales past the limit
    max_css_h = int(im.height * UPSCALE_LIMIT / dpr)
    verdicts = []
    if max_css_h < display_h * 0.5:
        verdicts.append(f"LOW-RES: supports only {max_css_h}px of a {display_h}px viewport")
    if halo > 55:
        verdicts.append(f"HALO: edge is {halo:.0f} luma brighter than interior (unmix the matte)")
    if coverage < 0.15:
        verdicts.append(f"SPARSE: subject covers {coverage * 100:.0f}% of its box (regenerate larger in frame)")
    rows.append((p.name, im.width, im.height, max_css_h, halo, verdicts))

warned = 0
for name, w, h, max_css_h, halo, verdicts in rows:
    flag = " !! " if verdicts else "    "
    print(f"{flag}{name:28s} {w:5d}x{h:<5d} max-display {max_css_h:4d}px  edge-halo {halo:+5.0f}")
    for v in verdicts:
        warned += 1
        print(f"        - {v}")
print(f"\n{len(rows)} plates checked, {warned} warning(s). "
      f"(display height {display_h}px at DPR {dpr}, upscale limit {UPSCALE_LIMIT}x)")
sys.exit(1 if warned else 0)
