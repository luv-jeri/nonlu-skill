// Default native scroll atlas plus the additive Phase B thorough controller.
// The default branch remains the Phase A step/settle/diff behavior; --thorough
// uses real wheel input and public/effective progress for pinned/virtual stories.
import { PNG } from 'pngjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ndjsonAppend, ensureDir, atomicWriteJson, redactSecrets } from './util.mjs';
import { DEEP_PROPS, normalizeTransitionTracks, snapshotDeepState, snapshotRuntimeMotion } from './evidence.mjs';
import { buildAutonomousMask, diffReadableSnapshots, hashFrame, subtractAutonomousTiles, summarizePixelDiff } from './visual-diff.mjs';

const decode = (buf) => PNG.sync.read(buf);

// mean absolute difference over a pixel stride; 0 = identical, 1 = inverted
function diffRatio(a, b) {
  if (!a || !b || a.width !== b.width || a.height !== b.height) return 1;
  const A = a.data, B = b.data; let sum = 0, n = 0;
  for (let i = 0; i < A.length; i += 32) { sum += Math.abs(A[i] - B[i]); n++; }
  return sum / (n * 255);
}

// blank = almost no pixel variance anywhere (solid intro screens are legal; pure emptiness is not evidence)
export function isBlank(png) {
  const D = png.data; let min = 255, max = 0;
  for (let i = 0; i < D.length; i += 64) { const v = D[i]; if (v < min) min = v; if (v > max) max = v; }
  return max - min < 6;
}

const scrubEvidence = (value, seen = new WeakSet()) => {
  if (typeof value === 'string') return redactSecrets(value);
  if (value == null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => scrubEvidence(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubEvidence(item, seen)]));
};

const captureStoryProgress = (page) => page.evaluate(() => {
  const finite = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
  const scrollingElement = document.scrollingElement || document.documentElement;
  const nativeMax = Math.max(0, scrollingElement.scrollHeight - innerHeight);
  const nativeY = scrollY;
  const lenis = window.lenis || window.__lenis || null;
  const lenisProgress = finite(lenis?.progress);
  const lenisLimit = finite(lenis?.limit) ?? finite(lenis?.dimensions?.limit) ?? nativeMax;
  const lenisScroll = finite(lenis?.animatedScroll) ?? finite(lenis?.actualScroll) ?? finite(lenis?.scroll);
  let ScrollTrigger = window.ScrollTrigger || null;
  try { ScrollTrigger ||= window.gsap?.core?.globals?.()?.ScrollTrigger || null; } catch {}
  let triggers = [];
  try { if (typeof ScrollTrigger?.getAll === 'function') triggers = ScrollTrigger.getAll().map((trigger) => ({ id: trigger.id || trigger.vars?.id || null, progress: finite(trigger.progress), start: finite(trigger.start), end: finite(trigger.end), isActive: !!trigger.isActive })).filter((trigger) => trigger.progress != null); } catch {}
  const transformed = [...document.body.children].slice(0, 20).map((element) => {
    const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
    return { tag: element.localName, id: element.id || null, className: typeof element.className === 'string' ? element.className.slice(0, 80) : '', transform: style.transform, top: Math.round(rect.top * 10) / 10 };
  }).filter((entry) => entry.transform !== 'none');
  const visibleSections = [...document.querySelectorAll('[data-section],section,main,article')].map((element, index) => {
    const rect = element.getBoundingClientRect(); const overlap = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
    return { index, overlap: Math.round(overlap), top: Math.round(rect.top) };
  }).filter((entry) => entry.overlap > 0);
  let source = 'structured-visual-state'; let value = null; let effectiveCssPx = null;
  if (lenisProgress != null) { source = 'lenis-public-progress'; value = lenisProgress; effectiveCssPx = lenisScroll ?? (lenisLimit ? lenisProgress * lenisLimit : null); }
  else if (triggers.some((trigger) => trigger.isActive || (trigger.progress > 0.001 && trigger.progress < 0.999))) { source = 'scrolltrigger-public-progress'; value = triggers.reduce((sum, trigger) => sum + trigger.progress, 0) / triggers.length; effectiveCssPx = value * 1000; }
  else if (nativeMax > 0) { source = 'native-scroll'; value = nativeY / nativeMax; effectiveCssPx = nativeY; }
  else if (triggers.length) { source = 'scrolltrigger-public-progress'; value = triggers.reduce((sum, trigger) => sum + trigger.progress, 0) / triggers.length; effectiveCssPx = value * 1000; }
  const signalText = JSON.stringify({ nativeY, triggers: triggers.map(({ id, progress, isActive }) => ({ id, progress, isActive })), transformed, visibleSections });
  let signalHash = 2166136261;
  for (let index = 0; index < signalText.length; index++) { signalHash ^= signalText.charCodeAt(index); signalHash = Math.imul(signalHash, 16777619); }
  const dom0WheelHandlers = Number(typeof window.onwheel === 'function') + [...document.querySelectorAll('[onwheel]')].length;
  const listenerCounts = window.__scap?.listenerCounts || {};
  const staticStory = nativeMax <= 1 && !lenis && !triggers.length && !(listenerCounts.wheel > 0) && !(dom0WheelHandlers > 0);
  return { source, value, effectiveCssPx, native: { x: scrollX, y: nativeY, maxY: nativeMax }, lenis: lenis ? { progress: lenisProgress, limit: lenisLimit, scroll: lenisScroll, velocity: finite(lenis.velocity), direction: finite(lenis.direction) } : null, triggers, transformed, visibleSections, listenerCounts, dom0WheelHandlers, staticStory, publicProgressAvailable: lenisProgress != null || nativeMax > 0 || triggers.length > 0, signalHash: (signalHash >>> 0).toString(36) };
});

const captureReadableSnapshot = async (page, point = null) => {
  const raw = await page.evaluate(({ props, point }) => {
    const phaseState = window.__siteCapturePhaseB ||= { elementIds: new WeakMap(), nextElementId: 1, runtimeIds: new WeakMap(), nextRuntimeId: 1, observationByElement: new Map(), nextObservationId: 1 };
    const idFor = (element) => {
      if (!element || element.nodeType !== 1) return null;
      let id = phaseState.elementIds.get(element);
      if (!id) { id = `el_${String(phaseState.nextElementId++).padStart(6, '0')}`; phaseState.elementIds.set(element, id); }
      return id;
    };
    const hash = (text) => { let value = 2166136261; for (let index = 0; index < text.length; index++) { value ^= text.charCodeAt(index); value = Math.imul(value, 16777619); } return (value >>> 0).toString(36); };
    const rectRecord = (rect) => ({ x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height });
    const roots = [document];
    for (let index = 0; index < roots.length; index++) for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
    const elements = [];
    const candidates = [document.documentElement, document.body, ...roots.flatMap((root) => [...(root.querySelectorAll?.('*') || [])])];
    const seenElements = new Set();
    for (const element of candidates) {
      if (seenElements.has(element)) continue; seenElements.add(element);
      if (!element || elements.length >= 400) break;
      const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width <= 0 || rect.height <= 0 || rect.bottom < -20 || rect.top > innerHeight + 20) continue;
      const values = Object.fromEntries(props.map((name) => [name, style.getPropertyValue(name)]));
      const rectValue = rectRecord(rect);
      elements.push({ elementRef: idFor(element), tag: element.localName, className: typeof element.className === 'string' ? element.className.slice(0, 120) : '', styleHash: hash(JSON.stringify(values)), rectHash: hash(JSON.stringify(rectValue)), props: values, rect: rectValue });
    }
    const animations = [];
    try {
      const seenAnimations = new Set();
      for (const animation of roots.flatMap((root) => { try { return typeof root.getAnimations === 'function' ? root.getAnimations({ subtree: true }) : []; } catch { return []; } }).slice(0, 200)) {
        if (seenAnimations.has(animation)) continue; seenAnimations.add(animation);
        let timing = null; try { timing = animation.effect?.getComputedTiming?.() || null; } catch {}
        animations.push({ id: animation.id || null, name: animation.animationName || null, playState: animation.playState, currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null, playbackRate: animation.playbackRate, targetRef: idFor(animation.effect?.target), progress: timing && typeof timing.progress === 'number' ? timing.progress : null, currentIteration: timing?.currentIteration ?? null });
      }
    } catch {}
    let ScrollTrigger = window.ScrollTrigger || null; try { ScrollTrigger ||= window.gsap?.core?.globals?.()?.ScrollTrigger || null; } catch {}
    let triggers = []; try { if (typeof ScrollTrigger?.getAll === 'function') triggers = ScrollTrigger.getAll().map((trigger) => ({ id: trigger.id || trigger.vars?.id || null, progress: trigger.progress ?? null, start: trigger.start ?? null, end: trigger.end ?? null, isActive: !!trigger.isActive, triggerRef: idFor(trigger.trigger || trigger.vars?.trigger) })); } catch {}
    let gsap = null;
    try { if (typeof window.gsap?.globalTimeline?.getChildren === 'function') gsap = { version: window.gsap.version || null, children: window.gsap.globalTimeline.getChildren(true, true, true).slice(0, 200).map((node) => ({ progress: typeof node.progress === 'function' ? node.progress() : null, totalProgress: typeof node.totalProgress === 'function' ? node.totalProgress() : null, targets: typeof node.targets === 'function' ? node.targets().map(idFor).filter(Boolean) : [] })) }; } catch {}
    const hitTest = point ? document.elementsFromPoint(point.x, point.y).slice(0, 12).map((element) => ({ elementRef: idFor(element), tag: element.localName, className: typeof element.className === 'string' ? element.className.slice(0, 120) : '' })) : [];
    const canvases = roots.flatMap((root) => [...(root.querySelectorAll?.('canvas') || [])]).map((canvas) => ({ elementRef: idFor(canvas), width: canvas.width, height: canvas.height, rect: rectRecord(canvas.getBoundingClientRect()), sceneGraph: { value: null, status: 'Unknown', reason: 'canvas is a rendered surface, not a DOM subtree' } }));
    const customCursors = candidates.filter((element) => {
      if (!element?.matches) return false;
      const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
      return style.position === 'fixed' && style.pointerEvents === 'none' && rect.width > 0 && rect.height > 0 && (/(?:cursor|pointer)/i.test(`${element.id} ${typeof element.className === 'string' ? element.className : ''}`) || (rect.width <= 160 && rect.height <= 160));
    }).slice(0, 20).map((element) => { const style = getComputedStyle(element); return { elementRef: idFor(element), tag: element.localName, className: typeof element.className === 'string' ? element.className.slice(0, 120) : '', rect: rectRecord(element.getBoundingClientRect()), transform: style.transform, opacity: style.opacity, mixBlendMode: style.mixBlendMode }; });
    return { capturedAt: { wallMs: Date.now(), performanceMs: performance.now(), scrollX, scrollY, pointer: point }, elements, animations, triggers, gsap, hitTest, canvases, customCursors };
  }, { props: DEEP_PROPS, point });
  return scrubEvidence(raw);
};

const compactReadableSnapshot = (snapshot, cache) => ({
  ...snapshot,
  elements: snapshot.elements.map((element) => {
    const previous = cache.get(element.elementRef);
    cache.set(element.elementRef, { styleHash: element.styleHash, rectHash: element.rectHash, props: element.props, rect: element.rect });
    if (previous?.styleHash === element.styleHash && previous?.rectHash === element.rectHash) {
      return { ...element, sameAsFingerprint: previous.styleHash };
    }
    return element;
  }),
});

const propertyKey = (elementRef, property, kind = 'style') => `${elementRef}:${kind}:${property}`;

