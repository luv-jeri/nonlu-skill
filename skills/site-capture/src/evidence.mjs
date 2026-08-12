// Phase B style, motion, layout, runtime, and technology evidence.
// Browser-side extractors are read-only: authored CSS, computed state, and public
// runtime APIs are kept separate, and opaque canvas internals remain Unknown.
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { atomicWriteJson, eachFileLine, sanitizeUrl } from './util.mjs';

export const STYLE_PROPERTY_SET = 'phase-b-v1';

export const DEEP_PROPS = [
  // Typography
  'font-family', 'font-size', 'font-style', 'font-weight', 'font-stretch',
  'font-variation-settings', 'font-feature-settings', 'font-kerning',
  'font-optical-sizing', 'font-synthesis', 'font-variant', 'line-height',
  'letter-spacing', 'word-spacing', 'text-align', 'text-align-last',
  'text-transform', 'text-indent', 'direction', 'unicode-bidi',
  'vertical-align', 'text-decoration-line', 'text-decoration-style',
  'text-decoration-color', 'text-decoration-thickness', 'text-underline-offset',
  'text-underline-position', 'text-shadow', 'white-space', 'word-break',
  'overflow-wrap', 'hyphens', 'writing-mode', 'text-orientation',
  '-webkit-line-clamp', '-webkit-text-fill-color', '-webkit-text-stroke-width',
  '-webkit-text-stroke-color',

  // Color and general visibility
  'color', 'color-scheme', 'opacity', 'display', 'visibility',
  'content-visibility', 'pointer-events',

  // Box sizing and geometry
  'box-sizing', 'width', 'min-width', 'max-width', 'height', 'min-height',
  'max-height', 'aspect-ratio', 'zoom', 'margin-top', 'margin-right',
  'margin-bottom', 'margin-left', 'margin-block-start', 'margin-block-end',
  'margin-inline-start', 'margin-inline-end', 'padding-top', 'padding-right',
  'padding-bottom', 'padding-left', 'padding-block-start', 'padding-block-end',
  'padding-inline-start', 'padding-inline-end',

  // Positioning, stacking, and overflow
  'position', 'top', 'right', 'bottom', 'left', 'inset-block-start',
  'inset-block-end', 'inset-inline-start', 'inset-inline-end', 'z-index',
  'float', 'clear', 'overflow-x', 'overflow-y', 'overflow-clip-margin',
  'overscroll-behavior-x', 'overscroll-behavior-y',

  // Flex and grid containers/items
  'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'order', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
  'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows',
  'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
  'gap', 'row-gap', 'column-gap', 'justify-content', 'justify-items',
  'justify-self', 'align-content', 'align-items', 'align-self',
  'place-content', 'place-items', 'place-self',

  // Columns, replaced content, and shapes
  'column-count', 'column-width', 'column-gap', 'column-rule-width',
  'column-rule-style', 'column-rule-color', 'table-layout', 'border-collapse',
  'border-spacing', 'caption-side', 'object-fit', 'object-position',
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
  'filter', 'backdrop-filter', '-webkit-backdrop-filter', 'mix-blend-mode',
  'isolation',

  // Clip, mask, and motion path
  'clip', 'clip-path', 'mask-image', 'mask-mode', 'mask-position', 'mask-size',
  'mask-repeat', 'mask-origin', 'mask-clip', 'mask-composite',
  '-webkit-mask-image', '-webkit-mask-position', '-webkit-mask-size',
  '-webkit-mask-repeat', '-webkit-mask-origin', '-webkit-mask-clip',
  '-webkit-mask-composite', 'offset-path', 'offset-distance', 'offset-rotate',
  'offset-anchor', 'offset-position',

  // SVG paint
  'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit',
  'stroke-dasharray', 'stroke-dashoffset', 'paint-order', 'vector-effect',
  'marker-start', 'marker-mid', 'marker-end', 'stop-color', 'stop-opacity',
  'flood-color', 'flood-opacity', 'lighting-color',

  // 2D/3D transforms
  'transform', 'translate', 'rotate', 'scale', 'transform-origin',
  'transform-box', 'transform-style', 'perspective', 'perspective-origin',
  'backface-visibility',

  // CSS transitions
  'transition-property', 'transition-duration', 'transition-timing-function',
  'transition-delay', 'transition-behavior',

  // CSS animations and timelines
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'animation-direction',
  'animation-fill-mode', 'animation-play-state', 'animation-composition',
  'animation-timeline', 'animation-range-start', 'animation-range-end',
  'scroll-timeline-name', 'scroll-timeline-axis', 'view-timeline-name',
  'view-timeline-axis', 'view-timeline-inset', 'timeline-scope',
  'view-transition-name',

  // Scroll behavior and snap
  'scroll-behavior', 'scroll-snap-type', 'scroll-snap-align',
  'scroll-snap-stop', 'scroll-padding-top', 'scroll-padding-right',
  'scroll-padding-bottom', 'scroll-padding-left', 'scroll-margin-top',
  'scroll-margin-right', 'scroll-margin-bottom', 'scroll-margin-left',
  'scrollbar-color', 'scrollbar-width',

  // Containment, interaction, and rendering hints
  'contain', 'contain-intrinsic-size', 'container-name', 'container-type',
  'will-change', 'cursor', 'touch-action', 'user-select', 'appearance',
  'accent-color', 'caret-color', 'resize',
];

const EASING_KEYWORDS = {
  linear: { type: 'cubic-bezier', values: [0, 0, 1, 1] },
  ease: { type: 'cubic-bezier', values: [0.25, 0.1, 0.25, 1] },
  'ease-in': { type: 'cubic-bezier', values: [0.42, 0, 1, 1] },
  'ease-out': { type: 'cubic-bezier', values: [0, 0, 0.58, 1] },
  'ease-in-out': { type: 'cubic-bezier', values: [0.42, 0, 0.58, 1] },
  'step-start': { type: 'steps', count: 1, position: 'jump-start' },
  'step-end': { type: 'steps', count: 1, position: 'jump-end' },
};

export function splitCssList(value) {
  const text = String(value ?? '');
  const out = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
  }
  out.push(text.slice(start).trim());
  return out.filter((part) => part.length > 0);
}

export function resolveCssEasing(token) {
  const original = String(token ?? '').trim();
  const normalized = original.toLowerCase();
  if (EASING_KEYWORDS[normalized]) return { token: original, resolved: structuredClone(EASING_KEYWORDS[normalized]), semanticType: normalized === 'linear' ? 'linear' : normalized.startsWith('step-') ? 'steps-alias' : 'css-keyword', parseError: null };
  const bezier = normalized.match(/^cubic-bezier\((.*)\)$/);
  if (bezier) {
    const values = splitCssList(bezier[1]).map(Number);
    if (values.length !== 4 || values.some((v) => !Number.isFinite(v))) {
      return { token: original, resolved: { type: 'cubic-bezier', values: null }, parseError: 'cubic-bezier requires four finite numbers' };
    }
    if (values[0] < 0 || values[0] > 1 || values[2] < 0 || values[2] > 1) {
      return { token: original, resolved: { type: 'cubic-bezier', values }, parseError: 'cubic-bezier x coordinates must be between 0 and 1' };
    }
    return { token: original, resolved: { type: 'cubic-bezier', values }, parseError: null };
  }
  const steps = normalized.match(/^steps\(\s*(\d+)\s*(?:,\s*([^)]+))?\)$/);
  if (steps) return { token: original, resolved: { type: 'steps', count: Number(steps[1]), position: (steps[2] || 'jump-end').trim() }, parseError: null };
  if (/^linear\(/.test(normalized)) return { token: original, resolved: { type: 'linear-stops', stops: splitCssList(original.slice(original.indexOf('(') + 1, -1)) }, parseError: null };
  return { token: original, resolved: { type: 'unknown-function', samples: null }, parseError: original ? 'unrecognized easing token' : 'empty easing token' };
}

function parseCssTime(value) {
  const token = String(value ?? '').trim();
  const match = token.match(/^(-?(?:\d+\.?\d*|\.\d+))(ms|s)$/i);
  if (!match) return { token, ms: null, parseError: 'expected CSS time in ms or s' };
  const number = Number(match[1]);
  return { token, ms: match[2].toLowerCase() === 's' ? number * 1000 : number, parseError: null };
}

const stableTextHash = (text) => {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
};

export function normalizeTransitionTracks(raw) {
  const lists = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, splitCssList(value)]));
  const properties = lists.property?.length ? lists.property : ['all'];
  const defaults = { duration: ['0s'], easing: ['ease'], delay: ['0s'], behavior: ['normal'] };
  return properties.map((property, index) => {
    const pick = (key) => (lists[key]?.length ? lists[key] : defaults[key])[index % (lists[key]?.length || defaults[key].length)];
    const duration = parseCssTime(pick('duration'));
    const delay = parseCssTime(pick('delay'));
    const easing = resolveCssEasing(pick('easing'));
    const track = {
      property,
      duration: duration.token,
      durationMs: duration.ms,
      delay: delay.token,
      delayMs: delay.ms,
      easing,
      easingComputed: easing.token,
      easingResolved: easing.resolved,
      easingAuthored: null,
      behavior: pick('behavior'),
      listSourceIndex: {
        property: index,
        duration: index % (lists.duration?.length || 1),
        easing: index % (lists.easing?.length || 1),
        delay: index % (lists.delay?.length || 1),
        behavior: index % (lists.behavior?.length || 1),
      },
      parseErrors: [duration.parseError, delay.parseError, easing.parseError].filter(Boolean),
    };
    return { trackId: `transition-track-${stableTextHash(JSON.stringify(track))}`, ...track };
  });
}

export function extractTransitions(element, computed, matchedRules = []) {
  const read = (name) => computed?.getPropertyValue ? computed.getPropertyValue(name) : computed?.[name] ?? '';
  const raw = {
    property: read('transition-property'),
    duration: read('transition-duration'),
    easing: read('transition-timing-function'),
    delay: read('transition-delay'),
    behavior: read('transition-behavior'),
  };
  const authored = matchedRules.filter((rule) => (rule.declarations || []).some((d) => d.property?.startsWith('transition')));
  const authoredEasing = authored.flatMap((rule) => rule.declarations || []).filter((declaration) => declaration.property === 'transition-timing-function').at(-1)?.value;
  const authoredEasingList = authoredEasing ? splitCssList(authoredEasing) : [];
  const tracks = normalizeTransitionTracks(raw).map((track, index) => ({ ...track, easingAuthored: authoredEasingList.length ? authoredEasingList[index % authoredEasingList.length] : null }));
  return {
    raw,
    tracks,
    authored,
    element: element?.elementId || null,
  };
}

