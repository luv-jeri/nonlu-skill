// Motion forensics: MEASURE the feel instead of guessing at it.
//
// Three questions every award-level site answers with numbers, not vibes:
//   1. SCROLL - native or virtual? How heavy is the spring? (one wheel
//      impulse, sample the response, fit the decay)
//   2. CURSOR - is the OS cursor replaced? What follows the pointer, and
//      with how much lag?
//   3. PARALLAX - how many distinct depth rates are on screen? (DOM rects
//      over scroll steps; for canvas pages, optical band correlation between
//      frames because there is no DOM to read)
//
// Everything here is bounded and failure-tolerant: any sub-probe that throws
// records a gap note instead of failing the capture.

import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { atomicWriteJson, ensureDir } from './util.mjs';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Fit p(t) -> P_inf with exponential approach; returns half-life ms or null.
function fitExponentialApproach(samples) {
  if (samples.length < 8) return null;
  const pInf = samples[samples.length - 1].v;
  const pts = samples
    .map((s) => ({ t: s.t, gap: Math.abs(pInf - s.v) }))
    .filter((s) => s.gap > 0.5);
  if (pts.length < 5) return null;
  // linear regression on ln(gap) = ln(g0) - k t
  const n = pts.length;
  let st = 0, sy = 0, stt = 0, sty = 0;
  for (const p of pts) {
    const y = Math.log(p.gap);
    st += p.t; sy += y; stt += p.t * p.t; sty += p.t * y;
  }
  const denom = n * stt - st * st;
  if (Math.abs(denom) < 1e-9) return null;
  const k = -(n * sty - st * sy) / denom; // decay rate per ms
  if (!(k > 0)) return null;
  return Math.log(2) / k; // half-life in ms
}

async function scrollForensics(page, log) {
  const before = await page.evaluate(() => ({
    scrollY: window.scrollY,
    h: document.documentElement.scrollHeight,
  }));

  // start sampling in-page, then send ONE impulse
  await page.evaluate(() => {
    const marks = [];
    const pick = [];
    // fingerprint: the tallest elements currently on screen
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.height > innerHeight * 0.3 && r.width > innerWidth * 0.3) pick.push(el);
      if (pick.length >= 4) break;
    }
    const t0 = performance.now();
    window.__scapMotion = { done: false, samples: marks };
    const loop = () => {
      const t = performance.now() - t0;
      marks.push({
        t,
        scrollY: window.scrollY,
        rects: pick.map((el) => Math.round(el.getBoundingClientRect().top * 10) / 10),
      });
      if (t < 2600) requestAnimationFrame(loop);
      else window.__scapMotion.done = true;
    };
    requestAnimationFrame(loop);
  });
  await page.mouse.move(Math.round(page.viewportSize().width / 2), Math.round(page.viewportSize().height / 2));
  await page.mouse.wheel(0, 480);
  await page.waitForFunction(() => window.__scapMotion?.done, null, { timeout: 4500 }).catch(() => {});
  const data = await page.evaluate(() => window.__scapMotion?.samples || []);
  if (!data.length) return { verdict: 'unmeasured' };

  const yMoved = Math.abs(data[data.length - 1].scrollY - data[0].scrollY) > 4;
  let rectMoved = false;
  if (data[0].rects?.length) {
    const first = data[0].rects, last = data[data.length - 1].rects;
    rectMoved = first.some((v, i) => Math.abs((last[i] ?? v) - v) > 4);
  }
  const verdict = yMoved ? 'native' : rectMoved ? 'virtual' : 'none';

  // response curve: use scrollY for native, first moving rect for virtual
  let series = null;
  if (yMoved) series = data.map((s) => ({ t: s.t, v: s.scrollY }));
  else if (rectMoved) {
    const idx = data[0].rects.findIndex((v, i) => Math.abs((data[data.length - 1].rects[i] ?? v) - v) > 4);
    series = data.map((s) => ({ t: s.t, v: s.rects[idx] }));
  }
  let halfLifeMs = null, settleMs = null;
  if (series) {
    halfLifeMs = fitExponentialApproach(series);
    const vInf = series[series.length - 1].v;
    const span = Math.abs(vInf - series[0].v);
    if (span > 2) {
      const hit = series.find((s) => Math.abs(vInf - s.v) < span * 0.05);
      settleMs = hit ? Math.round(hit.t) : null;
    }
  }
  log('motion-scroll', { verdict, halfLifeMs, settleMs });
  return {
    verdict,
    pageScrollHeight: before.h,
    smoothing: halfLifeMs == null ? null : {
      halfLifeMs: Math.round(halfLifeMs),
      settleMs,
      note: 'exponential fit of the response to ONE 480px wheel impulse; half-life is how long the spring takes to close half the remaining distance',
    },
  };
}