export function subtractAutonomousReadable(delta, autonomous = {}) {
  const autonomousKeys = new Set(autonomous.changedPropertyKeys || []);
  const controlledChanges = [];
  const autonomousChanges = [];
  const mixedElementRefs = new Set();
  for (const change of delta?.changes || []) {
    const propertyChanges = [];
    const autonomousPropertyChanges = [];
    for (const propertyChange of change.propertyChanges || []) {
      const target = autonomousKeys.has(propertyKey(change.elementRef, propertyChange.property));
      (target ? autonomousPropertyChanges : propertyChanges).push(propertyChange);
    }
    const rectChanges = [];
    const autonomousRectChanges = [];
    for (const rectChange of change.rectChanges || []) {
      const target = autonomousKeys.has(propertyKey(change.elementRef, rectChange.property, 'rect'));
      (target ? autonomousRectChanges : rectChanges).push(rectChange);
    }
    if (propertyChanges.length || rectChanges.length) controlledChanges.push({ ...change, propertyChanges, rectChanges });
    if (autonomousPropertyChanges.length || autonomousRectChanges.length) autonomousChanges.push({ ...change, propertyChanges: autonomousPropertyChanges, rectChanges: autonomousRectChanges });
    if ((propertyChanges.length || rectChanges.length) && (autonomousPropertyChanges.length || autonomousRectChanges.length)) mixedElementRefs.add(change.elementRef);
  }
  return { changed: controlledChanges.length > 0, changes: controlledChanges, autonomousChanges, mixedElementRefs: [...mixedElementRefs] };
}

const progressingTargetRefs = (before = {}, after = {}) => {
  const refs = new Set();
  const changedById = (earlier, later, targetRefs) => {
    const beforeMap = new Map((earlier || []).map((item, index) => [item.id || item.name || index, item]));
    for (let index = 0; index < (later || []).length; index++) {
      const item = later[index]; const prior = beforeMap.get(item.id || item.name || index);
      if (!prior) continue;
      const moved = ['progress', 'currentTime', 'totalProgress'].some((key) => item[key] != null && prior[key] != null && Math.abs(Number(item[key]) - Number(prior[key])) > 0.0001);
      if (moved) for (const ref of targetRefs(item)) if (ref) refs.add(ref);
    }
  };
  changedById(before.animations, after.animations, (item) => [item.targetRef]);
  changedById(before.triggers, after.triggers, (item) => [item.triggerRef]);
  changedById(before.gsap?.children, after.gsap?.children, (item) => item.targets || []);
  return refs;
};

export function classifyScrollCausality({ delta, autonomous, before, after, progressChanged, pixelDiff }) {
  const separated = subtractAutonomousReadable(delta, autonomous);
  const linkedRefs = progressingTargetRefs(before, after);
  const propertyClassifications = [];
  for (const change of separated.changes) {
    for (const item of change.propertyChanges || []) propertyClassifications.push({ elementRef: change.elementRef, kind: 'style', property: item.property, before: item.before, after: item.after, label: progressChanged ? (linkedRefs.has(change.elementRef) ? 'scroll-caused' : 'probably-scroll-caused') : 'ambiguous', status: progressChanged ? (linkedRefs.has(change.elementRef) ? 'Observed' : 'Inferred') : 'Unknown' });
    for (const item of change.rectChanges || []) propertyClassifications.push({ elementRef: change.elementRef, kind: 'rect', property: item.property, before: item.before, after: item.after, label: progressChanged ? (linkedRefs.has(change.elementRef) ? 'scroll-caused' : 'probably-scroll-caused') : 'ambiguous', status: progressChanged ? (linkedRefs.has(change.elementRef) ? 'Observed' : 'Inferred') : 'Unknown' });
  }
  for (const change of separated.autonomousChanges) {
    const linked = progressChanged && linkedRefs.has(change.elementRef);
    for (const item of [...(change.propertyChanges || []).map((value) => ({ ...value, kind: 'style' })), ...(change.rectChanges || []).map((value) => ({ ...value, kind: 'rect' }))]) propertyClassifications.push({ elementRef: change.elementRef, kind: item.kind, property: item.property, before: item.before, after: item.after, label: linked ? 'mixed' : 'time-caused', status: linked ? 'Observed' : 'Observed' });
  }
  let label = 'ambiguous'; let status = 'Unknown';
  const hasTime = propertyClassifications.some((item) => item.label === 'time-caused');
  const hasObservedScroll = propertyClassifications.some((item) => item.label === 'scroll-caused');
  const hasProbableScroll = propertyClassifications.some((item) => item.label === 'probably-scroll-caused') || (progressChanged && pixelDiff?.outsideAutonomousMask);
  if (propertyClassifications.some((item) => item.label === 'mixed') || (hasTime && (hasObservedScroll || hasProbableScroll))) { label = 'mixed'; status = hasObservedScroll ? 'Observed' : 'Inferred'; }
  else if (propertyClassifications.some((item) => item.label === 'scroll-caused')) { label = 'scroll-caused'; status = 'Observed'; }
  else if (hasProbableScroll) { label = 'probably-scroll-caused'; status = 'Inferred'; }
  else if (hasTime) { label = 'time-caused'; status = 'Observed'; }
  return { label, status, controlledReadableDelta: separated, propertyClassifications, linkedRuntimeTargetRefs: [...linkedRefs] };
}

export async function collectVisibleAndChangedElements(page, previousSnapshot = null) {
  const current = await captureReadableSnapshot(page);
  return { current, delta: previousSnapshot ? diffReadableSnapshots(previousSnapshot, current) : { changed: true, changes: current.elements.map((element) => ({ elementRef: element.elementRef, kind: 'initially-visible' })) } };
}

export async function captureScrollStateEvidence(page, options = {}) {
  return snapshotDeepState(page, { ...options, phase: options.phase || 'restored-after-cursor' });
}

// Public atomic-stop seam. The production controller below owns concrete browser
// callbacks; tests/alternate controllers can exercise the same mandatory order.
export async function captureStop(ctx) {
  const before = await ctx.capturePreStepBaseline();
  const movement = await ctx.advanceEffectiveStoryStep(before);
  const settled = await ctx.settleAtObservedProgress(movement);
  const dwell = await ctx.captureStationarySeries(settled);
  const autonomous = await ctx.classifyAutonomousMotion(dwell);
  const cursor = await ctx.probeCursorGrid(autonomous);
  const restored = await ctx.restoreNeutralPointerAndSettle(cursor);
  const deepState = await ctx.captureScrollStateEvidence({ include: await ctx.collectVisibleAndChangedElements(), runtimeMotion: true, pseudo: true, layout3d: true });
  return ctx.commitStopAtomically({ before, movement, settled, dwell, autonomous, cursor, restored, deepState });
}

const captureVisibleSection = (page) => page.evaluate(() => {
  const phaseState = window.__siteCapturePhaseB;
  const candidates = [...document.querySelectorAll('[data-section],section,main,article')];
  if (!candidates.length) candidates.push(document.body);
  let best = null;
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    const overlap = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)) * Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left));
    if (!best || overlap > best.overlap) best = { element, rect, overlap };
  }
  let elementRef = phaseState?.elementIds?.get(best.element) || null;
  if (!elementRef && phaseState) { elementRef = `el_${String(phaseState.nextElementId++).padStart(6, '0')}`; phaseState.elementIds.set(best.element, elementRef); }
  const rect = best.rect;
  return { sectionRef: elementRef || 'section-unknown', tag: best.element.localName, className: typeof best.element.className === 'string' ? best.element.className.slice(0, 120) : '', rect: { left: Math.max(0, rect.left), top: Math.max(0, rect.top), right: Math.min(innerWidth, rect.right), bottom: Math.min(innerHeight, rect.bottom), width: Math.min(innerWidth, rect.right) - Math.max(0, rect.left), height: Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top) } };
});

async function settleThorough(page, maxMs = 1250) {
  const start = Date.now();
  await page.waitForTimeout(120);
  let last = null;
  let stable = 0;
  let observations = 0;
  let deadlineMs = maxMs;
  let lastObservation = null;
  while (Date.now() - start < deadlineMs) {
    const current = await page.evaluate(() => {
      let geometry = '';
      const elements = [...document.querySelectorAll('body *')];
      const stride = Math.max(1, Math.floor(elements.length / 50));
      for (let index = 0; index < elements.length && geometry.length < 5000; index += stride) {
        const rect = elements[index].getBoundingClientRect();
        if (rect.bottom >= -50 && rect.top <= innerHeight + 50) geometry += `${Math.round(rect.left)},${Math.round(rect.top)},${Math.round(rect.width)},${Math.round(rect.height)};`;
      }
      const transitions = [];
      let longestRemainingMs = 0;
      try {
        const roots = [document];
        for (let index = 0; index < roots.length; index++) {
          for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
          if (roots[index].nodeType === 9) for (const frame of roots[index].querySelectorAll?.('iframe') || []) { try { if (frame.contentDocument) roots.push(frame.contentDocument); } catch {} }
        }
        const seenAnimations = new Set();
        for (const animation of roots.flatMap((root) => { try { return typeof root.getAnimations === 'function' ? root.getAnimations({ subtree: true }) : []; } catch { return []; } })) {
          if (seenAnimations.has(animation)) continue; seenAnimations.add(animation);
          if (animation.constructor?.name !== 'CSSTransition' && !('transitionProperty' in animation)) continue;
          const timing = animation.effect?.getComputedTiming?.() || {};
          const target = animation.effect?.target;
          const style = target ? (target.ownerDocument?.defaultView || window).getComputedStyle(target) : null;
          const currentTime = typeof animation.currentTime === 'number' ? animation.currentTime : null;
          const endTime = typeof timing.endTime === 'number' ? timing.endTime : null;
          if (currentTime != null && endTime != null) longestRemainingMs = Math.max(longestRemainingMs, endTime - currentTime);
          transitions.push({ property: animation.transitionProperty || null, playState: animation.playState, currentTime: currentTime == null ? null : Math.round(currentTime), progress: typeof timing.progress === 'number' ? Math.round(timing.progress * 10000) / 10000 : null, targetStyle: style ? [style.opacity, style.transform, style.color, style.backgroundColor, style.clipPath].join('|') : null });
        }
      } catch {}
      const lenis = window.lenis || window.__lenis || null;
      let ScrollTrigger = window.ScrollTrigger || null; try { ScrollTrigger ||= window.gsap?.core?.globals?.()?.ScrollTrigger || null; } catch {}
      let triggerProgress = []; try { if (typeof ScrollTrigger?.getAll === 'function') triggerProgress = ScrollTrigger.getAll().map((trigger) => [trigger.id || trigger.vars?.id || null, trigger.progress ?? null, !!trigger.isActive]); } catch {}
      return { scrollX, scrollY, geometry, transitions, longestRemainingMs, publicScrollProgress: { lenis: lenis ? { progress: lenis.progress ?? null, scroll: lenis.animatedScroll ?? lenis.actualScroll ?? lenis.scroll ?? null } : null, triggers: triggerProgress } };
    });
    observations++;
    lastObservation = current;
    if (current.longestRemainingMs > maxMs && maxMs >= 1250) deadlineMs = Math.min(1800, Math.max(deadlineMs, current.longestRemainingMs + (Date.now() - start)));
    const signature = JSON.stringify({ x: current.scrollX, y: current.scrollY, geometry: current.geometry, transitions: current.transitions, publicScrollProgress: current.publicScrollProgress });
    stable = signature === last ? stable + 1 : 0;
    last = signature;
    if (stable >= 2) return { status: 'settled', elapsedMs: Date.now() - start, observations, activeTransitions: current.transitions, publicScrollProgress: current.publicScrollProgress };
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  }
  return { status: 'timed-out-with-motion', elapsedMs: Date.now() - start, observations, activeTransitions: lastObservation?.transitions || [], publicScrollProgress: lastObservation?.publicScrollProgress || null };
}

