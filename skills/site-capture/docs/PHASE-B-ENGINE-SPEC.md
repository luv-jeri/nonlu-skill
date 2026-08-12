# Phase B Engine Specification — Slow, State-Aware, Motion-Complete Capture

**Status:** implementation-ready specification for Fable. No implementation is contained in this document.

**Goal:** close the ten confirmed Phase A evidence gaps and replace fast, top-of-page-biased scrolling with a bounded dwell-and-watch forensic pass that observes scroll-, time-, and pointer-caused behavior separately.

**Architecture:** keep the approved two-track model. The faithful pass remains a minimally interfered-with, continuously recorded experience. The forensic pass performs read-only CSS/animation/runtime extraction and, in `--thorough` mode, advances through small measured story steps, settles, watches while stationary, probes the pointer, and snapshots live element state. The two tracks cross-reference evidence but never silently substitute one for the other.

**Runtime:** Node.js, the skill's pinned Playwright package, headed system Chrome, and the existing `src/evidence.mjs`, `src/scroll.mjs`, `src/network.mjs`, and `src/report.mjs`. Browser-driving and browser tests must run as a direct host process; they must not run inside a Codex sandboxed worker, which is known to abort Chrome.

## 1. Binding constraints

1. Coverage remains a vector, never a percentage.
2. Every material field or derived claim is `Observed`, `Inferred`, or `Unknown`, with acquisition method and evidence links.
3. Authored CSS, live computed CSS, runtime animation state, and perceived pixels are separate evidence layers.
4. `document.getAnimations()` covers CSS/WAAPI, not GSAP. GSAP and ScrollTrigger extraction is guarded, read-only, and best effort.
5. Fast discovery never becomes the only evidence for a target requested at thorough depth.
6. A WebGL/canvas is a rendered surface, not a DOM subtree. Phase B records frames, timing, cursor/scroll response, canvas/context facts, and already-observed network assets. Runtime shader capture is a compatible forensic hook, but a scene graph, camera, material graph, or object identity stays Unknown unless explicitly exposed.
7. Cross-origin `cssRules` failure is recorded. Sanitized network CSS can preserve authored text, but rule activation and element association are not fabricated.
8. The engine never installs at capture time, never bypasses access controls, never executes harvested assets, never stores credentials, and never touches the user's Chrome.
9. Phase B changes are additive to the approved output schema. Existing consumers may ignore new collections.
10. On any cap, finish the current stop atomically, write its terminal status, then degrade or stop optional work. Never leave a stop looking complete when dwell, pointer, or deep-state phases were skipped.

## 2. Phase B file map

| File | Responsibility after Phase B |
|---|---|
| `bin/site-capture.mjs` | Parse `--thorough`, resolve mode-specific caps/budget, place the resolved profile in `manifest.json`, and invoke the faithful then forensic tracks. |
| `src/evidence.mjs` | Own CSSOM traversal, targeted computed-style snapshots, pseudo-elements, transition/keyframe/WAAPI extraction, guarded GSAP/ScrollTrigger introspection, stagger detection, layout/3D evidence, stable element references, and per-state deltas. |
| `src/scroll.mjs` | Detect/drive the effective scroll owner, orchestrate stop → settle → stationary dwell → cursor grid → restored deep snapshot, refine changed windows, and emit causal records. |
| `src/visual-diff.mjs` **(new)** | Compute deterministic screenshot hashes, changed-pixel/tile regions, autonomous masks, phase-aware comparisons, and bounded diagnostic summaries without making causal claims itself. |
| `src/network.mjs` | Ensure sanitized stylesheet/SVG/model/texture bodies and provenance are addressable by hash; provide cross-origin stylesheet bodies to the authored-rule fallback without executing them. |
| `src/report.mjs` | Build per-element, component, section, and site rollups; emit the new coverage dimensions and Unknown ledger; link all claims back to state/frame/runtime evidence. |
| `tests/fixtures/*` | Deterministic local pages for each extractor and causal classifier. No public site is an automated oracle. |

## 3. Ten-gap closure matrix

The function names below are the Phase B interfaces to add. They are intentionally explicit so later tasks do not invent competing names.