async function cursorForensics(page, log) {
  const styles = await page.evaluate(() => {
    const seen = new Set();
    const out = { bodyCursor: getComputedStyle(document.body).cursor, hidden: false, custom: [] };
    out.hidden = out.bodyCursor === 'none'
      || getComputedStyle(document.documentElement).cursor === 'none';
    for (const el of document.querySelectorAll('a, button, [role="button"]')) {
      const c = getComputedStyle(el).cursor;
      if (!seen.has(c)) { seen.add(c); out.custom.push(c); }
      if (seen.size >= 4) break;
    }
    return out;
  });

  // follower hunt: sample fixed/high-z elements while the mouse travels
  await page.evaluate(() => {
    const candidates = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if ((cs.position === 'fixed' || cs.position === 'absolute')
        && cs.pointerEvents === 'none' && r.width > 0 && r.width < 220 && r.height < 220) {
        candidates.push(el);
      }
      if (candidates.length >= 12) break;
    }
    const t0 = performance.now();
    window.__scapCursor = { done: false, mouse: [], els: candidates.map(() => []), count: candidates.length };
    const onMove = (e) => window.__scapCursor.mouse.push({ t: performance.now() - t0, x: e.clientX, y: e.clientY });
    addEventListener('pointermove', onMove, { passive: true });
    const loop = () => {
      const t = performance.now() - t0;
      candidates.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        window.__scapCursor.els[i].push({ t, x: r.x + r.width / 2, y: r.y + r.height / 2 });
      });
      if (t < 1600) requestAnimationFrame(loop);
      else { window.__scapCursor.done = true; removeEventListener('pointermove', onMove); }
    };
    requestAnimationFrame(loop);
  });
  const vs = page.viewportSize();
  const path = [[0.25, 0.4], [0.7, 0.45], [0.5, 0.7], [0.3, 0.5]];
  for (const [fx, fy] of path) {
    await page.mouse.move(Math.round(vs.width * fx), Math.round(vs.height * fy), { steps: 12 });
    await page.waitForTimeout(180);
  }
  await page.waitForFunction(() => window.__scapCursor?.done, null, { timeout: 3500 }).catch(() => {});
  const raw = await page.evaluate(() => window.__scapCursor || null);

  const followers = [];
  if (raw && raw.mouse.length > 10) {
    for (let i = 0; i < raw.count; i += 1) {
      const track = raw.els[i];
      if (track.length < 10) continue;
      const dx = track[track.length - 1].x - track[0].x;
      const dy = track[track.length - 1].y - track[0].y;
      if (Math.hypot(dx, dy) < 40) continue; // did not travel with the mouse
      // lag: time offset that minimizes distance between element and mouse path
      let best = { lag: 0, err: Infinity };
      for (let lag = 0; lag <= 400; lag += 25) {
        let err = 0, n = 0;
        for (const p of track) {
          const mt = p.t - lag;
          const m = raw.mouse.find((q) => q.t >= mt);
          if (!m) continue;
          err += Math.hypot(p.x - m.x, p.y - m.y); n += 1;
        }
        if (n > 5 && err / n < best.err) best = { lag, err: err / n };
      }
      followers.push({ index: i, lagMs: best.lag, meanDistancePx: Math.round(best.err) });
    }
  }
  log('motion-cursor', { hidden: styles.hidden, followers: followers.length });
  return {
    osCursorHidden: styles.hidden,
    bodyCursor: styles.bodyCursor,
    interactiveCursors: styles.custom,
    followers,
    note: followers.length
      ? 'follower lagMs near 0 = exact tracker (dot); 50-250ms = trailing spring (ring). Two rates together is the weighted-cursor pattern.'
      : 'no pointer-following elements detected',
  };
}