async function advanceEffectiveStoryStep(page, before, targetTravelCssPx) {
  const pulses = [];
  let after = before;
  let requestedDeltaY = targetTravelCssPx;
  let structuredChanges = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    requestedDeltaY = Math.max(4, Math.min(130, Math.round(requestedDeltaY)));
    await page.mouse.wheel(0, requestedDeltaY);
    await page.waitForTimeout(120);
    after = await captureStoryProgress(page);
    pulses.push({ requestedDeltaY, observed: after });
    const beforePx = before.effectiveCssPx;
    const afterPx = after.effectiveCssPx;
    const travel = beforePx != null && afterPx != null ? afterPx - beforePx : null;
    if (after.signalHash !== (pulses.at(-2)?.observed?.signalHash || before.signalHash)) structuredChanges++;
    if (travel != null && travel >= 100) break;
    if (travel != null && travel > 1) {
      const remaining = targetTravelCssPx - travel;
      if (remaining <= 2) break;
      const observedPerInput = travel / pulses.reduce((sum, pulse) => sum + pulse.requestedDeltaY, 0);
      requestedDeltaY = observedPerInput > 0.05 ? remaining / observedPerInput : remaining;
    } else requestedDeltaY = Math.max(20, Math.round(targetTravelCssPx * 0.35));
  }
  const travelCssPx = before.effectiveCssPx != null && after.effectiveCssPx != null ? after.effectiveCssPx - before.effectiveCssPx : null;
  const numericChanged = travelCssPx != null && Math.abs(travelCssPx) > 1;
  const transformedSteps = [];
  let priorStructured = before;
  for (const pulse of pulses) {
    const deltas = [];
    for (const next of pulse.observed.transformed || []) {
      const prior = (priorStructured.transformed || []).find((entry) => entry.tag === next.tag && entry.id === next.id && entry.className === next.className);
      if (prior && Math.abs(next.top - prior.top) > 1) deltas.push(next.top - prior.top);
    }
    if (deltas.length) transformedSteps.push(deltas.sort((a, b) => Math.abs(b) - Math.abs(a))[0]);
    priorStructured = pulse.observed;
  }
  const consistentDirection = transformedSteps.length >= 2 && transformedSteps.every((delta) => Math.sign(delta) === Math.sign(transformedSteps[0]));
  const structuredChanged = !numericChanged && structuredChanges >= 2 && consistentDirection && transformedSteps.reduce((sum, value) => sum + Math.abs(value), 0) > 4 && ((after.listenerCounts?.wheel || 0) > 0);
  const activePublicStory = (after.lenis?.progress != null && after.lenis.progress < 0.999) || after.triggers.some((trigger) => trigger.isActive || (trigger.progress > 0.001 && trigger.progress < 0.999));
  const nativeAtEnd = after.native.maxY > 0 && after.native.y >= after.native.maxY - 2;
  const staticTerminal = after.native.maxY <= 1 && !after.lenis && !after.triggers.length && !(after.listenerCounts?.wheel > 0) && !(after.dom0WheelHandlers > 0);
  let status = 'stalled'; let confidence = 'Observed'; let reason = 'no credible progress signal changed after bounded retries';
  if (numericChanged || structuredChanged) { status = 'advanced'; confidence = numericChanged ? 'Observed' : 'Inferred'; reason = structuredChanged ? 'two wheel-correlated structured-state changes; no public numeric distance' : null; }
  else if ((nativeAtEnd && !activePublicStory) || staticTerminal) { status = 'terminal'; reason = staticTerminal ? 'static one-viewport document with no public virtual-story signal' : 'native end with no active non-terminal public story signal'; }
  else if (!after.publicProgressAvailable) { status = 'ambiguous'; confidence = 'Unknown'; reason = 'visual/transform state did not provide a repeatable wheel-correlated progress signal'; }
  return { status, confidence, reason, targetTravelCssPx, targetBandCssPx: [100, 130], pulses, before, after, travelCssPx, transformedStepDeltas: transformedSteps, withinTargetBand: travelCssPx != null ? travelCssPx >= 100 && travelCssPx <= 130 : null, effectiveSource: after.source };
}

const persistDeepState = (runDir, deepState) => {
  for (const element of deepState.elements || []) ndjsonAppend(join(runDir, 'source-evidence', 'style-states.ndjson'), scrubEvidence(element));
  for (const pseudo of deepState.pseudoStates || []) ndjsonAppend(join(runDir, 'source-evidence', 'pseudo-states.ndjson'), scrubEvidence(pseudo));
  for (const transition of deepState.transitionInventory || []) ndjsonAppend(join(runDir, 'source-evidence', 'transition-states.ndjson'), scrubEvidence(transition));
  for (const animation of deepState.runtimeAnimations || []) ndjsonAppend(join(runDir, 'source-evidence', 'animation-states.ndjson'), scrubEvidence(animation));
  for (const stagger of deepState.staggerSystems || []) ndjsonAppend(join(runDir, 'source-evidence', 'stagger-states.ndjson'), scrubEvidence(stagger));
  if (deepState.gsap) ndjsonAppend(join(runDir, 'source-evidence', 'gsap.ndjson'), scrubEvidence(deepState.gsap));
  if (deepState.scrollTriggers) ndjsonAppend(join(runDir, 'source-evidence', 'scroll-triggers.ndjson'), scrubEvidence(deepState.scrollTriggers));
};

async function captureStationarySeries(page, runDir, stopId, stopDir, readableCache, progressAtSettle, diagnosticCounter) {
  const schedule = [0, 400, 900, 1400, 2100, 2800];
  const start = Date.now();
  const samples = [];
  for (let index = 0; index < schedule.length; index++) {
    const remaining = schedule[index] - (Date.now() - start);
    if (remaining > 0) await page.waitForTimeout(remaining);
    const buffer = await page.screenshot({ type: 'png' });
    const frameRef = `frames/desktop/scroll/${stopId}/dwell-${String(index).padStart(2, '0')}.png`;
    writeFileSync(join(runDir, frameRef), buffer);
    diagnosticCounter.count++;
    const progress = await captureStoryProgress(page);
    const parkedPointer = { x: 2, y: 2 };
    const readable = compactReadableSnapshot(await captureReadableSnapshot(page, parkedPointer), readableCache);
    const runtime = await snapshotRuntimeMotion(page, { stateRef: `${stopId}-dwell-${index}`, phase: 'stationary-dwell', storyProgress: progress.value, pointer: parkedPointer });
    samples.push({ index, elapsedMs: Date.now() - start, frameRef, frameHash: hashFrame(buffer), progress, progressValue: progress.value, readable, runtime: scrubEvidence(runtime), buffer });
  }
  const autonomous = buildAutonomousMask(samples, { progressTolerance: 0.001, channelThreshold: 12, tileSize: 64 });
  const autonomousReadableChanges = [];
  for (let index = 1; index < samples.length; index++) autonomousReadableChanges.push(...diffReadableSnapshots(samples[index - 1].readable, samples[index].readable).changes);
  autonomous.changedElementRefs = [...new Set(autonomousReadableChanges.map((change) => change.elementRef).filter(Boolean))];
  autonomous.changedPropertyKeys = [...new Set(autonomousReadableChanges.flatMap((change) => [
    ...(change.propertyChanges || []).map((item) => propertyKey(change.elementRef, item.property)),
    ...(change.rectChanges || []).map((item) => propertyKey(change.elementRef, item.property, 'rect')),
  ]))];
  autonomous.readableChanges = autonomousReadableChanges;
  const runtimeSignatures = samples.map((sample) => JSON.stringify({
    animations: (sample.runtime?.runtimeAnimations || []).map((record) => ({ id: record.value?.id || record.id, currentTime: record.value?.currentTime, progress: record.value?.effect?.computedTiming?.progress })),
    gsap: (sample.runtime?.gsap?.value?.children || []).map((node) => ({ id: node.id, progress: node.progress, totalProgress: node.totalProgress })),
    triggers: (sample.runtime?.scrollTriggers?.value?.triggers || []).map((trigger) => ({ id: trigger.id, progress: trigger.resolved?.progress })),
  }));
  autonomous.runtimeMotionChanged = new Set(runtimeSignatures).size > 1;
  if (autonomous.label === 'autonomous-observed' && !autonomousReadableChanges.length && !autonomous.runtimeMotionChanged) {
    autonomous.label = 'autonomous-probable';
    autonomous.status = 'Inferred';
    autonomous.caveat = `${autonomous.caveat} Repeated pixels changed, but no readable property or exposed runtime source progressed.`;
  }
  const record = scrubEvidence({ id: `dwell-${stopId}`, stopId, stateRef: `${stopId}-stationary`, progressAtSettle, samples: samples.map(({ buffer, ...sample }) => sample), autonomous });
  ndjsonAppend(join(runDir, 'telemetry', 'dwell.ndjson'), record);
  ndjsonAppend(join(runDir, 'telemetry', 'causal-deltas.ndjson'), { id: `causal-dwell-${stopId}`, stopId, source: 'stationary-dwell', label: autonomous.label, status: autonomous.status, evidenceRefs: [record.id], caveat: autonomous.caveat });
  return { record, autonomous, internalSamples: samples };
}

const enumerateVisibleInteractiveTargets = (page) => page.evaluate(() => {
  const state = window.__siteCapturePhaseB ||= { elementIds: new WeakMap(), nextElementId: 1, runtimeIds: new WeakMap(), nextRuntimeId: 1, observationByElement: new Map(), nextObservationId: 1 };
  const idFor = (element) => {
    let id = state.elementIds.get(element);
    if (!id) { id = `el_${String(state.nextElementId++).padStart(6, '0')}`; state.elementIds.set(element, id); }
    return id;
  };
  const roots = [document];
  for (let index = 0; index < roots.length; index++) for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
  const selector = 'a[href],button,input,select,textarea,summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"],[role="tab"],[role="menuitem"],[role="checkbox"],[role="radio"],[role="switch"],[role="slider"]';
  const seen = new Set(); const targets = [];
  for (const root of roots) {
    const candidates = new Set([...(root.querySelectorAll?.(selector) || []), ...(root.querySelectorAll?.('[onclick],[onpointerenter],[onpointerover],[onmouseenter],[onmouseover],[ontouchstart]') || [])]);
    for (const element of root.querySelectorAll?.('*') || []) if (window.__scapHasInteractiveListener?.(element) || getComputedStyle(element).cursor === 'pointer') candidates.add(element);
    for (const element of candidates) {
    if (seen.has(element) || element.disabled || element.getAttribute('aria-disabled') === 'true') continue;
    seen.add(element);
    const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) continue;
    const x = Math.max(1, Math.min(innerWidth - 2, rect.left + rect.width / 2)); const y = Math.max(1, Math.min(innerHeight - 2, rect.top + rect.height / 2));
    const hit = document.elementsFromPoint(x, y);
    targets.push({ elementRef: idFor(element), tag: element.localName, role: element.getAttribute('role'), type: element.getAttribute('type'), label: (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120), listenerTypes: window.__scapListenerTypesFor?.(element) || [], cursor: style.cursor, rect: { x: rect.x, y: rect.y, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }, point: { x: Math.round(x), y: Math.round(y) }, hitTestReachable: hit.includes(element) || hit.some((node) => element.contains(node)) });
    }
  }
  return targets.sort((a, b) => a.rect.top - b.rect.top || a.rect.left - b.rect.left);
});