| # | Confirmed gap | Exact code change | Required evidence/proof |
|---|---|---|---|
| 1 | No per-element transition timing/easing | In `src/evidence.mjs`, replace the 18-property set with `DEEP_PROPS`; add `splitCssList()`, `resolveCssEasing()`, `normalizeTransitionTracks()`, and `extractTransitions(element, computed, matchedRules)`. Call it from `snapshotElementState()`. In `src/report.mjs`, add `rollupTransitionVocabulary()`. | Each state stores original computed lists, accessible authored declarations, normalized per-property duration/delay tracks, original easing token, and resolved curve/type. Hover/focus/active fixture proves before/during/settled/reverse behavior. |
| 2 | No per-element CSS animation timing | Add all `animation-*` longhands to `DEEP_PROPS`; add `extractCssAnimationStyle()` and expand `extractRuntimeAnimations()` to include `effect.getTiming()`, `getComputedTiming()`, `getKeyframes()`, timeline type, `currentTime`, `playbackRate`, target, and state. Attach both to every active element observation. | Multiple animations, negative delay, fill, alternate direction, finite/infinite iterations, pause, and a WAAPI animation are represented without list misalignment. |
| 3 | GSAP/ScrollTrigger invisible to `getAnimations()` | Add guarded `extractGsap()` and `extractScrollTriggers()` in `src/evidence.mjs`; call once after readiness and again at each forensic stop through `snapshotRuntimeMotion()`. Use public APIs only. Emit `source-evidence/gsap.ndjson` and `source-evidence/scroll-triggers.ndjson`; add element/section reference IDs in `src/report.mjs`. | A deterministic GSAP fixture exposes global timeline duration/ease/targets and ScrollTrigger authored/resolved start/end, scrub, pin, progress, and linked animation. Hidden or non-global GSAP produces `Unknown`, not `unused`. |
| 4 | No `@keyframes` rules | Add `walkCssRules()` and `extractKeyframes()` in `src/evidence.mjs`. Walk nested imports/grouping/layer/media/supports/container rules and serialize `CSSKeyframesRule` plus its frame declarations and condition path. `src/network.mjs` exposes stored CSS bodies to an offline fallback parser; `src/report.mjs` links animation names to rule IDs. | Accessible nested keyframes preserve complete rule text and offsets. Cross-origin fixture records CSSOM denial and a network-text rule with association status `Unknown` unless activation is independently proven. |
| 5 | No `::before`/`::after` | Add `extractPseudo(element, pseudo, state)` and call it for `::before` and `::after` from `snapshotElementState()` using the same targeted paint/motion props. Capture matching pseudo rules in the CSSOM inventory. | Fixture proves generated content, transform, mask, transition, and state-dependent pseudo changes; record explicitly says no DOM node/direct rect exists. |
| 6 | No variable-driven stagger detection | Add `detectStagger(staticCssInventory, elementIndex)` and `resolveStaggerInstances(system, state)` in `src/evidence.mjs`. Parse raw `calc()`/`var()` declarations, `:nth-*` delay rules, inline/data indices, and GSAP `vars.stagger`; retain per-instance computed delay/order. | Fixture proves `calc(var(--i) * 80ms)`, `nth-child`, reverse ordering, and GSAP stagger. Arithmetic-only sequences without rule evidence are `Inferred`. |
| 7 | Only flat `transform`, no 3D chain | Add 3D/individual transform props to `DEEP_PROPS`; add `extractTransform3D(element)` and `extractTransformAncestorChain(element)`. Preserve authored transform functions where accessible, exact computed matrix, `DOMMatrixReadOnly` values, origins, perspective, preserve/flatten boundaries, and a labelled diagnostic decomposition. | Nested perspective → preserve-3d → rotateX/rotateY/translateZ fixture links the full ancestor chain and exact `matrix3d`; decomposition is marked `Inferred`. |
| 8 | Computed styles read once at page top | In `src/scroll.mjs`, add `captureStop()`, `collectVisibleAndChangedElements()`, and `captureScrollStateEvidence()`. After every thorough stop's settle/dwell/cursor sequence and pointer restoration, invoke `evidence.mjs::snapshotDeepState()` for all captureable visible elements, newly mounted elements, active animation/trigger targets, section roots, and fixed/sticky layers. | A scroll fixture shows a class/style/keyframe becoming active only at its trigger. Top, trigger, settled, reverse, and restored observations are distinct state records. |
| 9 | No grid/flex layout structure | Add grid/flex/box/overflow/containment props to `DEEP_PROPS`; add `extractLayout(element, computed)` with rects, client/scroll metrics, container/item roles, track strings, alignment, gaps, and sibling context. `src/report.mjs::rollupLayout()` derives section rhythm without discarding raw measurements. | Grid and flex fixtures retain authored rule where accessible, used computed tracks, item placement/order, gap, and state/viewport-specific rects. |
| 10 | No SVG/mask/clip, scroll-snap, `will-change`, or `contain` | Add all relevant props to `DEEP_PROPS`; add `extractSvgPaint(element)`, referenced fragment/asset linking, and scroll-container fields in `extractLayout()`. `src/network.mjs` retains sanitized external SVG by hash. | Fixture proves CSS/SVG clip paths, mask layers, SVG fill/stroke/filter/marker data, snap container/item values, and `will-change`/`contain`, with pixels used where external/paint details are opaque. |

## 4. Expanded `DEEP_PROPS`

Use `computed.getPropertyValue(name)` with hyphenated CSS property names. Keep the list grouped in source and version it in output as `stylePropertySet: "phase-b-v1"`. This is the replacement for the current 18-property `PROPS`, not a claim that dumping every browser property is useful.

```js
const DEEP_PROPS = [
  // Typography
  'font-family', 'font-size', 'font-style', 'font-weight', 'font-stretch',
  'font-variation-settings', 'font-feature-settings', 'font-kerning',
  'font-optical-sizing', 'font-synthesis', 'font-variant', 'line-height',
  'letter-spacing', 'word-spacing', 'text-align', 'text-align-last',
  'text-transform', 'text-indent', 'direction', 'unicode-bidi',
  'vertical-align', 'text-decoration-line',
  'text-decoration-style', 'text-decoration-color',
  'text-decoration-thickness', 'text-underline-offset',
  'text-underline-position', 'text-shadow', 'white-space', 'word-break',
  'overflow-wrap', 'hyphens', 'writing-mode', 'text-orientation',
  '-webkit-line-clamp', '-webkit-text-fill-color',
  '-webkit-text-stroke-width', '-webkit-text-stroke-color',

  // Color and general visibility
  'color', 'color-scheme', 'opacity', 'display', 'visibility',
  'content-visibility', 'pointer-events',

  // Box sizing and geometry
  'box-sizing', 'width', 'min-width', 'max-width', 'height', 'min-height',
  'max-height', 'aspect-ratio', 'zoom',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block-start', 'margin-block-end',
  'margin-inline-start', 'margin-inline-end',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block-start', 'padding-block-end',
  'padding-inline-start', 'padding-inline-end',

  // Positioning, stacking, and overflow
  'position', 'top', 'right', 'bottom', 'left',
  'inset-block-start', 'inset-block-end',
  'inset-inline-start', 'inset-inline-end',
  'z-index', 'float', 'clear', 'overflow-x', 'overflow-y',
  'overflow-clip-margin', 'overscroll-behavior-x', 'overscroll-behavior-y',

  // Flex and grid containers/items
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'order', 'grid-template-columns', 'grid-template-rows',
  'grid-template-areas', 'grid-auto-flow', 'grid-auto-columns',
  'grid-auto-rows', 'grid-column-start', 'grid-column-end',
  'grid-row-start', 'grid-row-end', 'gap', 'row-gap', 'column-gap',
  'justify-content', 'justify-items', 'justify-self',
  'align-content', 'align-items', 'align-self',
  'place-content', 'place-items', 'place-self',

  // Columns, replaced content, and shapes
  'column-count', 'column-width', 'column-gap', 'column-rule-width',
  'column-rule-style', 'column-rule-color', 'table-layout',
  'border-collapse', 'border-spacing', 'caption-side',
  'object-fit', 'object-position',
  'image-rendering', 'shape-outside', 'shape-margin',

  // Backgrounds
  'background-color', 'background-image', 'background-position',
  'background-size', 'background-repeat', 'background-origin',
  'background-clip', 'background-attachment', 'background-blend-mode',

  // Borders, radii, outlines, and shadows
  'border-top-width', 'border-right-width', 'border-bottom-width',
  'border-left-width', 'border-top-style', 'border-right-style',
  'border-bottom-style', 'border-left-style', 'border-top-color',
  'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-right-radius', 'border-bottom-left-radius',
  'border-image-source', 'border-image-slice', 'border-image-width',
  'border-image-outset', 'border-image-repeat', 'outline-width',
  'outline-style', 'outline-color', 'outline-offset', 'box-shadow',

  // Filters and compositing
  'filter', 'backdrop-filter', '-webkit-backdrop-filter',
  'mix-blend-mode', 'isolation',

  // Clip, mask, and motion path
  'clip', 'clip-path',
  'mask-image', 'mask-mode', 'mask-position', 'mask-size', 'mask-repeat',
  'mask-origin', 'mask-clip', 'mask-composite',
  '-webkit-mask-image', '-webkit-mask-position', '-webkit-mask-size',
  '-webkit-mask-repeat', '-webkit-mask-origin', '-webkit-mask-clip',
  '-webkit-mask-composite',
  'offset-path', 'offset-distance', 'offset-rotate',
  'offset-anchor', 'offset-position',

  // SVG paint
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset', 'paint-order', 'vector-effect',
  'marker-start', 'marker-mid', 'marker-end', 'stop-color', 'stop-opacity',
  'flood-color', 'flood-opacity', 'lighting-color',

  // 2D/3D transforms — exact values plus a separately derived ancestor chain
  'transform', 'translate', 'rotate', 'scale', 'transform-origin',
  'transform-box', 'transform-style', 'perspective', 'perspective-origin',
  'backface-visibility',

  // CSS transitions
  'transition-property', 'transition-duration',
  'transition-timing-function', 'transition-delay', 'transition-behavior',

  // CSS animations and timelines
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'animation-direction',
  'animation-fill-mode', 'animation-play-state', 'animation-composition',
  'animation-timeline', 'animation-range-start', 'animation-range-end',
  'scroll-timeline-name', 'scroll-timeline-axis',
  'view-timeline-name', 'view-timeline-axis', 'view-timeline-inset',
  'timeline-scope', 'view-transition-name',

  // Scroll behavior and snap
  'scroll-behavior', 'scroll-snap-type', 'scroll-snap-align',
  'scroll-snap-stop', 'scroll-padding-top', 'scroll-padding-right',
  'scroll-padding-bottom', 'scroll-padding-left',
  'scroll-margin-top', 'scroll-margin-right',
  'scroll-margin-bottom', 'scroll-margin-left',
  'scrollbar-color', 'scrollbar-width',

  // Containment, interaction, and rendering hints
  'contain', 'contain-intrinsic-size', 'container-name', 'container-type',
  'will-change', 'cursor', 'touch-action', 'user-select', 'appearance',
  'accent-color', 'caret-color', 'resize'
];
```