export function detectStagger(staticCssInventory, elementIndex = []) {
  const systems = [];
  for (const rule of staticCssInventory || []) {
    for (const declaration of rule.declarations || []) {
      const value = declaration.value || '';
      const variableFormula = /calc\([^)]*var\(--[\w-]+\)/i.test(value);
      const nthSelector = /:nth-(?:child|of-type)\(/i.test(rule.selectorText || '');
      if (!variableFormula && !nthSelector) continue;
      systems.push({
        id: `stagger-${systems.length + 1}`,
        status: variableFormula ? 'Observed' : 'Inferred',
        sourceType: variableFormula ? 'css-variable-formula' : 'css-nth-selector',
        selector: rule.selectorText,
        ruleRef: rule.id,
        property: declaration.property,
        expression: value,
        customProperties: [...value.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]),
        intervals: [...value.matchAll(/-?(?:\d+\.?\d*|\.\d+)(?:ms|s)/gi)].map((m) => m[0]),
        instances: elementIndex.filter((entry) => entry.ruleRefs?.includes(rule.id)),
      });
    }
  }
  return systems;
}

const browserEvidenceCollector = (payload) => {
  const { deepProps, options } = payload;
  const mode = options.mode || 'full';
  const stateRef = options.stateRef || `state-${Math.round(performance.now())}`;
  const phase = options.phase || (mode === 'full' ? 'initial' : 'restored-after-cursor');
  const track = options.track || 'forensic';
  const wallMs = Date.now();
  const performanceMs = performance.now();
  const storyProgress = options.storyProgress ?? null;
  const pointer = options.pointer || null;
  const nativeScroll = { x: scrollX, y: scrollY };
  const rootState = window.__siteCapturePhaseB ||= {
    elementIds: new WeakMap(), nextElementId: 1,
    runtimeIds: new WeakMap(), nextRuntimeId: 1,
    observationByElement: new Map(), nextObservationId: 1,
  };
  rootState.knownElements ||= new Map();
  rootState.lastElementRecords ||= new Map();
  rootState.terminalElementIds ||= new Set();

  const splitList = (value) => {
    const text = String(value ?? ''); const out = [];
    let start = 0, depth = 0, quote = '', escaped = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (quote) { if (ch === quote) quote = ''; continue; }
      if (ch === '"' || ch === "'") { quote = ch; continue; }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
    }
    out.push(text.slice(start).trim());
    return out.filter(Boolean);
  };
  const easingKeywords = {
    linear: { type: 'cubic-bezier', values: [0, 0, 1, 1] },
    ease: { type: 'cubic-bezier', values: [0.25, 0.1, 0.25, 1] },
    'ease-in': { type: 'cubic-bezier', values: [0.42, 0, 1, 1] },
    'ease-out': { type: 'cubic-bezier', values: [0, 0, 0.58, 1] },
    'ease-in-out': { type: 'cubic-bezier', values: [0.42, 0, 0.58, 1] },
    'step-start': { type: 'steps', count: 1, position: 'jump-start' },
    'step-end': { type: 'steps', count: 1, position: 'jump-end' },
  };
  const resolveEasing = (token) => {
    const original = String(token ?? '').trim(); const normalized = original.toLowerCase();
    if (easingKeywords[normalized]) return { token: original, resolved: easingKeywords[normalized], semanticType: normalized === 'linear' ? 'linear' : normalized.startsWith('step-') ? 'steps-alias' : 'css-keyword', parseError: null };
    const bezier = normalized.match(/^cubic-bezier\((.*)\)$/);
    if (bezier) {
      const values = splitList(bezier[1]).map(Number);
      let parseError = null;
      if (values.length !== 4 || values.some((v) => !Number.isFinite(v))) parseError = 'cubic-bezier requires four finite numbers';
      else if (values[0] < 0 || values[0] > 1 || values[2] < 0 || values[2] > 1) parseError = 'cubic-bezier x coordinates must be between 0 and 1';
      return { token: original, resolved: { type: 'cubic-bezier', values }, parseError };
    }
    const steps = normalized.match(/^steps\(\s*(\d+)\s*(?:,\s*([^)]+))?\)$/);
    if (steps) return { token: original, resolved: { type: 'steps', count: Number(steps[1]), position: (steps[2] || 'jump-end').trim() }, parseError: null };
    if (/^linear\(/.test(normalized)) return { token: original, resolved: { type: 'linear-stops', stops: splitList(original.slice(original.indexOf('(') + 1, -1)) }, parseError: null };
    return { token: original, resolved: { type: 'unknown-function', samples: null }, parseError: original ? 'unrecognized easing token' : 'empty easing token' };
  };
  const parseTime = (value) => {
    const token = String(value ?? '').trim(); const match = token.match(/^(-?(?:\d+\.?\d*|\.\d+))(ms|s)$/i);
    return match ? { token, ms: Number(match[1]) * (match[2].toLowerCase() === 's' ? 1000 : 1), parseError: null } : { token, ms: null, parseError: 'expected CSS time in ms or s' };
  };
  const normalizeTracks = (raw) => {
    const lists = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, splitList(value)]));
    const properties = lists.property?.length ? lists.property : ['all'];
    const defaults = { duration: ['0s'], easing: ['ease'], delay: ['0s'], behavior: ['normal'] };
    return properties.map((property, index) => {
      const pick = (key) => (lists[key]?.length ? lists[key] : defaults[key])[index % (lists[key]?.length || defaults[key].length)];
      const duration = parseTime(pick('duration')); const delay = parseTime(pick('delay')); const easing = resolveEasing(pick('easing'));
      const track = { property, duration: duration.token, durationMs: duration.ms, delay: delay.token, delayMs: delay.ms, easing, easingComputed: easing.token, easingResolved: easing.resolved, easingAuthored: null, behavior: pick('behavior'), listSourceIndex: { property: index, duration: index % (lists.duration?.length || 1), easing: index % (lists.easing?.length || 1), delay: index % (lists.delay?.length || 1), behavior: index % (lists.behavior?.length || 1) }, parseErrors: [duration.parseError, delay.parseError, easing.parseError].filter(Boolean) };
      return { trackId: `transition-track-${hashText(JSON.stringify(track))}`, ...track };
    });
  };
  const hashText = (text) => {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0).toString(36);
  };
  const isElement = (value) => !!value && value.nodeType === 1 && typeof value.localName === 'string';
  const isDocument = (value) => !!value && value.nodeType === 9;
  const safeValue = (value, depth = 0, seen = new WeakSet()) => {
    if (value == null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (typeof value === 'function') return { kind: 'function', name: value.name || null };
    if (isElement(value)) return { kind: 'dom-element', elementRef: elementId(value), signature: elementSignature(value) };
    if (depth >= 4) return { kind: 'depth-capped' };
    if (typeof value !== 'object') return String(value);
    if (seen.has(value)) return { kind: 'circular-ref' };
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 100).map((item) => safeValue(item, depth + 1, seen));
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return { kind: 'opaque-object', constructor: value.constructor?.name || null };
    const out = {};
    for (const [key, item] of Object.entries(value).slice(0, 100)) out[key] = safeValue(item, depth + 1, seen);
    return out;
  };
  const elementId = (element) => {
    if (!isElement(element)) return null;
    let id = rootState.elementIds.get(element);
    if (!id) { id = `el_${String(rootState.nextElementId++).padStart(6, '0')}`; rootState.elementIds.set(element, id); }
    rootState.knownElements.set(id, element);
    return id;
  };
  const runtimeId = (object, prefix = 'rt') => {
    if (!object || (typeof object !== 'object' && typeof object !== 'function')) return null;
    let id = rootState.runtimeIds.get(object);
    if (!id) { id = `${prefix}_${String(rootState.nextRuntimeId++).padStart(6, '0')}`; rootState.runtimeIds.set(object, id); }
    return id;
  };
  const elementSignature = (element) => {
    if (!element) return null;
    const classes = typeof element.className === 'string' ? element.className.trim().split(/\s+/).filter(Boolean).slice(0, 5) : [];
    const parent = element.parentElement;
    const siblingIndex = parent ? [...parent.children].indexOf(element) + 1 : 1;
    return { tag: element.localName, namespace: element.namespaceURI, id: element.id || null, classes, role: element.getAttribute('role'), siblingIndex };
  };
  const rectValue = (rect) => ({ x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height });
  const documentFor = (element) => element?.ownerDocument || document;
  const windowFor = (element) => documentFor(element).defaultView || window;
  const computedFor = (element, pseudo = null) => windowFor(element).getComputedStyle(element, pseudo);
  const sectionRoot = (element) => {
    if (!element) return null;
    const local = element.closest?.('[data-section],section,main,article,header,footer,nav');
    if (local) return local;
    const root = element.getRootNode?.();
    if (root?.host) return root.host;
    const owner = documentFor(element);
    return owner.body || owner.documentElement;
  };
  const componentRoot = (element) => element.closest?.('[data-component],[role="dialog"],[role="menu"],[role="tablist"],button,a,input,select,textarea,form') || null;
  const safeAttributes = (element) => {
    const allow = ['id', 'role', 'aria-label', 'aria-expanded', 'aria-hidden', 'aria-pressed', 'aria-selected', 'aria-current', 'data-index', 'data-component', 'data-section', 'type', 'alt', 'title'];
    return Object.fromEntries(allow.filter((name) => element.hasAttribute(name)).map((name) => [name, element.getAttribute(name).slice(0, 200)]));
  };
  const supportedProperty = (name) => {
    try { return CSS.supports(name, 'initial') || CSS.supports(name, 'inherit'); } catch { return false; }
  };
  const readProps = (computed, props = deepProps) => Object.fromEntries(props.map((name) => {
    const supported = supportedProperty(name);
    return [name, supported ? { supported: true, value: computed.getPropertyValue(name) } : { supported: false, value: null }];
  }));
  const propValue = (props, name) => props[name]?.value ?? '';
  const acquisition = (method) => ({ track, method });
  const acquiredAt = () => ({ wallMs, performanceMs, storyProgress, nativeScroll, pointer });
  const envelope = (kind, value, extra = {}) => ({
    id: `ev_${hashText(`${kind}:${stateRef}:${JSON.stringify(value).slice(0, 4000)}`)}`,
    kind, stateRef, elementRef: extra.elementRef ?? null,
    componentRef: extra.componentRef ?? null, sectionRef: extra.sectionRef ?? null,
    acquiredAt: acquiredAt(), acquisition: acquisition(extra.method || 'computed-style'),
    status: extra.status || 'Observed', value, caveats: extra.caveats || [],
    evidenceRefs: extra.evidenceRefs || [], derivedFrom: extra.derivedFrom || [],
  });

  const stylesheets = [];
  const cssAccess = [];
  const staticCssInventory = [];
  const keyframes = [];
  const fontFaces = [];
  const propertyRules = [];
  const startingStyles = [];
  const tokens = {};
  const hoverSelectors = [];
  const customPropertyNames = new Set();
  const realms = [];
  const seenRoots = new Set();
  const rootRealms = new WeakMap();
  const addRoot = (root, label) => {
    if (!root || seenRoots.has(root)) return;
    seenRoots.add(root); realms.push({ root, label }); rootRealms.set(root, label);
    const scope = root;
    for (const el of scope.querySelectorAll?.('*') || []) if (el.shadowRoot) addRoot(el.shadowRoot, `${label}/shadow:${elementId(el)}`);
    if (isDocument(root)) for (const frame of root.querySelectorAll('iframe')) {
      try {
        if (frame.contentDocument) addRoot(frame.contentDocument, `${label}/frame:${elementId(frame)}`);
        else cssAccess.push(envelope('css-access', { realm: `${label}/frame:${elementId(frame)}`, href: frame.src || null, reason: 'cross-origin or unavailable frame DOM' }, { method: 'CSSOM', status: 'Unknown' }));
      } catch { cssAccess.push(envelope('css-access', { realm: `${label}/frame:${elementId(frame)}`, href: frame.src || null, reason: 'cross-origin frame DOM inaccessible' }, { method: 'CSSOM', status: 'Unknown' })); }
    }
  };
  addRoot(document, 'document');
  const realmForElement = (element) => rootRealms.get(element?.getRootNode?.()) || rootRealms.get(element?.ownerDocument) || 'document';

  const conditionForRule = (rule, realmView = window) => {
    const name = rule.constructor?.name || '';
    if (name === 'CSSMediaRule') return { type: 'media', text: rule.conditionText, matches: (() => { try { return realmView.matchMedia(rule.conditionText).matches; } catch { return null; } })() };
    if (name === 'CSSSupportsRule') return { type: 'supports', text: rule.conditionText, matches: (() => { try { return realmView.CSS.supports(rule.conditionText); } catch { return null; } })() };
    if (/ContainerRule/.test(name)) return { type: 'container', text: rule.conditionText || rule.cssText?.slice(0, 200), matches: null };
    if (/Layer/.test(name)) return { type: 'layer', text: rule.name || rule.cssText?.slice(0, 200), matches: null };
    if (/Scope/.test(name)) return { type: 'scope', text: rule.cssText?.slice(0, 200), matches: null };
    if (/StartingStyle/.test(name)) return { type: 'starting-style', text: '@starting-style', matches: null };
    return null;
  };
  const serializeDeclarations = (style) => {
    const declarations = [];
    if (!style) return declarations;
    for (let i = 0; i < style.length; i++) {
      const property = style[i]; const value = style.getPropertyValue(property); const priority = style.getPropertyPriority(property);
      declarations.push({ property, value, priority });
      if (property.startsWith('--')) customPropertyNames.add(property);
      for (const match of value.matchAll(/var\((--[\w-]+)/g)) customPropertyNames.add(match[1]);
    }
    return declarations;
  };
  const walkRuleList = (ruleList, baseContext, realmView = window) => {
    for (let index = 0; index < ruleList.length; index++) {
      let rule;
      try { rule = ruleList[index]; } catch (error) {
        cssAccess.push(envelope('css-access', { ...baseContext, ruleIndex: index, reason: String(error) }, { method: 'CSSOM', status: 'Unknown' })); continue;
      }
      const type = rule.constructor?.name || `CSSRule:${rule.type}`;
      const context = { ...baseContext, rulePath: [...(baseContext.rulePath || []), index], conditions: [...(baseContext.conditions || [])] };
      const condition = conditionForRule(rule, realmView); if (condition) context.conditions.push(condition);
      const id = `rule_${hashText(`${context.realm}:${context.sheet}:${context.rulePath.join('.')}:${rule.cssText || ''}`)}`;
      if (/KeyframesRule/.test(type)) {
        const frames = [];
        try { for (let frameIndex = 0; frameIndex < rule.cssRules.length; frameIndex++) { const frame = rule.cssRules[frameIndex]; frames.push({ index: frameIndex, keyText: frame.keyText, cssText: frame.cssText, declarations: serializeDeclarations(frame.style) }); } }
        catch (error) { frames.push({ status: 'Unknown', reason: String(error) }); }
        keyframes.push(envelope('keyframes', { id, name: rule.name, cssText: rule.cssText, context, frames }, { method: 'CSSOM' }));
      } else if (type === 'CSSFontFaceRule') fontFaces.push(rule.cssText);
      else if (type === 'CSSPropertyRule') propertyRules.push(envelope('registered-property', { id, name: rule.name || null, syntax: rule.syntax || null, inherits: rule.inherits ?? null, initialValue: rule.initialValue ?? null, cssText: rule.cssText, context }, { method: 'CSSOM' }));
      else if (/StartingStyle/.test(type)) startingStyles.push(envelope('starting-style', { id, cssText: rule.cssText, context }, { method: 'CSSOM' }));
      if (rule.selectorText || rule.style) {
        const declarations = serializeDeclarations(rule.style);
        const record = { id, type, selectorText: rule.selectorText || null, cssText: rule.cssText, declarations, context };
        staticCssInventory.push(record);
        if (record.selectorText?.includes(':hover') && hoverSelectors.length < 500) hoverSelectors.push(record.selectorText.slice(0, 500));
        if (record.selectorText?.split(',').some((selector) => /^\s*(?::root|html)(?:\s|:|$)/.test(selector))) {
          for (const declaration of declarations) if (declaration.property.startsWith('--')) tokens[declaration.property] = declaration.value;
        }
      }
      if (type === 'CSSImportRule' && rule.styleSheet) {
        try { walkRuleList(rule.styleSheet.cssRules, { ...context, sheet: rule.href || context.sheet, rulePath: [], conditions: context.conditions }, realmView); }
        catch (error) { cssAccess.push(envelope('css-access', { ...context, href: rule.href || null, reason: String(error) }, { method: 'CSSOM', status: 'Unknown' })); }
      } else if (rule.cssRules && !/KeyframesRule/.test(type)) {
        try { if (rule.cssRules.length) walkRuleList(rule.cssRules, context, realmView); }
        catch (error) { cssAccess.push(envelope('css-access', { ...context, reason: String(error) }, { method: 'CSSOM', status: 'Unknown' })); }
      }
    }
  };
  if (mode !== 'runtime') for (const { root, label } of realms) {
    const localSheets = [...(root.styleSheets || [])];
    for (const node of root.querySelectorAll?.('style,link[rel="stylesheet"]') || []) {
      try { if (node.sheet) localSheets.push(node.sheet); } catch {}
    }
    const sheets = [...localSheets, ...(root.adoptedStyleSheets || [])];
    const seenSheets = new Set();
    for (let sheetIndex = 0; sheetIndex < sheets.length; sheetIndex++) {
      const sheet = sheets[sheetIndex]; if (seenSheets.has(sheet)) continue; seenSheets.add(sheet);
      const href = sheet.href || `adopted-or-inline:${sheetIndex}`;
      const entry = { href, realm: label, sheetIndex, adopted: [...(root.adoptedStyleSheets || [])].includes(sheet), rules: null, crossOrigin: false, status: 'Observed' };
      const realmView = isDocument(root) ? root.defaultView : root.host?.ownerDocument?.defaultView;
      try { entry.rules = sheet.cssRules.length; stylesheets.push(entry); walkRuleList(sheet.cssRules, { realm: label, sheet: href, sheetIndex, rulePath: [], conditions: [] }, realmView || window); }
      catch (error) { entry.crossOrigin = true; entry.status = 'Unknown'; entry.reason = String(error); stylesheets.push(entry); cssAccess.push(envelope('css-access', { realm: label, href, reason: String(error), networkAssociation: 'Unknown' }, { method: 'CSSOM', status: 'Unknown' })); }
    }
  }

  const conditionActivation = (context) => {
    const conditions = context?.conditions || [];
    if (conditions.some((condition) => condition.matches === false)) return 'Observed-inactive';
    if (conditions.some((condition) => condition.matches == null && condition.type !== 'layer')) return 'Unknown';
    return 'Observed-active';
  };
  const selectorCandidatesForElement = (element) => staticCssInventory.filter((rule) => {
    if (rule.context?.realm !== realmForElement(element) || !rule.selectorText || rule.selectorText.includes('::')) return false;
    try { return element.matches(rule.selectorText); } catch { return false; }
  });
  const selectorsForElement = (element) => selectorCandidatesForElement(element).filter((rule) => conditionActivation(rule.context) !== 'Observed-inactive');
  const pseudoRulesForElement = (element, pseudo) => staticCssInventory.filter((rule) => {
    if (rule.context?.realm !== realmForElement(element) || conditionActivation(rule.context) === 'Observed-inactive' || !rule.selectorText?.includes(pseudo)) return false;
    return splitList(rule.selectorText).some((selector) => {
      if (!selector.includes(pseudo)) return false;
      const base = selector.replace(/::(?:before|after)\b/gi, '').trim() || '*';
      try { return element.matches(base); } catch { return false; }
    });
  });
  const authoredDeclarations = (rules, propertyRe) => rules.flatMap((rule) => rule.declarations.filter((declaration) => propertyRe.test(declaration.property)).map((declaration) => ({ ruleRef: rule.id, selector: rule.selectorText, ...declaration, context: rule.context, conditionStatus: conditionActivation(rule.context) })));
  const extractTransitionsInPage = (element, computed, matchedRules) => {
    const raw = { property: computed.getPropertyValue('transition-property'), duration: computed.getPropertyValue('transition-duration'), easing: computed.getPropertyValue('transition-timing-function'), delay: computed.getPropertyValue('transition-delay'), behavior: computed.getPropertyValue('transition-behavior') };
    const authored = authoredDeclarations(matchedRules, /^transition/);
    const authoredEasing = authored.filter((declaration) => declaration.property === 'transition-timing-function').at(-1)?.value;
    const authoredEasingList = authoredEasing ? splitList(authoredEasing) : [];
    const tracks = normalizeTracks(raw).map((track, index) => ({ ...track, easingAuthored: authoredEasingList.length ? authoredEasingList[index % authoredEasingList.length] : null }));
    return { id: `transition_${hashText(JSON.stringify(raw))}`, raw, tracks, authored };
  };
  const extractCssAnimationStyle = (computed, matchedRules) => {
    const names = ['name', 'duration', 'timing-function', 'delay', 'iteration-count', 'direction', 'fill-mode', 'play-state', 'composition', 'timeline', 'range-start', 'range-end'];
    const raw = Object.fromEntries(names.map((name) => [name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), computed.getPropertyValue(`animation-${name}`)]));
    const lists = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, splitList(value)]));
    const count = Math.max(1, lists.name?.length || 0);
    const tracks = Array.from({ length: count }, (_, index) => {
      const pick = (key, fallback) => (lists[key]?.length ? lists[key] : [fallback])[index % (lists[key]?.length || 1)];
      const duration = parseTime(pick('duration', '0s')); const delay = parseTime(pick('delay', '0s'));
      return { name: pick('name', 'none'), duration: duration.token, durationMs: duration.ms, easing: resolveEasing(pick('timingFunction', 'ease')), delay: delay.token, delayMs: delay.ms, iterations: pick('iterationCount', '1'), direction: pick('direction', 'normal'), fillMode: pick('fillMode', 'none'), playState: pick('playState', 'running'), composition: pick('composition', 'replace'), timeline: pick('timeline', 'auto'), rangeStart: pick('rangeStart', 'normal'), rangeEnd: pick('rangeEnd', 'normal') };
    });
    return { raw, tracks, authored: authoredDeclarations(matchedRules, /^animation|^(?:scroll|view)-timeline|^timeline-scope/) };
  };
  const meaningfulPseudo = (props, content) => {
    if (content && content !== 'none' && content !== 'normal' && content !== '""') return true;
    const material = ['background-image', 'background-color', 'border-top-width', 'box-shadow', 'filter', 'mask-image', '-webkit-mask-image', 'clip-path', 'transform', 'animation-name'];
    return material.some((name) => { const value = propValue(props, name); return value && !['none', 'normal', '0px', 'rgba(0, 0, 0, 0)'].includes(value); });
  };
  const extractPseudo = (element, pseudo) => {
    try {
      const computed = computedFor(element, pseudo); const props = readProps(computed);
      const rules = pseudoRulesForElement(element, pseudo);
      return envelope('pseudo-element', { pseudo, owner: elementId(element), state: phase, content: computed.getPropertyValue('content'), props, meaningful: meaningfulPseudo(props, computed.getPropertyValue('content')), geometry: { value: null, status: 'Unknown', reason: 'pseudo-elements have no direct DOMRect API' }, matchedRuleRefs: rules.map((rule) => rule.id) }, { elementRef: elementId(element), sectionRef: elementId(sectionRoot(element)), componentRef: elementId(componentRoot(element)), method: 'computed-style' });
    } catch (error) { return envelope('pseudo-element', { pseudo, owner: elementId(element), reason: String(error) }, { elementRef: elementId(element), status: 'Unknown', method: 'computed-style' }); }
  };
  const extractLayout = (element, computed, matchedRules) => {
    const read = (name) => computed.getPropertyValue(name);
    const rect = element.getBoundingClientRect();
    const sibling = (candidate) => candidate ? { elementRef: elementId(candidate), tag: candidate.localName, rect: rectValue(candidate.getBoundingClientRect()), order: computedFor(candidate).order } : null;
    return {
      status: 'Observed', displayModel: read('display'),
      container: { flexDirection: read('flex-direction'), flexWrap: read('flex-wrap'), gridTemplateColumns: read('grid-template-columns'), gridTemplateRows: read('grid-template-rows'), gridTemplateAreas: read('grid-template-areas'), gridAutoFlow: read('grid-auto-flow'), gap: read('gap'), rowGap: read('row-gap'), columnGap: read('column-gap'), justifyContent: read('justify-content'), alignItems: read('align-items'), placeContent: read('place-content') },
      item: { flexGrow: read('flex-grow'), flexShrink: read('flex-shrink'), flexBasis: read('flex-basis'), order: read('order'), gridColumnStart: read('grid-column-start'), gridColumnEnd: read('grid-column-end'), gridRowStart: read('grid-row-start'), gridRowEnd: read('grid-row-end'), alignSelf: read('align-self'), justifySelf: read('justify-self') },
      sizing: { boxSizing: read('box-sizing'), width: read('width'), height: read('height'), minWidth: read('min-width'), maxWidth: read('max-width'), minHeight: read('min-height'), maxHeight: read('max-height'), aspectRatio: read('aspect-ratio') },
      spacing: { marginTop: read('margin-top'), marginRight: read('margin-right'), marginBottom: read('margin-bottom'), marginLeft: read('margin-left'), paddingTop: read('padding-top'), paddingRight: read('padding-right'), paddingBottom: read('padding-bottom'), paddingLeft: read('padding-left') },
      columns: { count: read('column-count'), width: read('column-width'), gap: read('column-gap'), ruleWidth: read('column-rule-width'), ruleStyle: read('column-rule-style'), ruleColor: read('column-rule-color') },
      position: { position: read('position'), top: read('top'), right: read('right'), bottom: read('bottom'), left: read('left'), zIndex: read('z-index') },
      overflow: { x: read('overflow-x'), y: read('overflow-y'), overscrollX: read('overscroll-behavior-x'), overscrollY: read('overscroll-behavior-y'), scrollBehavior: read('scroll-behavior'), snapType: read('scroll-snap-type'), snapAlign: read('scroll-snap-align'), snapStop: read('scroll-snap-stop') },
      containment: { contain: read('contain'), contentVisibility: read('content-visibility'), containIntrinsicSize: read('contain-intrinsic-size'), containerName: read('container-name'), containerType: read('container-type'), willChange: read('will-change') },
      rect: rectValue(rect), clientRects: [...element.getClientRects()].map(rectValue),
      metrics: { offsetWidth: element.offsetWidth, offsetHeight: element.offsetHeight, clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight, naturalWidth: element.naturalWidth ?? null, naturalHeight: element.naturalHeight ?? null },
      siblings: { previous: sibling(element.previousElementSibling), next: sibling(element.nextElementSibling) },
      authoredTracks: authoredDeclarations(matchedRules, /^(?:display|grid|flex|gap|row-gap|column-gap|justify|align|place|contain|container|overflow|scroll-|position|inset|top|right|bottom|left|max-|min-|width|height)/),
    };
  };
  const extractSvgPaint = (element, computed) => {
    const paintValues = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'paint-order', 'vector-effect', 'marker-start', 'marker-mid', 'marker-end', 'filter', 'clip-path', 'mask-image'].map((name) => [name, computed.getPropertyValue(name)]);
    const hasReference = paintValues.some(([, value]) => /url\(/.test(value));
    if (element.namespaceURI !== 'http://www.w3.org/2000/svg' && !hasReference) return null;
    const attributeAllow = ['id', 'viewBox', 'd', 'points', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'filter', 'mask', 'clip-path', 'href', 'xlink:href', 'marker-start', 'marker-mid', 'marker-end', 'offset', 'stop-color', 'stop-opacity'];
    const attributes = Object.fromEntries(attributeAllow.filter((name) => element.hasAttribute(name)).map((name) => [name, element.getAttribute(name).slice(0, 1000)]));
    const references = [];
    for (const [, value] of paintValues) for (const match of value.matchAll(/url\(["']?#([^)'"\s]+)["']?\)/g)) {
      const target = documentFor(element).getElementById(match[1]); references.push({ fragment: `#${match[1]}`, target: target ? { elementRef: elementId(target), tag: target.localName, attributes: safeAttributes(target) } : { status: 'Unknown', reason: 'fragment target not found in owner document' } });
    }
    if ((element.localName === 'use' || element.localName === 'image') && (element.getAttribute('href') || element.getAttribute('xlink:href'))) references.push({ href: element.getAttribute('href') || element.getAttribute('xlink:href') });
    return { status: 'Observed', tag: element.localName, attributes, viewBox: element.ownerSVGElement?.getAttribute('viewBox') || (element.localName === 'svg' ? element.getAttribute('viewBox') : null), computed: Object.fromEntries(paintValues), references };
  };
  const matrixFor = (transform) => {
    try {
      const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
      return { is2D: matrix.is2D, values: [matrix.m11, matrix.m12, matrix.m13, matrix.m14, matrix.m21, matrix.m22, matrix.m23, matrix.m24, matrix.m31, matrix.m32, matrix.m33, matrix.m34, matrix.m41, matrix.m42, matrix.m43, matrix.m44] };
    } catch (error) { return { status: 'Unknown', reason: String(error), values: null }; }
  };
  const extractTransform3D = (element, computed, matchedRules) => {
    const exact = { transform: computed.getPropertyValue('transform'), translate: computed.getPropertyValue('translate'), rotate: computed.getPropertyValue('rotate'), scale: computed.getPropertyValue('scale'), transformOrigin: computed.getPropertyValue('transform-origin'), transformBox: computed.getPropertyValue('transform-box'), transformStyle: computed.getPropertyValue('transform-style'), perspective: computed.getPropertyValue('perspective'), perspectiveOrigin: computed.getPropertyValue('perspective-origin'), backfaceVisibility: computed.getPropertyValue('backface-visibility') };
    const matrix = matrixFor(exact.transform);
    const values = matrix.values;
    return { status: 'Observed', exact, matrix, authored: authoredDeclarations(matchedRules, /^(?:transform|translate|rotate|scale|perspective|backface-visibility)/), decomposition: values ? { status: 'Inferred', reason: 'matrix decomposition is non-unique', translation: [values[12], values[13], values[14]], scaleApprox: [Math.hypot(values[0], values[1], values[2]), Math.hypot(values[4], values[5], values[6]), Math.hypot(values[8], values[9], values[10])] } : { status: 'Unknown', reason: 'matrix unavailable' } };
  };
  const extractTransformAncestorChain = (element) => {
    const chain = []; let ancestor = element.parentElement; const stop = sectionRoot(element)?.parentElement;
    while (ancestor) {
      const computed = computedFor(ancestor); const transform = computed.getPropertyValue('transform'); const perspective = computed.getPropertyValue('perspective'); const transformStyle = computed.getPropertyValue('transform-style');
      const containingBlockTrigger = transform !== 'none' || perspective !== 'none' || computed.filter !== 'none' || computed.contain !== 'none' || computed.willChange !== 'auto';
      if (containingBlockTrigger || transformStyle === 'preserve-3d') chain.push({ elementRef: elementId(ancestor), signature: elementSignature(ancestor), transform, matrix: matrixFor(transform), perspective, perspectiveOrigin: computed.getPropertyValue('perspective-origin'), transformOrigin: computed.getPropertyValue('transform-origin'), transformStyle, flatteningBoundary: transformStyle !== 'preserve-3d', containingBlockTrigger, stackingTrigger: computed.opacity !== '1' || computed.zIndex !== 'auto' || containingBlockTrigger, rect: rectValue(ancestor.getBoundingClientRect()) });
      if (ancestor === stop || ancestor === documentFor(element).documentElement) break;
      ancestor = ancestor.parentElement;
    }
    return { status: chain.length ? 'Observed' : 'Observed', chain, caveat: 'exact matrices are observed; any decomposition is Inferred' };
  };
  const assetRefsFor = (element, computed) => {
    const refs = [];
    if (element.currentSrc) refs.push({ kind: 'currentSrc', value: element.currentSrc });
    for (const name of ['background-image', 'mask-image', '-webkit-mask-image', 'border-image-source', 'content']) {
      const value = computed.getPropertyValue(name);
      for (const match of value.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) refs.push({ kind: name, value: match[1] });
    }
    if (element.localName === 'canvas') refs.push({ kind: 'canvas-facts', width: element.width, height: element.height, cssRect: rectValue(element.getBoundingClientRect()), sceneGraph: { value: null, status: 'Unknown', reason: 'canvas content is not a DOM subtree' }, camera: { value: null, status: 'Unknown', reason: 'canvas scene graph is not exposed' }, materials: { value: null, status: 'Unknown', reason: 'canvas scene graph is not exposed' } });
    return refs;
  };

  const collectAnimationRoots = () => realms.map(({ root }) => root).filter((root) => typeof root.getAnimations === 'function');
  const timelineTimeValue = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (value && typeof value.value === 'number') return { value: value.value, unit: typeof value.unit === 'string' ? value.unit : null };
    return safeValue(value);
  };
  const extractRuntimeAnimations = () => {
    const animations = []; const seen = new Set();
    for (const root of collectAnimationRoots()) {
      let list;
      try { list = root.getAnimations({ subtree: true }); } catch (error) { animations.push(envelope('runtime-animation', { reason: String(error) }, { method: 'runtime-public-api', status: 'Unknown' })); continue; }
      for (const animation of list) {
        if (seen.has(animation)) continue; seen.add(animation);
        const id = runtimeId(animation, 'anim');
        try {
          const effect = animation.effect; const target = isElement(effect?.target) ? effect.target : null;
          let timing = null, computedTiming = null, frames = null;
          try { timing = safeValue(effect?.getTiming?.() || null); } catch (error) { timing = { status: 'Unknown', reason: String(error) }; }
          try { computedTiming = safeValue(effect?.getComputedTiming?.() || null); } catch (error) { computedTiming = { status: 'Unknown', reason: String(error) }; }
          try { frames = safeValue(effect?.getKeyframes?.() || null); } catch (error) { frames = { status: 'Unknown', reason: String(error) }; }
          animations.push(envelope('runtime-animation', { id, constructor: animation.constructor?.name || null, cssAnimationName: animation.animationName || null, animationId: animation.id || null, playState: animation.playState, pending: animation.pending, currentTime: timelineTimeValue(animation.currentTime), startTime: timelineTimeValue(animation.startTime), playbackRate: animation.playbackRate, replaceState: animation.replaceState ?? null, timeline: animation.timeline ? { type: animation.timeline.constructor?.name || null, currentTime: timelineTimeValue(animation.timeline.currentTime) } : null, effect: effect ? { type: effect.constructor?.name || null, targetElementRef: elementId(target), pseudoElement: effect.pseudoElement || null, timing, computedTiming, keyframes: frames } : null }, { elementRef: elementId(target), componentRef: elementId(target && componentRoot(target)), sectionRef: elementId(target && sectionRoot(target)), method: 'runtime-public-api' }));
        } catch (error) { animations.push(envelope('runtime-animation', { id, reason: String(error) }, { method: 'runtime-public-api', status: 'Unknown' })); }
      }
    }
    return animations;
  };
  const readPublicMethod = (node, name) => {
    try { return typeof node?.[name] === 'function' ? safeValue(node[name]()) : null; }
    catch (error) { return { status: 'Unknown', reason: String(error) }; }
  };
  const safeGsapVars = (vars) => {
    if (!vars || typeof vars !== 'object') return {};
    const always = new Set(['duration', 'delay', 'ease', 'stagger', 'keyframes', 'repeat', 'repeatDelay', 'yoyo', 'paused', 'scrollTrigger', 'x', 'y', 'z', 'xPercent', 'yPercent', 'rotation', 'rotationX', 'rotationY', 'rotationZ', 'scale', 'scaleX', 'scaleY', 'opacity', 'autoAlpha', 'backgroundColor', 'color', 'clipPath', 'filter', 'transform', 'transformOrigin']);
    const out = {};
    for (const [key, value] of Object.entries(vars)) {
      if (/^(?:on|callbackScope)/.test(key)) { if (typeof value === 'function') out[key] = { kind: 'function', name: value.name || null }; continue; }
      if (always.has(key)) out[key] = safeValue(value);
    }
    return out;
  };
  const extractGsap = () => {
    const gsap = window.gsap && typeof window.gsap.globalTimeline?.getChildren === 'function' ? window.gsap : null;
    if (!gsap) return envelope('gsap', { reason: 'no public window.gsap global', hiddenOrBundledUse: 'Unknown' }, { method: 'runtime-public-api', status: 'Unknown' });
    let children;
    try { children = gsap.globalTimeline.getChildren(true, true, true); }
    catch (error) { return envelope('gsap', { version: gsap.version || null, reason: String(error) }, { method: 'runtime-public-api', status: 'Unknown' }); }
    const nodes = children.map((node) => {
      const vars = safeGsapVars(node.vars); const targets = (() => { try { return typeof node.targets === 'function' ? node.targets().map((target) => isElement(target) ? { kind: 'dom-element', elementRef: elementId(target), signature: elementSignature(target) } : { kind: 'opaque-object', values: Object.fromEntries(Object.keys(vars).filter((key) => target && ['string', 'number', 'boolean'].includes(typeof target[key])).map((key) => [key, target[key]])) }) : []; } catch (error) { return [{ status: 'Unknown', reason: String(error) }]; } })();
      let ease = vars.ease ?? null;
      if (typeof node.vars?.ease === 'function') { try { ease = { type: 'sampled-function', samples: Array.from({ length: 21 }, (_, i) => [i / 20, node.vars.ease(i / 20)]) }; } catch (error) { ease = { type: 'sampled-function', samples: null, status: 'Unknown', reason: String(error) }; } }
      let orderedChildIds = [];
      try { if (typeof node.getChildren === 'function') orderedChildIds = node.getChildren(false, true, true).map((child) => runtimeId(child, 'gsap')); } catch {}
      return { id: runtimeId(node, 'gsap'), type: node.constructor?.name || null, parentId: runtimeId(node.parent, 'gsap'), orderedChildIds, labels: safeValue(node.labels || null), startTime: readPublicMethod(node, 'startTime'), endTime: readPublicMethod(node, 'endTime'), duration: readPublicMethod(node, 'duration'), totalDuration: readPublicMethod(node, 'totalDuration'), delay: readPublicMethod(node, 'delay'), repeat: readPublicMethod(node, 'repeat'), repeatDelay: readPublicMethod(node, 'repeatDelay'), yoyo: readPublicMethod(node, 'yoyo'), timeScale: readPublicMethod(node, 'timeScale'), paused: readPublicMethod(node, 'paused'), reversed: readPublicMethod(node, 'reversed'), progress: readPublicMethod(node, 'progress'), totalProgress: readPublicMethod(node, 'totalProgress'), targets, vars, ease };
    });
    return envelope('gsap', { version: gsap.version || null, capturedAt: performance.now(), globalTimeline: { id: runtimeId(gsap.globalTimeline, 'gsap'), labels: safeValue(gsap.globalTimeline.labels || null) }, children: nodes }, { method: 'runtime-public-api' });
  };
  const extractScrollTriggers = () => {
    let globals = null; try { globals = window.gsap?.core?.globals?.() || null; } catch {}
    const ScrollTrigger = window.ScrollTrigger ?? globals?.ScrollTrigger ?? null;
    if (!ScrollTrigger || typeof ScrollTrigger.getAll !== 'function') return envelope('scroll-trigger', { reason: 'no public ScrollTrigger.getAll API', hiddenOrBundledUse: 'Unknown' }, { method: 'runtime-public-api', status: 'Unknown' });
    try {
      const triggers = ScrollTrigger.getAll().map((trigger) => {
        const vars = trigger.vars || {};
        const ref = (value) => isElement(value) ? elementId(value) : typeof value === 'string' ? value : null;
        const allowed = ['start', 'end', 'scrub', 'pin', 'pinSpacing', 'snap', 'toggleActions', 'toggleClass', 'once', 'horizontal', 'invalidateOnRefresh', 'anticipatePin', 'markers'];
        return { id: trigger.id || vars.id || runtimeId(trigger, 'trigger'), resolved: { start: safeValue(trigger.start), end: safeValue(trigger.end), progress: safeValue(trigger.progress), direction: safeValue(trigger.direction), isActive: safeValue(trigger.isActive), enabled: typeof trigger.enabled === 'function' ? safeValue(trigger.enabled()) : safeValue(trigger.enabled) }, refs: { trigger: ref(trigger.trigger || vars.trigger), endTrigger: ref(trigger.endTrigger || vars.endTrigger), scroller: ref(trigger.scroller || vars.scroller), pin: ref(trigger.pin || vars.pin), animation: runtimeId(trigger.animation, 'gsap') }, authored: Object.fromEntries(allowed.filter((key) => key in vars).map((key) => [key, safeValue(vars[key])])), capturedAt: { performanceMs: performance.now(), viewport: { width: innerWidth, height: innerHeight }, nativeScroll: { x: scrollX, y: scrollY } } };
      });
      return envelope('scroll-trigger', { version: ScrollTrigger.version || null, triggers }, { method: 'runtime-public-api' });
    } catch (error) { return envelope('scroll-trigger', { reason: String(error) }, { method: 'runtime-public-api', status: 'Unknown' }); }
  };

  const runtimeAnimations = extractRuntimeAnimations();
  const gsap = extractGsap();
  const scrollTriggers = extractScrollTriggers();
  if (mode === 'runtime') return { schemaVersion: 'phase-b-v1', stylePropertySet: options.stylePropertySet, stateRef, runtimeAnimations, gsap, scrollTriggers };

  const animationTargetIds = new Set(runtimeAnimations.map((record) => record.elementRef).filter(Boolean));
  const captureable = [];
  const candidates = [];
  const seenCandidates = new Set();
  const candidateLists = [];
  for (const { root } of realms) {
    const roots = isDocument(root) ? [root.documentElement, root.body] : [root.host];
    candidateLists.push([...roots, ...(root.querySelectorAll?.('*') || [])].filter(isElement));
  }
  for (let offset = 0; candidateLists.some((list) => offset < list.length); offset++) {
    for (const list of candidateLists) {
      const element = list[offset];
      if (!element || seenCandidates.has(element)) continue;
      seenCandidates.add(element); candidates.push(element);
    }
  }
  const maxElements = options.maxElements || (mode === 'full' ? 350 : 500);
  for (const element of candidates) {
    if (captureable.length >= maxElements) break;
    const id = elementId(element);
    if (Array.isArray(options.elementRefs) && options.elementRefs.length && !options.elementRefs.includes(id)) continue;
    const computed = computedFor(element); const rect = element.getBoundingClientRect(); const ownerWindow = windowFor(element);
    if (computed.display === 'none' || computed.visibility === 'hidden') continue;
    const intersects = rect.width > 0 && rect.height > 0 && rect.bottom >= -50 && rect.top <= ownerWindow.innerHeight + 50;
    const nearInitial = rect.width > 3 && rect.height > 3 && rect.bottom >= 0 && rect.top <= ownerWindow.innerHeight * 3;
    const semantic = /^(?:HTML|BODY|SECTION|MAIN|ARTICLE|HEADER|FOOTER|NAV|BUTTON|A|INPUT|SELECT|TEXTAREA|FORM|CANVAS|SVG)$/.test(element.tagName) || element.hasAttribute('role');
    const anchored = ['fixed', 'sticky'].includes(computed.position);
    if ((mode === 'full' ? nearInitial : intersects) || semantic || anchored || animationTargetIds.has(id)) captureable.push(element);
  }

  const elements = [];
  const pseudoStates = [];
  const transitionInventory = [];
  for (const element of captureable) {
    try {
      const id = elementId(element); const computed = computedFor(element); const matchedRules = selectorsForElement(element); const ownerWindow = windowFor(element);
      const props = readProps(computed); const propsHash = hashText(JSON.stringify(props)); const previous = rootState.observationByElement.get(id);
      const observationId = `obs_${String(rootState.nextObservationId++).padStart(7, '0')}`;
      const before = extractPseudo(element, '::before'); const after = extractPseudo(element, '::after');
      pseudoStates.push(before, after);
      const transitions = extractTransitionsInPage(element, computed, matchedRules);
      transitionInventory.push(envelope('transition', transitions, { elementRef: id, componentRef: elementId(componentRoot(element)), sectionRef: elementId(sectionRoot(element)), method: 'computed-style' }));
      const cssAnimations = extractCssAnimationStyle(computed, matchedRules);
      cssAnimations.keyframeLinks = cssAnimations.tracks.map((track) => {
        const realm = realmForElement(element);
        const candidates = keyframes.filter((record) => record.value?.name === track.name && record.value?.context?.realm === realm);
        const contextual = candidates.map((record) => {
          const conditions = record.value?.context?.conditions || [];
          const inactive = conditions.some((condition) => condition.matches === false);
          const unresolved = conditions.some((condition) => condition.matches == null && !['layer'].includes(condition.type));
          const active = inactive ? false : unresolved ? null : true;
          return { ruleRef: record.value?.id || record.id, evidenceRef: record.id, activeCondition: active === true ? 'Observed-active' : active === false ? 'Observed-inactive' : 'Unknown', conditions };
        });
        const viable = contextual.filter((candidate) => candidate.activeCondition !== 'Observed-inactive');
        const inaccessibleInRealm = cssAccess.some((record) => record.status === 'Unknown' && record.value?.realm === realm);
        const uniquelyProven = viable.length === 1 && viable[0].activeCondition === 'Observed-active' && !inaccessibleInRealm;
        return {
          animationName: track.name, realm, candidateRuleRefs: candidates.map((record) => record.value?.id || record.id), candidates: contextual,
          status: track.name === 'none' ? 'Observed' : uniquelyProven ? 'Observed' : viable.length ? 'Inferred' : 'Unknown',
          reason: track.name === 'none' ? 'no animation requested' : uniquelyProven ? null : viable.length ? 'all same-name realm candidates retained; active conditions or unseen CSS prevent proving the cascade winner' : 'no active accessible same-name keyframes rule in this realm',
        };
      });
      const rect = element.getBoundingClientRect(); const section = sectionRoot(element); const component = componentRoot(element);
      const relevantCustomProps = {};
      for (const name of [...customPropertyNames].slice(0, 200)) { const value = computed.getPropertyValue(name); if (value) relevantCustomProps[name] = value; }
      for (let i = 0; i < element.style.length; i++) if (element.style[i].startsWith('--')) relevantCustomProps[element.style[i]] = computed.getPropertyValue(element.style[i]);
      const observation = {
        observationId, stateRef, phase,
        realm: realmForElement(element),
        visibility: { intersectsViewport: rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= ownerWindow.innerHeight, display: computed.display, visibility: computed.visibility, opacity: computed.opacity, hitTest: (() => { if (!(rect.width > 0 && rect.height > 0)) return false; const x = Math.min(ownerWindow.innerWidth - 1, Math.max(0, rect.left + rect.width / 2)); const y = Math.min(ownerWindow.innerHeight - 1, Math.max(0, rect.top + rect.height / 2)); return documentFor(element).elementsFromPoint?.(x, y)?.includes(element) || false; })() },
        rects: { bounding: rectValue(rect), clients: [...element.getClientRects()].map(rectValue), offsetWidth: element.offsetWidth, offsetHeight: element.offsetHeight, clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth, scrollHeight: element.scrollHeight, naturalWidth: element.naturalWidth ?? null, naturalHeight: element.naturalHeight ?? null },
        props: previous?.hash === propsHash ? null : props,
        propsHash, sameAsObservationId: previous?.hash === propsHash ? previous.observationId : null,
        authoredRuleRefs: matchedRules.map((rule) => rule.id), authoredRuleCandidates: selectorCandidatesForElement(element).map((rule) => ({ ruleRef: rule.id, conditionStatus: conditionActivation(rule.context) })), customProperties: relevantCustomProps,
        layout: extractLayout(element, computed, matchedRules), svgPaint: extractSvgPaint(element, computed),
        pseudo: { before: before.id, after: after.id }, transitions, cssAnimations,
        runtimeAnimationRefs: runtimeAnimations.filter((record) => record.elementRef === id).map((record) => record.id),
        gsapTweenRefs: gsap.value?.children?.filter((node) => node.targets?.some((target) => target.elementRef === id)).map((node) => node.id) || [],
        scrollTriggerRefs: scrollTriggers.value?.triggers?.filter((trigger) => Object.values(trigger.refs || {}).includes(id)).map((trigger) => trigger.id) || [],
        transform3d: { ...extractTransform3D(element, computed, matchedRules), ancestorChain: extractTransformAncestorChain(element) },
        assetRefs: assetRefsFor(element, computed), frameRefs: options.frameRefs || [], dwellRef: options.dwellRef || null, cursorProbeRefs: options.cursorProbeRefs || [], status: 'Observed', caveats: [],
      };
      rootState.observationByElement.set(id, { hash: propsHash, observationId });
      const elementRecord = { elementId: id, realm: realmForElement(element), signature: elementSignature(element), safeAttributes: safeAttributes(element), sectionRef: elementId(section), componentRef: elementId(component), observation };
      const derivationCandidates = [...rootState.lastElementRecords.values()].filter((record) => record.detached && JSON.stringify(record.signature) === JSON.stringify(elementRecord.signature)).map((record) => record.elementId);
      if (!previous && derivationCandidates.length) elementRecord.derivedFromCandidates = derivationCandidates.map((elementRef) => ({ elementRef, status: 'Inferred', reason: 'structural signature matches a detached predecessor; identity continuity was not proven' }));
      elements.push(elementRecord);
      rootState.lastElementRecords.set(id, { elementId: id, realm: elementRecord.realm, signature: elementRecord.signature, sectionRef: elementRecord.sectionRef, componentRef: elementRecord.componentRef, detached: false });
    } catch (error) {
      const id = elementId(element); elements.push({ elementId: id, realm: realmForElement(element), signature: elementSignature(element), sectionRef: elementId(sectionRoot(element)), componentRef: elementId(componentRoot(element)), observation: { observationId: `obs_${String(rootState.nextObservationId++).padStart(7, '0')}`, stateRef, phase, status: 'Unknown', caveats: [String(error)] } });
    }
  }

  for (const [id, knownElement] of rootState.knownElements) {
    if (knownElement.isConnected || rootState.terminalElementIds.has(id)) continue;
    const prior = rootState.lastElementRecords.get(id) || { elementId: id, signature: elementSignature(knownElement), sectionRef: null, componentRef: null, realm: 'Unknown' };
    elements.push({ elementId: id, realm: prior.realm, signature: prior.signature, sectionRef: prior.sectionRef, componentRef: prior.componentRef, observation: { observationId: `obs_${String(rootState.nextObservationId++).padStart(7, '0')}`, stateRef, phase: 'detached', status: 'Observed', terminal: { kind: 'detached-or-replaced', status: 'Observed' }, props: null, caveats: ['element identity ended; any similar successor receives a new ID'] } });
    prior.detached = true; rootState.lastElementRecords.set(id, prior); rootState.terminalElementIds.add(id);
  }

  const staggerSystems = [];
  for (const rule of staticCssInventory) for (const declaration of rule.declarations) {
    const variableFormula = /calc\([^)]*var\(--[\w-]+\)/i.test(declaration.value);
    const nthSelector = /:nth-(?:child|of-type)\(/i.test(rule.selectorText || '');
    if (!variableFormula && !nthSelector) continue;
    let matched = [];
    const realmRoot = realms.find((entry) => entry.label === rule.context?.realm)?.root;
    try { matched = [...(realmRoot?.querySelectorAll?.(rule.selectorText.replace(/::(?:before|after)/g, '')) || [])]; } catch {}
    const customProperties = [...declaration.value.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]);
    const activation = conditionActivation(rule.context);
    staggerSystems.push(envelope('stagger-system', {
      id: `stagger_${hashText(`${rule.id}:${declaration.property}:${declaration.value}`)}`,
      sourceType: variableFormula ? 'css-variable-formula' : 'css-nth-selector', selector: rule.selectorText,
      ruleRef: rule.id, ruleContext: rule.context, property: declaration.property, expression: declaration.value,
      parsedNodes: { operators: [...declaration.value.matchAll(/[+*/-]/g)].map((match) => match[0]), variables: customProperties, functions: [...declaration.value.matchAll(/(?:calc|min|max|clamp)\(/g)].map((match) => match[0].slice(0, -1)) },
      customProperties, intervals: [...declaration.value.matchAll(/-?(?:\d+\.?\d*|\.\d+)(?:ms|s)/gi)].map((match) => match[0]),
      direction: /\*\s*-/.test(declaration.value) ? 'reverse' : 'forward-or-rule-defined', bounds: [...declaration.value.matchAll(/(?:min|max|clamp)\([^)]*\)/g)].map((match) => match[0]),
      instances: matched.map((item, index) => {
        const style = computedFor(item); const matchedRules = selectorsForElement(item);
        return { elementRef: elementId(item), domOrder: index, visualOrder: style.order, indexValue: item.getAttribute('data-index') || style.getPropertyValue('--i') || null, customProperties: Object.fromEntries(customProperties.map((name) => [name, style.getPropertyValue(name)])), transitionDelay: style.transitionDelay, animationDelay: style.animationDelay, transitionTracks: extractTransitionsInPage(item, style, matchedRules).tracks, animationTracks: extractCssAnimationStyle(style, matchedRules).tracks, observedStartTime: { value: null, status: 'Unknown', reason: 'no matching lifecycle event was linked to this instance in this state' } };
      }),
    }, { method: 'CSSOM', status: activation === 'Observed-inactive' ? 'Unknown' : variableFormula && activation === 'Observed-active' ? 'Observed' : 'Inferred', caveats: [
      ...(activation === 'Observed-inactive' ? ['rule conditions were observed inactive in this state'] : activation === 'Unknown' ? ['rule condition activation could not be proven in this state'] : []),
      ...(!variableFormula ? ['Selector order suggests staggering; an authored arithmetic interval was not proven.'] : []),
    ] }));
  }
  for (const node of gsap.value?.children || []) if (node.vars?.stagger != null) staggerSystems.push(envelope('stagger-system', { id: `stagger_${node.id}`, sourceType: 'gsap-stagger', tweenRef: node.id, stagger: node.vars.stagger, targets: node.targets }, { method: 'runtime-public-api' }));
  for (const node of gsap.value?.children || []) {
    const children = (node.orderedChildIds || []).map((childId) => gsap.value.children.find((candidate) => candidate.id === childId)).filter(Boolean);
    const offsets = children.map((child) => ({ tweenRef: child.id, startTime: child.startTime })).filter((entry) => typeof entry.startTime === 'number');
    if (offsets.length > 1 && new Set(offsets.map((entry) => entry.startTime)).size > 1) staggerSystems.push(envelope('stagger-system', { id: `stagger_offsets_${node.id}`, sourceType: 'gsap-timeline-child-offsets', timelineRef: node.id, offsets }, { method: 'runtime-public-api', status: 'Observed', caveats: ['Public child start offsets are observed; the author may have produced them without GSAP stagger syntax.'] }));
  }
  for (const element of elements) element.observation.staggerSystemRefs = staggerSystems.filter((system) => system.value?.instances?.some((instance) => instance.elementRef === element.elementId) || system.value?.targets?.some((target) => target.elementRef === element.elementId)).map((system) => system.id);

  // Keep the original Phase A sample shape for existing consumers.
  const computedLegacy = []; const seenLegacy = new Set(); const palette = {};
  const legacyProps = ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'background-color', 'background-image', 'opacity', 'transform', 'border-radius', 'box-shadow', 'filter', 'backdrop-filter', 'mix-blend-mode', 'cursor', 'position', 'z-index'];
  for (const element of document.querySelectorAll('body *')) {
    if (computedLegacy.length >= 250) break;
    const rect = element.getBoundingClientRect(); if (rect.width < 4 || rect.height < 4 || rect.bottom < 0 || rect.top > innerHeight * 3) continue;
    const computed = getComputedStyle(element); if (computed.visibility === 'hidden' || computed.display === 'none') continue;
    const props = {}; for (const name of legacyProps) { const value = computed.getPropertyValue(name); if (value && value !== 'none' && value !== 'normal' && value !== 'auto') props[name] = value.slice(0, 200); }
    const signature = element.tagName + JSON.stringify(props); if (seenLegacy.has(signature)) continue; seenLegacy.add(signature);
    computedLegacy.push({ tag: element.tagName.toLowerCase(), cls: (typeof element.className === 'string' ? element.className : '').slice(0, 120), rect: { x: Math.round(rect.x), y: Math.round(rect.y + scrollY), w: Math.round(rect.width), h: Math.round(rect.height) }, props });
    for (const key of ['color', 'background-color']) if (props[key]) palette[props[key]] = (palette[props[key]] || 0) + 1;
  }
  const loadedFonts = []; try { for (const font of document.fonts) loadedFonts.push({ family: font.family, weight: font.weight, style: font.style, stretch: font.stretch, status: font.status }); } catch {}
  const textOutline = []; for (const heading of document.querySelectorAll('h1,h2,h3,[role=heading]')) { if (textOutline.length >= 60) break; const text = heading.textContent.trim().slice(0, 160); if (text) textOutline.push({ tag: heading.tagName.toLowerCase(), text, y: Math.round(heading.getBoundingClientRect().top + scrollY) }); }
  const legacyAnimations = runtimeAnimations.slice(0, 100).map((record) => ({ kind: record.value?.constructor || 'Animation', name: record.value?.cssAnimationName || record.value?.animationId || '', duration: record.value?.effect?.timing?.duration ?? null, delay: record.value?.effect?.timing?.delay ?? null, easing: record.value?.effect?.timing?.easing ?? null, iterations: record.value?.effect?.timing?.iterations ?? null, state: record.value?.playState || null, target: record.value?.effect?.targetElementRef || '' }));

  const rt = {};
  rt.three = !!(window.THREE || window.__THREE__); rt.gsap = !!window.gsap;
  rt.scrollTrigger = !!(window.ScrollTrigger || window.gsap?.plugins?.scrollTrigger || window.gsap?.core?.globals?.()?.ScrollTrigger);
  rt.lenis = !!(window.lenis || window.Lenis); rt.locomotive = !!window.LocomotiveScroll;
  rt.barba = !!window.barba; rt.swup = !!window.Swup;
  rt.next = !!window.__NEXT_DATA__ || !!document.querySelector('#__next'); rt.nuxt = !!window.__NUXT__ || !!document.querySelector('#__nuxt');
  rt.astro = !!document.querySelector('astro-island,[data-astro-cid],astro-dev-toolbar'); rt.webflow = !!window.Webflow || !!document.querySelector('html[data-wf-site]');
  rt.pixi = !!window.PIXI; rt.babylon = !!window.BABYLON; rt.ogl = !!window.OGL;
  rt.regl = typeof window.regl === 'function' || !!window._regl; rt.curtains = !!(window.Curtains || window.curtains);
  rt.framer = !!document.querySelector('[data-framer-name],[data-framer-component-type]') || /framer/i.test(document.querySelector('meta[name="generator"]')?.content || '');
  rt.framerMotion = !!((window.Motion && typeof window.Motion.animate === 'function') || window.framerMotion || window.FramerMotion) || !!document.querySelector('[data-framer-component-type]');
  rt.react = !!window.React || !!document.querySelector('[data-reactroot],#__next');
  rt.vue = !!window.Vue || !!document.querySelector('[data-v-app],[data-vue-meta]') || !!document.querySelector('#app')?.__vue_app__;
  rt.svelte = !!window.__svelte || !!document.querySelector('[class*="svelte-"]'); rt.angular = !!window.ng || !!document.querySelector('[ng-version]');
  const canvases = realms.flatMap(({ root }) => [...(root.querySelectorAll?.('canvas') || [])]); rt.canvasCount = new Set(canvases).size;
  const canvasContexts = [];
  for (const { root, label } of realms) {
    if (!isDocument(root)) continue;
    try {
      const records = root.defaultView?.__scapCanvasContexts?.() || [];
      for (const record of records) canvasContexts.push({ realm: label, ...record });
    } catch {}
  }
  rt.canvasContexts = canvasContexts;
  rt.webgl = canvasContexts.some((record) => record.contextTypes?.some((type) => /^(?:webgl2?|experimental-webgl)$/.test(type)));
  if (window.gsap?.version) rt.gsapVersion = window.gsap.version;
  if (window.THREE?.REVISION) rt.threeRevision = window.THREE.REVISION;
  if (window.PIXI?.VERSION) rt.pixiVersion = window.PIXI.VERSION;
  if (window.BABYLON?.Engine?.Version) rt.babylonVersion = window.BABYLON.Engine.Version;
  if (window.React?.version) rt.reactVersion = window.React.version;
  if (window.Vue?.version) rt.vueVersion = window.Vue.version;

  return {
    schemaVersion: 'phase-b-v1', stylePropertySet: options.stylePropertySet,
    stateRef, tokens, fontFaces, loadedFonts, stylesheets, cssAccess,
    staticCssInventory, propertyRules, startingStyles, keyframes,
    computed: computedLegacy, palette, animations: legacyAnimations,
    runtimeAnimations, transitionInventory, pseudoStates, staggerSystems,
    elements, gsap, scrollTriggers, hoverSelectors: [...new Set(hoverSelectors)],
    textOutline, runtime: rt,
    listenerCounts: window.__scap?.listenerCounts || {},
    instrumentationEvents: typeof window.__scapPeek === 'function' ? window.__scapPeek().slice(-2000) : [],
    unknowns: [
      ...(rt.canvasCount ? [{ field: 'canvas.sceneGraph', status: 'Unknown', reason: 'canvas content is not DOM-readable; frames and timed reactions are the evidence' }] : []),
      ...(rt.canvasCount && !canvasContexts.length ? [{ field: 'canvas.contextType', status: 'Unknown', reason: 'no author getContext call was observed; evidence collection did not initialize a context' }] : []),
      ...cssAccess.filter((record) => record.status === 'Unknown').map((record) => ({ field: 'crossOriginCSS.ruleAssociation', status: 'Unknown', reason: record.value?.reason || 'CSSOM inaccessible', evidenceRefs: [record.id] })),
      ...(gsap.status === 'Unknown' ? [{ field: 'gsap.timelineTree', status: 'Unknown', reason: gsap.value.reason, evidenceRefs: [gsap.id] }] : []),
    ],
  };
};