const captureInteractiveTargetState = async (page, elementRef, phase, point = null) => {
  const snapshot = await page.evaluate(({ elementRef, phase, point, props }) => {
    const state = window.__siteCapturePhaseB;
    const roots = [document];
    for (let index = 0; index < roots.length; index++) for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
    let target = null;
    for (const root of roots) {
      target = [...(root.querySelectorAll?.('*') || [])].find((element) => state?.elementIds?.get(element) === elementRef) || null;
      if (target) break;
    }
    if (!target) return { elementRef, phase, status: 'Unknown', reason: 'target detached or moved into an inaccessible realm' };
    const idFor = (element) => {
      if (!element) return null;
      let id = state.elementIds.get(element);
      if (!id) { id = `el_${String(state.nextElementId++).padStart(6, '0')}`; state.elementIds.set(element, id); }
      return id;
    };
    const read = (style) => Object.fromEntries(props.map((name) => [name, style.getPropertyValue(name)]));
    const style = getComputedStyle(target); const before = getComputedStyle(target, '::before'); const after = getComputedStyle(target, '::after'); const rect = target.getBoundingClientRect();
    const transitionRaw = { property: style.getPropertyValue('transition-property'), duration: style.getPropertyValue('transition-duration'), easing: style.getPropertyValue('transition-timing-function'), delay: style.getPropertyValue('transition-delay'), behavior: style.getPropertyValue('transition-behavior') };
    const animations = [];
    try {
      for (const animation of target.getAnimations({ subtree: true })) {
        const timing = animation.effect?.getComputedTiming?.() || {};
        animations.push({ id: animation.id || null, type: animation.constructor?.name || null, property: animation.transitionProperty || null, name: animation.animationName || null, playState: animation.playState, currentTime: typeof animation.currentTime === 'number' ? animation.currentTime : null, progress: typeof timing.progress === 'number' ? timing.progress : null, targetRef: idFor(animation.effect?.target) });
      }
    } catch {}
    const hitTest = point ? document.elementsFromPoint(point.x, point.y).slice(0, 12).map((element) => ({ elementRef: idFor(element), tag: element.localName })) : [];
    return {
      elementRef, phase, status: 'Observed', capturedAt: { wallMs: Date.now(), performanceMs: performance.now() }, point,
      matches: { hover: target.matches(':hover'), focus: target.matches(':focus'), focusVisible: target.matches(':focus-visible'), active: target.matches(':active') },
      rect: { x: rect.x, y: rect.y, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      props: read(style), pseudo: { before: { content: before.content, props: read(before) }, after: { content: after.content, props: read(after) } },
      transitionRaw, animations, hitTest, activeElementRef: idFor(document.activeElement), customCursor: style.cursor,
      canvases: [...document.querySelectorAll('canvas')].map((canvas) => ({ elementRef: idFor(canvas), width: canvas.width, height: canvas.height, sceneGraph: { value: null, status: 'Unknown', reason: 'canvas pixels are not a DOM scene graph' } })),
    };
  }, { elementRef, phase, point, props: DEEP_PROPS });
  if (snapshot.transitionRaw) snapshot.transitions = { raw: snapshot.transitionRaw, tracks: normalizeTransitionTracks(snapshot.transitionRaw) };
  return scrubEvidence(snapshot);
};

const targetClipForRect = (viewport, fallbackRect) => {
  const pad = 12;
  const x = Math.max(0, Math.min(viewport.width - 1, fallbackRect.left - pad));
  const y = Math.max(0, Math.min(viewport.height - 1, fallbackRect.top - pad));
  const width = Math.max(1, Math.min(viewport.width - x, fallbackRect.width + pad * 2));
  const height = Math.max(1, Math.min(viewport.height - y, fallbackRect.height + pad * 2));
  return { x, y, width, height };
};

const captureTargetCrop = async (page, runDir, relativePath, fallbackRect) => {
  const clip = targetClipForRect(page.viewportSize(), fallbackRect);
  const buffer = await page.screenshot({ type: 'png', clip });
  writeFileSync(join(runDir, relativePath), buffer);
  return { frameRef: relativePath, frameHash: hashFrame(buffer), clip };
};

async function probeInteractiveTargets(page, runDir, stopId, autonomous, budgetState, diagnosticCounter, maxDiagnosticFrames, budget) {
  const discovered = await enumerateVisibleInteractiveTargets(page);
  budgetState.discovered += discovered.filter((target) => !budgetState.discoveredRefs.has(target.elementRef)).length;
  for (const target of discovered) budgetState.discoveredRefs.add(target.elementRef);
  const records = [];
  const neutral = { x: 2, y: 2 };
  for (const target of discovered) {
    if (budgetState.probedRefs.has(target.elementRef)) continue;
    if (!target.hitTestReachable) {
      const occluded = { id: `interactive-${stopId}-${target.elementRef}`, stopId, elementRef: target.elementRef, status: 'Unknown', terminalStatus: 'occluded', reason: 'center point was not reachable in the observed hit-test stack', target };
      budgetState.probedRefs.add(target.elementRef);
      if (!budgetState.skippedRefs.has(target.elementRef)) { budgetState.skipped++; budgetState.skippedRefs.add(target.elementRef); }
      ndjsonAppend(join(runDir, 'source-evidence', 'interactive-states.ndjson'), scrubEvidence(occluded)); ndjsonAppend(join(runDir, 'telemetry', 'interactive-probes.ndjson'), scrubEvidence(occluded)); records.push(occluded);
      continue;
    }
    if (budgetState.captured >= 120 || budgetState.crops + 4 > 480 || diagnosticCounter.count + 4 > maxDiagnosticFrames || budget.exceeded()) {
      const skipped = { id: `interactive-${stopId}-${target.elementRef}`, stopId, elementRef: target.elementRef, status: 'Unknown', reason: budget.exceeded() ? 'global browser budget reached before target probe' : 'interactive target/crop crash-safety cap reached', target };
      if (!budgetState.skippedRefs.has(target.elementRef)) { budgetState.skipped++; budgetState.skippedRefs.add(target.elementRef); }
      budgetState.probedRefs.add(target.elementRef);
      ndjsonAppend(join(runDir, 'source-evidence', 'interactive-states.ndjson'), scrubEvidence(skipped));
      ndjsonAppend(join(runDir, 'telemetry', 'interactive-probes.ndjson'), scrubEvidence(skipped));
      records.push(skipped);
      continue;
    }
    budgetState.probedRefs.add(target.elementRef);
    const dir = `frames/interactive/${stopId}/${target.elementRef}`;
    ensureDir(join(runDir, dir));
    const eventCursor = await page.evaluate(() => window.__scapPeek?.().length || 0).catch(() => 0);
    const record = { id: `interactive-${stopId}-${target.elementRef}`, stopId, elementRef: target.elementRef, target, status: 'partial', phases: {}, autonomousMaskRef: `dwell-${stopId}` };
    try {
      await page.mouse.move(neutral.x, neutral.y, { steps: 4 }); await page.waitForTimeout(80);
      const baseState = await captureInteractiveTargetState(page, target.elementRef, 'base', neutral);
      const baseFrame = await captureTargetCrop(page, runDir, `${dir}/base.png`, target.rect); diagnosticCounter.count++; budgetState.crops++;
      record.phases.base = { state: baseState, ...baseFrame };

      const transitionStart = Date.now();
      await page.mouse.move(target.point.x, target.point.y, { steps: 8 });
      const hoverSeries = [];
      let hoverImmediateFrame = null;
      for (const scheduledMs of [0, 40, 90, 160, 300]) {
        const wait = scheduledMs - (Date.now() - transitionStart); if (wait > 0) await page.waitForTimeout(wait);
        const state = await captureInteractiveTargetState(page, target.elementRef, scheduledMs === 300 ? 'hover-settled' : 'hover-during', target.point);
        hoverSeries.push({ scheduledMs, actualMs: Date.now() - transitionStart, state });
        if (scheduledMs === 0) { hoverImmediateFrame = await captureTargetCrop(page, runDir, `${dir}/hover-immediate.png`, state.rect || target.rect); diagnosticCounter.count++; budgetState.crops++; }
      }
      const hoverSettledFrame = await captureTargetCrop(page, runDir, `${dir}/hover-settled.png`, hoverSeries.at(-1).state.rect || target.rect); diagnosticCounter.count++; budgetState.crops++;
      record.phases.hover = { status: 'Observed', series: hoverSeries, immediateFrame: hoverImmediateFrame, settledFrame: hoverSettledFrame };

      const reverseStart = Date.now(); await page.mouse.move(neutral.x, neutral.y, { steps: 8 });
      const reverseSeries = [];
      for (const scheduledMs of [0, 40, 90, 160, 320, 600]) {
        const wait = scheduledMs - (Date.now() - reverseStart); if (wait > 0) await page.waitForTimeout(wait);
        reverseSeries.push({ scheduledMs, actualMs: Date.now() - reverseStart, state: await captureInteractiveTargetState(page, target.elementRef, scheduledMs === 600 ? 'reverse-settled' : 'reverse-during', neutral) });
      }
      record.phases.reverse = { status: 'Observed', series: reverseSeries };

      await page.evaluate((elementRef) => {
        const state = window.__siteCapturePhaseB; const roots = [document];
        for (let index = 0; index < roots.length; index++) for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
        for (const root of roots) for (const element of root.querySelectorAll?.('*') || []) if (state?.elementIds?.get(element) === elementRef) { element.focus({ preventScroll: true }); return; }
      }, target.elementRef);
      record.phases.focus = { status: 'Observed', state: await captureInteractiveTargetState(page, target.elementRef, 'focus-and-focus-visible', target.point) };

      await page.mouse.move(target.point.x, target.point.y, { steps: 4 }); await page.mouse.down();
      const activeStart = Date.now(); const activeSeries = [];
      for (const scheduledMs of [0, 60, 150]) {
        const wait = scheduledMs - (Date.now() - activeStart); if (wait > 0) await page.waitForTimeout(wait);
        activeSeries.push({ scheduledMs, actualMs: Date.now() - activeStart, state: await captureInteractiveTargetState(page, target.elementRef, 'active-during', target.point) });
      }
      await page.mouse.move(neutral.x, neutral.y, { steps: 4 }); await page.mouse.up();
      record.phases.active = { status: 'Observed', series: activeSeries };
      await page.evaluate((elementRef) => {
        const state = window.__siteCapturePhaseB; const roots = [document];
        for (let index = 0; index < roots.length; index++) for (const element of roots[index].querySelectorAll?.('*') || []) if (element.shadowRoot) roots.push(element.shadowRoot);
        for (const root of roots) for (const element of root.querySelectorAll?.('*') || []) if (state?.elementIds?.get(element) === elementRef) { element.blur(); return; }
      }, target.elementRef).catch(() => {});
      const restoreSettle = await settleThorough(page, 600);
      const restoredState = await captureInteractiveTargetState(page, target.elementRef, 'restored', neutral);
      const restoredFrame = await captureTargetCrop(page, runDir, `${dir}/restored.png`, restoredState.rect || target.rect); diagnosticCounter.count++; budgetState.crops++;
      const restoreDelta = diffReadableSnapshots({ elements: [{ elementRef: target.elementRef, styleHash: JSON.stringify(baseState.props), rectHash: JSON.stringify(baseState.rect), props: baseState.props, rect: baseState.rect }] }, { elements: [{ elementRef: target.elementRef, styleHash: JSON.stringify(restoredState.props), rectHash: JSON.stringify(restoredState.rect), props: restoredState.props, rect: restoredState.rect }] });
      const separatedRestore = subtractAutonomousReadable(restoreDelta, autonomous);
      record.phases.restored = { status: separatedRestore.changed ? 'not-restored-in-window' : 'restored', settle: restoreSettle, state: restoredState, delta: separatedRestore, ...restoredFrame };
      record.lifecycleEvents = await page.evaluate((from) => (window.__scapPeek?.() || []).slice(from), eventCursor).catch(() => []);
      record.status = 'Observed'; budgetState.captured++;
    } catch (error) {
      try { await page.mouse.up(); } catch {}
      await page.mouse.move(neutral.x, neutral.y).catch(() => {});
      record.status = 'Unknown'; record.reason = String(error);
      if (!budgetState.skippedRefs.has(target.elementRef)) { budgetState.skipped++; budgetState.skippedRefs.add(target.elementRef); }
    }
    const safe = scrubEvidence(record);
    ndjsonAppend(join(runDir, 'source-evidence', 'interactive-states.ndjson'), safe);
    ndjsonAppend(join(runDir, 'telemetry', 'interactive-probes.ndjson'), safe);
    records.push(safe);
  }
  return { discovered: discovered.length, records, captured: records.filter((record) => record.status === 'Observed').length, skipped: records.filter((record) => record.status !== 'Observed').length };
}

async function probeCursorGrid(page, runDir, stopId, section, autonomous, readableCache, diagnosticCounter, maxDiagnosticFrames) {
  const cursorDir = ensureDir(join(runDir, 'frames', 'cursor', section.sectionRef, stopId));
  const neutral = { x: 2, y: 2 };
  const normalized = [
    ['center', 0.5, 0.5], ['upper-left', 0.2, 0.2], ['upper-right', 0.8, 0.2],
    ['lower-left', 0.2, 0.8], ['lower-right', 0.8, 0.8],
  ];
  const clip = (value, low, high) => Math.max(low, Math.min(high, value));
  const positions = [];
  let firstBaselineReadable = null;
  let firstBaselineFrame = null;
  for (let positionIndex = 0; positionIndex < normalized.length; positionIndex++) {
    const [name, nx, ny] = normalized[positionIndex];
    const target = {
      x: Math.round(clip(section.rect.left + section.rect.width * nx, 8, (await page.viewportSize()).width - 8)),
      y: Math.round(clip(section.rect.top + section.rect.height * ny, 8, (await page.viewportSize()).height - 8)),
    };
    try {
      await page.mouse.move(neutral.x, neutral.y);
      await page.waitForTimeout(80);
      const baselineBuffer = await page.screenshot({ type: 'png' });
      const baselineReadable = compactReadableSnapshot(await captureReadableSnapshot(page, neutral), readableCache);
      if (!firstBaselineReadable) { firstBaselineReadable = baselineReadable; firstBaselineFrame = baselineBuffer; }
      const baselineRef = `frames/cursor/${section.sectionRef}/${stopId}/${String(positionIndex).padStart(2, '0')}-${name}-baseline.png`;
      writeFileSync(join(runDir, baselineRef), baselineBuffer); diagnosticCounter.count++;
      const targetIdentity = await page.evaluate((point) => {
        const state = window.__siteCapturePhaseB ||= { elementIds: new WeakMap(), nextElementId: 1, runtimeIds: new WeakMap(), nextRuntimeId: 1, observationByElement: new Map(), nextObservationId: 1 };
        const idFor = (element) => {
          if (!element) return null;
          let id = state.elementIds.get(element);
          if (!id) { id = `el_${String(state.nextElementId++).padStart(6, '0')}`; state.elementIds.set(element, id); }
          return id;
        };
        const stack = document.elementsFromPoint(point.x, point.y); const element = stack.find((candidate) => candidate !== document.documentElement && candidate !== document.body) || stack[0] || null;
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const ancestors = []; let ancestor = element.parentElement;
        while (ancestor && ancestors.length < 12) {
          const ancestorRect = ancestor.getBoundingClientRect();
          ancestors.push({ elementRef: idFor(ancestor), tag: ancestor.localName, role: ancestor.getAttribute('role'), rect: { left: ancestorRect.left, top: ancestorRect.top, width: ancestorRect.width, height: ancestorRect.height } });
          if (ancestor.matches('[data-section],section,main,article,body')) break;
          ancestor = ancestor.parentElement;
        }
        const component = element.closest('[data-component],[role="dialog"],[role="menu"],[role="tablist"],button,a,input,select,textarea,form');
        const style = getComputedStyle(element);
        return { elementRef: idFor(element), componentRef: idFor(component), tag: element.localName, role: element.getAttribute('role'), className: typeof element.className === 'string' ? element.className.slice(0, 120) : '', cursor: style.cursor, ancestors, hitTestStack: stack.slice(0, 12).map((candidate) => ({ elementRef: idFor(candidate), tag: candidate.localName })), rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } };
      }, target);
      let targetBaselineBuffer = null; let targetBaselineRef = null; let targetClip = null;
      if (targetIdentity?.rect?.width > 0 && targetIdentity?.rect?.height > 0) {
        targetClip = targetClipForRect(await page.viewportSize(), targetIdentity.rect);
        targetBaselineBuffer = await page.screenshot({ type: 'png', clip: targetClip });
        targetBaselineRef = `frames/cursor/${section.sectionRef}/${stopId}/${String(positionIndex).padStart(2, '0')}-${name}-target-baseline.png`;
        writeFileSync(join(runDir, targetBaselineRef), targetBaselineBuffer); diagnosticCounter.count++;
      }
      const pathSamples = [];
      const canRefinePath = diagnosticCounter.count + 12 <= maxDiagnosticFrames;
      const waypointCount = canRefinePath ? 9 : 1;
      for (let waypointIndex = 1; waypointIndex <= waypointCount; waypointIndex++) {
        const fraction = waypointIndex / waypointCount;
        const point = { x: Math.round(neutral.x + (target.x - neutral.x) * fraction), y: Math.round(neutral.y + (target.y - neutral.y) * fraction) };
        await page.mouse.move(point.x, point.y);
        await page.waitForTimeout(canRefinePath ? 35 : 70);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const buffer = await page.screenshot({ type: 'png' });
        const frameRef = `frames/cursor/${section.sectionRef}/${stopId}/${String(positionIndex).padStart(2, '0')}-${name}-path-${String(waypointIndex).padStart(2, '0')}.png`;
        writeFileSync(join(runDir, frameRef), buffer); diagnosticCounter.count++;
        const readableData = compactReadableSnapshot(await captureReadableSnapshot(page, point), readableCache);
        const frameHash = hashFrame(buffer);
        pathSamples.push({ waypointIndex, fraction, point, wallMs: Date.now(), frameRef, frameHash, readableData, canvasReaction: { status: 'Observed', frameHash, canvases: readableData.canvases || [], caveat: 'frame/timed reaction only; canvas scene graph, camera, and materials remain Unknown' } });
      }
      await page.waitForTimeout(300);
      const settledBuffer = await page.screenshot({ type: 'png' });
      const settledRef = `frames/cursor/${section.sectionRef}/${stopId}/${String(positionIndex).padStart(2, '0')}-${name}-settled.png`;
      writeFileSync(join(runDir, settledRef), settledBuffer); diagnosticCounter.count++;
      let targetSettledRef = null; let targetPixelDiff = { comparable: false, reason: 'no stable target crop' };
      if (targetClip && targetBaselineBuffer) {
        const targetSettledBuffer = await page.screenshot({ type: 'png', clip: targetClip });
        targetSettledRef = `frames/cursor/${section.sectionRef}/${stopId}/${String(positionIndex).padStart(2, '0')}-${name}-target-settled.png`;
        writeFileSync(join(runDir, targetSettledRef), targetSettledBuffer); diagnosticCounter.count++;
        targetPixelDiff = summarizePixelDiff(targetBaselineBuffer, targetSettledBuffer, { channelThreshold: 12, tileSize: 32 });
      }
      const settledReadable = compactReadableSnapshot(await captureReadableSnapshot(page, target), readableCache);
      const rawDiff = summarizePixelDiff(baselineBuffer, settledBuffer, { channelThreshold: 12, tileSize: 64 });
      const pixelDiff = subtractAutonomousTiles(rawDiff, autonomous);
      const readableDiff = diffReadableSnapshots(baselineReadable, settledReadable);
      const separatedReadable = subtractAutonomousReadable(readableDiff, autonomous);
      let label = 'ambiguous';
      if (separatedReadable.changed && separatedReadable.autonomousChanges.length) label = 'mixed';
      else if (separatedReadable.changed && pixelDiff.outsideAutonomousMask) label = 'pointer-caused';
      else if (separatedReadable.changed) label = 'pointer-caused';
      else if (pixelDiff.outsideAutonomousMask) label = 'probably-pointer-caused';
      else if ((rawDiff.changedRatio || 0) > 0 && autonomous.label === 'autonomous-observed') label = 'autonomous';
      positions.push({ name, normalized: { x: nx, y: ny }, target, targetIdentity, status: 'captured', baselineFrameRef: baselineRef, targetBaselineFrameRef: targetBaselineRef, pathSampling: canRefinePath ? 'continuous-nine-waypoint' : 'endpoint-only-cap-degraded', pathSamples, settledFrameRef: settledRef, targetSettledFrameRef: targetSettledRef, settledFrameHash: hashFrame(settledBuffer), settledReadable, pixelDiff, targetPixelDiff: { ...targetPixelDiff, caveat: 'target-crop pixels are Observed; the section-phase full-view autonomous mask is not geometrically reused on crop coordinates' }, readableDiff, controlledReadableDiff: separatedReadable, causalLabel: label });
      ndjsonAppend(join(runDir, 'telemetry', 'causal-deltas.ndjson'), { id: `causal-cursor-${stopId}-${positionIndex}`, stopId, source: 'cursor-path', position: name, label, status: label === 'ambiguous' ? 'Unknown' : label === 'probably-pointer-caused' ? 'Inferred' : 'Observed', evidenceRefs: [settledRef, targetBaselineRef, targetSettledRef, ...pathSamples.map((sample) => sample.frameRef)].filter(Boolean) });
    } catch (error) {
      positions.push({ name, normalized: { x: nx, y: ny }, target, status: 'error', reason: String(error), pathSamples: [], causalLabel: 'ambiguous' });
    }
  }
  await page.mouse.move(neutral.x, neutral.y);
  const restoreSettle = await settleThorough(page, 600);
  const restoredBuffer = await page.screenshot({ type: 'png' });
  const restoredReadable = compactReadableSnapshot(await captureReadableSnapshot(page, neutral), readableCache);
  const restoredRef = `frames/cursor/${section.sectionRef}/${stopId}/restored-neutral.png`;
  writeFileSync(join(runDir, restoredRef), restoredBuffer); diagnosticCounter.count++;
  const restorationDiff = diffReadableSnapshots(firstBaselineReadable || {}, restoredReadable);
  const restorationReadable = subtractAutonomousReadable(restorationDiff, autonomous);
  const remainingReadableChanges = restorationReadable.changes;
  const restorationPixelDiff = firstBaselineFrame ? subtractAutonomousTiles(summarizePixelDiff(firstBaselineFrame, restoredBuffer, { channelThreshold: 12, tileSize: 64 }), autonomous) : { comparable: false, reason: 'missing-baseline' };
  const restored = remainingReadableChanges.length === 0 && (!restorationPixelDiff.comparable || !restorationPixelDiff.outsideAutonomousMask);
  const restore = { neutral, status: restored ? 'restored' : 'not-restored-in-window', confidence: autonomous.label === 'autonomous-observed' ? 'Inferred' : 'Observed', settle: restoreSettle, frameRef: restoredRef, frameHash: hashFrame(restoredBuffer), readable: restoredReadable, diffFromFirstBaseline: restorationDiff, propertyLevelSubtraction: restorationReadable, remainingReadableChanges, pixelDiffOutsideAutonomousMask: restorationPixelDiff, caveat: autonomous.label === 'autonomous-observed' ? 'stationary-observed properties/rects/tiles were subtracted only for this phase-matched state' : null };
  const record = scrubEvidence({ id: `cursor-${stopId}`, stopId, sectionRef: section.sectionRef, neutral, positions, restore });
  ndjsonAppend(join(runDir, 'telemetry', 'cursor-probes.ndjson'), record);
  return { record, positions, restore, restoredBuffer, restoredReadable, firstBaselineFrame };
}