Do not force non-supported properties into fake empty strings. Store `{supported: false, value: null}` when a required property is absent from the browser's computed declaration. This distinguishes unsupported from authored `none`/empty.

### Values derived outside `DEEP_PROPS`

`snapshotElementState()` must also record:

- `getBoundingClientRect()` and all `getClientRects()`; `offsetWidth/Height`, `clientWidth/Height`, `scrollWidth/Height`, and natural media dimensions where relevant.
- stable element signature, role/name, safe attributes, parent/section/component references, visibility/intersection, and hit-test status.
- matching accessible authored declarations, relevant custom-property values, and source rule IDs.
- `::before`/`::after`, transitions, CSS animation longhands, runtime CSS/WAAPI animations, GSAP tween refs, ScrollTrigger refs, layout record, SVG paint/attributes, and the 3D ancestor chain.
- asset references such as `currentSrc`, background/mask URLs, SVG fragments, media sources, and canvas facts.
- a hash of the complete property/value map. If unchanged at a later state, emit `sameAsObservationId` rather than duplicating values; the state is still explicitly covered.

## 5. Evidence record model

Use one envelope for every extractor:

```js
{
  id: 'ev_…',
  kind: 'element-state | keyframes | gsap-tween | scroll-trigger | dwell | cursor-probe | …',
  stateRef: 'state_…',
  elementRef: 'el_…' | null,
  componentRef: 'cmp_…' | null,
  sectionRef: 'sec_…' | null,
  acquiredAt: { wallMs, performanceMs, storyProgress, nativeScroll, pointer },
  acquisition: { track: 'faithful | forensic', method: 'computed-style | CSSOM | runtime-public-api | screenshot-pixel | network | derived' },
  status: 'Observed | Inferred | Unknown',
  value: {},
  caveats: [],
  evidenceRefs: [],
  derivedFrom: []
}
```

Use field-level wrappers when an object mixes statuses:

```js
camera: { value: null, status: 'Unknown', reason: 'canvas scene graph is not exposed' }
```

Do not mark an entire GSAP or WebGL record Observed merely because one field, such as version/context type, was observed.

## 6. In-page extractor designs

### 6.1 Shared CSS helpers

`walkCssRules(onRule)` runs once per reachable same-origin frame/root and recursively visits:

- each accessible `document.styleSheets[].cssRules` and `document.adoptedStyleSheets`;
- each open shadow root's accessible stylesheets and `adoptedStyleSheets`;
- `CSSImportRule.styleSheet.cssRules`;
- any rule exposing nested `cssRules`, including media, supports, layer, scope, container, starting-style, and keyframes parents where supported;
- a condition stack containing stylesheet URL/index, rule index path, layer/scope, media query plus `matchMedia(...).matches`, supports condition, and container text.

Wrap every stylesheet and nested rule read in `try/catch`. On `SecurityError`, emit an `Unknown` access record and link the sanitized stylesheet URL/hash from `src/network.mjs`. An offline parser may inventory raw rules from that body, but it must not assert which element matched unless computed/live evidence proves it.

`splitCssList(value)` is a small scanner that splits only top-level commas while respecting parentheses, quoted strings, and escapes. Never use `value.split(',')`.

`resolveCssEasing(token)` returns both the preserved token and one of:

```js
{ type: 'cubic-bezier', values: [x1, y1, x2, y2] }
{ type: 'steps', count, position }
{ type: 'linear-stops', stops: [...] }
{ type: 'unknown-function', samples: null }
```

Resolve CSS keywords exactly as listed in `CAPTURE-CHECKLIST.md`. Validate cubic-bezier x coordinates and preserve invalid/authored text with a parse error rather than “repairing” it.

### 6.2 `extractTransitions()`

Approach:

```js
function extractTransitions(element, computed, matchedRules) {
  const raw = {
    property: computed.getPropertyValue('transition-property'),
    duration: computed.getPropertyValue('transition-duration'),
    easing: computed.getPropertyValue('transition-timing-function'),
    delay: computed.getPropertyValue('transition-delay'),
    behavior: computed.getPropertyValue('transition-behavior')
  };
  const lists = mapValues(raw, splitCssList);
  const count = lists.property.length;
  const tracks = repeatOrTruncateToPropertyCount(lists, count)
    .map(track => ({ ...parseTimes(track), easing: resolveCssEasing(track.easing) }));
  return { raw, tracks, authored: matchingTransitionDeclarations(matchedRules) };
}
```

