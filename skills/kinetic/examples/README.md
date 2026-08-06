# Worked examples — the same shot, three ways

All three built and MEASURED from one 10s cinematic on 2026-08-06.
Artefacts and screenshots: `~/Desktop/underwater-test/`.

| | Weight | FPS | Dropped | Looks real |
|---|---|---|---|---|
| A · scrub the real frames | 5,255 kb | 59.3 | 1% | yes (it IS the footage) |
| B · rebuild procedurally (`underwater-scene.html`) | **749 kb** | 45.2 | 24.9% | **no** |
| C · hybrid (`hybrid-video-shader.html`) | 5,925 kb | **58.8** | **2.1%** | **yes** |

## The finding

Procedural code is 8x lighter and still loses. Hand-written GLSL cannot produce
photorealistic volumetric water at this budget — real light transport, depth of
field and film grain are not reproducible in 200kb of shader. B ran 45fps and
still read as a stylised demo.

**The pattern award-winning sites actually ship is the hybrid**: real footage bound
as a GPU texture with a shader on top. Several Awwwards heroes are tagged
"video + shader + filter" for exactly this reason. The footage supplies the
realism; the shader supplies the reactivity and grade a plain `<video>` cannot:
refraction displacement, chromatic aberration, wavelength-dependent depth
absorption, a filmic curve, and animated grain.

C beat B on FPS, dropped frames AND blocking time — the GPU decodes video far
more cheaply than it evaluates procedural shaders. Its only loss is weight, and
weight is the one thing that is fixable.

## Open defect on C

5.9MB transferred for a 2.6MB file — something loads the video twice. Untraced.
Fixing that plus a scrub-tuned re-encode should land C near 1.5MB.

## Perf lessons that transfer

- Move particle motion to the vertex shader. A 1,200-point JS loop with a
  per-frame buffer upload measured 33.1fps / 47.7% dropped; on the GPU it is one
  uniform write and it hit 59.9fps / 0%.
- Clamp `gl_PointSize`. Uncapped it peaked ~180px and bubbles read as bokeh snow.
- Bake procedural patterns to a seamless tile at startup and animate UVs.
  Live per-fragment Worley was 26.4fps / 97.5% dropped; baked, 45.5fps.
- Combine two scrolling copies of a line-pattern tile with `max()`, not multiply.
  The tile is thin bright lines on black, so a product is near-zero except at
  rare intersections and the structure disappears into scattered glints.
- `ACESFilmicToneMapping` + exposure is the cheapest cinematic win that exists.
- Cap `devicePixelRatio` at ~1.5.