async function thoroughScrollAtlas(page, runDir, opts, log, budget) {
  const framesRoot = ensureDir(join(runDir, 'frames', 'desktop', 'scroll'));
  const keyDir = ensureDir(join(runDir, 'frames', 'desktop', 'keyframes'));
  ensureDir(join(runDir, 'telemetry'));
  ensureDir(join(runDir, 'source-evidence'));
  const viewport = page.viewportSize();
  const vh = viewport.height;
  const targetTravelCssPx = Math.max(100, Math.min(130, Math.round(vh * 0.125)));
  const maxStops = opts.thoroughProfile?.maxStops || 120;
  const maxDiagnosticFrames = opts.thoroughProfile?.maxDiagnosticFrames || 1800;
  const diagnosticCounter = { count: 0 };
  const interactiveBudget = { discovered: 0, captured: 0, skipped: 0, crops: 0, discoveredRefs: new Set(), probedRefs: new Set(), skippedRefs: new Set() };
  const readableCache = new Map();
  const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await settleThorough(page, 1250);

  const frames = [];
  const stops = [];
  const scenesBySection = new Map();
  let previousCanonical = null;
  let previousRestoredReadable = null;
  let previousProgress = null;
  let previousAutonomous = null;
  let stalledStops = 0;
  const seenStorySignatures = new Set();
  const boundaries = [];
  let termination = null;

  for (let stopIndex = 0; stopIndex < maxStops; stopIndex++) {
    const remainingMs = typeof budget.remainingMs === 'function' ? budget.remainingMs() : Infinity;
    if (stopIndex > 0 && diagnosticCounter.count + 70 > maxDiagnosticFrames) {
      log('diagnostic-frame-cap', { note: `stopped before atomic stop ${stopIndex}; current stop cannot fit under the ${maxDiagnosticFrames}-frame crash-safety cap` });
      termination = { reason: 'diagnostic-frame-cap', status: 'cap-skipped', afterStopId: stops.at(-1)?.id || null, progress: previousProgress };
      break;
    }
    if (stopIndex > 0 && (budget.exceeded() || remainingMs < 12000)) {
      log('budget-stop', { note: `thorough capture stopped before atomic stop ${stopIndex}; remaining story range is cap-skipped` });
      termination = { reason: 'browser-budget', status: 'cap-skipped', afterStopId: stops.at(-1)?.id || null, progress: previousProgress };
      break;
    }
    const stopId = `stop-${String(stopIndex).padStart(4, '0')}`;
    const stopDir = ensureDir(join(framesRoot, stopId));
    const stopRecord = { id: stopId, index: stopIndex, status: 'partial', stateRef: `state-${stopId}`, startedAt: new Date().toISOString(), phases: {}, degradation: [] };
    try {
      await page.mouse.move(2, 2);
      const beforeProgress = await captureStoryProgress(page);
      const beforeBuffer = await page.screenshot({ type: 'png' });
      const beforeRef = `frames/desktop/scroll/${stopId}/pre-step.png`;
      writeFileSync(join(runDir, beforeRef), beforeBuffer); diagnosticCounter.count++;
      const beforeReadable = compactReadableSnapshot(await captureReadableSnapshot(page, { x: 2, y: 2 }), readableCache);
      stopRecord.phases.preStep = { status: 'complete', frameRef: beforeRef, frameHash: hashFrame(beforeBuffer), progress: beforeProgress, readable: beforeReadable };

      const movement = stopIndex === 0
        ? { status: 'initial-no-input', targetTravelCssPx: 0, before: beforeProgress, after: beforeProgress, travelCssPx: 0, effectiveSource: beforeProgress.source, pulses: [] }
        : await advanceEffectiveStoryStep(page, beforeProgress, targetTravelCssPx);
      if (stopIndex > 0 && movement.status === 'advanced' && seenStorySignatures.has(movement.after?.signalHash) && Math.abs((movement.after?.native?.y || 0) - (beforeProgress.native?.y || 0)) <= 1) {
        movement.status = 'loop'; movement.confidence = 'Inferred'; movement.reason = 'wheel-correlated state returned to an already observed signal without native advance';
      }
      stopRecord.phases.movement = movement;
      if (stopIndex > 0 && movement.status !== 'advanced') stalledStops++; else stalledStops = 0;

      const settleResult = await settleThorough(page, 1250);
      const settledProgress = await captureStoryProgress(page);
      stopRecord.phases.settle = { ...settleResult, progress: settledProgress };

      const canonicalBuffer = await page.screenshot({ type: 'png' });
      const canonicalRef = `frames/desktop/keyframes/sc-${String(stopIndex).padStart(4, '0')}-y${Math.round(settledProgress.native.y)}.png`;
      writeFileSync(join(runDir, canonicalRef), canonicalBuffer);
      const canonicalDiff = previousCanonical ? summarizePixelDiff(previousCanonical, canonicalBuffer, { channelThreshold: 12, tileSize: 64 }) : { comparable: false, changedRatio: 1 };
      const frameRecord = { id: `sc-${String(stopIndex).padStart(4, '0')}`, phase: stopIndex === 0 ? 'intro' : 'thorough-stop', requestedY: movement.after?.native?.y ?? settledProgress.native.y, actualY: settledProgress.native.y, settleMs: settleResult.elapsedMs, diffRatio: Number((canonicalDiff.changedRatio ?? 1).toFixed(4)), stateHash: settledProgress.signalHash, blank: isBlank(decode(canonicalBuffer)), keyframe: canonicalRef };
      frames.push(frameRecord);

      const dwell = await captureStationarySeries(page, runDir, stopId, stopDir, readableCache, settledProgress, diagnosticCounter);
      stopRecord.phases.dwell = { status: dwell.record.samples.length === 6 ? 'complete' : 'partial', ref: dwell.record.id, sampleCount: dwell.record.samples.length, actualDurationMs: dwell.record.samples.at(-1)?.elapsedMs ?? 0 };
      stopRecord.phases.autonomousModel = { status: dwell.autonomous.status, label: dwell.autonomous.label, changedTileCount: dwell.autonomous.changedTileKeys.length };

      const section = await captureVisibleSection(page);
      const interactive = await probeInteractiveTargets(page, runDir, stopId, dwell.autonomous, interactiveBudget, diagnosticCounter, maxDiagnosticFrames, budget);
      stopRecord.phases.interactiveTargets = { status: 'complete', discoveredAtStop: interactive.discovered, capturedAtStop: interactive.captured, skippedAtStop: interactive.skipped, recordRefs: interactive.records.map((record) => record.id) };
      const cursor = await probeCursorGrid(page, runDir, stopId, section, dwell.autonomous, readableCache, diagnosticCounter, maxDiagnosticFrames);
      stopRecord.phases.cursor = { status: cursor.positions.length === 5 && cursor.positions.every((position) => ['captured', 'occluded', 'outside-section', 'error'].includes(position.status)) ? 'complete' : 'partial', ref: cursor.record.id, terminalCount: cursor.positions.length, pathSamples: cursor.positions.reduce((sum, position) => sum + (position.pathSamples?.length || 0), 0) };
      stopRecord.phases.restore = cursor.restore;

      const visibleAndChanged = await collectVisibleAndChangedElements(page, previousRestoredReadable);
      const deepState = await captureScrollStateEvidence(page, { stateRef: stopRecord.stateRef, phase: 'restored-after-cursor', storyProgress: settledProgress.value, pointer: { x: 2, y: 2 }, frameRefs: [canonicalRef, cursor.restore.frameRef], dwellRef: dwell.record.id, cursorProbeRefs: [cursor.record.id] });
      persistDeepState(runDir, deepState);
      stopRecord.phases.deepSnapshot = { status: Array.isArray(deepState.elements) ? 'complete' : 'partial', stateRef: deepState.stateRef, elementCount: deepState.elements?.length || 0, selectedVisibleCount: visibleAndChanged.current.elements.length, changedSincePriorStop: visibleAndChanged.delta.changes.length, runtimeAnimationCount: deepState.runtimeAnimations?.length || 0, gsapRef: deepState.gsap?.id || null, scrollTriggerRef: deepState.scrollTriggers?.id || null };

      if (previousRestoredReadable && previousProgress) {
        const readableDelta = diffReadableSnapshots(previousRestoredReadable, cursor.restoredReadable);
        const controlledPixelDiff = subtractAutonomousTiles(canonicalDiff, previousAutonomous);
        const progressChanged = settledProgress.signalHash !== previousProgress.signalHash || (settledProgress.value != null && previousProgress.value != null && Math.abs(settledProgress.value - previousProgress.value) > 0.0001);
        const causal = classifyScrollCausality({ delta: readableDelta, autonomous: previousAutonomous, before: previousRestoredReadable, after: cursor.restoredReadable, progressChanged, pixelDiff: controlledPixelDiff });
        ndjsonAppend(join(runDir, 'telemetry', 'causal-deltas.ndjson'), scrubEvidence({ id: `causal-scroll-${stopId}`, stopId, source: 'scroll-step', label: causal.label, status: causal.status, readableDelta, controlledReadableDelta: causal.controlledReadableDelta, propertyClassifications: causal.propertyClassifications, linkedRuntimeTargetRefs: causal.linkedRuntimeTargetRefs, pixelDiff: controlledPixelDiff, autonomousMaskRef: `dwell-${stops.at(-1)?.id || 'unknown'}`, progressBefore: previousProgress, progressAfter: settledProgress, evidenceRefs: [canonicalRef] }));
        const largeReadableDelta = causal.controlledReadableDelta.changes.reduce((sum, change) => sum + (change.propertyChanges?.length || 0) + (change.rectChanges?.length || 0), 0) >= 8;
        const controlledPixelRatio = controlledPixelDiff.comparable ? (controlledPixelDiff.changedTilesOutsideAutonomousMask || []).reduce((sum, tile) => sum + (tile.changedPixels || 0), 0) / Math.max(1, controlledPixelDiff.width * controlledPixelDiff.height) : 0;
        const triggerBoundary = (previousProgress.triggers || []).some((prior) => {
          const next = (settledProgress.triggers || []).find((trigger) => trigger.id === prior.id);
          return next && (prior.isActive !== next.isActive || (prior.progress <= 0 && next.progress > 0) || (prior.progress < 1 && next.progress >= 1));
        });
        if (controlledPixelRatio >= 0.04 || largeReadableDelta || triggerBoundary) boundaries.push({ id: `boundary-${boundaries.length + 1}`, status: 'queued', bracket: { before: previousProgress, after: settledProgress, beforeFrameRef: frames.at(-2)?.keyframe || null, afterFrameRef: canonicalRef }, reasons: { controlledPixelRatio, largeReadableDelta, triggerBoundary }, targetIncrementCssPx: 8, replay: { status: 'pending', method: previousProgress.source === 'native-scroll' && settledProgress.source === 'native-scroll' ? 'native-scrollTo' : 'Unknown', caveat: 'forensic replay is not faithful input' } });
      }

      const complete = stopRecord.phases.settle.status && stopRecord.phases.dwell.sampleCount === 6 && stopRecord.phases.interactiveTargets.status === 'complete' && stopRecord.phases.cursor.terminalCount === 5 && stopRecord.phases.restore.status && stopRecord.phases.deepSnapshot.status === 'complete';
      stopRecord.status = complete ? 'complete' : 'partial';
      stopRecord.completedAt = new Date().toISOString();
      stopRecord.diagnosticFramesSoFar = diagnosticCounter.count;
      if (diagnosticCounter.count >= maxDiagnosticFrames) stopRecord.degradation.push('cursor-path-refinement-frame-cap');
      atomicWriteJson(join(stopDir, 'stop.json'), scrubEvidence(stopRecord));
      ndjsonAppend(join(runDir, 'telemetry', 'scroll.ndjson'), scrubEvidence(stopRecord));
      stops.push(stopRecord);

      let scene = scenesBySection.get(section.sectionRef);
      if (!scene) { scene = { id: `S${String(scenesBySection.size + 1).padStart(2, '0')}`, sectionRef: section.sectionRef, startY: settledProgress.native.y, endY: settledProgress.native.y, keyframes: [] }; scenesBySection.set(section.sectionRef, scene); }
      scene.endY = Math.max(scene.endY, settledProgress.native.y); scene.keyframes.push(canonicalRef);
      previousCanonical = canonicalBuffer;
      previousRestoredReadable = cursor.restoredReadable;
      previousProgress = settledProgress;
      previousAutonomous = dwell.autonomous;
      seenStorySignatures.add(settledProgress.signalHash);

      const activePublicStory = (settledProgress.lenis?.progress != null && settledProgress.lenis.progress < 0.999) || settledProgress.triggers.some((trigger) => trigger.isActive || (trigger.progress > 0.001 && trigger.progress < 0.999));
      const nativeTerminal = settledProgress.native.maxY > 0 && settledProgress.native.y >= settledProgress.native.maxY - 2 && !activePublicStory;
      const staticTerminal = settledProgress.native.maxY <= 1 && !settledProgress.lenis && !settledProgress.triggers.length && !(settledProgress.listenerCounts?.wheel > 0) && !(settledProgress.dom0WheelHandlers > 0);
      if (nativeTerminal || staticTerminal || movement.status === 'terminal' || movement.status === 'loop' || stalledStops >= 2) {
        termination = { reason: nativeTerminal ? 'native-terminal' : staticTerminal ? 'static-terminal' : movement.status === 'loop' ? 'loop' : movement.status === 'terminal' ? 'terminal-signal' : 'bounded-stall', status: ['native-terminal', 'static-terminal', 'terminal-signal'].includes(nativeTerminal ? 'native-terminal' : staticTerminal ? 'static-terminal' : movement.status === 'terminal' ? 'terminal-signal' : '') ? 'Observed' : movement.status === 'loop' ? 'Inferred' : 'Unknown', afterStopId: stopId, progress: settledProgress };
        break;
      }
    } catch (error) {
      stopRecord.status = 'partial'; stopRecord.error = String(error); stopRecord.completedAt = new Date().toISOString();
      atomicWriteJson(join(stopDir, 'stop.json'), scrubEvidence(stopRecord));
      ndjsonAppend(join(runDir, 'telemetry', 'scroll.ndjson'), scrubEvidence(stopRecord));
      stops.push(stopRecord);
      log('thorough-stop-error', { stopId, note: String(error).slice(0, 300) });
      termination = { reason: 'stop-error', status: 'Unknown', afterStopId: stopId, progress: previousProgress };
      break;
    }
  }

  // Replay only native, repeatable brackets. These are forensic micro-stops,
  // explicitly separated from the faithful real-wheel track.
  if (!termination && stops.filter((stop) => stop.kind !== 'forensic-refinement').length >= maxStops) termination = { reason: 'atomic-stop-cap', status: 'cap-skipped', afterStopId: stops.at(-1)?.id || null, progress: previousProgress };
  const faithfulEnd = previousProgress;
  let refinementStopIndex = 0;
  for (const boundary of boundaries.slice(0, 20)) {
    if (stops.length >= maxStops || budget.exceeded() || diagnosticCounter.count + 70 > maxDiagnosticFrames) {
      boundary.status = 'cap-skipped'; boundary.replay.status = 'Unknown'; boundary.replay.reason = 'global stop/time/diagnostic cap reached before atomic refinement';
      continue;
    }
    const startY = boundary.bracket?.before?.native?.y;
    const endY = boundary.bracket?.after?.native?.y;
    if (boundary.replay.method !== 'native-scrollTo' || !Number.isFinite(startY) || !Number.isFinite(endY) || endY <= startY) {
      boundary.status = 'unreplayable'; boundary.replay.status = 'Unknown'; boundary.replay.reason = 'no safe repeatable native bracket; sampled primary evidence retained';
      continue;
    }
    if (endY - startY <= 12) {
      boundary.status = 'already-within-refinement-band'; boundary.replay.status = 'Observed'; boundary.replay.incrementCssPx = endY - startY;
      continue;
    }
    await page.evaluate((y) => window.scrollTo(0, y), startY);
    await settleThorough(page, 1250);
    const canaryProgress = await captureStoryProgress(page);
    const canaryBuffer = await page.screenshot({ type: 'png' });
    const canaryRef = `frames/desktop/scroll/${boundary.id}-replay-canary.png`;
    writeFileSync(join(runDir, canaryRef), canaryBuffer); diagnosticCounter.count++;
    let canaryDiff = { comparable: false, reason: 'primary bracket frame unavailable' };
    if (boundary.bracket.beforeFrameRef && existsSync(join(runDir, boundary.bracket.beforeFrameRef))) canaryDiff = summarizePixelDiff(readFileSync(join(runDir, boundary.bracket.beforeFrameRef)), canaryBuffer, { channelThreshold: 12, tileSize: 64 });
    const progressDiverged = Math.abs(canaryProgress.native.y - startY) > 3;
    const frameDiverged = canaryDiff.comparable && canaryDiff.changedRatio > 0.35;
    boundary.replay.canary = { frameRef: canaryRef, progress: canaryProgress, pixelDiff: canaryDiff, progressDiverged, frameDiverged };
    if (progressDiverged || frameDiverged) {
      boundary.status = 'replay-diverged'; boundary.replay.status = 'Unknown'; boundary.replay.reason = 'canary progress/frame diverged materially; controlled replay abandoned';
      continue;
    }
    boundary.status = 'refining'; boundary.replay.status = 'Inferred'; boundary.replay.incrementCssPx = 8; boundary.replay.caveat = 'scrollTo replay is forensic and not evidence of faithful wheel pacing';
    let refinementPriorReadable = compactReadableSnapshot(await captureReadableSnapshot(page, { x: 2, y: 2 }), readableCache);
    let refinementPriorProgress = canaryProgress;
    let refinementPriorFrame = canaryBuffer;
    boundary.refinementStopIds = [];
    for (let targetY = startY + 8; targetY < endY - 2; targetY += 8) {
      if (stops.length >= maxStops || budget.exceeded() || diagnosticCounter.count + 70 > maxDiagnosticFrames) { boundary.status = 'partial-cap-skipped'; break; }
      const stopId = `refine-${String(refinementStopIndex++).padStart(4, '0')}`;
      const stopDir = ensureDir(join(framesRoot, stopId));
      const stopRecord = { id: stopId, kind: 'forensic-refinement', boundaryRef: boundary.id, index: stops.length, status: 'partial', stateRef: `state-${stopId}`, startedAt: new Date().toISOString(), phases: {}, degradation: [], caveat: 'forensic native scrollTo replay, not faithful wheel input' };
      try {
        await page.mouse.move(2, 2);
        const preBuffer = await page.screenshot({ type: 'png' }); const preRef = `frames/desktop/scroll/${stopId}/pre-step.png`;
        writeFileSync(join(runDir, preRef), preBuffer); diagnosticCounter.count++;
        stopRecord.phases.preStep = { status: 'complete', frameRef: preRef, frameHash: hashFrame(preBuffer), progress: refinementPriorProgress, readable: refinementPriorReadable };
        await page.evaluate((y) => window.scrollTo(0, y), targetY);
        const settleResult = await settleThorough(page, 1250); const settledProgress = await captureStoryProgress(page);
        const refinedTravel = settledProgress.native.y - refinementPriorProgress.native.y;
        stopRecord.phases.movement = { status: refinedTravel >= 4 && refinedTravel <= 12 ? 'advanced' : 'ambiguous', confidence: refinedTravel >= 4 && refinedTravel <= 12 ? 'Observed' : 'Unknown', method: 'native-scrollTo-forensic-replay', requestedY: targetY, before: refinementPriorProgress, after: settledProgress, travelCssPx: refinedTravel, targetBandCssPx: [4, 12], reason: refinedTravel >= 4 && refinedTravel <= 12 ? null : 'observed replay travel fell outside the required 4–12px effective band' };
        stopRecord.phases.settle = { ...settleResult, progress: settledProgress };
        if (stopRecord.phases.movement.status !== 'advanced') {
          stopRecord.status = 'partial'; stopRecord.completedAt = new Date().toISOString();
          atomicWriteJson(join(stopDir, 'stop.json'), scrubEvidence(stopRecord)); ndjsonAppend(join(runDir, 'telemetry', 'scroll.ndjson'), scrubEvidence(stopRecord)); stops.push(stopRecord);
          boundary.status = 'replay-diverged'; boundary.replay.status = 'Unknown'; boundary.replay.reason = stopRecord.phases.movement.reason;
          break;
        }
        const canonicalBuffer = await page.screenshot({ type: 'png' });
        const canonicalRef = `frames/desktop/keyframes/rf-${String(refinementStopIndex).padStart(4, '0')}-y${Math.round(settledProgress.native.y)}.png`;
        writeFileSync(join(runDir, canonicalRef), canonicalBuffer);
        const canonicalDiff = summarizePixelDiff(refinementPriorFrame, canonicalBuffer, { channelThreshold: 12, tileSize: 64 });
        frames.push({ id: `rf-${String(refinementStopIndex).padStart(4, '0')}`, phase: 'forensic-refinement', requestedY: targetY, actualY: settledProgress.native.y, settleMs: settleResult.elapsedMs, diffRatio: Number((canonicalDiff.changedRatio || 0).toFixed(4)), stateHash: settledProgress.signalHash, blank: isBlank(decode(canonicalBuffer)), keyframe: canonicalRef, boundaryRef: boundary.id });
        const dwell = await captureStationarySeries(page, runDir, stopId, stopDir, readableCache, settledProgress, diagnosticCounter);
        stopRecord.phases.dwell = { status: dwell.record.samples.length === 6 ? 'complete' : 'partial', ref: dwell.record.id, sampleCount: dwell.record.samples.length, actualDurationMs: dwell.record.samples.at(-1)?.elapsedMs ?? 0 };
        stopRecord.phases.autonomousModel = { status: dwell.autonomous.status, label: dwell.autonomous.label, changedTileCount: dwell.autonomous.changedTileKeys.length };
        const section = await captureVisibleSection(page);
        const interactive = await probeInteractiveTargets(page, runDir, stopId, dwell.autonomous, interactiveBudget, diagnosticCounter, maxDiagnosticFrames, budget);
        stopRecord.phases.interactiveTargets = { status: 'complete', discoveredAtStop: interactive.discovered, capturedAtStop: interactive.captured, skippedAtStop: interactive.skipped, recordRefs: interactive.records.map((record) => record.id) };
        const cursor = await probeCursorGrid(page, runDir, stopId, section, dwell.autonomous, readableCache, diagnosticCounter, maxDiagnosticFrames);
        stopRecord.phases.cursor = { status: 'complete', ref: cursor.record.id, terminalCount: cursor.positions.length, pathSamples: cursor.positions.reduce((sum, position) => sum + (position.pathSamples?.length || 0), 0) };
        stopRecord.phases.restore = cursor.restore;
        const deepState = await captureScrollStateEvidence(page, { stateRef: stopRecord.stateRef, phase: 'forensic-refinement-restored', storyProgress: settledProgress.value, pointer: { x: 2, y: 2 }, frameRefs: [canonicalRef, cursor.restore.frameRef], dwellRef: dwell.record.id, cursorProbeRefs: [cursor.record.id] });
        persistDeepState(runDir, deepState);
        stopRecord.phases.deepSnapshot = { status: Array.isArray(deepState.elements) ? 'complete' : 'partial', stateRef: deepState.stateRef, elementCount: deepState.elements?.length || 0, runtimeAnimationCount: deepState.runtimeAnimations?.length || 0, staggerSystemCount: deepState.staggerSystems?.length || 0 };
        const readableDelta = diffReadableSnapshots(refinementPriorReadable, cursor.restoredReadable);
        const controlledPixelDiff = subtractAutonomousTiles(canonicalDiff, dwell.autonomous);
        const causal = classifyScrollCausality({ delta: readableDelta, autonomous: dwell.autonomous, before: refinementPriorReadable, after: cursor.restoredReadable, progressChanged: settledProgress.signalHash !== refinementPriorProgress.signalHash, pixelDiff: controlledPixelDiff });
        ndjsonAppend(join(runDir, 'telemetry', 'causal-deltas.ndjson'), scrubEvidence({ id: `causal-${stopId}`, stopId, source: 'forensic-refinement', label: causal.label === 'scroll-caused' ? 'probably-scroll-caused' : causal.label, status: causal.status === 'Observed' ? 'Inferred' : causal.status, propertyClassifications: causal.propertyClassifications, caveat: 'forensic replay cannot upgrade faithful-input causality', evidenceRefs: [canonicalRef] }));
        stopRecord.status = stopRecord.phases.dwell.sampleCount === 6 && stopRecord.phases.cursor.terminalCount === 5 && stopRecord.phases.restore.status && stopRecord.phases.deepSnapshot.status === 'complete' ? 'complete' : 'partial';
        stopRecord.completedAt = new Date().toISOString(); stopRecord.diagnosticFramesSoFar = diagnosticCounter.count;
        atomicWriteJson(join(stopDir, 'stop.json'), scrubEvidence(stopRecord)); ndjsonAppend(join(runDir, 'telemetry', 'scroll.ndjson'), scrubEvidence(stopRecord));
        stops.push(stopRecord); boundary.refinementStopIds.push(stopId);
        let scene = scenesBySection.get(section.sectionRef);
        if (!scene) { scene = { id: `S${String(scenesBySection.size + 1).padStart(2, '0')}`, sectionRef: section.sectionRef, startY: settledProgress.native.y, endY: settledProgress.native.y, keyframes: [] }; scenesBySection.set(section.sectionRef, scene); }
        scene.startY = Math.min(scene.startY, settledProgress.native.y); scene.endY = Math.max(scene.endY, settledProgress.native.y); scene.keyframes.push(canonicalRef);
        refinementPriorReadable = cursor.restoredReadable; refinementPriorProgress = settledProgress; refinementPriorFrame = canonicalBuffer;
      } catch (error) {
        stopRecord.status = 'partial'; stopRecord.error = String(error); stopRecord.completedAt = new Date().toISOString();
        atomicWriteJson(join(stopDir, 'stop.json'), scrubEvidence(stopRecord)); ndjsonAppend(join(runDir, 'telemetry', 'scroll.ndjson'), scrubEvidence(stopRecord)); stops.push(stopRecord);
        boundary.status = 'partial-error'; boundary.replay.reason = String(error); break;
      }
    }
    if (boundary.status === 'refining') boundary.status = boundary.refinementStopIds.length ? 'refined' : 'no-interior-sample';
  }
  if (faithfulEnd?.source === 'native-scroll' && Number.isFinite(faithfulEnd.native?.y)) {
    await page.evaluate((y) => window.scrollTo(0, y), faithfulEnd.native.y).catch(() => {});
    await settleThorough(page, 1250).catch(() => {});
  }
  const scenes = [...scenesBySection.values()];
  if (!scenes.length) scenes.push({ id: 'S01', sectionRef: null, startY: 0, endY: 0, keyframes: [], note: 'no complete thorough stop' });
  const moved = stops.some((stop) => stop.kind !== 'forensic-refinement' && stop.phases?.movement?.status === 'advanced');
  const remainingStoryRange = termination?.status === 'cap-skipped' ? { status: 'Unknown', reason: termination.reason, nativeFromY: termination.progress?.native?.y ?? null, nativeToY: termination.progress?.native?.maxY ?? null, estimatedCssPx: termination.progress?.native ? Math.max(0, termination.progress.native.maxY - termination.progress.native.y) : null } : null;
  return { frames, scenes, total, moved, boundaries, termination, remainingStoryRange, vh, shortPage: total <= vh * 1.5, thorough: true, stops, interactiveCoverage: { discovered: interactiveBudget.discovered, captured: interactiveBudget.captured, skipped: interactiveBudget.skipped, cropFrames: interactiveBudget.crops, targetCap: 120, cropCap: 480 }, profile: { targetTravelCssPx, maxStops, dwellSamplesPerStop: 6, dwellScheduleMs: [0, 400, 900, 1400, 2100, 2800], cursorPositionsPerStop: 5, cursorWaypointsPerMove: 9, maxDiagnosticFrames }, diagnosticFrames: diagnosticCounter.count };
}

