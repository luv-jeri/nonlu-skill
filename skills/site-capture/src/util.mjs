import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

// Chunked line walker: run telemetry can exceed Node's 0x1fffffe8-char string ceiling
// (a 1GB cursor-probes.ndjson killed two report stages), so no whole-file string is ever
// built. Individual lines must still fit in a string. onLine gets the raw line text.
export function eachFileLine(path, onLine) {
  if (!existsSync(path)) return;
  const fd = openSync(path, 'r');
  try {
    const chunk = Buffer.alloc(32 * 1024 * 1024);
    const decoder = new StringDecoder('utf8');
    let carry = '';
    let bytes;
    while ((bytes = readSync(fd, chunk, 0, chunk.length, null)) > 0) {
      carry += decoder.write(chunk.subarray(0, bytes));
      const lines = carry.split('\n');
      carry = lines.pop();
      for (const line of lines) onLine(line);
    }
    const last = carry + decoder.end();
    if (last) onLine(last);
  } finally {
    closeSync(fd);
  }
}

// Chunked pattern scan for the secret gate: the trailing-overlap re-test catches a match
// that straddles a chunk boundary (8KB covers any credential the pattern set can match).
export function fileContainsPattern(path, regex, overlap = 8192) {
  if (!existsSync(path)) return false;
  const fd = openSync(path, 'r');
  try {
    const chunk = Buffer.alloc(32 * 1024 * 1024);
    const decoder = new StringDecoder('utf8');
    let tail = '';
    let bytes;
    while ((bytes = readSync(fd, chunk, 0, chunk.length, null)) > 0) {
      const text = tail + decoder.write(chunk.subarray(0, bytes));
      if (regex.test(text)) return true;
      tail = text.slice(-overlap);
    }
    return regex.test(tail + decoder.end());
  } finally {
    closeSync(fd);
  }
}

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
