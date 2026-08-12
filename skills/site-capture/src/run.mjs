// Orchestration: contract -> browser -> cold load -> evidence -> scroll atlas ->
// components -> mobile smoke -> close browser -> sheets -> reports -> verify.
import { chromium } from 'playwright';
import { writeFileSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWriteJson, ensureDir, makeLogger, ndjsonAppend, redactSecrets, sanitizeUrl, slug } from './util.mjs';
import { makeSafetyShell } from './cleanup.mjs';
import { attachNetwork, extractNetworkKeyframes, readStoredStylesheets } from './network.mjs';
import { collectPageEvidence, mergeTechnology, STYLE_PROPERTY_SET } from './evidence.mjs';
import { scrollAtlas, mobileSmoke } from './scroll.mjs';
import { motionForensics } from './motion-forensics.mjs';
import { buildRollups, makeSheets, writeRecreateDraft, verify, writeEvidenceIndex } from './report.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BUDGETS = { full: 600, medium: 240, quick: 90 };
const THOROUGH_BUDGET_SECONDS = 1200;

// Playwright does not expose the browser PID; Chrome is spawned as our direct child,
// so we find it by parent-pid. Killing the main chrome process takes down its tree.
import { execSync, spawn } from 'node:child_process';
function chromeChildPids() {
  try {
    const out = execSync('ps -o pid=,ppid=,comm= -ax', { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return out.split('\n').map((l) => l.trim().split(/\s+/)).filter((p) => Number(p[1]) === process.pid && /chrom/i.test(p.slice(2).join(' '))).map((p) => Number(p[0]));
  } catch { return []; }
}

const scrubEvidence = (value) => {
  if (typeof value === 'string') return redactSecrets(value);
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(scrubEvidence);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubEvidence(item)]));
};

function persistInitialEvidence(runDir, evidence) {
  const sourceDir = ensureDir(join(runDir, 'source-evidence'));
  for (const file of ['style-states.ndjson', 'transition-states.ndjson', 'animation-states.ndjson', 'pseudo-states.ndjson', 'gsap.ndjson', 'scroll-triggers.ndjson', 'motion-events.ndjson', 'stagger-states.ndjson', 'interactive-states.ndjson']) {
    const path = join(sourceDir, file);
    if (!existsSync(path)) writeFileSync(path, '');
  }
  for (const element of evidence.elements || []) ndjsonAppend(join(sourceDir, 'style-states.ndjson'), scrubEvidence(element));
  for (const pseudo of evidence.pseudoStates || []) ndjsonAppend(join(sourceDir, 'pseudo-states.ndjson'), scrubEvidence(pseudo));
  if (evidence.gsap) ndjsonAppend(join(sourceDir, 'gsap.ndjson'), scrubEvidence(evidence.gsap));
  if (evidence.scrollTriggers) ndjsonAppend(join(sourceDir, 'scroll-triggers.ndjson'), scrubEvidence(evidence.scrollTriggers));
  atomicWriteJson(join(sourceDir, 'keyframes.json'), scrubEvidence(evidence.keyframes || []));
  atomicWriteJson(join(sourceDir, 'transition-inventory.json'), scrubEvidence(evidence.transitionInventory || []));
  atomicWriteJson(join(sourceDir, 'animation-inventory.json'), scrubEvidence(evidence.runtimeAnimations || []));
  atomicWriteJson(join(sourceDir, 'stagger-systems.json'), scrubEvidence(evidence.staggerSystems || []));
  atomicWriteJson(join(sourceDir, 'css-inventory.json'), scrubEvidence({ stylesheets: evidence.stylesheets || [], access: evidence.cssAccess || [], rules: evidence.staticCssInventory || [], propertyRules: evidence.propertyRules || [], startingStyles: evidence.startingStyles || [] }));
}

