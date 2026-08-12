#!/usr/bin/env node
// Perceived palette: the dominant colors as they READ on screen, sampled from the
// captured frame pixels - not from CSS. Award/canvas sites carry most of their
// palette in imagery a CSS-color sweep never sees (eval-01 G-palette gap).
// Additive post-step: reads a finished run folder, writes source-evidence/perceived-palette.json
// and merges evidence.json.perceivedPalette. Never touches the capture engine.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const RUN = process.argv[2];
if (!RUN || !existsSync(RUN)) { console.error('usage: perceived-palette.mjs <run-dir>'); process.exit(1); }

const FRAME_DIRS = ['frames/desktop/keyframes', 'frames/desktop/scroll', 'frames/gap-fill-thorough', 'frames/gap-fill-detailed', 'frames/gap-fill'];
const files = [];
for (const d of FRAME_DIRS) { const p = join(RUN, d); if (existsSync(p)) for (const f of readdirSync(p)) if (f.endsWith('.png')) files.push(join(p, f)); }
if (!files.length) { console.error('no frames found'); process.exit(1); }

// sample up to N frames; quantize RGB to 24-steps; count buckets over a pixel stride
const STEP = 24, STRIDE = 41 * 4, MAX_FRAMES = 80;
const buckets = new Map();
let sampled = 0;
for (const f of files.slice(0, MAX_FRAMES)) {
  let png; try { png = PNG.sync.read(readFileSync(f)); } catch { continue; }
  sampled++;
  const d = png.data;
  for (let i = 0; i < d.length; i += STRIDE) {
    if (d[i + 3] < 200) continue; // skip transparent
    const r = Math.min(255, Math.round(d[i] / STEP) * STEP);
    const g = Math.min(255, Math.round(d[i + 1] / STEP) * STEP);
    const b = Math.min(255, Math.round(d[i + 2] / STEP) * STEP);
    const key = (r << 16) | (g << 8) | b;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
}
const total = [...buckets.values()].reduce((a, b) => a + b, 0) || 1;
const hex = (v) => '#' + v.toString(16).padStart(6, '0');
const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16)
  .map(([k, n]) => ({ hex: hex(k), rgb: [(k >> 16) & 255, (k >> 8) & 255, k & 255], share: +(n / total).toFixed(4) }));

// classify: darkest (ink), lightest (paper), most-saturated (accent)
const lum = (c) => 0.299 * c.rgb[0] + 0.587 * c.rgb[1] + 0.114 * c.rgb[2];
const sat = (c) => { const m = Math.max(...c.rgb), n = Math.min(...c.rgb); return m ? (m - n) / m : 0; };
const sorted = [...top];
const roles = {
  ink: [...sorted].sort((a, b) => lum(a) - lum(b))[0]?.hex || null,
  paper: [...sorted].sort((a, b) => lum(b) - lum(a))[0]?.hex || null,
  accent: [...sorted].sort((a, b) => sat(b) - sat(a))[0]?.hex || null,
};
const out = { source: 'screenshot-pixel-quantization', status: 'Observed', note: `dominant on-screen colors sampled from ${sampled} captured frames; approximate (quantized to ${STEP}-steps), evidence-only never shipped`, roles, colors: top };

mkdirSync(join(RUN, 'source-evidence'), { recursive: true });
writeFileSync(join(RUN, 'source-evidence', 'perceived-palette.json'), JSON.stringify(out, null, 2));
const evPath = join(RUN, 'evidence.json');
if (existsSync(evPath)) { try { const ev = JSON.parse(readFileSync(evPath, 'utf8')); ev.perceivedPalette = out; writeFileSync(evPath, JSON.stringify(ev, null, 2)); } catch {} }
console.log('perceived palette (' + sampled + ' frames):', top.slice(0, 8).map((c) => c.hex).join(' '));
console.log('roles: ink', roles.ink, '| paper', roles.paper, '| accent', roles.accent);
