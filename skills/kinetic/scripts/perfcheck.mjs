#!/usr/bin/env node
/**
 * perfcheck.mjs — prove an animated page is actually fast.
 *
 *   node perfcheck.mjs <url-or-file> [--scroll] [--budget budget.json] [--json]
 *   node perfcheck.mjs --selftest
 *
 * "Looks smooth" is not a check, because it cannot fail. This measures:
 *   bytes transferred (by type)  · FPS while scrolling · dropped frames
 *   long tasks >50ms             · total blocking time · layout shift
 *
 * Exits 1 when a budget is breached, so it can gate a build.
 *
 * Needs Playwright. If it is missing the script says so and exits 2 — it never
 * reports a pass it did not measure.
 */
import fs from 'fs';
import path from 'path';
import {pathToFileURL} from 'url';

// Budgets are the point of this tool. Defaults are deliberately strict; a page
// that wants more must SAY so in its own budget file, which is a decision the
// user makes on purpose rather than a limit that quietly slipped.
const DEFAULT_BUDGET = {
  total_kb: 1500,
  js_kb: 350,
  css_kb: 100,
  image_kb: 800,
  media_kb: 0,        // 0 = ship no video by default; see the 3.4MB->40kb rule
  font_kb: 200,
  min_fps: 55,
  max_dropped_pct: 10,
  max_long_tasks: 3,
  max_tbt_ms: 200,
  max_cls: 0.1,
};

const TYPE_OF = (ct = '', url = '') => {
  const u = url.split('?')[0].toLowerCase();
  if (/javascript|ecmascript/.test(ct) || /\.m?js$/.test(u)) return 'js';
  if (/css/.test(ct) || /\.css$/.test(u)) return 'css';
  if (/^video|^audio/.test(ct) || /\.(mp4|webm|mov|m4v|ogg|mp3)$/.test(u)) return 'media';
  if (/^image/.test(ct) || /\.(png|jpe?g|gif|webp|avif|svg)$/.test(u)) return 'image';
  if (/font/.test(ct) || /\.(woff2?|ttf|otf)$/.test(u)) return 'font';
  return 'other';
};

async function loadPlaywright() {
  const candidates = [
    'playwright',
    path.join(process.env.HOME || '', 'Claude/Projects/banyan/ventures/beatass/node_modules/playwright/index.mjs'),
  ];
  for (const c of candidates) {
    try { return await import(c); } catch { /* try next */ }
  }
  console.error(
    'perfcheck: Playwright not found.\n' +
    '  npm i -D playwright && npx playwright install chromium\n' +
    'Refusing to report a result I did not measure.');
  process.exit(2);
}

async function run(target, opts) {
  const {chromium} = await loadPlaywright();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 1440, height: 900}});
  const page = await ctx.newPage();

  const bytes = {js: 0, css: 0, image: 0, media: 0, font: 0, other: 0};
  page.on('response', async (res) => {
    try {
      const h = res.headers();
      const len = Number(h['content-length'] || 0);
      const t = TYPE_OF(h['content-type'] || '', res.url());
      // content-length is absent for chunked responses; fall back to the body.
      bytes[t] += len || (await res.body().catch(() => Buffer.alloc(0))).length;
    } catch { /* a response that vanished is not a measurement */ }
  });

  // Observers must exist BEFORE first paint or the entries are already gone.
  await page.addInitScript(() => {
    window.__perf = {longTasks: [], cls: 0, frames: []};
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__perf.longTasks.push(Math.round(e.duration));
      }).observe({type: 'longtask', buffered: true});
    } catch {}
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
      }).observe({type: 'layout-shift', buffered: true});
    } catch {}
  });

  const url = /^https?:/.test(target) ? target : pathToFileURL(path.resolve(target)).href;
  const t0 = Date.now();
  await page.goto(url, {waitUntil: 'load', timeout: 60000});
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(600);

  // FPS is only meaningful while something is actually animating, so drive the
  // page the way a user would instead of measuring an idle screen.
  const fps = await page.evaluate(async (doScroll) => {
    const stamps = [];
    let stop = false;
    const tick = (t) => { stamps.push(t); if (!stop) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    if (doScroll) {
      const h = Math.max(document.body.scrollHeight - innerHeight, 0);
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        scrollTo(0, (h * i) / steps);
        await new Promise((r) => setTimeout(r, 25));
      }
    } else {
      await new Promise((r) => setTimeout(r, 1600));
    }
    stop = true;
    await new Promise((r) => setTimeout(r, 60));
    if (stamps.length < 5) return null;
    const d = [];
    for (let i = 1; i < stamps.length; i++) d.push(stamps[i] - stamps[i - 1]);
    d.sort((a, b) => a - b);
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    // A frame is "dropped" when it took longer than ~1.5 frames at 60Hz.
    const dropped = d.filter((x) => x > 25).length;
    return {
      avg_fps: +(1000 / mean).toFixed(1),
      p95_frame_ms: +d[Math.floor(d.length * 0.95)].toFixed(1),
      worst_frame_ms: +d[d.length - 1].toFixed(1),
      dropped_pct: +((100 * dropped) / d.length).toFixed(1),
      samples: d.length,
    };
  }, opts.scroll);

  const perf = await page.evaluate(() => ({
    longTasks: window.__perf.longTasks,
    cls: +window.__perf.cls.toFixed(4),
  }));

  await browser.close();
  const kb = (n) => +(n / 1024).toFixed(1);
  return {
    url, load_ms: loadMs,
    kb: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, kb(v)])),
    total_kb: kb(Object.values(bytes).reduce((a, b) => a + b, 0)),
    fps, long_tasks: perf.longTasks,
    tbt_ms: perf.longTasks.reduce((a, b) => a + Math.max(0, b - 50), 0),
    cls: perf.cls,
  };
}

