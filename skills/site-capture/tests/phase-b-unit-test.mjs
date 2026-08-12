import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { captureStop, classifyScrollCausality, subtractAutonomousReadable } from '../src/scroll.mjs';
import { buildAutonomousMask, diffReadableSnapshots, hashFrame, summarizePixelDiff } from '../src/visual-diff.mjs';
import { sanitizeUrl } from '../src/util.mjs';

const frame = (changed = false) => {
  const png = new PNG({ width: 2, height: 2 });
  png.data.fill(255);
  if (changed) { png.data[0] = 0; png.data[1] = 0; png.data[2] = 0; png.data[3] = 255; }
  return PNG.sync.write(png);
};

const still = frame(false);
const moving = frame(true);
assert.notEqual(hashFrame(still), hashFrame(moving));
const diff = summarizePixelDiff(still, moving, { channelThreshold: 1, tileSize: 1 });
assert.equal(diff.comparable, true);
assert.equal(diff.changedPixels, 1);
assert.equal(diff.changedRatio, 0.25);

const mask = buildAutonomousMask([
  { buffer: still, elapsedMs: 0, progressValue: 0.4, progress: { source: 'native-scroll', value: 0.4, signalHash: 'same', native: { y: 100 }, lenis: null, triggers: [] } },
  { buffer: moving, elapsedMs: 400, progressValue: 0.4, progress: { source: 'native-scroll', value: 0.4, signalHash: 'same', native: { y: 100 }, lenis: null, triggers: [] } },
]);
assert.equal(mask.label, 'autonomous-observed');
assert.equal(mask.stableProgress, true);
assert.equal(mask.firstToLast.comparable, true);
assert.equal(mask.temporalSummary.comparisonCount, 1);

const readableBefore = { elements: [{ elementRef: 'el_1', styleHash: 'a', rectHash: 'r', props: { opacity: '0', 'background-color': 'red' }, rect: { top: 0 } }], animations: [{ id: 'anim_1', targetRef: 'el_1', progress: 0.1 }], triggers: [], gsap: null };
const readableAfter = { elements: [{ elementRef: 'el_1', styleHash: 'b', rectHash: 'r', props: { opacity: '1', 'background-color': 'blue' }, rect: { top: 0 } }], animations: [{ id: 'anim_1', targetRef: 'el_1', progress: 0.8 }], triggers: [], gsap: null };
const readableDelta = diffReadableSnapshots(readableBefore, readableAfter);
const autonomousProperties = { changedPropertyKeys: ['el_1:style:background-color'] };
const separated = subtractAutonomousReadable(readableDelta, autonomousProperties);
assert.deepEqual(separated.changes[0].propertyChanges.map((change) => change.property), ['opacity']);
assert.deepEqual(separated.autonomousChanges[0].propertyChanges.map((change) => change.property), ['background-color']);
const causal = classifyScrollCausality({ delta: readableDelta, autonomous: autonomousProperties, before: readableBefore, after: readableAfter, progressChanged: true, pixelDiff: { outsideAutonomousMask: false } });
assert.equal(causal.label, 'mixed');
assert.equal(causal.status, 'Observed');
assert.ok(causal.propertyClassifications.some((item) => item.property === 'opacity' && item.label === 'scroll-caused'));

const unrelatedRuntime = classifyScrollCausality({ delta: readableDelta, autonomous: { changedPropertyKeys: [] }, before: { ...readableBefore, animations: [], triggers: [{ id: 't', triggerRef: 'other', progress: 0 }] }, after: { ...readableAfter, animations: [], triggers: [{ id: 't', triggerRef: 'other', progress: 1 }] }, progressChanged: true, pixelDiff: { outsideAutonomousMask: false } });
assert.equal(unrelatedRuntime.label, 'probably-scroll-caused', 'a global unrelated trigger must not upgrade element changes to Observed causality');

assert.equal(sanitizeUrl('https://alice:secret@example.test/path?token=abc123&ok=yes#session=abc').includes('alice'), false);
assert.match(sanitizeUrl('https://alice:secret@example.test/path?token=abc123&ok=yes#session=abc'), /token=REDACTED/);

const order = [];
const result = await captureStop({
  capturePreStepBaseline: async () => (order.push('before'), 'before'),
  advanceEffectiveStoryStep: async () => (order.push('move'), 'move'),
  settleAtObservedProgress: async () => (order.push('settle'), 'settle'),
  captureStationarySeries: async () => (order.push('dwell'), 'dwell'),
  classifyAutonomousMotion: async () => (order.push('autonomous'), 'autonomous'),
  probeCursorGrid: async () => (order.push('cursor'), 'cursor'),
  restoreNeutralPointerAndSettle: async () => (order.push('restore'), 'restore'),
  collectVisibleAndChangedElements: async () => (order.push('collect'), ['visible']),
  captureScrollStateEvidence: async () => (order.push('deep'), 'deep'),
  commitStopAtomically: async (record) => (order.push('commit'), record),
});
assert.deepEqual(order, ['before', 'move', 'settle', 'dwell', 'autonomous', 'cursor', 'restore', 'collect', 'deep', 'commit']);
assert.equal(result.deepState, 'deep');

console.log('phase B unit tests pass');
