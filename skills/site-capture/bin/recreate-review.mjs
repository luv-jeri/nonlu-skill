#!/usr/bin/env node
// Recreation review loop: SEE the rebuild next to the reference, with numbers.
//
// The capture engine gathers the reference; this drives the REBUILD the same
// way a hand would (virtual-scroll wheel glides), shoots every beat plus the
// mid-transitions, probes FPS, computes coarse objective deltas against the
// reference scroll frames, and emits review/REVIEW.md - screenshots paired
// side by side plus a judgment checklist the agent fills by LOOKING.
//
// The loop: run -> read REVIEW.md -> fix the worst finding -> run again.
// Every finding that changes the rebuild is appended to LEARNINGS.md so the
// next capture starts smarter (absorbed later by /skill-evolve).
//
//   node bin/recreate-review.mjs <demo-url> --capture <capture-dir> \
//     [--beats 6] [--travel-px 16000] [--out <capture-dir>/review]

import { chromium } from 'playwright';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--'));
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
if (!url) {
  console.error('usage: recreate-review.mjs <demo-url> --capture <capture-dir> [--beats 6] [--travel-px 16000]');
  process.exit(1);
}
const captureDir = opt('capture', null);
const beats = Number(opt('beats', 6));
const travel = Number(opt('travel-px', 16000));
const outDir = resolve(opt('out', captureDir ? join(captureDir, 'review') : './review'));
mkdirSync(outDir, { recursive: true });

// reference frames: the capture's scroll atlas, evenly resampled to `beats`
let refFrames = [];
if (captureDir) {
  // first frame dir that actually CONTAINS scroll frames (a dir can exist empty)
  for (const d of ['frames/desktop/scroll', 'frames/desktop/keyframes', 'frames/desktop']) {
    const dir = join(captureDir, d);
    if (!existsSync(dir)) continue;
    const all = readdirSync(dir).filter((f) => f.startsWith('sc-') && f.endsWith('.png')).sort();
    if (all.length >= 2) {
      refFrames = Array.from({ length: beats }, (_, i) => join(dir, all[Math.min(all.length - 1, Math.round((i / Math.max(1, beats - 1)) * (all.length - 1)))]));
      break;
    }
  }
}

const grid = (png, n = 4) => {
  const cells = [];
  const cw = Math.floor(png.width / n), ch = Math.floor(png.height / n);
  for (let gy = 0; gy < n; gy += 1) for (let gx = 0; gx < n; gx += 1) {
    let r = 0, g = 0, b = 0, c = 0;
    for (let y = gy * ch; y < (gy + 1) * ch; y += 6) for (let x = gx * cw; x < (gx + 1) * cw; x += 6) {
      const i = (png.width * y + x) << 2;
      r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; c += 1;
    }
    cells.push([r / c, g / c, b / c]);
  }
  return cells;
};
// fraction of the frame close to its own most common cell color = "empty ground"
const emptiness = (cells) => {
  const key = (c) => c.map((v) => Math.round(v / 24)).join(',');
  const counts = {};
  for (const c of cells) counts[key(c)] = (counts[key(c)] || 0) + 1;
  return Math.max(...Object.values(counts)) / cells.length;
};

const b = await chromium.launch({ channel: 'chrome', args: ['--use-gl=angle', '--ignore-gpu-blocklist'] }).catch(() => chromium.launch());
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
await p.goto(url, { waitUntil: 'load' });
await p.waitForTimeout(3200);
await p.mouse.move(720, 450);

