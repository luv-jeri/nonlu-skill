// Process safety shell: PID registry, watchdog, signal handlers, exit audit.
// Contract: after the run ends (any way it ends), zero run-owned processes survive.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { atomicWriteJson } from './util.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

export function makeSafetyShell(runDir, hardDeadlineMs, log) {
  const pidsFile = join(runDir, 'logs', 'pids.json');
  const owned = new Set();
  let watchdog = null;
  let finalizers = [];
  let finished = false;

  const flush = () => atomicWriteJson(pidsFile, { main: process.pid, watchdog: watchdog?.pid ?? null, owned: [...owned] });

  const shell = {
    pidsFile,
    own(pid, label) { if (pid) { owned.add(pid); flush(); log('pid-owned', { pid, label }); } },
    disown(pid) { owned.delete(pid); flush(); },
    onFinalize(fn) { finalizers.push(fn); },
    startWatchdog() {
      watchdog = spawn(process.execPath, [join(HERE, 'watchdog.mjs'), String(process.pid), pidsFile, String(hardDeadlineMs)], { detached: true, stdio: 'ignore' });
      watchdog.unref();
      flush(); // registry must name the watchdog so a supervisor-kill test can target it
      log('watchdog-started', { pid: watchdog.pid });
    },
    async finish(status) {
      if (finished) return; finished = true;
      for (const fn of finalizers.reverse()) { try { await fn(); } catch (e) { log('finalizer-error', { note: String(e).slice(0, 300) }); } }
      // audit: every owned pid must be dead
      const alive = [...owned].filter((pid) => { try { process.kill(pid, 0); return true; } catch { return false; } });
      for (const pid of alive) { try { process.kill(pid, 'SIGKILL'); } catch {} }
      const watchdogPid = watchdog?.pid ?? null;
      const watchdogExited = watchdogPid ? new Promise((resolve) => {
        if (watchdog.exitCode != null || watchdog.signalCode != null) resolve();
        else watchdog.once('exit', resolve);
      }) : Promise.resolve();
      if (watchdogPid) { try { process.kill(watchdogPid, 'SIGKILL'); } catch {} }
      await Promise.all([new Promise((resolve) => setTimeout(resolve, 300)), Promise.race([watchdogExited, new Promise((resolve) => setTimeout(resolve, 1000))])]);
      const survivors = [...owned, ...(watchdogPid ? [watchdogPid] : [])].filter((pid) => { try { process.kill(pid, 0); return true; } catch { return false; } });
      atomicWriteJson(join(runDir, 'logs', 'cleanup.json'), {
        t: new Date().toISOString(), status, ownedAtExit: [...owned], watchdogAtExit: watchdogPid, neededForceKill: [...alive, ...(watchdogPid ? [watchdogPid] : [])], survivors,
      });
      log('cleanup-done', { status, survivors: survivors.length });
      return survivors.length === 0;
    },
  };

  const bail = (status, err) => {
    if (err) log('fatal', { note: String(err?.stack || err).slice(0, 800) });
    shell.finish(status).then(() => process.exit(status === 'complete' ? 0 : 1));
  };
  process.on('SIGINT', () => bail('interrupted'));
  process.on('SIGTERM', () => bail('interrupted'));
  process.on('uncaughtException', (e) => bail('failed', e));
  process.on('unhandledRejection', (e) => bail('failed', e));

  flush();
  return shell;
}