function report(r, budget, asJson) {
  if (asJson) { console.log(JSON.stringify({result: r, budget}, null, 2)); }
  const fails = [];
  const row = (label, got, limit, bad, unit = '') => {
    const ok = !bad;
    if (bad) fails.push(`${label}: ${got}${unit} (budget ${limit}${unit})`);
    if (!asJson) {
      console.log(`  ${ok ? 'ok ' : 'OVER'}  ${label.padEnd(22)} ${String(got).padStart(8)}${unit}` +
                  `   budget ${limit}${unit}`);
    }
  };

  if (!asJson) {
    console.log(`\nperfcheck  ${r.url}`);
    // Not a user-facing load time: response bodies are read for byte accounting,
    // which inflates it. Weight and frame timing below are the real numbers.
    console.log(`(instrumented load ${r.load_ms}ms — measurement overhead included)\n`);
    console.log('WEIGHT');
  }
  row('total', r.total_kb, budget.total_kb, r.total_kb > budget.total_kb, 'kb');
  for (const k of ['js', 'css', 'image', 'media', 'font']) {
    const lim = budget[`${k}_kb`];
    if (lim === undefined) continue;
    row(k, r.kb[k], lim, r.kb[k] > lim, 'kb');
  }

  if (!asJson) console.log('\nSMOOTHNESS');
  if (!r.fps) {
    if (!asJson) console.log('  ??    fps                    not measurable (too few frames)');
  } else {
    row('avg fps', r.fps.avg_fps, budget.min_fps, r.fps.avg_fps < budget.min_fps);
    row('dropped frames', r.fps.dropped_pct, budget.max_dropped_pct, r.fps.dropped_pct > budget.max_dropped_pct, '%');
    if (!asJson) console.log(`  --    p95 frame            ${String(r.fps.p95_frame_ms).padStart(8)}ms   (16.7ms = 60fps)`);
    if (!asJson) console.log(`  --    worst frame          ${String(r.fps.worst_frame_ms).padStart(8)}ms`);
  }

  if (!asJson) console.log('\nMAIN THREAD');
  row('long tasks >50ms', r.long_tasks.length, budget.max_long_tasks, r.long_tasks.length > budget.max_long_tasks);
  row('total blocking', r.tbt_ms, budget.max_tbt_ms, r.tbt_ms > budget.max_tbt_ms, 'ms');
  row('layout shift', r.cls, budget.max_cls, r.cls > budget.max_cls);

  if (!asJson) {
    if (fails.length) {
      console.log(`\nFAIL — ${fails.length} budget breach(es):`);
      for (const f of fails) console.log(`  - ${f}`);
      console.log('\nBefore raising a budget, read references/performance-budget.md.');
      console.log('A budget you raise to make a build pass is not a budget.');
    } else {
      console.log('\nPASS — every budget met.');
    }
  }
  return fails.length;
}

function selftest() {
  const bad = [];
  // The scorer must FAIL a bad page and PASS a good one. A checker that only
  // ever says "ok" is the exact failure mode this tool exists to prevent.
  const heavy = {url: 'x', load_ms: 100, kb: {js: 9000, css: 1, image: 1, media: 5000, font: 1, other: 0},
    total_kb: 14003, fps: {avg_fps: 22, dropped_pct: 60, p95_frame_ms: 80, worst_frame_ms: 400, samples: 50},
    long_tasks: [120, 300, 90, 70], tbt_ms: 350, cls: 0.4};
  const lean = {url: 'x', load_ms: 100, kb: {js: 40, css: 8, image: 120, media: 0, font: 30, other: 2},
    total_kb: 200, fps: {avg_fps: 59.8, dropped_pct: 0.4, p95_frame_ms: 17, worst_frame_ms: 22, samples: 90},
    long_tasks: [], tbt_ms: 0, cls: 0.002};
  const quiet = (o, b) => { const l = console.log; console.log = () => {}; const n = report(o, b, false); console.log = l; return n; };
  const nHeavy = quiet(heavy, DEFAULT_BUDGET);
  const nLean = quiet(lean, DEFAULT_BUDGET);
  if (nHeavy < 6) bad.push(`a 14MB 22fps page produced only ${nHeavy} breaches`);
  if (nLean !== 0) bad.push(`a lean 60fps page produced ${nLean} false breaches`);
  if (TYPE_OF('', 'a.mp4') !== 'media') bad.push('mp4 not classed as media');
  if (TYPE_OF('text/javascript', 'a') !== 'js') bad.push('js content-type not classed as js');
  if (TYPE_OF('', 'a.woff2') !== 'font') bad.push('woff2 not classed as font');
  if (bad.length) { console.log('SELFTEST FAILED'); bad.forEach((b) => console.log('  - ' + b)); process.exit(1); }
  console.log('ALL GREEN — heavy page fails on ' + nHeavy + ' budgets, lean page passes clean, ' +
              'asset typing correct');
}

const argv = process.argv.slice(2);
if (argv.includes('--selftest')) { selftest(); process.exit(0); }
const target = argv.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('usage: perfcheck.mjs <url-or-file> [--scroll] [--budget b.json] [--json]');
  process.exit(2);
}
const bIdx = argv.indexOf('--budget');
const budget = bIdx >= 0
  ? {...DEFAULT_BUDGET, ...JSON.parse(fs.readFileSync(argv[bIdx + 1], 'utf8'))}
  : DEFAULT_BUDGET;
const r = await run(target, {scroll: argv.includes('--scroll')});
process.exit(report(r, budget, argv.includes('--json')) ? 1 : 0);
