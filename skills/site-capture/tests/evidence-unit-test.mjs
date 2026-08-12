import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  detectStagger,
  mergeTechnology,
  normalizeTransitionTracks,
  resolveCssEasing,
  splitCssList,
} from '../src/evidence.mjs';

assert.deepEqual(
  splitCssList('opacity 200ms cubic-bezier(.1, .2, .3, 1), transform 1s linear(0, .4 40%, 1)'),
  ['opacity 200ms cubic-bezier(.1, .2, .3, 1)', 'transform 1s linear(0, .4 40%, 1)'],
  'top-level commas must not split easing functions',
);
assert.deepEqual(
  splitCssList('"a,b", steps(4, jump-both), var(--fallback, 120ms)'),
  ['"a,b"', 'steps(4, jump-both)', 'var(--fallback, 120ms)'],
  'quoted and nested commas must remain intact',
);

assert.deepEqual(resolveCssEasing('ease-in-out').resolved, {
  type: 'cubic-bezier',
  values: [0.42, 0, 0.58, 1],
});
assert.deepEqual(resolveCssEasing('step-end').resolved, {
  type: 'steps',
  count: 1,
  position: 'jump-end',
});
assert.equal(resolveCssEasing('cubic-bezier(1.2, 0, .5, 1)').parseError, 'cubic-bezier x coordinates must be between 0 and 1');
assert.equal(resolveCssEasing('linear(0, .3 35%, 1)').resolved.type, 'linear-stops');

const tracks = normalizeTransitionTracks({
  property: 'opacity, transform, visibility',
  duration: '100ms, 0.4s',
  easing: 'ease, steps(2, jump-none)',
  delay: '-20ms',
  behavior: 'normal, allow-discrete',
});
assert.equal(tracks.length, 3);
assert.ok(tracks.every((track) => /^transition-track-/.test(track.trackId)));
assert.deepEqual(normalizeTransitionTracks({ property: 'opacity', duration: '100ms', easing: 'ease', delay: '0s', behavior: 'normal' }), normalizeTransitionTracks({ property: 'opacity', duration: '100ms', easing: 'ease', delay: '0s', behavior: 'normal' }), 'normalized transition IDs must be stable across state snapshots');
assert.deepEqual(
  tracks.map(({ property, durationMs, delayMs, listSourceIndex }) => ({ property, durationMs, delayMs, listSourceIndex })),
  [
    { property: 'opacity', durationMs: 100, delayMs: -20, listSourceIndex: { property: 0, duration: 0, easing: 0, delay: 0, behavior: 0 } },
    { property: 'transform', durationMs: 400, delayMs: -20, listSourceIndex: { property: 1, duration: 1, easing: 1, delay: 0, behavior: 1 } },
    { property: 'visibility', durationMs: 100, delayMs: -20, listSourceIndex: { property: 2, duration: 0, easing: 0, delay: 0, behavior: 0 } },
  ],
  'short CSS lists must repeat cyclically to transition-property length',
);

const stagger = detectStagger([{ id: 'rule-1', selectorText: '.item', declarations: [{ property: 'transition-delay', value: 'calc(var(--i) * 80ms)' }] }], [{ elementRef: 'el-1', ruleRefs: ['rule-1'] }]);
assert.equal(stagger[0].status, 'Observed');
assert.deepEqual(stagger[0].customProperties, ['--i']);
assert.deepEqual(stagger[0].intervals, ['80ms']);

const technologyDir = mkdtempSync(join(tmpdir(), 'site-capture-technology-'));
try {
  const expanded = mergeTechnology({ pixi: true, babylon: true, ogl: true, regl: true, curtains: true, framer: true, framerMotion: true, react: true, vue: true, svelte: true, angular: true, webgl: true }, technologyDir);
  const expandedNames = new Set(expanded.detected.map((entry) => entry.name));
  for (const name of ['PixiJS', 'Babylon.js', 'OGL', 'regl', 'curtains.js', 'Framer', 'Framer-Motion', 'React', 'Vue', 'Svelte', 'Angular']) assert.ok(expandedNames.has(name), `${name} must be present in the expanded registry`);
  assert.equal(expandedNames.has('custom-webgl-engine'), false, 'known WebGL libraries suppress the custom-engine fallback');
  const custom = mergeTechnology({ webgl: true }, technologyDir);
  assert.ok(custom.detected.some((entry) => entry.name === 'custom-webgl-engine' && entry.confidence === 'medium'));
} finally {
  rmSync(technologyDir, { recursive: true, force: true });
}

console.log('evidence unit tests pass');