Rules:

- Preserve `none` and `all`; bind an `all` track to concrete properties only when a before/after computed delta observes them.
- Store negative delay, zero duration, allow-discrete behavior, list-repetition origin, and parse errors.
- At a triggered state, correlate `transitionrun/start/end/cancel` events and runtime animations where available, but do not depend on events that could have fired before instrumentation.
- The element observation at `before`, `during`, `settled`, `reverse`, and `restored` links to the same normalized track ID.

### 6.3 `extractKeyframes()`

Approach:

```js
function extractKeyframes() {
  const out = [];
  walkCssRules((rule, context) => {
    if (isCssKeyframesRule(rule)) {
      out.push({
        id: stableRuleId(context, rule.name),
        name: rule.name,
        cssText: rule.cssText,
        context,
        frames: [...rule.cssRules].map((frame, index) => ({
          index,
          keyText: frame.keyText,
          cssText: frame.cssText,
          declarations: serializeStyleDeclaration(frame.style)
        }))
      });
    }
  });
  return out;
}
```

Link per-element `animation-name` tokens and runtime `KeyframeEffect.getKeyframes()` results to every same-name candidate plus its cascade/condition context. If more than one rule could win and the engine cannot prove which one did, retain all candidates and mark the link `Inferred` or `Unknown`; do not choose by name alone.

### 6.4 `extractRuntimeAnimations()`

For `document.getAnimations()` and every reachable open shadow root:

- assign a stable runtime animation ID;
- record `id`, `playState`, `pending`, `currentTime`, `startTime`, `playbackRate`, `replaceState`, and timeline constructor/type/current time;
- for a `KeyframeEffect`, record target element/pseudo, `getTiming()`, `getComputedTiming()`, and `getKeyframes()`;
- record `progress`/`currentIteration` from computed timing, not a home-grown duration calculation;
- attach the record to the target element and current state;
- catch detached targets and API errors as terminal statuses.

This extractor supplements `extractCssAnimationStyle()`; it does not replace the authored longhands or `@keyframes` rule.

### 6.5 `extractPseudo()`

```js
function extractPseudo(element, pseudo, state) {
  const computed = getComputedStyle(element, pseudo); // ::before or ::after
  const props = readSupportedProps(computed, PSEUDO_PROPS); // DEEP_PROPS paint/motion subset
  return {
    pseudo,
    owner: elementId(element),
    state,
    content: computed.getPropertyValue('content'),
    props,
    meaningful: hasGeneratedContentOrPaint(props),
    geometry: { value: null, status: 'Unknown', reason: 'pseudo-elements have no direct DOMRect API' },
    matchedRuleRefs: matchingPseudoRules(element, pseudo)
  };
}
```

Always emit a terminal status for both pseudos on a captured element. `meaningful: false` means no generated content/paint was observed in that state; it does not claim no rule exists in another state.

### 6.6 `extractGsap()`

Guard and resolve public APIs without mutating the timeline:

```js
function resolveGsap() {
  return window.gsap && typeof window.gsap.globalTimeline?.getChildren === 'function'
    ? window.gsap
    : null;
}

function extractGsap() {
  const gsap = resolveGsap();
  if (!gsap) return { status: 'Unknown', reason: 'no public window.gsap global' };
  const children = gsap.globalTimeline.getChildren(true, true, true);
  return {
    status: 'Observed',
    version: gsap.version ?? null,
    capturedAt: performance.now(),
    children: children.map(readPublicGsapNode)
  };
}
```

`readPublicGsapNode(node)` records:

- stable ID, constructor/type, parent ID, ordered child IDs, labels when it is a timeline;
- public method values: `duration()`, `totalDuration()`, `delay()`, `repeat()`, `repeatDelay()`, `yoyo()`, `timeScale()`, `paused()`, `reversed()`, `progress()`, and `totalProgress()` when present;
- `targets()` as stable DOM element refs or `{kind:'opaque-object'}`; never recursively serialize arbitrary targets;
- for an opaque target, only the current primitive value of property keys explicitly named by the tween's safe `vars` allowlist; all other object state stays uninspected;
- a conservative allowlist from `vars`: animated property keys and JSON-safe scalar/array/plain-object values for `duration`, `delay`, `ease`, `stagger`, `keyframes`, `repeat`, `repeatDelay`, `yoyo`, `paused`, `scrollTrigger`, and transform/paint properties;
- callbacks as `{kind:'function', name}` only—no function source;
- ease as original string when available. For function/custom eases, sample `ease(p)` at 21 points from 0 to 1 inside a try/catch and store `type:'sampled-function'`; never call it a cubic-bezier unless exact representation is proven.

No call may seek, pause, render, invalidate, refresh, update, kill, or otherwise mutate author state.

### 6.7 `extractScrollTriggers()`

Resolve the plugin in this order:

```js
const globals = window.gsap?.core?.globals?.();
const ScrollTrigger = window.ScrollTrigger ?? globals?.ScrollTrigger ?? null;
```

If `ScrollTrigger?.getAll` is public, map `getAll()` and record:

- public `id`, resolved numeric `start`, `end`, `progress`, `direction`, `isActive`, and enabled state where exposed;
- stable refs for `trigger`, `endTrigger`, `scroller`, `pin`, and linked `animation`;
- authored `vars.start`, `vars.end`, `vars.scrub`, `vars.pin`, `vars.pinSpacing`, `vars.snap`, `vars.toggleActions`, `vars.toggleClass`, `vars.once`, `vars.horizontal`, `vars.invalidateOnRefresh`, `vars.anticipatePin`, and `vars.markers`, safely serialized;
- the current state/viewport/layout timestamp because resolved start/end can change after resize or asset load.

Do not call `ScrollTrigger.refresh()` or `update()` merely to inspect it. If only private/minified fields are available, emit public fields and mark the rest Unknown.

### 6.8 `detectStagger()`

Run once over the static CSS inventory, then resolve instances at each relevant state.

