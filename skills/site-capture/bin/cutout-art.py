#!/usr/bin/env python3
"""Turn the flat-white woodcut plates into real alpha cutouts.

Blend modes tinted the engravings red when they sat on the red flood, so the
plates need an honest alpha channel instead: the same plate can then sit on
cream OR on red without losing its light values.

Method: flood-fill the background inward from the image border, rather than
thresholding on brightness. A brightness threshold also eats the white GAPS
between hatching lines inside an object, which made the stone arch and the
altar go see-through and speckle red. Only paper that is actually connected to
the outside is background; every enclosed white stays opaque.

Edge quality (added after the halo review): the raw cut leaves two artifacts -
a bright rim of half-background pixels, and dark antialiased fringe that reads
as a sticker outline once the plate sits on a coloured ground. Fix is the
standard matte treatment: erode the mask by one pixel to drop the contaminated
rim, then feather, then UNMIX the white background out of every semi-
transparent edge pixel (c' = (c - (1-a)*white) / a) so the fringe carries the
art's own colour instead of a white-grey halo.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import binary_erosion, binary_fill_holes, label

SRC = Path(sys.argv[1])
DST = SRC / "cutout"
DST.mkdir(exist_ok=True)

PAPER_AT = 236   # at or above this luminance a pixel may be background
FEATHER = 0.8    # px, softens the cut edge so hatching does not alias
ERODE = 1        # px of contaminated rim dropped before feathering


def cutout(path: Path) -> tuple[int, int]:
    im = Image.open(path).convert("RGB")
    lum = np.asarray(im.convert("L"), dtype=np.uint8)

    paper = lum >= PAPER_AT

    # label connected paper regions; anything touching the border is outside
    lab, n = label(paper)
    if n:
        border = np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]])
        outside_ids = set(np.unique(border)) - {0}
        background = np.isin(lab, list(outside_ids)) if outside_ids else np.zeros_like(paper)
    else:
        background = np.zeros_like(paper)

    subject = binary_fill_holes(~background)
    if ERODE:
        subject = binary_erosion(subject, iterations=ERODE, border_value=1)
    alpha_im = Image.fromarray((subject * 255).astype(np.uint8), mode="L")
    alpha_im = alpha_im.filter(ImageFilter.GaussianBlur(FEATHER))

    # unmix the white paper out of semi-transparent edge pixels
    rgb = np.asarray(im, dtype=np.float32)
    a = np.asarray(alpha_im, dtype=np.float32)[..., None] / 255.0
    edge = (a > 0.02) & (a < 0.999)
    unmixed = np.clip((rgb - (1.0 - a) * 255.0) / np.maximum(a, 1e-3), 0, 255)
    rgb = np.where(edge, unmixed, rgb)

    out = Image.fromarray(rgb.astype(np.uint8), mode="RGB")
    out.putalpha(alpha_im)
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(DST / path.name, optimize=True)
    return out.size


if __name__ == "__main__":
    plates = [p for p in sorted(SRC.glob("*.png")) if not p.name.startswith(("blender-", "_"))]
    for p in plates:
        w, h = cutout(p)
        print(f"{p.name:24s} -> cutout/{p.name}  {w}x{h}")
    print(f"\n{len(plates)} plates cut out into {DST}")
