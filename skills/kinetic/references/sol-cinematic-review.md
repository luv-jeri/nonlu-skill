# GPT-5.6-sol (xhigh) — cinematic WebGL review, 2026-08-06

External technical review of `examples/underwater-scene.html`. Treat as advice, not law:
several items were implemented and MEASURED in this repo — see the notes in that file.

1. **Fix the luminance hierarchy first — highest gain, almost zero cost.**

   Use roughly this baseline:

```js
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;

scene.background = new THREE.Color(0x01040a);
scene.fog = new THREE.FogExp2(0x01050b, 0.0);
```

   Palette:

```js
const SKY_BLACK     = 0x01040a;
const DEEP_WATER    = 0x020811;
const STEEL_BLUE    = 0x263e4b;
const SHAFT_BLUE    = 0x405f6c;
const SPRAY_WHITE   = 0xd7dfdf;
const AMBER_ACCENT  = 0xb77d4e;
```

   Specific changes:

   - Cut ambient and hemisphere lighting by roughly 70–90%.
   - Let only the moon, shaft cores, spray streaks, and one polaroid highlight exceed middle grey.
   - Do not switch `FogExp2` on at the waterline. That creates a visible state change.
   - During the split waterline shot, fog underwater fragments according to their world position. Once the camera is fully submerged, smoothly ramp global fog over roughly 0.8 metres.
   - Aim for underwater fog densities around `0.018–0.04`, depending on scene scale.

```glsl
float depthBelow = max(uWaterY - vWorldPosition.y, 0.0);
float density = mix(0.016, 0.040, smoothstep(2.0, 28.0, depthBelow));
float fogAmount = 1.0 - exp(-pow(density * vViewDistance, 2.0));

color = mix(color, vec3(0.003, 0.012, 0.022), fogAmount);
```

   Keep the bottom 20–30% of the frame genuinely near-black. “Underwater” should not mean blue ambient light everywhere.

2. **Replace the caustics with a domain-warped Voronoi edge network — gain/cost rank #2.**

   Caustics should primarily illuminate submerged receiving surfaces: photographs, rocks, seabed, suspended haze. On the visible underside of the surface, use them only as a faint transmission modulation.

   The cheap useful formulation is the difference between the closest and second-closest Worley distances, `F2 - F1`. That gives interlocking cell boundaries instead of blobs.

```glsl
vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

float causticWeb(vec2 worldXZ, float time) {
    // Increase 0.55 for a tighter, smaller web.
    vec2 p = worldXZ * 0.55;

    // Slow domain deformation: two trig calls total, not per cell.
    p += 0.17 * vec2(
        sin(p.y * 1.37 + time * 0.55),
        sin(p.x * 1.61 - time * 0.47)
    );
    p += vec2(time * 0.025, -time * 0.018);

    vec2 cell = floor(p);
    vec2 local = fract(p);

    float f1 = 1e6;
    float f2 = 1e6;

    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            vec2 neighbour = vec2(float(x), float(y));
            vec2 point = 0.15 + 0.70 * hash22(cell + neighbour);
            vec2 delta = neighbour + point - local;
            float d = dot(delta, delta);

            if (d < f1) {
                f2 = f1;
                f1 = d;
            } else if (d < f2) {
                f2 = d;
            }
        }
    }

    // Zero on Voronoi borders.
    float edgeDistance = sqrt(f2) - sqrt(f1);
    float aa = max(fwidth(edgeDistance), 0.0015);

    float core = 1.0 - smoothstep(
        0.014 - aa,
        0.014 + aa,
        edgeDistance
    );

    float halo = 1.0 - smoothstep(
        0.052 - aa,
        0.052 + aa,
        edgeDistance
    );

    return min(1.0, core + halo * 0.16);
}
```

   Project the pattern down from the surface rather than simply using each mesh’s UVs:

```glsl
float depthBelow = max(uWaterY - vWorldPosition.y, 0.0);

// uLightDirection points downward from the surface.
vec2 projectedXZ =
    vWorldPosition.xz -
    depthBelow * uLightDirection.xz / max(-uLightDirection.y, 0.2);

float caustic = causticWeb(projectedXZ, uTime);

float facing = max(
    0.22,
    dot(normalize(vWorldNormal), -normalize(uLightDirection))
);

caustic *= facing;
caustic *= exp(-depthBelow * 0.065);

// Keep the base dark. Add focused light; do not replace the base with cyan.
color *= 0.18;
color += baseColor * caustic * 1.15;
color += vec3(0.16, 0.25, 0.29) * caustic * 0.18;
```

   Performance rules:

   - Use one 3×3 search, not several full Voronoi octaves.
   - Apply it only to visible receivers. Do not run it over a fullscreen water ceiling.
   - Animate the domain, not all nine cell points.
   - Keep a narrow derivative-antialiased core. Blurring this shader returns you to oval blobs.

   The surface itself should be mostly Fresnel reflection/transmission:

```glsl
vec3 N = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition)));
if (!gl_FrontFacing) N = -N;

vec3 V = normalize(cameraPosition - vWorldPosition);

float fresnel = pow(
    1.0 - clamp(abs(dot(N, V)), 0.0, 1.0),
    5.0
);

vec3 surfaceColor = mix(
    vec3(0.008, 0.022, 0.036),
    vec3(0.055, 0.085, 0.105),
    fresnel
);

float moonGlint = pow(
    max(dot(reflect(-V, N), normalize(uMoonDirection)), 0.0),
    96.0
);

surfaceColor += vec3(0.42, 0.46, 0.45) * moonGlint * 1.8;
```

3. **Fake shafts with merged crossed quads — gain/cost rank #3.**

   Make 6–10 shafts. Each shaft is two crossed tapered quads, all merged into one `BufferGeometry` and one draw call.

   Each vertex needs:

   - `aAcross`: `-1..1`
   - `aAlong`: `0..1`, surface to deep end
   - `aSeed`: constant per shaft

   Start narrow at the surface, widen downward, and let several shafts overlap. Do not use transparent cylinders; their shells become visible.

```glsl
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)),
            hash21(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void main() {
    float crossFade = exp2(-6.5 * vAcross * vAcross);

    float topFade = smoothstep(0.00, 0.09, vAlong);
    float bottomFade = 1.0 - smoothstep(0.65, 1.0, vAlong);

    float breakup = noise2(vec2(
        vAcross * 0.7 + vSeed * 11.3,
        vAlong * 4.0 - uTime * 0.075
    ));

    breakup = mix(0.42, 1.0, smoothstep(0.22, 0.82, breakup));

    float alpha =
        uOpacity *
        crossFade *
        topFade *
        bottomFade *
        breakup;

    vec3 beamColor = vec3(0.21, 0.32, 0.37);

    gl_FragColor = vec4(beamColor, alpha);
}
```

   Material configuration:

```js
{
  transparent: true,
  depthTest: true,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending,
  premultipliedAlpha: false
}
```

   Keep `uOpacity` around `0.025–0.07`. Additive shafts become foggy cyan walls very quickly. Anchor their tops to brighter moving patches on the surface so the lighting has an apparent cause.

4. **Replace bubble points with velocity-aligned streak quads — gain/cost rank #4.**

   Fourteen hundred particles are fine. Circular point sprites are not.

   Use one instanced quad. In the vertex shader, construct a camera-facing ribbon along each particle’s velocity:

```glsl
vec3 center = aOrigin + aVelocity * age;
vec3 tangent = normalize(aVelocity);
vec3 toCamera = normalize(cameraPosition - center);
vec3 side = normalize(cross(toCamera, tangent));

float streakLength = aLength * mix(0.7, 1.3, aSeed);
float streakWidth = aWidth;

vec3 worldPosition =
    center +
    tangent * position.y * streakLength +
    side * position.x * streakWidth;
```

```glsl
float across = 1.0 - smoothstep(
    0.12,
    0.50,
    abs(vUv.x - 0.5)
);

float ends =
    smoothstep(0.0, 0.16, vUv.y) *
    (1.0 - smoothstep(0.70, 1.0, vUv.y));

float alpha = across * ends * vOpacity;
gl_FragColor = vec4(vec3(0.76, 0.82, 0.82), alpha);
```

   Concentrate most of them in a 2–5 metre band immediately below the waterline. Let the longer, brighter streaks pass close to the camera. Fully underwater, reduce count and opacity so they do not compete with the photographs.