1. Parse declaration values, not only computed values. Candidate properties include `transition-delay`, `animation-delay`, `transition`, `animation`, transforms, and custom properties referenced by them.
2. Detect a value graph containing `calc()` plus one or more `var(--name)` terms multiplied/divided/added to time or length values. Preserve the complete raw expression and parsed nodes.
3. Record selector, rule context, affected property, custom-property names, literal interval(s), direction/sign, and `min()`/`max()`/`clamp()` bounds.
4. Detect selector staggering through `:nth-child()`/`:nth-of-type()` and data/class/inline index declarations.
5. For each matched visible instance, read referenced custom-property values and normalized computed transition/animation tracks, then store DOM order, visual order, index, delay, and observed start time.
6. Merge GSAP `vars.stagger` and timeline child start offsets as a separate source type.
7. If only an arithmetic delay sequence is visible, emit a candidate with `status:'Inferred'`; never reverse-engineer an authored formula as Observed.

### 6.9 Layout, SVG, and 3D helpers

`extractLayout(element, computed)` returns container and item data together: display model, grid/flex/column properties, alignment, gaps, size constraints, margins/padding, positioning/insets, overflow/scroll/snap, containment/container queries, rects, client/scroll metrics, and immediate sibling summaries. Used pixel grid tracks and accessible authored tracks remain separate.

`extractSvgPaint(element)` runs only for SVG-namespace elements or elements referencing SVG paint/clip/mask resources. It captures relevant computed props, sanitized geometry/paint attributes, `viewBox`, `<use>`/fragment links, filters/gradients/patterns/markers, and network asset refs.

`extractTransform3D(element)` returns:

- exact computed `transform`, `translate`, `rotate`, `scale`, origins, `perspective`, `transform-style`, and `backface-visibility`;
- accessible authored transform function strings;
- exact 4×4 `DOMMatrixReadOnly` components;
- a diagnostic decomposition labelled `Inferred` with ambiguity noted.

`extractTransformAncestorChain(element)` walks ancestors through the section root or document root and records every non-identity transform, perspective, origin, preserve-3d/flattening boundary, containing-block trigger, rect, and stacking trigger. It never reduces the chain to a single invented `rotateX`/`translateZ` sequence.

## 7. `scroll.mjs` dwell-and-watch redesign

### 7.1 Mode contract

Keep the existing default profiles for practical runs. Add an explicit slow overlay:

```text
--level full --thorough
```

`--thorough` opts into the stop/dwell/cursor protocol below and therefore loses the approved ten-minute guarantee, just as the earlier `--deep` concept did. If the caller supplies `--budget`, it remains authoritative. Without it, use a 20-minute browser-active budget, stop starting optional work at 17 minutes, begin browser release by 18.5 minutes, and reserve the final 90 seconds for finalization and process verification.

The manifest must record `thorough: true`, resolved cadence, frame/stop caps, actual dwell durations, and every degradation. The skill should recommend `--thorough` for award-site, pinned, virtual-scroll, canvas-heavy, or “capture everything” jobs. It remains an explicit flag so quick/default work does not unexpectedly take tens of minutes.

### 7.2 Step size

Use an effective primary step of:

```js
targetTravelCssPx = clamp(100, Math.round(viewportHeight * 0.125), 130);
```

At 900 px high this is about 113 px. The requested absolute range is authoritative: 100–130 px is approximately 11–14% of a 900 px viewport, not 1–1.5%. Literal 1–1.5 viewport-percent (9–14 px at 900 px) belongs to the existing 4–12 px transition refinement band.

For native scroll, target **observed effective travel**, not merely requested wheel delta. For Lenis, Locomotive, ScrollTrigger pins, transformed roots, and canvas stories with `scrollY === 0`, send bounded real-wheel pulses and close the loop on the best observed progress signal: public library progress first, transformed-content/trigger progress second, and structured visual-state progress third. Store both input and observed output.

### 7.3 One atomic thorough stop

Every attempted stop is a state machine. It is complete only after all terminal phases are written:

```text
PRE-STEP BASELINE
  → SMALL REAL-WHEEL STEP
  → SETTLE
  → STATIONARY DWELL SERIES
  → AUTONOMOUS-MOTION MODEL
  → FIVE-POSITION CURSOR PROBE
  → POINTER RESTORE + SETTLE
  → SCROLL-STATE DEEP SNAPSHOT
  → ATOMIC STOP COMMIT
```

Pseudocode:

```js
async function captureStop(ctx) {
  const before = await capturePreStepBaseline(ctx);
  const movement = await advanceEffectiveStoryStep(ctx);
  const settled = await settleAtObservedProgress(ctx, movement);
  const dwell = await captureStationarySeries(ctx, settled);
  const autonomous = classifyAutonomousMotion(dwell);
  const cursor = await probeCursorGrid(ctx, autonomous);
  const restored = await restoreNeutralPointerAndSettle(ctx);
  const deepState = await captureScrollStateEvidence(ctx, {
    include: collectVisibleAndChangedElements(ctx),
    runtimeMotion: true,
    pseudo: true,
    layout3d: true
  });
  await commitStopAtomically({ before, movement, settled, dwell, autonomous, cursor, restored, deepState });
}
```

#### Phase A — pre-step baseline

- Park the pointer at the recorded neutral coordinate and verify its hit-test target.
- Capture one viewport frame, current story/native/library progress, active triggers/animations, visible element IDs, complete style fingerprints, and section ID.
- Use the previous stop's final restored state when it is still valid; never reuse a pointer-active or unsettled frame.

#### Phase B — small real-wheel step

- Send one bounded wheel pulse, observe effective travel, and adapt pulse magnitude without exceeding the target band by more than the controller tolerance.
- If a pin consumes input while its progress changes, that is successful story travel even when native position is fixed.
- If no credible progress signal changes after the retry cap, emit `stalled`, `terminal`, `loop`, or `ambiguous` with evidence; do not hammer the page with a large scroll.

#### Phase C — settle

- Minimum settle: 120 ms and two observations separated by at least three animation frames.
- Normal maximum: 1,250 ms. A known long transition may extend to 1,800 ms if the remaining budget permits.
- Stability uses effective progress, layout rects, active transition state, and non-autonomous pixel regions. Never wait for an animated background to become globally pixel-still.
- A timeout is a valid `settleStatus:'timed-out-with-motion'`, not a reason to skip dwell.

#### Phase D — stationary dwell-and-sample

With no wheel, keyboard, click, or pointer movement, capture `K = 6` timestamped frames at approximately:

```text
t = 0, 400, 900, 1,400, 2,100, 2,800 ms
```

For every sample, record:

- full viewport diagnostic frame or a storage-deduplicated frame reference;
- wall/performance time, story/native/library progress, pointer coordinate, and hit-test target;
- screenshot hash/perceptual hash and changed tile/region summary;
- `document.getAnimations()`/open-shadow animation progress;
- GSAP/ScrollTrigger progress when publicly exposed;
- complete style fingerprints for visible captureable elements, with full property records emitted when the hash changes.

