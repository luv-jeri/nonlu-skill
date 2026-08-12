// Sanitized network ledger + content-addressed body store.
// Saves design-relevant bodies (images, fonts, css, audio, video, 3D, animation JSON);
// never saves executable JS bundles. Response headers are never captured at all
// (only content-type is read), so cookies and auth headers cannot reach disk;
// URLs are query-sanitized before persisting.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eachFileLine, ndjsonAppend, sanitizeUrl, sha256, ensureDir, redactSecrets } from './util.mjs';

const SAVE_TYPES = [
  [/^image\//, 'image'], [/^font\/|font-woff|application\/font/, 'font'],
  [/^text\/css/, 'css'], [/^audio\//, 'audio'], [/^video\//, 'video'],
  [/gltf|glb|octet-stream.*model|model\//, 'model'], [/json/, 'json-maybe'],
];
const MODEL_EXT = /\.(glb|gltf|bin|ktx2?|basis|dds|hdr|exr|draco)(\?|$)/i;
const LOTTIE_HINT = /lottie|animation.*\.json/i;

export function attachNetwork(context, runDir, caps, log) {
  const ledger = join(runDir, 'network', 'responses.ndjson');
  const assetIndex = join(runDir, 'assets', 'index.ndjson');
  const blobDir = ensureDir(join(runDir, 'assets', 'blobs'));
  writeFileSync(join(runDir, 'assets', 'DO-NOT-SHIP.txt'), 'Everything under assets/ is captured evidence for private study only. None of it may be shipped, embedded, or reused in any recreation. Take the mechanism, never the execution.\n');
  let totalBytes = 0;

  context.on('response', async (res) => {
    let meta;
    try {
      const req = res.request();
      const mime = (res.headers()['content-type'] || '').split(';')[0].trim();
      meta = {
        t: new Date().toISOString(), url: sanitizeUrl(res.url()), status: res.status(),
        mime, resourceType: req.resourceType(), method: req.method(),
      };
      let role = null;
      for (const [re, r] of SAVE_TYPES) if (re.test(mime)) { role = r; break; }
      if (!role && MODEL_EXT.test(res.url())) role = 'model';
      if (role === 'json-maybe') role = LOTTIE_HINT.test(res.url()) ? 'animation-json' : null;
      if (role && res.status() === 200 && meta.resourceType !== 'script') {
        const responseBody = await res.body().catch(() => null);
        // Textual design assets can embed signed URLs or literal credentials.
        // Redact before hashing/writing so the blob store cannot become a bypass
        // around the shared JSON/NDJSON persistence boundary.
        const textualEvidence = role === 'css' || role === 'animation-json' || /^(?:image\/svg\+xml|application\/(?:xml|json)|text\/)/i.test(mime);
        const body = responseBody && textualEvidence ? Buffer.from(redactSecrets(responseBody.toString('utf8'))) : responseBody;
        if (body && body.length <= caps.perBodyBytes && totalBytes + body.length <= caps.totalBodyBytes) {
          const hash = sha256(body);
          const ext = (res.url().match(/\.([a-z0-9]{2,5})(\?|$)/i)?.[1] || mime.split('/')[1] || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
          const file = join(blobDir, `${hash}.${ext}`);
          if (!existsSync(file)) { writeFileSync(file, body); totalBytes += body.length; }
          ndjsonAppend(assetIndex, { ...meta, role, sha256: hash, bytes: body.length, file: `assets/blobs/${hash}.${ext}` });
          meta.saved = true; meta.sha256 = hash;
        } else if (body) {
          ndjsonAppend(assetIndex, { ...meta, role, bytes: body.length, skipped: 'over-cap' });
          meta.saved = false;
        }
      }
      ndjsonAppend(ledger, meta);
    } catch (e) {
      if (meta) ndjsonAppend(ledger, { ...meta, error: redactSecrets(String(e).slice(0, 200)) });
    }
  });

  return { totalSaved: () => totalBytes };
}

export function readStoredStylesheets(runDir) {
  const indexPath = join(runDir, 'assets', 'index.ndjson');
  if (!existsSync(indexPath)) return [];
  const rows = [];
  eachFileLine(indexPath, (line) => { if (line) { try { const row = JSON.parse(line); if (row) rows.push(row); } catch {} } });
  const stylesheets = [];
  for (const row of rows) {
    if (row.role !== 'css' || !row.file) continue;
    const absolute = join(runDir, row.file);
    if (!existsSync(absolute)) continue;
    try { stylesheets.push({ url: row.url, sha256: row.sha256, file: row.file, text: readFileSync(absolute, 'utf8') }); }
    catch (error) { stylesheets.push({ url: row.url, sha256: row.sha256, file: row.file, status: 'Unknown', reason: redactSecrets(String(error)), text: null }); }
  }
  return stylesheets;
}

// Bounded offline fallback: inventory complete @keyframes blocks from already
// sanitized network CSS. It never claims that a rule was active or matched an
// element; live CSSOM/computed evidence remains authoritative for association.
export function extractNetworkKeyframes(stylesheets) {
  const records = [];
  for (const sheet of stylesheets || []) {
    if (!sheet.text) continue;
    const text = sheet.text;
    const re = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/gi;
    let match;
    while ((match = re.exec(text))) {
      let depth = 1;
      let quote = '';
      let escaped = false;
      let index = re.lastIndex;
      for (; index < text.length && depth > 0; index++) {
        const char = text[index];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (quote) { if (char === quote) quote = ''; continue; }
        if (char === '"' || char === "'") { quote = char; continue; }
        if (char === '{') depth++;
        else if (char === '}') depth--;
      }
      const cssText = text.slice(match.index, index);
      records.push({
        id: `network-keyframes-${sheet.sha256}-${match.index}`,
        kind: 'keyframes',
        status: depth === 0 ? 'Observed' : 'Unknown',
        acquisition: { track: 'forensic', method: 'network' },
        value: { name: match[1], cssText, source: { url: sheet.url, sha256: sheet.sha256, file: sheet.file }, activation: { value: null, status: 'Unknown', reason: 'network CSS text does not prove cascade activation or element association' }, frames: [] },
        caveats: depth === 0 ? ['Authored network text only; active condition and element association are Unknown.'] : ['Unbalanced keyframes block in captured CSS.'],
        evidenceRefs: [sheet.file], derivedFrom: [],
      });
      re.lastIndex = Math.max(re.lastIndex, index);
    }
  }
  return records;
}
