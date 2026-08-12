// Deterministic diagnostic PNG comparisons. This module reports pixel facts and
// masks only; scroll.mjs combines them with input/runtime evidence before assigning
// causal labels.
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';

export const hashFrame = (buffer) => createHash('sha256').update(buffer).digest('hex');

const asPng = (value) => Buffer.isBuffer(value) ? PNG.sync.read(value) : value;

export function summarizePixelDiff(beforeValue, afterValue, options = {}) {
  if (!beforeValue || !afterValue) return { comparable: false, reason: 'missing-frame' };
  const before = asPng(beforeValue);
  const after = asPng(afterValue);
  if (before.width !== after.width || before.height !== after.height) {
    return { comparable: false, reason: 'dimension-mismatch', before: { width: before.width, height: before.height }, after: { width: after.width, height: after.height } };
  }
  const channelThreshold = options.channelThreshold ?? 12;
  const tileSize = options.tileSize ?? 64;
  let changedPixels = 0;
  let accumulatedDelta = 0;
  let minX = before.width;
  let minY = before.height;
  let maxX = -1;
  let maxY = -1;
  const tiles = new Map();
  for (let y = 0; y < before.height; y++) {
    for (let x = 0; x < before.width; x++) {
      const offset = (y * before.width + x) * 4;
      const delta = Math.max(
        Math.abs(before.data[offset] - after.data[offset]),
        Math.abs(before.data[offset + 1] - after.data[offset + 1]),
        Math.abs(before.data[offset + 2] - after.data[offset + 2]),
        Math.abs(before.data[offset + 3] - after.data[offset + 3]),
      );
      accumulatedDelta += delta;
      if (delta <= channelThreshold) continue;
      changedPixels++;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      const key = `${Math.floor(x / tileSize)}:${Math.floor(y / tileSize)}`;
      tiles.set(key, (tiles.get(key) || 0) + 1);
    }
  }
  const pixels = before.width * before.height;
  const changedTiles = [...tiles.entries()].map(([key, count]) => {
    const [column, row] = key.split(':').map(Number);
    return { key, x: column * tileSize, y: row * tileSize, width: Math.min(tileSize, before.width - column * tileSize), height: Math.min(tileSize, before.height - row * tileSize), changedPixels: count };
  });
  return {
    comparable: true,
    width: before.width,
    height: before.height,
    threshold: channelThreshold,
    changedPixels,
    changedRatio: pixels ? changedPixels / pixels : 0,
    meanMaxChannelDelta: pixels ? accumulatedDelta / pixels : 0,
    bounds: changedPixels ? { left: minX, top: minY, right: maxX, bottom: maxY, width: maxX - minX + 1, height: maxY - minY + 1 } : null,
    changedTiles,
  };
}