The final sample may occur between 2.4 and 3.0 seconds to respect scheduler load; persist actual timestamps. A selected refinement window may watch up to two observed cycles or eight seconds, bounded by the global cap.

#### Phase E — autonomous-motion model

`src/visual-diff.mjs` computes consecutive and first-to-last pixel deltas, changed tile/region masks, variance, and element/style/runtime-animation deltas. `src/scroll.mjs` applies labels:

- `autonomous-observed`: changed during stationary samples with stable story progress;
- `autonomous-probable`: repeated pixel motion with no exposed runtime source;
- `stable-in-window`: below declared thresholds for the sampled interval;
- `ambiguous`: progress drift, random/global change, or insufficient samples prevents attribution.

The mask belongs only to this route/viewport/section/scroll/pointer state. Never reuse it as a universal noise mask.

#### Phase F — five-position cursor probe

Derive section-local normalized positions, clipped to visible bounds:

```text
center (0.50, 0.50)
upper-left inset (0.20, 0.20)
upper-right inset (0.80, 0.20)
lower-left inset (0.20, 0.80)
lower-right inset (0.80, 0.80)
```

For each reachable position:

1. Return to neutral and capture/verify the phase baseline.
2. Move along a short real pointer path, not a dispatched synthetic event; record path coordinates/times.
3. Record hit-test stack with `elementsFromPoint`.
4. Capture an immediate frame after two `requestAnimationFrame` turns and a settled frame after 300 ms or bounded stability, whichever is later and within 600 ms.
5. Snapshot the hit target, its ancestors/component, active animation targets, custom cursor, canvas, and any element whose style fingerprint changed.
6. Diff target crop and full viewport against the closest phase-matched stationary baseline and autonomous mask.
7. Label changes `pointer-caused`, `probably-pointer-caused`, `autonomous`, `mixed`, or `ambiguous`.

If a point is occluded/outside the current visible section, emit that terminal status and continue. Grid points sample the response field; selected sections with path-dependent tilt/inertia may receive an additional horizontal/vertical/diagonal path refinement, explicitly marked sampled.

#### Phase G — restore and deep scroll-state snapshot

- Return to neutral, wait for reverse transitions/inertia up to the bounded settle, and record whether state restored.
- Run `snapshotDeepState()` on every captureable visible element in the target, every newly mounted/visible element, every active CSS/WAAPI/GSAP/ScrollTrigger target, section/component roots, and fixed/sticky/global-cursor layers.
- A captureable element is a target-scope element with a painted box, semantic/accessibility role, generated content, interaction, asset, animation, or layout ownership. `html`, `body`, and section roots are always included; non-rendering metadata nodes are inventoried but do not require per-stop style records.
- Compute the full `DEEP_PROPS` map for coverage. If its hash matches the preceding observation, emit `sameAsObservationId`; do not silently skip it.
- Attach the dwell, pointer, transition, keyframe, runtime animation, GSAP, trigger, 3D, layout, pseudo, and frame refs to this state.

### 7.4 Causal comparison across stops

For scroll causality, compare the new settled-rest state with the prior pre-step/rest state while subtracting only changes demonstrated by that prior stationary control. Classify each property/region:

- `scroll-caused`: effective story progress changed and the property/region changed outside the stationary model with a matching trigger/runtime progression;
- `probably-scroll-caused`: same, but no exposed trigger/runtime link;
- `time-caused`: equivalent change occurred during no-input samples while progress stayed stable;
- `pointer-caused`: change appears only in pointer probes and reverses/restores accordingly;
- `mixed`: both independent controls affect it;
- `ambiguous`: drift/randomness/sampling prevents separation.

Pixel subtraction alone cannot prove causality. DOM/style/runtime evidence raises confidence; canvas-only changes without an exposed driver stay probable or ambiguous.

### 7.5 Adaptive refinement

When a primary stop crosses a large pixel/style/visibility/animation delta or a ScrollTrigger boundary:

1. Queue the bracket between the two primary states.
2. Reposition using the safest repeatable method established during discovery; record that this is forensic replay, not faithful input.
3. Refine to 4–12 CSS px **effective** progress increments.
4. Apply the same atomic stop protocol, subject to the total-stop cap.
5. Abandon controlled replay if its canary frames/progress diverge materially from the faithful track; retain sampled evidence and mark the boundary approximate.

### 7.6 Thorough caps and graceful degradation

Default `--thorough` caps are maxima, not quotas:

| Dimension | Thorough cap |
|---|---:|
| Browser-active time | 20 min, unless `--budget` overrides |
| Total atomic stops, primary plus refinement | 120 |
| Primary step target | 100–130 effective CSS px |
| Stationary samples per stop | 6 over about 2.8 s |
| Cursor positions per stop | 5, immediate + settled |
| Refined transition windows | 20, sharing the total-stop cap |
| Extra long autonomous windows | 12, each at most two cycles or 8 s |
| Canonical full-resolution evidence frames | Preserve approved 300-frame cap |
| Diagnostic dwell/cursor frames | 1,800; content-deduplicated and separately identified |
| Captured interactive target strips | Preserve approved 120-target/480-crop cap; cursor-grid probes are a separate coverage dimension |
| Output | Preserve approved 1 GiB cap and 100 MiB per response body |

Degrade in this order:

1. Deduplicate byte-identical diagnostic frames while keeping timestamped records.
2. Drop optional DPR 2 diagnostic duplicates.
3. Stop adding long autonomous extensions; retain the six-frame dwell.
4. Stop additional cursor path refinements; retain the five-point grid.
5. Stop micro-refinement windows; preserve primary route coverage.
6. Stop before starting a new primary stop and mark the remaining story range cap-skipped.

Never shorten an already-started dwell below its declared six samples or omit the cursor/deep-state phases while calling that stop complete. If the hard process deadline requires emergency shutdown, mark the stop `partial` with completed phases.

## 8. Per-element, component, section, and site attachment

### 8.1 Element record

`src/evidence.mjs::snapshotElementState()` produces:

```js
{
  elementId,
  signature,
  sectionRef,
  componentRef,
  observation: {
    stateRef,
    phase: 'restored-after-cursor',
    visibility,
    rects,
    props,
    authoredRuleRefs,
    customProperties,
    layout,
    svgPaint,
    pseudo: { before, after },
    transitions,
    cssAnimations,
    runtimeAnimationRefs,
    gsapTweenRefs,
    scrollTriggerRefs,
    transform3d,
    assetRefs,
    frameRefs,
    dwellRef,
    cursorProbeRefs,
    status,
    caveats
  }
}
```