async function settle(page, maxMs) {
  const start = Date.now();
  await page.waitForTimeout(80); // minimum settle
  try {
    await page.evaluate((deadline) => new Promise((resolve) => {
      let last = ''; let stable = 0;
      const probe = () => {
        const els = document.querySelectorAll('body *');
        let sig = '';
        for (let i = 0; i < Math.min(els.length, 40); i++) { const r = els[i * Math.floor(Math.max(1, els.length / 40))]?.getBoundingClientRect?.(); if (r) sig += `${Math.round(r.top)},`; }
        stable = sig === last ? stable + 1 : 0;
        last = sig;
        if (stable >= 2 || performance.now() > deadline) resolve();
        else requestAnimationFrame(probe);
      };
      requestAnimationFrame(probe);
    }), maxMs);
  } catch {}
  return Date.now() - start;
}

const stateHash = (page) => page.evaluate(() => {
  let sig = '';
  const els = document.querySelectorAll('body *');
  let count = 0;
  for (const el of els) {
    if (count >= 60) break;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.bottom < -50 || r.top > innerHeight + 50) continue;
    const cs = getComputedStyle(el);
    sig += `${el.tagName}:${Math.round(r.top)}:${cs.opacity}:${cs.backgroundColor}:${cs.color};`;
    count++;
  }
  return sig.length + ':' + sig.split('').reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 0);
});

