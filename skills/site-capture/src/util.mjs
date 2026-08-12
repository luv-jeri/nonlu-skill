import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

export function ensureDir(p) { mkdirSync(p, { recursive: true }); return p; }

// atomic: write tmp then rename, so a killed run never leaves a half-written JSON
export function atomicWriteJson(path, obj) {
  ensureDir(dirname(path));
  const tmp = path + '.tmp';
  writeFileSync(tmp, redactSecrets(JSON.stringify(obj, null, 2)));
  renameSync(tmp, path);
}

export function ndjsonAppend(path, obj) {
  ensureDir(dirname(path));
  appendFileSync(path, redactSecrets(JSON.stringify(obj)) + '\n');
}

export function makeLogger(runDir) {
  const path = join(runDir, 'logs', 'run.ndjson');
  return (event, data = {}) => {
    const clean = redactValue(data);
    const line = { t: new Date().toISOString(), event, ...clean };
    ndjsonAppend(path, line);
    if (process.env.SCAP_VERBOSE) console.error(`[site-capture] ${event}`, clean.note ?? '');
  };
}

export const slug = (s) => s.toLowerCase().replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'site';

// strip credential-looking query values so nothing signed/secret lands on disk
export function sanitizeUrl(u) {
  try {
    const url = new URL(u);
    // User-info is never useful capture evidence and may contain literal HTTP
    // credentials. Remove it rather than preserving even a recognizable shape.
    url.username = '';
    url.password = '';
    for (const [k] of url.searchParams) {
      if (/(sig|signature|token|key|auth|session|passw|secret|credential|x-amz-)/i.test(k)) url.searchParams.set(k, 'REDACTED');
    }
    if (/(sig|signature|token|key|auth|session|passw|secret|credential)/i.test(url.hash)) url.hash = '#REDACTED';
    return url.toString();
  } catch { return u; }
}

export const nowMs = () => Date.now();

// scrub secret-looking material from free text (console lines, CSS, media URLs)
// before it can reach disk; URL queries get the same treatment as sanitizeUrl
const SECRET_PATTERNS = [
  /(bearer\s+)[a-z0-9._~+/=-]{16,}/gi,
  /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd|authorization)["']?\s*[:=]\s*["']?)[^\s"'&;]{8,}/gi,
];
export function redactSecrets(text) {
  if (typeof text !== 'string' || !text) return text;
  let t = text.replace(/https?:\/\/[^\s"')]+/g, (u) => sanitizeUrl(u));
  for (const re of SECRET_PATTERNS) t = t.replace(re, '$1REDACTED');
  return t;
}

// Use at every persistence boundary. It intentionally leaves keys intact so
// evidence schemas stay inspectable while recursively redacting string values.
export function redactValue(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactSecrets(value);
  if (value == null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactValue(item, seen)]));
}