An element that is detached/replaced receives a terminal observation. A structurally similar successor gets a derivation link, not the same identity unless continuity is proven.

### 8.2 Component rollup

`src/report.mjs::buildComponentRollups()` groups explicit target roots, semantic widgets, and repeated structural/behavioral families. Each rollup includes member/instance IDs, tested state graph, normalized transition/animation/stagger systems, shared custom properties, layout, assets, audio/action refs, responsive substitutions, and per-instance terminal status. Inferred clustering is labelled and raw elements remain accessible.

### 8.3 Section rollup

`src/report.mjs::buildSectionRollups()` assigns observations to explicit selector roots first, then semantic sections, then mechanically proposed scene ranges. Each section contains:

- state/scroll range and viewport coverage;
- captureable/discovered/observed/same-as/skipped element counts;
- layer/position/stacking map and grid/flex/container summary;
- typography, authored/computed/perceived color, surface, and spacing distributions;
- transition duration/easing/property vocabulary;
- keyframe/CSS animation/WAAPI/GSAP/ScrollTrigger references;
- stagger systems and 3D chains;
- dwell autonomous regions and runtime sources;
- cursor response positions/regions and restoration result;
- assets, canvas, audio/action references, contact sheet, and Unknown ledger.

### 8.4 Full-site rollup

`src/report.mjs::buildSiteRollup()` aggregates shared vocabularies and the route/state graph but never fills an unobserved section by analogy. It adds independent coverage dimensions for:

```text
style-property observations
transition states
CSS keyframe rules
runtime CSS/WAAPI animations
GSAP timelines/tweens
ScrollTriggers
pseudo-elements
3D ancestor chains
layout containers/items
scroll stops
stationary dwell series
cursor-grid positions
autonomous / scroll / pointer / mixed / ambiguous causal labels
```

## 9. Output additions

Keep the approved folder layout. Add or extend:

```text
source-evidence/
  style-states.ndjson
  keyframes.json
  transition-inventory.json
  animation-inventory.json        # extend existing collection
  pseudo-states.ndjson
  stagger-systems.json
  gsap.ndjson
  scroll-triggers.ndjson
  section-rollups.json

telemetry/
  scroll.ndjson                   # extend with atomic-stop phases
  dwell.ndjson
  cursor-probes.ndjson
  causal-deltas.ndjson

frames/
  desktop/scroll/<stop-id>/
  cursor/<section-id>/<stop-id>/
```

`evidence.json` receives references and compact rollups, not every raw repeated property map. Raw state series remain append-only NDJSON. `manifest.json` records schema version, `stylePropertySet`, resolved thorough profile/caps, completed stop IDs, and resume cursor. `verification.json` fails if a stop marked complete lacks settle, six-sample dwell, cursor terminal statuses, pointer restoration, or deep snapshot.

## 10. What remains honestly Unknown

1. **Hidden/minified GSAP:** if GSAP is bundled without a public global or a plugin keeps data private, its timeline tree, ease names, and trigger configuration are Unknown. Pixel/timing samples remain Observed; a guessed GSAP reconstruction does not.
2. **Custom easing identity:** a function can be sampled but often cannot be inverted to its author name or an exact cubic-bezier. Store the samples and say Unknown.
3. **Completed/removed motion:** CSS/WAAPI/GSAP animations that completed and were discarded before instrumentation may only be visible in the faithful video. Their internal timing remains Unknown unless replay recovers it faithfully.
4. **Canvas/WebGL scene graph:** DOM evidence reveals a canvas, not its objects. Even with context/shader hooks, semantic object names, scene hierarchy, camera path, material graph, author intent, and post-processing topology can remain Unknown. Describe observed frames and links; never fabricate an Active Theory scene graph.
5. **Cross-origin CSS:** `SecurityError` blocks live CSSOM. A captured network stylesheet gives authored text, not definitive cascade/match or runtime substitution. Computed values are Observed; author-rule association may be Unknown.
6. **Closed shadow DOM and cross-origin frames:** pixels and outer geometry may be observed, internals are Unknown.
7. **Random/chaotic/autonomous systems:** a 2–8 second series is sampled evidence, not an exhaustive loop or distribution. Causality can remain ambiguous.
8. **Matrix decomposition:** the exact `matrix3d()` is Observed; a particular sequence of `rotateX/Y/Z`, `translateZ`, skew, and scale is not unique and is therefore Inferred unless authored transform text is accessible.
9. **Perceived compositing inverse:** screenshot pixels include blend, backdrop, shader, video, color management, and anti-aliasing. Pixels are Observed; assigning each pixel to a source layer can be Unknown.
10. **Untested states:** responsive widths, alternate routes, gesture sequences, touch/pen behavior, focus branches, and cap-skipped targets remain explicit in the coverage vector.

## 11. Additional gaps beyond the confirmed ten

The ten-item research list is correct but not exhaustive. Phase B should include these while the relevant surfaces are already being changed:

| Additional gap | Phase B action |
|---|---|
| CSS scroll-driven animations were omitted: `animation-timeline`, `animation-range-*`, `scroll-timeline-*`, `view-timeline-*`, and `timeline-scope` | Include them in `DEEP_PROPS`, CSSOM conditions, runtime timeline records, and the scroll fixture. |
| Current `getAnimations()` capture lacks actual effect keyframes, computed timing/progress, playback rate, pseudo target, and timeline type | Expand `extractRuntimeAnimations()` as specified; keep CSS/WAAPI separate from GSAP. |
| Constructed/adopted stylesheets and open-shadow-root styles can be absent from `document.styleSheets` | Walk document and open-root `adoptedStyleSheets`, run extractors per reachable same-origin frame/root, and keep closed/cross-origin realms Unknown. |
| `@property`/`CSS.registerProperty()` changes whether and how custom properties interpolate; `@starting-style` changes entry transitions | Inventory `CSSPropertyRule` and `CSSStartingStyleRule`, record safe registration calls, and include both in the transitions/keyframes fixtures. |
| State breadth is wider than hover: keyboard focus/`:focus-visible`, transient `:active`, checked/open/expanded/disabled, reverse/restored, touch substitution, and reduced motion | Extend the interaction state registry and attach the same before/during/settled/restored evidence envelope. Phase B automates safe focus/active states; broader form/route actions stay bounded by scope. |
| View Transitions API and view-transition pseudos can own route/component motion | Inventory `document.startViewTransition` availability/use where observable, `view-transition-name`, relevant pseudo CSS rules, and faithful route-transition frames. Hidden callback internals stay Unknown. |
| Responsive conditions and container-query context were not in the ten | Walk media/container/supports/layer/scope rules and record active conditions; retain approved mobile smoke rather than multiplying every state across every width. |
| Authored/computed color does not equal perceived or asset-native color | Keep four datasets: authored CSS, computed CSS, decoded asset colors, and screenshot-perceived palettes. This prevents WebGL/imagery color from disappearing from a DOM-only palette. |
| Custom GSAP eases and JS spring/inertia curves cannot always be named | Preserve exposed tokens; otherwise store a bounded 21-point curve sample and label exact identity Unknown. |
| Pointer-path effects are not characterized by hover targets alone | Add the five-point per-stop grid plus selected path/inertia refinements and stationary phase controls. |
| First-load/warm-load behavior and performance pacing affect “feel” | Preserve the faithful cold-load video and existing environment/performance evidence; do not make the forensic replay the experiential source of truth. |