export async function scrollAtlas(page, runDir, opts, log, budget) {
  if (opts.thorough === true) return thoroughScrollAtlas(page, runDir, opts, log, budget);
  const { level } = opts;
  const framesDir = ensureDir(join(runDir, 'frames', 'desktop', 'scroll'));
  const keyDir = ensureDir(join(runDir, 'frames', 'desktop', 'keyframes'));
  const telemetry = join(runDir, 'telemetry', 'scroll.ndjson');
  const vh = page.viewportSize().height;
  const stepPx = Math.round(vh * (level === 'quick' ? 1.0 : 0.25));
  const SCENE_THRESHOLD = 0.10; // pixel-diff ratio that marks a scene boundary

  const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 750);

  const frames = [];
  const scenes = [];
  let prevPng = null, sceneStart = 0, frameCount = 0;
  const maxFrames = level === 'quick' ? 40 : 300;

  const captureAt = async (y, phase) => {
    if (frameCount >= maxFrames || budget.exceeded()) return null;
    // real input so wheel listeners fire - but never during the intro dwell, where a
    // nudge would advance a virtual-scroll experience past its opening state
    if (phase !== 'intro' && y > 0) await page.mouse.wheel(0, 60);
    await page.evaluate((ty) => window.scrollTo(0, ty), y);
    const settleMs = await settle(page, phase === 'refine' ? 1500 : 750);
    const actualY = await page.evaluate(() => scrollY);
    const buf = await page.screenshot({ type: 'png' });
    const png = decode(buf);
    const ratio = diffRatio(prevPng, png);
    const hash = await stateHash(page);
    const id = `sc-${String(frameCount).padStart(4, '0')}`;
    const rec = { id, phase, requestedY: y, actualY, settleMs, diffRatio: Number(ratio.toFixed(4)), stateHash: hash, blank: isBlank(png) };
    ndjsonAppend(telemetry, { t: new Date().toISOString(), ...rec });
    frames.push(rec);
    frameCount++;
    const isBoundary = prevPng && ratio > SCENE_THRESHOLD;
    if (!prevPng || isBoundary || phase === 'last') {
      const file = join(keyDir, `${id}-y${actualY}.png`);
      writeFileSync(file, buf);
      rec.keyframe = `frames/desktop/keyframes/${id}-y${actualY}.png`;
    } else if (phase === 'refine') {
      const file = join(framesDir, `${id}-y${actualY}.png`);
      writeFileSync(file, buf);
      rec.frame = `frames/desktop/scroll/${id}-y${actualY}.png`;
    }
    prevPng = png;
    return rec;
  };

  // dwell on the opening section before any scrolling - entrance animations are part
  // of the story (directed 2026-08-12: "don't miss the first section")
  const first = await captureAt(0, 'intro');
  for (let i = 0; i < (level === 'quick' ? 1 : 2); i++) { await page.waitForTimeout(1800); await captureAt(0, 'intro'); }
  const boundaries = [];
  for (let y = stepPx; y < total; y += stepPx) {
    const rec = await captureAt(y, 'coarse');
    if (!rec) break;
    if (rec.diffRatio > SCENE_THRESHOLD) boundaries.push({ from: y - stepPx, to: y });
  }
  await captureAt(Math.max(0, total - vh), 'last');

  // hijack honesty check: did the page actually move?
  const moved = frames.some((f) => f.actualY > 10);
  if (!moved && total > vh * 1.5) {
    log('scroll-hijack-suspected', { note: 'page did not move on scrollTo/wheel; hijacked scroll is phase B - queued as gap' });
    return { frames, scenes: [{ id: 'S01', startY: 0, endY: 0, note: 'scroll-hijacked-or-static' }], total, moved, boundaries: [], vh, shortPage: false };
  }

  // refinement pass inside changed windows (full level only)
  if (level === 'full') {
    const refineStep = Math.round(vh * 0.10);
    for (const b of boundaries.slice(0, 20)) {
      if (budget.exceeded()) { log('budget-stop', { note: 'refinement truncated' }); break; }
      for (let y = b.from; y <= b.to; y += refineStep) await captureAt(y, 'refine');
    }
  }

  // scene segmentation
  const sameY = frames.length > 1 && frames.every((f) => f.actualY === frames[0].actualY);
  if (sameY) {
    // virtual-scroll or time-driven page: Y never changes, so segment by capture
    // sequence - a keyframe that crossed the diff threshold opens a new scene
    let idx = 1;
    let cur = { id: 'S01', startY: 0, endY: 0, keyframes: [], note: 'sequence-segmented (virtual or no scroll)' };
    for (const f of frames) if (f.keyframe) {
      if (f.diffRatio > SCENE_THRESHOLD && cur.keyframes.length) {
        scenes.push(cur); idx++;
        cur = { id: `S${String(idx).padStart(2, '0')}`, startY: 0, endY: 0, keyframes: [], note: cur.note };
      }
      cur.keyframes.push(f.keyframe);
    }
    scenes.push(cur);
  } else {
    let start = 0, idx = 1;
    for (const b of boundaries) { scenes.push({ id: `S${String(idx).padStart(2, '0')}`, startY: start, endY: b.to, keyframes: [] }); start = b.to; idx++; }
    scenes.push({ id: `S${String(idx).padStart(2, '0')}`, startY: start, endY: total, keyframes: [] });
    for (const f of frames) if (f.keyframe) {
      // a boundary frame is the first look at the NEW scene, so ranges are [startY, endY)
      const scene = scenes.find((s, i) => f.actualY >= s.startY && (f.actualY < s.endY || i === scenes.length - 1)) || scenes[scenes.length - 1];
      scene.keyframes.push(f.keyframe);
    }
  }
  if (first?.blank) log('blank-first-frame', { note: 'first frame near-blank; possible gated intro - queued as gap' });
  return { frames, scenes, total, moved, boundaries, vh, shortPage: total <= vh * 1.5 };
}

export async function mobileSmoke(context, url, runDir, log) {
  const dir = ensureDir(join(runDir, 'frames', 'mobile-smoke'));
  const page = await context.newPage();
  const shots = [];
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await settle(page, 1500);
    const total = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    const vh = page.viewportSize().height;
    const states = 6;
    for (let i = 0; i < states; i++) {
      const y = Math.round((total - vh) * (i / (states - 1)));
      await page.evaluate((ty) => window.scrollTo(0, ty), Math.max(0, y));
      await settle(page, 600);
      const file = join(dir, `mob-${i}-y${y}.png`);
      writeFileSync(file, await page.screenshot({ type: 'png' }));
      shots.push(`frames/mobile-smoke/mob-${i}-y${y}.png`);
    }
  } catch (e) { log('mobile-smoke-error', { note: String(e).slice(0, 300) }); }
  finally { await page.close().catch(() => {}); }
  return shots;
}