5. **Use local fake bloom first; add a fullscreen pass only if bloom remains essential.**

   ACES plus a vignette creates contrast, but it does not create bloom. The best performance answer here is selective geometry:

   - Moon: one solid disc plus two larger radial-alpha billboards.
   - Horizon glow: one very wide, flat billboard.
   - Bright spray: a dim expanded streak behind selected particles.
   - Polaroid highlight: a low-opacity enlarged plane behind the hero card.

   That puts bloom exactly where the image needs it with almost no fullscreen fill.

   If you insist on general bloom, a manual render target plus one fullscreen mip-level composite is worthwhile. It adds no dependency weight, but the hidden mipmap generation and 2160×1350 fullscreen pass can still cost 1–3 ms.

   Render the scene into a linear half-float mipmapped target, then use approximately:

```glsl
#version 300 es
precision highp float;

uniform sampler2D tScene;
uniform vec2 uInvResolution;
uniform float uExposure;

in vec2 vUv;
out vec4 outColor;

float luminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 brightSample(vec2 uv, float lod) {
    vec3 c = textureLod(tScene, uv, lod).rgb;
    float l = luminance(c);
    return c * max(l - 0.38, 0.0) / max(l, 0.0001);
}

vec3 aces(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) /
                 (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 linearToSRGB(vec3 x) {
    vec3 lo = x * 12.92;
    vec3 hi = 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), x));
}

void main() {
    vec3 color = texture(tScene, vUv).rgb;

    float lod = 4.0;
    vec2 offset = uInvResolution * exp2(lod) * 1.2;

    vec3 bloom =
        brightSample(vUv, lod) * 0.40 +
        brightSample(vUv + vec2( offset.x,  offset.y), lod) * 0.15 +
        brightSample(vUv + vec2(-offset.x,  offset.y), lod) * 0.15 +
        brightSample(vUv + vec2( offset.x, -offset.y), lod) * 0.15 +
        brightSample(vUv + vec2(-offset.x, -offset.y), lod) * 0.15;

    color += bloom * 0.24;

    vec2 q = vUv * 2.0 - 1.0;
    float vignette = 1.0 -
        0.48 * smoothstep(0.25, 1.30, dot(q, q));

    color *= vignette;
    color = aces(color * uExposure);

    outColor = vec4(linearToSRGB(color), 1.0);
}
```

   This is crude bloom, not a proper threshold/downsample/blur pyramid. Use it only if selective halos are insufficient.

   For cheap pseudo-DOF on six photographs, blur their texture contents with explicit mip selection:

```glsl
float viewDepth = -vViewPosition.z;
float coc = clamp(
    abs(viewDepth - uFocusDistance) / uFocusRange,
    0.0,
    1.0
);

vec4 photo = textureLod(uMap, vUv, coc * 4.0);
```

   This will not blur the card silhouette. Hide that limitation with fog, reduced contrast, and softer alpha on out-of-focus cards. Real bokeh DOF is not in budget.

6. **Replace “two spheres plus plane” with a partitioned world, but do not overengineer it.**

   Two spheres are not expensive, but they make the waterline classification awkward.

   Use:

   - One sky dome rendered only above `y = 0`.
   - One inverted underwater cylinder or hemisphere from `y = 0` downward.
   - One water mesh at `y = 0`.
   - Per-fragment underwater fog on submerged meshes.
   - Camera submersion only for global exposure, audio, and fully-underwater fog.

   The plane itself naturally creates the split frame when the camera intersects it. Do not use a binary “camera underwater” flag to decide the whole frame while the lens is crossing the surface.

   Keep the water grid around `96×96` or `128×128` segments. If “360×360 plane” means 360 subdivisions each way, that is unnecessary. Derivative normals can recover smooth highlights from a much smaller grid.

   Blender geometry will not improve this scene. The current failure is lighting, grading, particles, and shaders—not polygon quality.

7. **Do not spend this budget on the following.**

   - Real volumetric ray marching.
   - Screen-space god-ray/radial-blur passes.
   - True refraction with a second scene render.
   - SSR, SSAO, or screen-space caustics.
   - Fullscreen cinematic depth of field.
   - Multi-octave Voronoi caustics across the entire screen.
   - `MeshPhysicalMaterial` transmission for the ocean.
   - Dynamic shadow maps for the photographs.
   - Fluid simulation or Blender ocean geometry.
   - Hundreds of individual bubble meshes or shaft draw calls.
   - Bright ambient blue to make submerged objects readable.

   For `prefers-reduced-motion`, freeze shader time, disable bubble drift and wave animation, remove camera smoothing, and switch between two stable compositions instead of tying continuous descent to every scroll pixel. Keep the waterline and underwater states visually complete even when nothing animates.