function mergeOfflineCssEvidence(runDir, evidence) {
  const networkRules = extractNetworkKeyframes(readStoredStylesheets(runDir));
  const existing = new Set((evidence.keyframes || []).map((record) => `${record.value?.name}:${record.value?.cssText}`));
  const addedNetworkRules = [];
  for (const record of networkRules) {
    const key = `${record.value?.name}:${record.value?.cssText}`;
    if (!existing.has(key)) { evidence.keyframes.push(scrubEvidence(record)); addedNetworkRules.push(record); existing.add(key); }
  }
  for (const element of evidence.elements || []) for (const link of element.observation?.cssAnimations?.keyframeLinks || []) {
    const offline = addedNetworkRules.filter((record) => record.value?.name === link.animationName && !(link.candidateRuleRefs || []).includes(record.id));
    if (!offline.length) continue;
    link.candidateRuleRefs = [...(link.candidateRuleRefs || []), ...offline.map((record) => record.id)];
    link.candidates = [...(link.candidates || []), ...offline.map((record) => ({ ruleRef: record.id, evidenceRef: record.id, activeCondition: 'Unknown', conditions: [], source: record.value?.source }))];
    if (link.animationName !== 'none') link.status = 'Inferred';
    link.reason = 'same-name network CSS candidates retained; network text cannot prove activation, realm match, or cascade winner';
  }
  atomicWriteJson(join(runDir, 'source-evidence', 'keyframes.json'), evidence.keyframes || []);
}

const waitForProcess = (child) => new Promise((resolve) => {
  child.once('error', (error) => resolve({ code: null, error }));
  child.once('exit', (code, signal) => resolve({ code, signal, error: null }));
});

async function normalizeWalkthrough(rawPath, mp4Path, shell, log) {
  const ffmpeg = spawn('ffmpeg', ['-y', '-i', rawPath, '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4Path], { stdio: 'ignore' });
  shell.own(ffmpeg.pid, 'ffmpeg-walkthrough-30fps');
  const result = await waitForProcess(ffmpeg);
  shell.disown(ffmpeg.pid);
  if (result.code !== 0) log('walkthrough-normalize-failed', { note: `ffmpeg ${result.error || `exit ${result.code}`}` });
  return result.code === 0 && existsSync(mp4Path) && statSync(mp4Path).size > 0;
}

async function prepareWalkthroughPage(page, url, runDir, gaps, log) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await Promise.race([page.evaluate(() => document.fonts.ready), page.waitForTimeout(5000)]);
  await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(8000)]);
  await passEntryScreens(page, runDir, gaps, log);
  const consent = page.locator('[role=dialog], [class*=cookie i], [id*=consent i], [class*=consent i]').first();
  if (await consent.isVisible().catch(() => false)) {
    const reject = consent.locator('button', { hasText: /reject|decline|necessary|essential only/i }).first();
    if (await reject.isVisible().catch(() => false)) await reject.click().catch(() => {});
  }
}