export function buildAutonomousMask(samples, options = {}) {
  const changedTileKeys = new Set();
  const comparisons = [];
  for (let index = 1; index < samples.length; index++) {
    const summary = summarizePixelDiff(samples[index - 1].buffer, samples[index].buffer, options);
    comparisons.push({ from: index - 1, to: index, ...summary });
    for (const tile of summary.changedTiles || []) changedTileKeys.add(tile.key);
  }
  const firstToLast = samples.length > 1
    ? summarizePixelDiff(samples[0].buffer, samples.at(-1).buffer, options)
    : { comparable: false, reason: 'insufficient-samples' };
  for (const tile of firstToLast.changedTiles || []) changedTileKeys.add(tile.key);
  const ratios = comparisons.filter((comparison) => comparison.comparable).map((comparison) => comparison.changedRatio || 0);
  const meanChangedRatio = ratios.length ? ratios.reduce((sum, value) => sum + value, 0) / ratios.length : 0;
  const temporalChangeVariance = ratios.length
    ? ratios.reduce((sum, value) => sum + ((value - meanChangedRatio) ** 2), 0) / ratios.length
    : 0;
  const tolerance = options.progressTolerance ?? 0.001;
  const baselineProgress = samples[0]?.progress || null;
  const stableProgress = samples.length > 1 && samples.every((sample) => {
    const progress = sample.progress || null;
    if (!baselineProgress || !progress) return false;
    if (Math.abs((progress.native?.y ?? Number.NaN) - (baselineProgress.native?.y ?? Number.NaN)) > 1) return false;
    if (progress.source !== baselineProgress.source) return false;
    if (baselineProgress.value != null || progress.value != null) {
      if (baselineProgress.value == null || progress.value == null || Math.abs(progress.value - baselineProgress.value) > tolerance) return false;
    } else if (!(baselineProgress.staticStory && progress.staticStory) && progress.signalHash !== baselineProgress.signalHash) return false;
    const lenisBefore = baselineProgress.lenis?.scroll;
    const lenisAfter = progress.lenis?.scroll;
    if (lenisBefore != null || lenisAfter != null) {
      if (lenisBefore == null || lenisAfter == null || Math.abs(lenisAfter - lenisBefore) > 1) return false;
    }
    const triggerBefore = (baselineProgress.triggers || []).map((trigger) => [trigger.id, trigger.progress]);
    const triggerAfter = (progress.triggers || []).map((trigger) => [trigger.id, trigger.progress]);
    return JSON.stringify(triggerBefore) === JSON.stringify(triggerAfter);
  });
  const changed = comparisons.some((comparison) => comparison.changedRatio > (options.changedRatioThreshold ?? 0.0001));
  return {
    status: stableProgress ? 'Observed' : 'Unknown',
    label: !stableProgress ? 'ambiguous' : changed ? 'autonomous-observed' : 'stable-in-window',
    sampleCount: samples.length,
    sampledDurationMs: samples.length > 1 ? samples.at(-1).elapsedMs - samples[0].elapsedMs : 0,
    stableProgress,
    changedTileKeys: [...changedTileKeys],
    comparisons,
    firstToLast,
    temporalSummary: {
      comparisonCount: ratios.length,
      meanChangedRatio,
      maxChangedRatio: ratios.length ? Math.max(...ratios) : 0,
      changedRatioVariance: temporalChangeVariance,
      repeatedChangedIntervals: ratios.filter((value) => value > (options.changedRatioThreshold ?? 0.0001)).length,
    },
    caveat: 'This mask is valid only for the sampled route/viewport/section/scroll/pointer phase.',
  };
}

export function subtractAutonomousTiles(diff, autonomousMask) {
  if (!diff?.comparable) return diff;
  const autonomous = new Set(autonomousMask?.changedTileKeys || []);
  const outside = (diff.changedTiles || []).filter((tile) => !autonomous.has(tile.key));
  return { ...diff, changedTilesOutsideAutonomousMask: outside, outsideAutonomousMask: outside.length > 0 };
}

export function diffReadableSnapshots(before = {}, after = {}) {
  const beforeElements = new Map((before.elements || []).map((entry) => [entry.elementRef, entry]));
  const afterElements = new Map((after.elements || []).map((entry) => [entry.elementRef, entry]));
  const changes = [];
  for (const [elementRef, next] of afterElements) {
    const prior = beforeElements.get(elementRef);
    if (!prior) { changes.push({ elementRef, kind: 'mounted-or-newly-visible', afterHash: next.styleHash, propertyChanges: [{ property: '*', before: null, after: 'mounted-or-visible' }], rectChanges: [] }); continue; }
    if (prior.styleHash !== next.styleHash || prior.rectHash !== next.rectHash) {
      const propertyChanges = [];
      const names = new Set([...Object.keys(prior.props || {}), ...Object.keys(next.props || {})]);
      for (const property of names) {
        const beforeValue = prior.props?.[property] ?? null;
        const afterValue = next.props?.[property] ?? null;
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) propertyChanges.push({ property, before: beforeValue, after: afterValue });
      }
      const rectChanges = [];
      const rectNames = new Set([...Object.keys(prior.rect || {}), ...Object.keys(next.rect || {})]);
      for (const property of rectNames) {
        const beforeValue = prior.rect?.[property] ?? null;
        const afterValue = next.rect?.[property] ?? null;
        if (beforeValue !== afterValue) rectChanges.push({ property, before: beforeValue, after: afterValue });
      }
      changes.push({ elementRef, kind: 'style-or-layout', beforeHash: prior.styleHash, afterHash: next.styleHash, beforeRectHash: prior.rectHash, afterRectHash: next.rectHash, propertyChanges, rectChanges });
    }
  }
  for (const [elementRef, prior] of beforeElements) if (!afterElements.has(elementRef)) changes.push({ elementRef, kind: 'detached-or-no-longer-visible', beforeHash: prior.styleHash, propertyChanges: [{ property: '*', before: 'mounted-or-visible', after: null }], rectChanges: [] });
  return { changed: changes.length > 0, changes };
}
