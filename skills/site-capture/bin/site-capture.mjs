#!/usr/bin/env node
// site-capture CLI. See SKILL.md for usage. Exit 0 = success, 1 = failure.
import { runCapture } from '../src/run.mjs';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);

function usage() {
  console.log(`site-capture <url> ["css-selector"=level ...] [options]
  --level full|medium|quick   capture depth (default full)
  --thorough                  slow atomic dwell/cursor/state capture (additive)
  --smart-probes              probe one representative per same-styled interactive group (thorough)
  --out <dir>                 output root (default ./captures)
  --headless                  run Chrome headless (default headed)
  --budget <seconds>          override the level's time budget
  --selftest                  verify environment, touch no network
  --reap <out-root>           kill stale run-owned PIDs from crashed runs
One page per run. Extra pages = separate runs (documented in SKILL.md).`);
}

async function selftest() {
  const results = [];
  const ok = (name, pass, note = '') => { results.push({ name, pass, note }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name} ${note}`); };
  ok('node>=20', Number(process.versions.node.split('.')[0]) >= 20, process.version);
  try { const { chromium } = await import('playwright'); ok('playwright-import', true, '');
    const b = await chromium.launch({ channel: 'chrome', headless: true });
    ok('chrome-launch', true, b.version()); await b.close();
  } catch (e) { ok('playwright/chrome', false, String(e).slice(0, 120)); }
  try { const { PNG } = await import('pngjs'); ok('pngjs-import', !!PNG); } catch { ok('pngjs-import', false); }
  const { execSync } = await import('node:child_process');
  try { execSync('ffmpeg -version', { stdio: 'pipe' }); ok('ffmpeg', true); } catch { ok('ffmpeg', false, 'install via homebrew'); }
  const pass = results.every((r) => r.pass);
  console.log(pass ? 'SELFTEST PASS' : 'SELFTEST FAIL');
  process.exit(pass ? 0 : 1);
}

function reap(root) {
  let found = 0, killed = 0;
  const walk = (dir, depth) => {
    if (depth > 4 || !existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const pidsFile = join(dir, e.name, 'logs', 'pids.json');
      if (existsSync(pidsFile)) {
        try {
          const reg = JSON.parse(readFileSync(pidsFile, 'utf8'));
          for (const pid of [...(reg.owned || []), ...(reg.watchdog ? [reg.watchdog] : [])]) {
            found++;
            try { process.kill(pid, 0); process.kill(pid, 'SIGKILL'); killed++; console.log(`reaped stale pid ${pid} (${pidsFile})`); } catch {}
          }
        } catch {}
      } else walk(join(dir, e.name), depth + 1);
    }
  };
  walk(root, 0);
  console.log(`reap done: ${found} registered pids checked, ${killed} stale killed`);
  process.exit(0);
}

if (args.includes('--selftest')) { await selftest(); }
else if (args.includes('--reap')) { reap(args[args.indexOf('--reap') + 1] || './captures'); }
else {
  const url = args.find((a) => /^https?:\/\//.test(a));
  if (!url) { usage(); process.exit(args.length ? 1 : 0); }
  if (/^(https?:\/\/)(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(url) && !args.includes('--allow-private')) {
    if (!process.env.SCAP_ALLOW_PRIVATE) { console.error('refusing private/localhost target (use --allow-private for fixture tests)'); process.exit(1); }
  }
  const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
  const components = args.filter((a) => a.includes('=') && !a.startsWith('--') && a !== url).map((a) => {
    const [sel, level] = a.split('=');
    return { selector: sel, level: level || 'full' };
  });
  const result = await runCapture({
    url,
    level: flag('--level', 'full'),
    thorough: args.includes('--thorough'),
    smartProbes: args.includes('--smart-probes'),
    outRoot: flag('--out', './captures'),
    headless: args.includes('--headless'),
    budgetSec: flag('--budget', null) ? Number(flag('--budget', null)) : null,
    components: components.map((c) => c.selector),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'failed' || result.status === 'verification-failed' || result.verificationPass !== true || result.clean === false ? 1 : 0);
}