async function driveHumanWalkthrough(page, telemetryPath, options) {
  const viewport = page.viewportSize();
  const neutral = { x: 24, y: 24 };
  const logAction = (action, data = {}) => ndjsonAppend(telemetryPath, { t: new Date().toISOString(), action, ...data });
  await page.mouse.move(neutral.x, neutral.y);
  await page.waitForTimeout(700);
  if (options.selector) {
    const target = page.locator(options.selector).first();
    await target.scrollIntoViewIfNeeded({ timeout: 6000 });
    await page.waitForTimeout(700);
    const box = await target.boundingBox();
    if (!box) throw new Error(`component target has no visible box: ${options.selector}`);
    const points = [[0.15, 0.2], [0.5, 0.5], [0.85, 0.2], [0.85, 0.8], [0.5, 0.5]];
    for (const [nx, ny] of points) {
      const point = { x: Math.max(4, Math.min(viewport.width - 4, box.x + box.width * nx)), y: Math.max(4, Math.min(viewport.height - 4, box.y + box.height * ny)) };
      await page.mouse.move(point.x, point.y, { steps: 12 });
      logAction('component-pointer-drift', { selector: options.selector, point });
      await page.waitForTimeout(500);
    }
    await page.mouse.move(neutral.x, neutral.y, { steps: 10 });
    await page.waitForTimeout(700);
    return { terminal: true, reason: 'component-target-covered', steps: points.length };
  }

  const maxSteps = 240;
  let stagnant = 0;
  let priorSignal = '';
  let last = null;
  for (let step = 0; step < maxSteps && Date.now() < options.deadlineMs; step++) {
    const before = await page.evaluate(() => ({ y: scrollY, maxY: Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - innerHeight), transform: [...document.body.children].slice(0, 8).map((element) => getComputedStyle(element).transform).join('|') }));
    if (step > 0 || before.y < before.maxY) {
      await page.mouse.wheel(0, 115);
      logAction('wheel', { step, requestedDeltaY: 115, before });
    }
    await page.waitForTimeout(options.thorough ? 650 : 500);
    if (step % 3 === 0) {
      const decision = await page.evaluate((seed) => {
        const candidates = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[role="button"],[role="link"],[role="tab"],[role="menuitem"]')].filter((element) => {
          const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
          return !element.disabled && element.getAttribute('aria-disabled') !== 'true' && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 4 && rect.height > 4 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
        });
        if (!candidates.length) return null;
        const element = candidates[Math.floor(seed / 3) % candidates.length]; const rect = element.getBoundingClientRect();
        return { point: { x: Math.round(Math.max(4, Math.min(innerWidth - 4, rect.left + rect.width / 2))), y: Math.round(Math.max(4, Math.min(innerHeight - 4, rect.top + rect.height / 2))) }, tag: element.localName, label: (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100) };
      }, step).catch(() => null);
      const direction = Math.floor(step / 3) % 2 ? 1 : -1;
      const point = decision?.point || { x: Math.round(viewport.width * (direction > 0 ? 0.72 : 0.28)), y: Math.round(viewport.height * (0.42 + (step % 6) * 0.025)) };
      await page.mouse.move(point.x, point.y, { steps: 10 });
      logAction(decision ? 'decision-point-hover' : 'pointer-drift', { step, point, tag: decision?.tag || null, label: decision?.label || null });
      await page.waitForTimeout(decision ? 650 : 220);
    }
    const after = await page.evaluate(() => ({ y: scrollY, maxY: Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - innerHeight), transform: [...document.body.children].slice(0, 8).map((element) => getComputedStyle(element).transform).join('|') }));
    last = after;
    const signal = JSON.stringify(after);
    stagnant = signal === priorSignal ? stagnant + 1 : 0;
    priorSignal = signal;
    if (after.maxY > 0 && after.y >= after.maxY - 2) { await page.waitForTimeout(900); await page.mouse.move(neutral.x, neutral.y, { steps: 10 }); await page.waitForTimeout(900); return { terminal: true, reason: 'native-scroll-end', steps: step + 1, last }; }
    if (after.maxY === 0 && stagnant >= 6) { await page.mouse.move(neutral.x, neutral.y, { steps: 10 }); await page.waitForTimeout(900); return { terminal: true, reason: 'stable-virtual-or-static-end', steps: step + 1, last }; }
  }
  await page.mouse.move(neutral.x, neutral.y, { steps: 10 });
  await page.waitForTimeout(900);
  return { terminal: false, reason: Date.now() >= options.deadlineMs ? 'walkthrough-deadline' : 'walkthrough-step-cap', steps: maxSteps, last };
}