// Optical parallax for canvas pages: compare two frames a small scroll apart;
// per horizontal band, find the vertical shift that best aligns row-luminance
// profiles. Distinct shift rates = distinct depth layers.
function bandShift(pngA, pngB, bands = 5) {
  const { width, height } = pngA;
  const rowLuma = (png, y0, y1) => {
    const rows = [];
    for (let y = y0; y < y1; y += 2) {
      let sum = 0;
      for (let x = 0; x < width; x += 4) {
        const i = (width * y + x) << 2;
        sum += png.data[i] * 0.299 + png.data[i + 1] * 0.587 + png.data[i + 2] * 0.114;
      }
      rows.push(sum);
    }
    return rows;
  };
  const out = [];
  const bandH = Math.floor(height / bands);
  const MAX_SHIFT = 30; // half-rows (we sample every 2px)
  for (let b = 0; b < bands; b += 1) {
    const y0 = b * bandH, y1 = y0 + bandH;
    const a = rowLuma(pngA, y0, y1);
    const bb = rowLuma(pngB, clamp(y0 - MAX_SHIFT * 2, 0, height), clamp(y1 + MAX_SHIFT * 2, 0, height));
    const pad = Math.floor((bb.length - a.length) / 2);
    let best = { shift: 0, err: Infinity };
    for (let s = -Math.min(MAX_SHIFT, pad); s <= Math.min(MAX_SHIFT, pad); s += 1) {
      let err = 0;
      for (let i = 0; i < a.length; i += 1) err += Math.abs(a[i] - (bb[i + pad + s] ?? a[i]));
      if (err < best.err) best = { shift: s, err };
    }
    out.push(best.shift * 2); // back to px
  }
  return out;
}

async function parallaxForensics(page, runDir, canvasPage, log) {
  if (!canvasPage) {
    // DOM route: rects of large elements across 4 wheel steps
    const steps = [];
    for (let s = 0; s < 4; s += 1) {
      const snap = await page.evaluate(() => {
        const els = [];
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.height > 120 && r.width > 200 && r.bottom > 0 && r.top < innerHeight) {
            els.push({ tag: el.tagName, top: Math.round(r.top * 10) / 10 });
          }
          if (els.length >= 10) break;
        }
        return { scrollY: window.scrollY, els };
      });
      steps.push(snap);
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(650);
    }
    const dScroll = steps[steps.length - 1].scrollY - steps[0].scrollY;
    if (Math.abs(dScroll) < 10) return { mode: 'dom', verdict: 'no-native-scroll', factors: [] };
    const n = Math.min(steps[0].els.length, steps[steps.length - 1].els.length);
    const factors = [];
    for (let i = 0; i < n; i += 1) {
      const dTop = steps[steps.length - 1].els[i].top - steps[0].els[i].top;
      factors.push(Math.round((-dTop / dScroll) * 100) / 100);
    }
    const clusters = [...new Set(factors.map((f) => Math.round(f * 20) / 20))].sort((a, b) => a - b);
    return {
      mode: 'dom',
      factors,
      clusters,
      verdict: clusters.length <= 1 ? 'flat (single depth rate)'
        : clusters.length <= 4 ? `layered 2.5D (${clusters.length} distinct depth rates)`
          : 'continuous depth gradient (true 3D or many layers)',
    };
  }

  // canvas route: two frames a micro-scroll apart, optical band shifts
  const dir = ensureDir(join(runDir, 'telemetry'));
  const fa = join(dir, 'parallax-a.png');
  const fb = join(dir, 'parallax-b.png');
  await page.screenshot({ path: fa });
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(900);
  await page.screenshot({ path: fb });
  const pngA = PNG.sync.read(readFileSync(fa));
  const pngB = PNG.sync.read(readFileSync(fb));
  const shifts = bandShift(pngA, pngB);
  const moving = shifts.filter((s) => Math.abs(s) > 1);
  const rates = [...new Set(moving.map((s) => Math.round(s / 4) * 4))];
  log('motion-parallax', { mode: 'optical', shifts });
  return {
    mode: 'optical',
    bandShiftsPx: shifts,
    verdict: !moving.length ? 'no vertical response measured (motion may be non-vertical or fluid-driven)'
      : rates.length === 1 ? 'single depth rate visible'
        : `${rates.length} distinct band rates - layered depth is present`,
    note: 'per-band vertical pixel shift for one 200px wheel step, top band first. Bands moving at different rates = parallax layers.',
  };
}

export async function motionForensics(page, runDir, ctx, gaps, log) {
  const out = { capturedAt: new Date().toISOString() };
  const canvasPage = (ctx.evidence?.runtime?.canvasCount || 0) > 0 && ctx.scroll?.shortPage !== false;
  try { out.scroll = await scrollForensics(page, log); }
  catch (e) { gaps.push({ kind: 'motion-scroll', note: String(e).slice(0, 160) }); }
  try { out.cursor = await cursorForensics(page, log); }
  catch (e) { gaps.push({ kind: 'motion-cursor', note: String(e).slice(0, 160) }); }
  try { out.parallax = await parallaxForensics(page, runDir, canvasPage, log); }
  catch (e) { gaps.push({ kind: 'motion-parallax', note: String(e).slice(0, 160) }); }
  atomicWriteJson(join(runDir, 'telemetry', 'motion-forensics.json'), out);
  return out;
}
