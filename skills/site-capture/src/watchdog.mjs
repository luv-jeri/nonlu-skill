// Watchdog: survives the main process. If main dies or the hard deadline passes,
// kill every PID the run registered, then exit. Never pattern-matches process
// names - only exact PIDs from the registry, so the user's own Chrome is untouchable.
import { readFileSync, writeFileSync } from 'node:fs';

const [parentPid, pidsFile, hardDeadlineMs] = process.argv.slice(2).map((v, i) => (i === 1 ? v : Number(v)));

const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const readPids = () => { try { return JSON.parse(readFileSync(pidsFile, 'utf8')); } catch { return { owned: [] }; } };

function killOwned(reason) {
  const reg = readPids();
  const owned = (reg.owned || []).filter((p) => p !== process.pid);
  for (const pid of owned) { try { process.kill(pid, 'SIGTERM'); } catch {} }
  setTimeout(() => {
    const survivors = owned.filter(alive);
    for (const pid of survivors) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    try {
      writeFileSync(pidsFile.replace(/pids\.json$/, 'watchdog-fired.json'), JSON.stringify({ t: new Date().toISOString(), reason, killed: owned, forceKilled: survivors }));
    } catch {}
    process.exit(0);
  }, 3000);
}

const tick = setInterval(() => {
  if (!alive(parentPid)) { clearInterval(tick); killOwned('parent-died'); }
  else if (Date.now() > hardDeadlineMs) { clearInterval(tick); killOwned('hard-deadline'); }
}, 2000);