async function evaluateEvidence(page, options) {
  return await page.evaluate(browserEvidenceCollector, { deepProps: DEEP_PROPS, options: { stylePropertySet: STYLE_PROPERTY_SET, ...options } });
}

export async function collectPageEvidence(page) {
  return await evaluateEvidence(page, { mode: 'full', phase: 'initial', track: 'forensic', stateRef: 'state_initial' });
}

export async function snapshotDeepState(page, options = {}) {
  return await evaluateEvidence(page, { ...options, mode: 'deep', track: 'forensic' });
}

export async function snapshotRuntimeMotion(page, options = {}) {
  return await evaluateEvidence(page, { ...options, mode: 'runtime', track: 'forensic' });
}

export async function extractKeyframes(page) { return (await evaluateEvidence(page, { mode: 'full', maxElements: 1 })).keyframes; }
export async function extractRuntimeAnimations(page) { return (await snapshotRuntimeMotion(page)).runtimeAnimations; }
export async function extractGsap(page) { return (await snapshotRuntimeMotion(page)).gsap; }
export async function extractScrollTriggers(page) { return (await snapshotRuntimeMotion(page)).scrollTriggers; }
export async function walkCssRules(page) {
  const evidence = await evaluateEvidence(page, { mode: 'full', maxElements: 1 });
  return { rules: evidence.staticCssInventory, access: evidence.cssAccess, keyframes: evidence.keyframes, propertyRules: evidence.propertyRules, startingStyles: evidence.startingStyles };
}
export async function snapshotElementState(page, selector, options = {}) {
  const elementRef = await page.evaluate((value) => {
    const element = document.querySelector(value);
    if (!element) return null;
    const state = window.__siteCapturePhaseB ||= { elementIds: new WeakMap(), nextElementId: 1, runtimeIds: new WeakMap(), nextRuntimeId: 1, observationByElement: new Map(), nextObservationId: 1 };
    let id = state.elementIds.get(element);
    if (!id) { id = `el_${String(state.nextElementId++).padStart(6, '0')}`; state.elementIds.set(element, id); }
    return id;
  }, selector);
  if (!elementRef) return { status: 'Unknown', reason: `selector did not match: ${selector}` };
  const evidence = await snapshotDeepState(page, { ...options, elementRefs: [elementRef] });
  return evidence.elements.find((element) => element.elementId === elementRef) || { elementId: elementRef, status: 'Unknown', reason: 'element detached before snapshot' };
}
export async function extractPseudo(page, options = {}) { return (await snapshotDeepState(page, options)).pseudoStates; }
export async function extractCssAnimationStyle(page, options = {}) { return (await snapshotDeepState(page, options)).elements.map((element) => ({ elementRef: element.elementId, stateRef: element.observation?.stateRef, cssAnimations: element.observation?.cssAnimations })); }
export async function extractLayout(page, options = {}) { return (await snapshotDeepState(page, options)).elements.map((element) => ({ elementRef: element.elementId, stateRef: element.observation?.stateRef, layout: element.observation?.layout })); }
export async function extractSvgPaint(page, options = {}) { return (await snapshotDeepState(page, options)).elements.map((element) => ({ elementRef: element.elementId, stateRef: element.observation?.stateRef, svgPaint: element.observation?.svgPaint })).filter((entry) => entry.svgPaint); }
export async function extractTransform3D(page, options = {}) { return (await snapshotDeepState(page, options)).elements.map((element) => ({ elementRef: element.elementId, stateRef: element.observation?.stateRef, transform3d: element.observation?.transform3d })); }
export async function extractTransformAncestorChain(page, options = {}) { return (await extractTransform3D(page, options)).map((entry) => ({ elementRef: entry.elementRef, stateRef: entry.stateRef, ancestorChain: entry.transform3d?.ancestorChain })); }
export async function resolveStaggerInstances(page, system = null, options = {}) {
  const systems = (await snapshotDeepState(page, options)).staggerSystems;
  if (!system) return systems;
  return systems.filter((record) => record.id === system.id || record.value?.id === system.id || record.value?.expression === system.expression);
}