// FPS probe during a heavy glide
await p.evaluate(() => {
  window.__rrFps = { frames: [], t: performance.now() };
  const loop = () => {
    const now = performance.now();
    window.__rrFps.frames.push(now - window.__rrFps.t);
    window.__rrFps.t = now;
    if (window.__rrFps.frames.length < 360) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});

const rows = [];
let sent = 0;
for (let i = 0; i < beats; i += 1) {
  const targetPx = (i / Math.max(1, beats - 1)) * travel;
  const chunk = (targetPx - sent) / 12;
  for (let s = 0; s < 12; s += 1) {
    await p.mouse.wheel(0, chunk);
    await p.mouse.move(700 + Math.sin(s) * 160, 430 + Math.cos(s) * 90);
    await p.waitForTimeout(45);
  }
  sent = targetPx;
  if (i > 0) { // mid-transition frame BEFORE settling
    await p.waitForTimeout(500);
    await p.screenshot({ path: join(outDir, `transition-${i}.png`) });
  }
  await p.waitForTimeout(2300);
  const shot = join(outDir, `beat-${i}.png`);
  await p.screenshot({ path: shot });
  const demoPng = PNG.sync.read(readFileSync(shot));
  const demoCells = grid(demoPng);
  const row = { beat: i, shot: `beat-${i}.png`, emptiness: +emptiness(demoCells).toFixed(2) };
  if (refFrames[i] && existsSync(refFrames[i])) {
    const refPng = PNG.sync.read(readFileSync(refFrames[i]));
    const refCells = grid(refPng);
    row.ref = refFrames[i];
    row.refEmptiness = +emptiness(refCells).toFixed(2);
    row.gridDelta = +(
      demoCells.reduce((s, c, k) => s + Math.hypot(c[0] - refCells[k][0], c[1] - refCells[k][1], c[2] - refCells[k][2]), 0)
      / demoCells.length
    ).toFixed(1);
  }
  rows.push(row);
}
const fps = await p.evaluate(() => {
  const f = (window.__rrFps?.frames || []).slice(10).sort((a, b2) => a - b2);
  if (!f.length) return null;
  const avg = f.reduce((s, v) => s + v, 0) / f.length;
  return { fps: +(1000 / avg).toFixed(1), p95Ms: +f[Math.floor(f.length * 0.95)].toFixed(1), worstMs: +f[f.length - 1].toFixed(1) };
});
await b.close();

const md = [];
md.push('# Recreation review', '');
md.push(`Demo: ${url}`, captureDir ? `Reference: ${captureDir}` : 'Reference: (none given - visual pairs unavailable)', '');
md.push(`**FPS during glide:** ${fps ? `${fps.fps} avg, p95 ${fps.p95Ms}ms, worst ${fps.worstMs}ms` : 'unmeasured'} - p95 above 20ms or worst above 100ms = judder finding.`);
md.push(`**Console errors:** ${errs.length ? errs.slice(0, 5).join(' | ') : 'none'}`, '');
md.push('| beat | demo | reference | grid delta | demo emptiness | ref emptiness |');
md.push('|---|---|---|---|---|---|');
for (const r of rows) {
  md.push(`| ${r.beat} | ${r.shot} | ${r.ref || '-'} | ${r.gridDelta ?? '-'} | ${r.emptiness} | ${r.refEmptiness ?? '-'} |`);
}
md.push('', 'Emptiness = fraction of the frame that is bare ground. If the demo number is well above the reference, the beat is floating in empty space - compose fuller (quality bar rule 8).', '');
md.push('## Judgment checklist (fill by LOOKING at the pairs, then fix the worst finding and rerun)', '');
for (const q of [
  'Does each beat fill the frame the way the reference does (heroes cropped by edges, supports bleeding off)?',
  'Is display type present, legible on every ground it crosses, and revealed with the observed easing?',
  'Do transitions OVERLAP (one beat dissolving into the next) with correct layer paint order, no orphan fragments at rest?',
  'Is settled artwork completely clean (no erosion, boil confined to a whisper), per the captured shaders?',
  'Does the cursor match the forensics (hidden OS cursor, follower lags, visible trail on every ground)?',
  'Any hitch, texture pop-in, or judder during the glide?',
  'At 1280px and 1920px: any overflow, misalignment, or collision?',
] ) md.push(`- [ ] ${q}`);
md.push('', 'Findings that changed the rebuild go to LEARNINGS.md (dated), so the next site starts smarter.');
writeFileSync(join(outDir, 'REVIEW.md'), md.join('\n'), 'utf8');
console.log(`review written: ${join(outDir, 'REVIEW.md')} (${rows.length} beats${refFrames.length ? ', paired' : ', unpaired'})`);