async function recordOneWalkthrough(browser, url, runDir, selector, options, shell, gaps, log) {
  const rawDir = ensureDir(join(runDir, 'media', 'walkthrough-raw'));
  const componentDir = ensureDir(join(runDir, 'media', 'components'));
  const base = selector ? `${slug(selector)}-human-walkthrough` : 'human-walkthrough';
  const finalDir = selector ? componentDir : ensureDir(join(runDir, 'media', 'reference'));
  const webmPath = join(finalDir, `${base}.webm`);
  const mp4Path = join(finalDir, `${base}-30fps.mp4`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', serviceWorkers: 'block', recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const video = page.video();
  let driveResult = null;
  try {
    await prepareWalkthroughPage(page, url, runDir, gaps, log);
    driveResult = await driveHumanWalkthrough(page, join(runDir, 'telemetry', 'walkthrough.ndjson'), { selector, thorough: options.thorough, deadlineMs: Math.max(Date.now() + 6000, options.deadlineMs) });
  } finally {
    await context.close().catch(() => {});
  }
  const generated = await video?.path().catch(() => null);
  if (!generated || !existsSync(generated)) return { kind: selector ? 'component' : 'full-site', selector: selector || null, status: 'Unknown', reason: 'Playwright did not finalize a walkthrough video' };
  renameSync(generated, webmPath);
  const normalized = await normalizeWalkthrough(webmPath, mp4Path, shell, log);
  const relative = (path) => path.slice(runDir.length + 1);
  const status = normalized && driveResult?.terminal ? 'Observed' : normalized ? 'Unknown' : 'Unknown';
  return { kind: selector ? 'component' : 'full-site', selector: selector || null, status, terminal: !!driveResult?.terminal, terminalReason: driveResult?.reason || 'Unknown', steps: driveResult?.steps ?? null, rawWebm: relative(webmPath), mp4: normalized ? relative(mp4Path) : null, frameRate: normalized ? 30 : null, acquisition: 'Playwright recordVideo + human-paced real wheel/pointer drive; ffmpeg -r 30', caveat: driveResult?.terminal ? null : 'Walkthrough video is partial and is not labelled full-site Observed.' };
}

async function recordHumanWalkthroughs(browser, url, runDir, selectors, options, shell, gaps, log) {
  const videos = [];
  videos.push(await recordOneWalkthrough(browser, url, runDir, null, options, shell, gaps, log).catch((error) => ({ kind: 'full-site', selector: null, status: 'Unknown', reason: redactSecrets(String(error)) })));
  for (const selector of selectors) videos.push(await recordOneWalkthrough(browser, url, runDir, selector, options, shell, gaps, log).catch((error) => ({ kind: 'component', selector, status: 'Unknown', reason: redactSecrets(String(error)) })));
  return videos;
}

// Entry gates (age checks, "yes to enter") and loaders precede the real page.
// Directed by Sanjay 2026-08-12: click the affirmative on entry gates - the human
// running the capture owns that attestation. Cookie consent stays reject-only.
async function passEntryScreens(page, runDir, gaps, log) {
  const loaderSel = '[class*="loader" i], [class*="preload" i], [id*="loader" i], [class*="loading" i], [id*="loading" i]';
  const waitLoaderGone = async (capMs) => {
    const t0 = Date.now();
    while (Date.now() - t0 < capMs) {
      const visible = await page.locator(loaderSel).first().isVisible().catch(() => false);
      if (!visible) break;
      await page.waitForTimeout(750);
    }
    return Date.now() - t0;
  };
  const waited = await waitLoaderGone(20000);
  if (waited > 1500) log('loader-waited', { ms: waited });
  try {
    // innerText inserts newlines mid-sentence; collapse whitespace before matching
    const readBody = async () => (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 3000);
    const gateRe = /(are you of legal age|of legal age|legal drinking age|are you (over|of) ?(18|21)|must be (18|21)|(18|21)\+? (or older|and over)|enter (the )?site|are you old enough)/i;
    let bodyText = await readBody();
    if (!gateRe.test(bodyText) && bodyText.length < 200) { await page.waitForTimeout(2000); bodyText = await readBody(); } // gate may mount late
    const gateContext = gateRe.test(bodyText);
    if (gateContext) {
      log('entry-gate-detected', {});
      ensureDir(join(runDir, 'frames', 'desktop', 'keyframes'));
      await page.screenshot({ path: join(runDir, 'frames', 'desktop', 'keyframes', 'entry-gate.png') });
      // the affirmative is often a styled div/span, not a <button> - match by exact text, innermost node
      const affirmative = page.getByText(/^\s*(yes|enter|i am over ?(18|21)|i'm over ?(18|21)|i agree|confirm)\s*$/i).last();
      if (await affirmative.isVisible().catch(() => false)) {
        const label = (await affirmative.innerText().catch(() => 'yes')).trim().slice(0, 40);
        await affirmative.click({ timeout: 5000 });
        log('entry-gate-clicked', { note: label });
        await page.waitForTimeout(1200);
        await waitLoaderGone(20000); // a loader often follows the gate
        await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(8000)]);
      } else {
        gaps.push({ kind: 'entry-gate', note: 'age/entry gate detected but no affirmative element found - agent must pass it by hand and re-verify frames' });
      }
    }
  } catch (e) { gaps.push({ kind: 'entry-gate', note: 'gate present but click failed: ' + String(e).slice(0, 120) }); }
}

export async function runCapture(opts) {
  const { url, level = 'full', outRoot, headless = false, components = [], thorough = false, smartProbes = false } = opts;
  const targetUrl = url;
  const persistedUrl = sanitizeUrl(url);
  const budgetSec = opts.budgetSec || (thorough ? THOROUGH_BUDGET_SECONDS : BUDGETS[level] || BUDGETS.full);
  const runId = Math.random().toString(36).slice(2, 8);
  const runDir = ensureDir(join(outRoot, slug(persistedUrl), `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}--${runId}`));
  const log = makeLogger(runDir);
  const startMs = Date.now();
  const deadlineMs = startMs + budgetSec * 1000;
  const optionalReserveMs = thorough ? Math.min(180000, Math.max(15000, budgetSec * 1000 * 0.15)) : 15000;
  const finalizationReserveMs = thorough ? Math.min(90000, Math.max(10000, budgetSec * 1000 * 0.10)) : 10000;
  const budget = {
    exceeded: () => Date.now() > deadlineMs - optionalReserveMs,
    mustRelease: () => Date.now() > deadlineMs - finalizationReserveMs,
    remainingMs: () => deadlineMs - Date.now(),
  };
  const shell = makeSafetyShell(runDir, deadlineMs + 60000, log);
  shell.startWatchdog();

  const thoroughProfile = thorough ? {
    browserActiveBudgetSeconds: budgetSec,
    optionalWorkStopsAtSeconds: Math.max(0, budgetSec - optionalReserveMs / 1000),
    browserReleaseBeginsAtSeconds: Math.max(0, budgetSec - finalizationReserveMs / 1000),
    finalizationReserveSeconds: finalizationReserveMs / 1000,
    maxStops: 120,
    targetTravelCssPx: 'clamp(100, round(viewportHeight * 0.125), 130)',
    dwellSamples: 6,
    dwellScheduleMs: [0, 400, 900, 1400, 2100, 2800],
    cursorPositions: 5,
    cursorWaypointsPerMove: 9,
    maxCanonicalFrames: 300,
    maxDiagnosticFrames: 1800,
  } : null;

  let ctx = null;

  const manifest = (status, extra = {}) => atomicWriteJson(join(runDir, 'manifest.json'), {
    runId, url: persistedUrl, level, thorough, budgetSec, status,
    startedAt: new Date(startMs).toISOString(), updatedAt: new Date().toISOString(),
    phase: 'B', schemaVersion: 'phase-b-v1', stylePropertySet: STYLE_PROPERTY_SET,
    thoroughProfile,
    completedStopIds: ctx?.scroll?.stops?.filter((stop) => stop.status === 'complete').map((stop) => stop.id) || [],
    actualDwellDurationsMs: ctx?.scroll?.stops?.map((stop) => ({ stopId: stop.id, durationMs: stop.phases?.dwell?.actualDurationMs ?? null })) || [],
    cursorPathSamples: ctx?.scroll?.stops?.map((stop) => ({ stopId: stop.id, samples: stop.phases?.cursor?.pathSamples ?? 0 })) || [],
    refinementBoundaries: ctx?.scroll?.boundaries?.map((boundary) => ({ id: boundary.id, status: boundary.status, replayStatus: boundary.replay?.status, refinementStopIds: boundary.refinementStopIds || [] })) || [],
    remainingStoryRange: ctx?.scroll?.remainingStoryRange || null,
    resumeCursor: ctx?.scroll?.stops?.at(-1) ? { afterStopId: ctx.scroll.stops.at(-1).id, status: ctx.scroll.stops.at(-1).status } : null,
    degradations: ctx?.scroll?.stops?.flatMap((stop) => stop.degradation || []) || [],
    ...scrubEvidence(extra),
  });
  manifest('preflight');

  const gaps = [];
  ctx = { runId, url: persistedUrl, level, thorough, gaps, requestedComponents: [...components], components: [], environment: {}, audioEvents: [], motionEvents: [], walkthroughs: [] };

  let browser, context, page;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless });
    const chromePids = chromeChildPids();
    for (const pid of chromePids) shell.own(pid, 'chrome');
    context = await browser.newContext({
      viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
      recordVideo: { dir: ensureDir(join(runDir, 'media', 'reference')) },
      reducedMotion: 'no-preference', // we WANT the motion
      serviceWorkers: 'block',
    });
    context.setDefaultTimeout(30000);
    await context.addInitScript({ path: join(HERE, '..', 'injected', 'probe.js') });
    attachNetwork(context, runDir, { perBodyBytes: 100 * 1024 * 1024, totalBodyBytes: 1024 * 1024 * 1024 }, log);
    page = await context.newPage();
    page.on('console', (m) => ndjsonAppend(join(runDir, 'telemetry', 'console.ndjson'), { t: new Date().toISOString(), type: m.type(), text: redactSecrets(m.text().slice(0, 500)) }));

    ctx.environment = { browser: browser.version(), viewport: '1440x900@1', platform: process.platform, node: process.version };
    manifest('loading');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await Promise.race([page.evaluate(() => document.fonts.ready), page.waitForTimeout(5000)]);
    await Promise.race([page.waitForLoadState('networkidle'), page.waitForTimeout(8000)]);
    await passEntryScreens(page, runDir, gaps, log);

    // conservative consent handling: reject-optional only, never "accept all"
    const consent = page.locator('[role=dialog], [class*=cookie i], [id*=consent i], [class*=consent i]').first();
    if (await consent.isVisible().catch(() => false)) {
      ensureDir(join(runDir, 'frames', 'desktop', 'keyframes'));
      writeFileSync(join(runDir, 'frames', 'desktop', 'keyframes', 'consent-dialog.png'), await page.screenshot());
      const reject = consent.locator('button', { hasText: /reject|decline|necessary|essential only/i }).first();
      if (await reject.isVisible().catch(() => false)) { await reject.click().catch(() => {}); log('consent', { note: 'clicked reject/necessary-only' }); }
      else { gaps.push({ kind: 'consent-dialog', note: 'dialog present, no safe reject option; left for the agent' }); }
    }

    manifest('evidence');
    ctx.evidence = scrubEvidence(await collectPageEvidence(page));
    ctx.evidence.keyframes ||= [];
    mergeOfflineCssEvidence(runDir, ctx.evidence);
    persistInitialEvidence(runDir, ctx.evidence);
    if ((ctx.evidence.hoverSelectors || []).length && !thorough) gaps.push({ kind: 'hover-targets', note: `${ctx.evidence.hoverSelectors.length} :hover selectors found; rerun with --thorough for pointer-path evidence` });

    manifest('scroll-atlas');
    ctx.scroll = await scrollAtlas(page, runDir, { level, thorough, thoroughProfile, smartProbes }, log, budget);
    if (!ctx.scroll.moved && ctx.scroll.total > 1400) gaps.push({ kind: 'scroll-hijack', note: thorough ? 'no credible effective progress signal advanced during the bounded real-wheel retries' : 'page did not move under scrollTo/wheel; rerun with --thorough for effective-progress traversal' });
    if (!thorough && ctx.scroll.shortPage && (ctx.evidence.runtime?.canvasCount || 0) > 0 && (ctx.evidence.listenerCounts?.wheel || 0) > 0) gaps.push({ kind: 'virtual-scroll-experience', note: 'one-viewport page with canvas + wheel listeners; rerun with --thorough to sample its wheel-driven story' });

    // component targets: selector=level entries
    for (const sel of components) {
      try {
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded({ timeout: 5000 });
        await page.waitForTimeout(400);
        const dir = ensureDir(join(runDir, 'frames', 'desktop', 'components'));
        const file = join(dir, `${slug(sel)}.png`);
        await el.screenshot({ path: file, timeout: 8000 });
        const elementRef = await el.evaluate((element) => window.__siteCapturePhaseB?.elementIds?.get(element) || null).catch(() => null);
        ctx.components.push({ selector: sel, elementRef, frame: `frames/desktop/components/${slug(sel)}.png` });
      } catch (e) { gaps.push({ kind: 'component-miss', note: redactSecrets(`${sel}: ${String(e).slice(0, 120)}`) }); }
    }

    const instrumentedEvents = scrubEvidence(await page.evaluate(() => (window.__scapDrain ? window.__scapDrain() : [])).catch(() => []));
    ctx.audioEvents = instrumentedEvents.filter((event) => /^(?:media-|audiocontext-)/.test(event.type || ''));
    ctx.motionEvents = instrumentedEvents.filter((event) => /^(?:transition|animation|css-register-property|view-transition)/.test(event.type || ''));
    for (const e of ctx.audioEvents) ndjsonAppend(join(runDir, 'telemetry', 'audio-events.ndjson'), e);
    for (const e of ctx.motionEvents) ndjsonAppend(join(runDir, 'source-evidence', 'motion-events.ndjson'), e);
    // GLSL is the one readable account of how a canvas site builds its look, so it is
    // saved as source next to the frames rather than summarized away.
    const shaderData = await page.evaluate(() => (window.__scapShaders ? window.__scapShaders() : { shaders: [], programs: [] })).catch(() => ({ shaders: [], programs: [] }));
    ctx.shaders = shaderData;
    if (shaderData.shaders.length) {
      const shaderDir = ensureDir(join(runDir, 'source-evidence', 'shaders'));
      for (const s of shaderData.shaders) {
        writeFileSync(join(shaderDir, `${String(s.index).padStart(3, '0')}-${s.kind}.glsl`), redactSecrets(s.source), 'utf8');
      }
      atomicWriteJson(join(runDir, 'source-evidence', 'shader-programs.json'), {
        api: shaderData.shaders[0]?.api || null,
        shaderCount: shaderData.shaders.length,
        programCount: shaderData.programs.length,
        programs: shaderData.programs,
        note: 'GLSL captured from the page\'s own shaderSource() calls. Evidence only, never shipped.',
      });
      log('shaders-captured', { shaders: shaderData.shaders.length, programs: shaderData.programs.length });
    }
    if (ctx.evidence.runtime?.canvasCount > 0) gaps.push({ kind: 'canvas', note: `${ctx.evidence.runtime.canvasCount} canvas element(s); frames and timed reactions are Observed, but scene graph/camera/material internals remain Unknown unless a public runtime exposed them${shaderData.shaders.length ? `. ${shaderData.shaders.length} shader(s) WERE captured as GLSL source in source-evidence/shaders/, so the look's construction is Observed even though the scene graph is not` : ''}` });

    // measure the FEEL: scroll spring, cursor followers, parallax depth rates
    manifest('motion-forensics');
    ctx.motionForensics = await motionForensics(page, runDir, ctx, gaps, log);

    manifest('mobile-smoke');
    ctx.mobileShots = level === 'quick' ? [] : await mobileSmoke(await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' }), targetUrl, runDir, log);

    // Close each recording context before ffmpeg so its WebM is finalized. The
    // separate walkthrough is intentionally human-paced rather than forensic.
    manifest('finalizing');
    const video = page.video();
    await context.close();
    const mobileCtxs = browser.contexts();
    for (const c of mobileCtxs) await c.close().catch(() => {});
    if (video) {
      const p = await video.path().catch(() => null);
      if (p && existsSync(p)) renameSync(p, join(runDir, 'media', 'reference', 'primary-path.webm'));
    }

    manifest('human-walkthrough');
    ctx.walkthroughs = await recordHumanWalkthroughs(browser, targetUrl, runDir, components, {
      thorough,
      deadlineMs: thorough ? Math.max(Date.now() + 6000, deadlineMs - finalizationReserveMs) : Math.max(Date.now() + 6000, deadlineMs + 45000),
    }, shell, gaps, log);

    await browser.close();
    for (const pid of chromePids) shell.disown(pid);

    ctx.technology = mergeTechnology(ctx.evidence.runtime || {}, runDir);
    mergeOfflineCssEvidence(runDir, ctx.evidence);
    ctx.sheets = await makeSheets(runDir, ctx.scroll.scenes, shell, log);

    ctx.rollups = buildRollups(runDir, ctx);

    const nonBlank = ctx.scroll.frames.filter((f) => f.keyframe && !f.blank).length;
    ctx.coverage = {
      scrollStates: { captured: ctx.scroll.frames.length, note: ctx.scroll.moved ? (thorough ? 'effective story progress traversed' : 'native scroll traversed') : 'page did not advance - see gaps' },
      scenes: ctx.scroll.scenes.length, keyframesNonBlank: nonBlank,
      hoverTargets: { probed: thorough ? (ctx.scroll.stops || []).reduce((sum, stop) => sum + (stop.phases?.cursor?.terminalCount || 0), 0) : 0, found: (ctx.evidence.hoverSelectors || []).length, note: thorough ? 'five-position cursor field per complete stop; paths sampled continuously' : 'rerun with --thorough' },
      interactiveTargets: ctx.scroll.interactiveCoverage || { discovered: 0, captured: 0, skipped: 0, note: thorough ? 'no captureable interactive controls observed' : 'rerun with --thorough' },
      audio: { events: ctx.audioEvents.length, note: 'inventory only; deep audio is phase C' },
      mobileStates: ctx.mobileShots.length, components: ctx.components.length,
      ...(ctx.rollups.site.coverage || {}),
    };
    ctx.coverageTable = ['| Dimension | Covered | Note |', '|---|---|---|',
      `| Scroll states | ${ctx.scroll.frames.length} frames, ${ctx.scroll.scenes.length} scenes | ${ctx.coverage.scrollStates.note} |`,
      `| Keyframes (non-blank) | ${nonBlank} | |`,
      `| Transition states | ${ctx.coverage.transitionStates?.captured || 0} | normalized per-property timing/easing |`,
      `| CSS keyframe rules | ${ctx.coverage.cssKeyframeRules?.captured || 0} Observed, ${ctx.coverage.cssKeyframeRules?.unknown || 0} Unknown | CSSOM + network fallback |`,
      `| Runtime CSS/WAAPI | ${ctx.coverage.runtimeCssWaapiAnimations?.captured || 0} Observed | live timing/keyframes |`,
      `| GSAP / ScrollTrigger | ${ctx.coverage.gsapTimelinesTweens?.captured || 0} / ${ctx.coverage.scrollTriggers?.captured || 0} | hidden globals remain Unknown |`,
      `| Pseudo-elements | ${ctx.coverage.pseudoElements?.captured || 0} terminal records | ${ctx.coverage.pseudoElements?.meaningful || 0} meaningful in covered states |`,
      `| 3D chains | ${ctx.coverage.transform3dAncestorChains?.captured || 0} | exact matrices; decomposition Inferred |`,
      `| Layout observations | ${ctx.coverage.layoutContainersItems?.captured || 0} | grid/flex/box/overflow/snap |`,
      `| Thorough stops | ${ctx.coverage.scrollStops?.captured || 0} complete, ${ctx.coverage.scrollStops?.partial || 0} partial | ${thorough ? 'enabled' : 'disabled'} |`,
      `| Stationary dwell | ${ctx.coverage.stationaryDwellSeries?.sampled || 0} series / ${ctx.coverage.stationaryDwellSeries?.frames || 0} frames | time-caused control |`,
      `| Cursor field | ${ctx.coverage.cursorGridPositions?.sampled || 0} positions / ${ctx.coverage.cursorGridPositions?.pathWaypoints || 0} waypoints | frame + readable data per waypoint |`,
      `| Interactive controls | ${ctx.coverage.interactiveTargets?.captured || 0} / ${ctx.coverage.interactiveTargets?.discovered || 0} targets; ${ctx.coverage.interactiveTargets?.skipped || 0} skipped | base/during/settled/reverse/focus/active/restored state series |`,
      `| Adaptive refinement | ${(ctx.scroll.boundaries || []).filter((boundary) => boundary.status === 'refined').length} refined / ${(ctx.scroll.boundaries || []).length} detected boundaries | 8px forensic replay; divergences remain Unknown |`,
      `| Hover selectors | ${ctx.coverage.hoverTargets.probed} probes; ${(ctx.evidence.hoverSelectors || []).length} authored selectors found | ${ctx.coverage.hoverTargets.note} |`,
      `| Audio | ${ctx.audioEvents.length} events logged | inventory only |`,
      `| Mobile | ${ctx.mobileShots.length} states | smoke pass |`,
      `| Components | ${ctx.components.length} | ${(ctx.walkthroughs || []).filter((item) => item.kind === 'component' && item.status === 'Observed').length} component walkthroughs |`,
      `| 30 fps walkthrough | ${(ctx.walkthroughs || []).filter((item) => item.status === 'Observed').length} videos | human-paced recordVideo, normalized by ffmpeg |`].join('\n');

    ctx.status = budget.exceeded() ? 'partial (budget)' : 'mechanical-complete';
    atomicWriteJson(join(runDir, 'gap-queue.json'), scrubEvidence({ gaps, forAgent: 'open the site with browser tools, resolve each gap, append findings to gaps/supplemental.ndjson' }));
    writeRecreateDraft(runDir, ctx);
    writeEvidenceIndex(runDir, ctx);
    manifest(ctx.status, { verificationPass: null, verificationPending: true });

    // Process cleanup is itself a verification input. Release every owned child
    // first, then prove zero survivors and all persisted evidence in one pass.
    const clean = await shell.finish('capture-finished-pending-verification');
    ctx.cleanup = { completed: true, zeroSurvivors: clean === true };
    let v = verify(runDir, ctx);
    if (!v.pass) ctx.status = 'verification-failed';
    writeRecreateDraft(runDir, ctx);
    writeEvidenceIndex(runDir, ctx);
    manifest(ctx.status, { verificationPass: v.pass, verificationPending: false });
    v = verify(runDir, ctx);
    if (!v.pass && ctx.status !== 'verification-failed') {
      ctx.status = 'verification-failed';
      writeRecreateDraft(runDir, ctx);
      writeEvidenceIndex(runDir, ctx);
      manifest(ctx.status, { verificationPass: false, verificationPending: false });
      v = verify(runDir, ctx);
    }
    return { runDir, status: ctx.status, verificationPass: v.pass, clean };
  } catch (err) {
    log('run-error', { note: redactSecrets(String(err?.stack || err).slice(0, 800)) });
    try { if (browser?.isConnected()) await browser.close(); } catch {}
    manifest('failed', { error: redactSecrets(String(err).slice(0, 300)) });
    await shell.finish('failed');
    return { runDir, status: 'failed', error: redactSecrets(String(err)) };
  }
}