const URL_SIGNALS = [
  ['three', /three(?:\.min)?\.(?:js|mjs)|three@|\/three\//i],
  ['gsap', /gsap(?:\.min)?\.js|gsap@/i], ['scrollTrigger', /scrolltrigger/i],
  ['lenis', /lenis/i], ['locomotive', /locomotive/i], ['next', /\/_next\//i],
  ['nuxt', /\/_nuxt\//i], ['astro', /\/_astro\//i], ['webflow', /webflow/i],
  ['barba', /barba/i], ['swup', /swup/i], ['pixi', /pixi(?:\.min)?\.(?:js|mjs)|pixi\.js/i],
  ['babylon', /babylon(?:\.min)?\.js|@babylonjs/i], ['ogl', /(?:^|\/)ogl(?:[.@/]|\.min)/i],
  ['regl', /(?:^|\/)regl(?:[.@/]|\.min)/i], ['curtains', /curtains(?:\.min)?\.js|curtainsjs/i],
  ['framerMotion', /framer-motion|motion(?:\.min)?\.(?:js|mjs)/i], ['framer', /framerusercontent|framer\.com/i],
  ['react', /react(?:-dom)?(?:\.production|\.development|\.min)?\.(?:js|mjs)|react@/i],
  ['vue', /vue(?:\.runtime)?(?:\.global|\.esm-browser|\.min)?\.(?:js|mjs)|vue@/i],
  ['svelte', /svelte(?:\/|@|\.js)/i], ['angular', /@angular|angular(?:\.min)?\.js/i],
];

// A site can run a full 3D asset pipeline without ever naming its engine. These
// decoders and asset formats are only shipped to load real compressed GEOMETRY and
// GPU textures, so they answer "is this actual 3D or a layered 2D fake" even when the
// renderer is a private bundle. Added 2026-08-12 after a capture reported only
// 'custom-webgl-engine' while the ledger plainly held a Draco decoder and a Basis
// transcoder - the evidence was on disk and never reached the verdict.
const PIPELINE_SIGNALS = [
  ['draco', /draco(?:_decoder|_wasm|_encoder)?[\w.-]*\.(?:js|wasm)/i, 'compressed 3D mesh decoder'],
  ['basis', /basis_transcoder|basisu/i, 'Basis Universal GPU texture transcoder'],
  ['meshopt', /meshopt(?:_decoder)?/i, 'meshoptimizer geometry decoder'],
  ['ktx2', /\.ktx2(?:\?|$)/i, 'KTX2 GPU texture'],
  ['gltf', /\.(?:glb|gltf)(?:\?|$)/i, 'glTF/GLB 3D model'],
  ['envmap', /\.(?:hdr|exr)(?:\?|$)/i, 'HDR environment map (image-based lighting)'],
];

export function mergeTechnology(runtime, runDir) {
  const ledgerPath = join(runDir, 'network', 'responses.ndjson');
  const urls = [];
  eachFileLine(ledgerPath, (line) => { if (line) { try { urls.push(JSON.parse(line).url || ''); } catch { urls.push(''); } } });
  const netHits = {};
  for (const [name, regexp] of URL_SIGNALS) netHits[name] = urls.some((url) => regexp.test(url));
  const tech = [];
  const labels = { pixi: 'PixiJS', babylon: 'Babylon.js', ogl: 'OGL', regl: 'regl', curtains: 'curtains.js', framer: 'Framer', framerMotion: 'Framer-Motion', react: 'React', vue: 'Vue', svelte: 'Svelte', angular: 'Angular' };
  const names = new Set([...Object.keys(runtime).filter((key) => runtime[key] === true), ...Object.keys(netHits).filter((key) => netHits[key])].filter((name) => !['webgl'].includes(name)));
  for (const name of names) {
    const signals = [];
    if (runtime[name] === true) signals.push('runtime-global-or-dom');
    if (netHits[name]) signals.push('resource-url');
    let version = runtime[`${name}Version`] || runtime[`${name}Revision`] || null;
    if (name === 'three' && version && !String(version).startsWith('r')) version = `r${version}`;
    tech.push({ name: labels[name] || name, key: name, confidence: signals.length >= 2 ? 'high' : 'medium', signals, version });
  }
  if (runtime.webgl) tech.push({ name: 'webgl', confidence: 'high', signals: ['runtime-context'], version: null });
  const knownWebgl = ['three', 'pixi', 'babylon', 'ogl', 'regl', 'curtains'].some((name) => runtime[name] || netHits[name]);
  const pipeline = [];
  for (const [key, regexp, means] of PIPELINE_SIGNALS) {
    const hits = urls.filter((url) => regexp.test(url));
    if (hits.length) pipeline.push({ marker: key, means, count: hits.length, example: sanitizeUrl(hits[0]) });
  }
  const realGeometry = pipeline.some(({ marker }) => ['draco', 'meshopt', 'gltf'].includes(marker));
  if (runtime.webgl && !knownWebgl) tech.push({
    name: 'custom-webgl-engine',
    confidence: 'medium',
    signals: ['runtime-webgl-without-known-library', ...(pipeline.length ? ['3d-asset-pipeline'] : [])],
    version: null,
    caveat: realGeometry
      ? 'Engine identity is Unknown, but this is REAL 3D: the page ships a compressed-geometry pipeline, which is only needed to load actual meshes. Do not describe this site as layered 2D parallax.'
      : 'Observed WebGL surface; engine identity is Unknown, so this is an honest fallback label rather than a library attribution.',
  });
  const result = {
    detected: tech,
    canvasCount: runtime.canvasCount || 0,
    assetPipeline3d: { markers: pipeline, realGeometry, note: realGeometry ? 'Compressed 3D geometry confirmed from shipped decoders/assets.' : pipeline.length ? 'Some 3D-adjacent assets seen, but no geometry decoder - real-geometry claim stays Unknown.' : 'No 3D asset-pipeline markers in the network ledger.' },
    note: 'high = two independent signals, except a directly observed WebGL context; WebGL never implies three.js',
  };
  atomicWriteJson(join(runDir, 'telemetry', 'technology.json'), result);
  return result;
}