Deep audio graph forensics and comprehensive GL/WebGPU call interception remain the approved Phase C slices. This Phase B spec does not falsely mark them complete: it preserves existing network/audio evidence, records canvas/time/pointer/scroll behavior, and leaves compatible hooks/output fields for Phase C.

## 12. Test plan

All fixtures are local, deterministic, same-origin unless testing a declared cross-origin failure, and run with the pinned Playwright/system Chrome through a **direct host Node process**. The CI/unit layer may test parsers without Chrome; browser acceptance must not use a Codex sandboxed worker.

| Fixture | Planted behavior | Pass condition |
|---|---|---|
| `tests/fixtures/transitions/` | One element with multiple properties and cyclic lists; `ease`, `ease-in/out`, cubic-bezier, `steps()`, `linear()`, negative delay, `allow-discrete`, and `@starting-style`; hover, focus-visible, active, reverse/cancel; animated `::before` | Exact normalized tracks retain authored/computed/resolved easing; before/immediate/settled/reverse/restored states and pseudo change are linked to the element. |
| `tests/fixtures/keyframes/` | Nested layer/media/supports keyframes; duplicate names in different conditions; `@property`/registered-property animation; document/open-shadow adopted sheets; negative delay, fill, alternate, infinite, paused; WAAPI keyframes; a test cross-origin stylesheet | Rule text/offsets/context are captured; animation longhands and `getKeyframes()`/computed timing align; adopted rules are present; ambiguous duplicate/cross-origin association is not guessed. |
| `tests/fixtures/gsap-scrolltrigger/` | Locally pinned deterministic GSAP timeline with labels, custom ease, stagger, repeat/yoyo, DOM and opaque-object targets; ScrollTrigger start/end, numeric scrub, pin, snap, markers config | Public timeline/trigger fields, target refs, sampled custom ease, stagger, pin, progress, and authored/resolved bounds are captured without timeline mutation. |
| `tests/fixtures/css-3d/` | Parent perspective/origin, nested preserve-3d, rotateX/rotateY/translateZ, individual transforms, backface hidden, and an intentional flattening ancestor | Exact matrices and the full ancestor chain are Observed; authored functions are preserved; diagnostic decomposition is marked Inferred; flatten boundary is correct. |
| `tests/fixtures/time-based-bg/` | Infinite CSS background pulse/particle loop independent of a scroll-driven text/color change; optional deterministic canvas clock | At a fixed stop, dwell frames change while story progress does not and are labelled autonomous; after scroll, text/color change is scroll-caused and background pixels are not falsely attributed to scroll. |
| `tests/fixtures/cursor-parallax/` | Section-local pointer parallax/tilt, custom cursor, global background response, inertia/reset, plus an independent time pulse | Five grid positions have hit tests, immediate/settled frames, target/full-view diffs, and pointer labels; autonomous pulse is masked; neutral restoration is verified. |
| `tests/fixtures/stagger-pseudo-layout/` | `calc(var(--i) * 80ms)`, `nth-child` delay, grid/flex gaps, masks/clip/SVG paint, snap, contain/will-change, and stateful pseudos | Gaps 5, 6, 9, and 10 each produce exact rule/computed/state records; arithmetic inference is distinct from authored system evidence. |
| `tests/fixtures/scroll-state/` | Native and virtual/pinned variants where `scrollY` is misleading; style/class activation only at a trigger; reverse behavior | The controller completes the story from observed progress, captures live trigger-state styles, dwells at each completed stop, and reports reverse/restoration honestly. |

### Cross-fixture assertions

1. Every confirmed gap has at least one positive assertion and one inaccessible/ambiguous-path assertion.
2. No comma-list parser breaks `cubic-bezier()` or `linear()`.
3. Every complete thorough stop has six dwell samples, five cursor terminal statuses, a restore result, and a deep state snapshot.
4. Autonomous motion is never labelled scroll- or pointer-caused in the planted fixtures.
5. A canvas fixture never produces fabricated child elements, camera, scene graph, or materials.
6. Cross-origin CSS and hidden GSAP produce scoped Unknown records rather than negative claims.
7. Caps stop before a new atomic stop, preserve a readable partial run, and show exact skipped ranges/counts in the coverage vector.
8. Existing Phase A fixture expectations continue to pass; new fields are additive.
9. `verification.json` catches broken evidence links, incomplete “complete” stops, secret patterns, and surviving run-owned processes.

## 13. Implementation sequence

1. **Schema and pure helpers:** add evidence envelopes, CSS list/easing parsers, stable IDs, and unit tests; no browser behavior changes.
2. **Static/live CSS evidence:** land `DEEP_PROPS`, transition/keyframe/pseudo/stagger/layout/SVG/3D extractors and their fixtures.
3. **Runtime motion:** expand CSS/WAAPI extraction, then add guarded GSAP and ScrollTrigger adapters with no-op/Unknown paths.
4. **Visual controls:** add `src/visual-diff.mjs`, autonomous masks, and deterministic parser/diff tests.
5. **Thorough scroll controller:** add the CLI profile, atomic stop state machine, dwell series, pointer grid, deep scroll-state snapshots, caps, and resumable checkpoints.
6. **Rollups/reporting:** attach per-element observations and component/section/site vocabularies; extend coverage and verification.
7. **Direct-process acceptance:** run all local browser fixtures, forced-cap/forced-interruption checks, and one manual award-site acceptance. Public-site results validate robustness but never replace deterministic fixture assertions.

Phase B is complete only when all ten confirmed gaps have deterministic fixture proof, the slow pass no longer skips time- or pointer-dependent behavior at completed stops, and every remaining blind spot is visible as Unknown in the coverage vector.
