// Contact sheets (ffmpeg), evidence.json, RECREATE draft, verification, gap queue.
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { atomicWriteJson, eachFileLine, ensureDir, fileContainsPattern, redactSecrets } from './util.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

export function makeSheets(runDir, scenes, shell, log) {
  const sheetDir = ensureDir(join(runDir, 'media', 'contact-sheets'));
  const jobs = [];
  for (const scene of scenes) {
    const keys = scene.keyframes || [];
    for (let chunk = 0; chunk * 12 < keys.length; chunk++) {
      const batch = keys.slice(chunk * 12, chunk * 12 + 12);
      if (batch.length < 2) continue;
      const tmp = ensureDir(join(runDir, 'logs', `sheet-tmp-${scene.id}-${chunk}`));
      batch.forEach((rel, i) => copyFileSync(join(runDir, rel), join(tmp, `f-${String(i).padStart(3, '0')}.png`)));
      const out = join(sheetDir, `${scene.id}-sheet-${chunk}.png`);
      const cols = 3, rows = Math.ceil(batch.length / cols);
      jobs.push({ tmp, out, tile: `${cols}x${rows}`, sceneId: scene.id, frames: batch });
    }
  }
  return Promise.all(jobs.map((j) => new Promise((resolve) => {
    const ff = spawn('ffmpeg', ['-y', '-i', join(j.tmp, 'f-%03d.png'), '-filter_complex', `scale=480:-1,tile=${j.tile}`, j.out], { stdio: 'ignore' });
    shell.own(ff.pid, 'ffmpeg-sheet');
    ff.on('exit', (code) => {
      shell.disown(ff.pid);
      if (code !== 0) log('sheet-failed', { scene: j.sceneId, note: 'ffmpeg exit ' + code });
      resolve(code === 0 ? { scene: j.sceneId, file: `media/contact-sheets/${j.sceneId}-sheet-0.png`.replace('-0.png', `-${j.out.split('-sheet-')[1]}`), frames: j.frames } : null);
    });
  }))).then((r) => r.filter(Boolean));
}

// Chunked reader: telemetry rows can be ~200MB each (huge-DOM readable snapshots), so a
// whole-file readFileSync string trips Node's 0x1fffffe8 char ceiling. Individual lines
// must still fit in a string; `project` lets call sites drop heavy payloads at parse time.
const readNdjson = (path, project) => {
  const rows = [];
  eachFileLine(path, (line) => {
    if (!line.trim()) return;
    try {
      const row = JSON.parse(line);
      rows.push(project ? project(row) : row);
    } catch {}
  });
  return rows;
};

const ndjsonParseable = (path) => {
  let ok = true;
  eachFileLine(path, (line) => {
    if (!ok || !line.trim()) return;
    try { JSON.parse(line); } catch { ok = false; }
  });
  return ok;
};

// The report only consumes light fields from cursor rows; the heavy readable/diff payloads
// stay on disk. readableData/canvasReaction collapse to presence booleans because the only
// consumer checks truthiness (verification's nine-waypoint assert).
const projectCursorRow = (row) => ({
  id: row.id,
  stopId: row.stopId,
  sectionRef: row.sectionRef,
  positions: (row.positions || []).map((position) => ({
    name: position.name,
    status: position.status,
    causalLabel: position.causalLabel,
    pathSampling: position.pathSampling,
    baselineFrameRef: position.baselineFrameRef,
    targetBaselineFrameRef: position.targetBaselineFrameRef,
    settledFrameRef: position.settledFrameRef,
    targetSettledFrameRef: position.targetSettledFrameRef,
    pathSamples: (position.pathSamples || []).map((sample) => ({
      frameRef: sample.frameRef,
      frameHash: sample.frameHash,
      readableData: Boolean(sample.readableData),
      canvasReaction: Boolean(sample.canvasReaction),
    })),
  })),
  restore: row.restore ? { status: row.restore.status, frameRef: row.restore.frameRef } : row.restore,
});

const uniqueByJson = (values) => [...new Map(values.map((value) => [JSON.stringify(value), value])).values()];

const observedProp = (observation, name) => {
  const entry = observation?.props?.[name];
  if (typeof entry === 'string') return entry;
  return entry?.supported === true ? entry.value : null;
};

const distribution = (values) => {
  const counts = {};
  for (const value of values.filter((value) => value != null && value !== '')) counts[value] = (counts[value] || 0) + 1;
  return { status: Object.keys(counts).length ? 'Observed' : 'Unknown', counts };
};

const perceivedPaletteForFrames = (runDir, refs) => {
  const selected = refs.length <= 30 ? refs : Array.from({ length: 30 }, (_, index) => refs[Math.round(index * (refs.length - 1) / 29)]);
  const counts = {};
  let sampledFrames = 0;
  for (const ref of [...new Set(selected)]) {
    try {
      const png = PNG.sync.read(readFileSync(join(runDir, ref))); sampledFrames++;
      const pixelStride = Math.max(1, Math.floor((png.width * png.height) / 20000));
      for (let pixel = 0; pixel < png.width * png.height; pixel += pixelStride) {
        const offset = pixel * 4; if (png.data[offset + 3] < 128) continue;
        const q = (value) => Math.min(255, Math.round(value / 16) * 16);
        const color = `rgb(${q(png.data[offset])}, ${q(png.data[offset + 1])}, ${q(png.data[offset + 2])})`;
        counts[color] = (counts[color] || 0) + 1;
      }
    } catch {}
  }
  return sampledFrames ? { status: 'Observed', method: 'quantized screenshot-pixel sampling', sampledFrames, availableFrames: refs.length, colors: Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 32)), caveat: 'perceived composite pixels are observed; inverse attribution to DOM/canvas/video layers remains Unknown' } : { status: 'Unknown', reason: 'no readable section frame was available' };
};

const stateMotion = (runDir, ctx) => ({
  animations: uniqueByJson([...(ctx.evidence.runtimeAnimations || []), ...readNdjson(join(runDir, 'source-evidence', 'animation-states.ndjson'))]),
  pseudos: uniqueByJson([...(ctx.evidence.pseudoStates || []), ...readNdjson(join(runDir, 'source-evidence', 'pseudo-states.ndjson'))]),
  gsap: uniqueByJson([...(ctx.evidence.gsap ? [ctx.evidence.gsap] : []), ...readNdjson(join(runDir, 'source-evidence', 'gsap.ndjson'))]),
  triggers: uniqueByJson([...(ctx.evidence.scrollTriggers ? [ctx.evidence.scrollTriggers] : []), ...readNdjson(join(runDir, 'source-evidence', 'scroll-triggers.ndjson'))]),
  stagger: uniqueByJson([...(ctx.evidence.staggerSystems || []), ...readNdjson(join(runDir, 'source-evidence', 'stagger-states.ndjson'))]),
});

const keyframeLinks = (observations) => uniqueByJson(observations.flatMap((observation) => observation.cssAnimations?.keyframeLinks || []));

export function rollupTransitionVocabulary(elementRollups) {
  const tracks = [];
  for (const element of elementRollups || []) for (const observation of element.observations || []) {
    for (const track of observation.transitions?.tracks || []) tracks.push({ trackId: track.trackId || null, property: track.property, durationMs: track.durationMs, delayMs: track.delayMs, easingToken: track.easing?.token || track.easingComputed || null, easingResolved: track.easing?.resolved || track.easingResolved || null, behavior: track.behavior || null });
  }
  const exact = uniqueByJson(tracks);
  const counts = {};
  for (const track of tracks) {
    const key = JSON.stringify(track);
    counts[key] = (counts[key] || 0) + 1;
  }
  return exact.map((track) => ({ ...track, observationCount: counts[JSON.stringify(track)], status: 'Observed' }));
}

export function rollupLayout(elementRollups) {
  const displays = {};
  const gaps = {};
  const containers = [];
  for (const element of elementRollups || []) for (const observation of element.observations || []) {
    const layout = observation.layout;
    if (!layout) continue;
    displays[layout.displayModel] = (displays[layout.displayModel] || 0) + 1;
    const gap = layout.container?.gap;
    if (gap) gaps[gap] = (gaps[gap] || 0) + 1;
    if (/grid|flex|columns/.test(layout.displayModel || '')) containers.push({ elementRef: element.elementId, stateRef: observation.stateRef, display: layout.displayModel, tracks: { columns: layout.container?.gridTemplateColumns, rows: layout.container?.gridTemplateRows }, gap, rect: layout.rect, status: 'Observed' });
  }
  return { status: 'Observed', displays, gaps, containers };
}

export function buildElementRollups(runDir, ctx) {
  const stateRows = readNdjson(join(runDir, 'source-evidence', 'style-states.ndjson'));
  const source = stateRows.length ? stateRows : (ctx.evidence.elements || []);
  const byElement = new Map();
  for (const row of source) {
    if (!row?.elementId) continue;
    let record = byElement.get(row.elementId);
    if (!record) {
      record = { elementId: row.elementId, signature: row.signature || null, sectionRef: row.sectionRef || null, componentRef: row.componentRef || null, status: 'Observed', observations: [] };
      byElement.set(row.elementId, record);
    }
    if (!record.signature && row.signature) record.signature = row.signature;
    record.sectionRef ||= row.sectionRef || null;
    record.componentRef ||= row.componentRef || null;
    if (row.observation) record.observations.push(row.observation);
  }
  for (const interactive of readNdjson(join(runDir, 'source-evidence', 'interactive-states.ndjson'))) {
    if (!interactive?.elementRef || interactive.status !== 'Observed') continue;
    let record = byElement.get(interactive.elementRef);
    if (!record) {
      record = { elementId: interactive.elementRef, signature: { tag: interactive.target?.tag || null, role: interactive.target?.role || null }, sectionRef: null, componentRef: interactive.elementRef, status: 'Observed', observations: [] };
      byElement.set(interactive.elementRef, record);
    }
    const states = [
      interactive.phases?.base?.state,
      ...(interactive.phases?.hover?.series || []).map((entry) => entry.state),
      ...(interactive.phases?.reverse?.series || []).map((entry) => entry.state),
      interactive.phases?.focus?.state,
      ...(interactive.phases?.active?.series || []).map((entry) => entry.state),
      interactive.phases?.restored?.state,
    ].filter(Boolean);
    states.forEach((state, index) => record.observations.push({
      observationId: `${interactive.id}:state:${index}`,
      stateRef: `${interactive.id}:${state.phase || index}`,
      phase: state.phase || 'interactive', status: state.status || 'Unknown', props: state.props || null,
      rects: state.rect ? { bounding: state.rect } : null, pseudoState: state.pseudo || null,
      transitions: state.transitions || null,
      runtimeAnimationRefs: (state.animations || []).map((animation) => animation.id).filter(Boolean),
      gsapTweenRefs: [], scrollTriggerRefs: [], assetRefs: [],
      frameRefs: [interactive.phases?.base?.frameRef, interactive.phases?.hover?.immediateFrame?.frameRef, interactive.phases?.hover?.settledFrame?.frameRef, interactive.phases?.restored?.frameRef].filter(Boolean),
      interactiveEvidenceRef: interactive.id, lifecycleEvents: interactive.lifecycleEvents || [],
    }));
  }
  for (const record of byElement.values()) {
    record.stateCount = record.observations.length;
    record.sameAsCount = record.observations.filter((observation) => observation.sameAsObservationId).length;
    record.terminalStatus = record.observations.at(-1)?.status || 'Unknown';
    record.timing = {
      transitions: rollupTransitionVocabulary([record]),
      cssAnimations: uniqueByJson(record.observations.flatMap((observation) => observation.cssAnimations?.tracks || [])),
      keyframeLinks: keyframeLinks(record.observations),
      runtimeAnimationRefs: [...new Set(record.observations.flatMap((observation) => observation.runtimeAnimationRefs || []))],
      gsapTweenRefs: [...new Set(record.observations.flatMap((observation) => observation.gsapTweenRefs || []))],
      scrollTriggerRefs: [...new Set(record.observations.flatMap((observation) => observation.scrollTriggerRefs || []))],
      staggerSystemRefs: [...new Set(record.observations.flatMap((observation) => observation.staggerSystemRefs || []))],
    };
  }
  return [...byElement.values()];
}

export function buildComponentRollups(elementRollups, ctx, runDir) {
  const groups = new Map();
  const inferredFamilies = new Map();
  for (const element of elementRollups) {
    if (element.componentRef) {
      if (!groups.has(element.componentRef)) groups.set(element.componentRef, []);
      groups.get(element.componentRef).push(element);
    } else {
      const signature = JSON.stringify({ tag: element.signature?.tag, classes: element.signature?.classes || [], role: element.signature?.role || null });
      if (!inferredFamilies.has(signature)) inferredFamilies.set(signature, []);
      inferredFamilies.get(signature).push(element);
    }
  }
  for (const target of ctx.components || []) {
    if (!target.elementRef) continue;
    const members = elementRollups.filter((element) => element.elementId === target.elementRef || element.componentRef === target.elementRef);
    if (members.length) groups.set(`target:${target.selector}`, members);
  }
  let familyIndex = 0;
  for (const members of inferredFamilies.values()) if (members.length > 1) groups.set(`cmp_inferred_${String(++familyIndex).padStart(4, '0')}`, members);
  const motion = stateMotion(runDir, ctx);
  return [...groups.entries()].map(([componentRef, members]) => {
    const explicitTarget = componentRef.startsWith('target:') || (ctx.components || []).some((component) => component.elementRef && members.some((member) => member.elementId === component.elementRef || member.componentRef === component.elementRef));
    const inferredFamily = componentRef.startsWith('cmp_inferred_');
    const observations = members.flatMap((member) => member.observations);
    const memberIds = new Set(members.map((member) => member.elementId));
    return {
      componentRef,
      status: inferredFamily ? 'Inferred' : 'Observed',
      groupingBasis: explicitTarget ? 'explicit target root' : inferredFamily ? 'repeated structural signature' : 'nearest semantic widget/root',
      memberIds: members.map((member) => member.elementId),
      instanceIds: members.map((member) => member.elementId),
      testedStateGraph: uniqueByJson(observations.map((observation) => ({ stateRef: observation.stateRef, phase: observation.phase, status: observation.status }))),
      transitionVocabulary: rollupTransitionVocabulary(members),
      cssAnimations: uniqueByJson(observations.flatMap((observation) => observation.cssAnimations?.tracks || [])),
      keyframeLinks: keyframeLinks(observations),
      runtimeAnimationRefs: [...new Set(observations.flatMap((observation) => observation.runtimeAnimationRefs || []))],
      gsapTweenRefs: [...new Set(observations.flatMap((observation) => observation.gsapTweenRefs || []))],
      scrollTriggerRefs: [...new Set(observations.flatMap((observation) => observation.scrollTriggerRefs || []))],
      staggerSystems: motion.stagger.filter((system) => system.value?.instances?.some((instance) => memberIds.has(instance.elementRef))),
      sharedCustomProperties: uniqueByJson(observations.flatMap((observation) => Object.entries(observation.customProperties || {}).map(([name, value]) => ({ name, value })))),
      layout: rollupLayout(members),
      assets: uniqueByJson(observations.flatMap((observation) => observation.assetRefs || [])),
      actionRefs: uniqueByJson(observations.flatMap((observation) => observation.lifecycleEvents || []).map((event) => ({ type: event.type, propertyName: event.propertyName || null, animationName: event.animationName || null, elapsedTime: event.elapsedTime ?? null }))),
      audioRefs: { value: null, status: 'Unknown', reason: 'global media/audio events are not safely attributable to this component without a target link' },
      responsiveSubstitutions: { value: null, status: 'Unknown', reason: 'only the desktop forensic pass and approved mobile smoke states were sampled' },
      terminalStatuses: Object.fromEntries(members.map((member) => [member.elementId, member.terminalStatus])),
      caveat: inferredFamily ? 'Repeated-family component grouping is inferred; raw element observations remain authoritative.' : null,
    };
  });
}

export function buildSectionRollups(elementRollups, ctx, runDir) {
  const groups = new Map();
  for (const element of elementRollups) {
    const sectionRef = element.sectionRef || 'section-unknown';
    if (!groups.has(sectionRef)) groups.set(sectionRef, []);
    groups.get(sectionRef).push(element);
  }
  const dwellRows = readNdjson(join(runDir, 'telemetry', 'dwell.ndjson'));
  const cursorRows = readNdjson(join(runDir, 'telemetry', 'cursor-probes.ndjson'), projectCursorRow);
  const causalRows = readNdjson(join(runDir, 'telemetry', 'causal-deltas.ndjson'));
  const motion = stateMotion(runDir, ctx);
  return [...groups.entries()].map(([sectionRef, members], index) => {
    const observations = members.flatMap((member) => member.observations);
    const scene = (ctx.scroll.scenes || []).find((candidate) => candidate.sectionRef === sectionRef) || null;
    const relevantCursor = cursorRows.filter((row) => row.sectionRef === sectionRef);
    const relevantStopIds = new Set(relevantCursor.map((row) => row.stopId));
    const relevantDwell = dwellRows.filter((row) => relevantStopIds.has(row.stopId) || (!cursorRows.length && index === 0));
    const memberIds = new Set(members.map((member) => member.elementId));
    const observedMembers = members.filter((member) => member.observations.some((observation) => observation.status === 'Observed'));
    const sameAsMembers = members.filter((member) => member.observations.some((observation) => observation.sameAsObservationId));
    const computedColors = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'text-decoration-color', 'fill', 'stroke']
      .flatMap((name) => observations.map((observation) => observedProp(observation, name)));
    const authoredRuleRefs = new Set(observations.flatMap((observation) => observation.authoredRuleRefs || []));
    const authoredColors = (ctx.evidence.staticCssInventory || []).filter((rule) => authoredRuleRefs.has(rule.id)).flatMap((rule) => (rule.declarations || []).filter((declaration) => /(?:^|-)color$|^(?:fill|stroke)$/.test(declaration.property)).map((declaration) => declaration.value));
    return {
      id: scene?.id || `S${String(index + 1).padStart(2, '0')}`,
      sectionRef,
      status: sectionRef === 'section-unknown' ? 'Inferred' : 'Observed',
      stateRange: scene ? { startY: scene.startY, endY: scene.endY } : { value: null, status: 'Unknown', reason: 'no scroll-scene range linked' },
      viewportCoverage: { observedStateRefs: [...new Set(observations.map((observation) => observation.stateRef))], status: observations.length ? 'Observed' : 'Unknown' },
      elementCoverage: { captureable: members.length, discovered: members.length, observed: observedMembers.length, sameAs: sameAsMembers.length, skipped: members.length - observedMembers.length, observationCount: observations.length },
      layout: rollupLayout(members),
      layers: uniqueByJson(observations.map((observation) => ({ elementRef: members.find((member) => member.observations.includes(observation))?.elementId || null, position: observation.layout?.position, zIndex: observation.layout?.position?.zIndex })).filter((layer) => layer.position)),
      transitionVocabulary: rollupTransitionVocabulary(members),
      cssAnimations: uniqueByJson(observations.flatMap((observation) => observation.cssAnimations?.tracks || [])),
      typography: {
        families: distribution(observations.map((observation) => observedProp(observation, 'font-family'))),
        sizes: distribution(observations.map((observation) => observedProp(observation, 'font-size'))),
        weights: distribution(observations.map((observation) => observedProp(observation, 'font-weight'))),
        lineHeights: distribution(observations.map((observation) => observedProp(observation, 'line-height'))),
        letterSpacing: distribution(observations.map((observation) => observedProp(observation, 'letter-spacing'))),
      },
      colors: { authored: distribution(authoredColors), computed: distribution(computedColors), perceived: perceivedPaletteForFrames(runDir, scene?.keyframes || []) },
      surfaces: {
        backgrounds: distribution(observations.flatMap((observation) => ['background-color', 'background-image'].map((name) => observedProp(observation, name)))),
        shadows: distribution(observations.map((observation) => observedProp(observation, 'box-shadow'))),
        filters: distribution(observations.flatMap((observation) => ['filter', 'backdrop-filter'].map((name) => observedProp(observation, name)))),
      },
      spacing: {
        gaps: distribution(observations.flatMap((observation) => ['gap', 'row-gap', 'column-gap'].map((name) => observedProp(observation, name)))),
        margins: distribution(observations.flatMap((observation) => ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'].map((name) => observedProp(observation, name)))),
        padding: distribution(observations.flatMap((observation) => ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'].map((name) => observedProp(observation, name)))),
      },
      keyframeLinks: keyframeLinks(observations),
      keyframeRefs: [...new Set(keyframeLinks(observations).flatMap((link) => link.candidateRuleRefs || []))],
      runtimeAnimationRefs: [...new Set(observations.flatMap((observation) => observation.runtimeAnimationRefs || []))],
      gsapTweenRefs: [...new Set(observations.flatMap((observation) => observation.gsapTweenRefs || []))],
      scrollTriggerRefs: [...new Set(observations.flatMap((observation) => observation.scrollTriggerRefs || []))],
      staggerSystems: motion.stagger.filter((system) => system.value?.instances?.some((instance) => memberIds.has(instance.elementRef))).map((system) => system.id),
      transform3dChains: observations.filter((observation) => observation.transform3d?.ancestorChain?.chain?.length).map((observation) => ({ stateRef: observation.stateRef, chain: observation.transform3d.ancestorChain })),
      dwell: relevantDwell.map((row) => ({ id: row.id, label: row.autonomous?.label, sampleCount: row.samples?.length, durationMs: row.autonomous?.sampledDurationMs })),
      cursorResponses: relevantCursor.map((row) => ({ id: row.id, positions: row.positions?.map((position) => ({ name: position.name, status: position.status, causalLabel: position.causalLabel, pathSamples: position.pathSamples?.length || 0 })), restoration: row.restore?.status })),
      causalLabels: causalRows.filter((row) => relevantStopIds.has(row.stopId)).map((row) => ({ source: row.source, label: row.label, status: row.status })),
      assets: uniqueByJson(observations.flatMap((observation) => observation.assetRefs || [])),
      canvas: uniqueByJson(observations.flatMap((observation) => observation.assetRefs || []).filter((asset) => asset.kind === 'canvas-facts')),
      actionRefs: uniqueByJson(observations.flatMap((observation) => observation.lifecycleEvents || []).map((event) => ({ type: event.type, propertyName: event.propertyName || null, animationName: event.animationName || null, elapsedTime: event.elapsedTime ?? null }))),
      audioRefs: { globalObservedEventCount: ctx.audioEvents?.length || 0, status: ctx.audioEvents?.length ? 'Inferred' : 'Unknown', reason: ctx.audioEvents?.length ? 'events were observed globally but not safely attributed to this section' : 'no audio event observed in sampled states' },
      contactSheetRefs: (ctx.sheets || []).filter((sheet) => sheet.scene === scene?.id).map((sheet) => sheet.file),
      unknownLedger: [
        ...(ctx.evidence.unknowns || []),
        ...observations.filter((observation) => observation.status === 'Unknown').map((observation) => ({ field: 'element-observation', stateRef: observation.stateRef, status: 'Unknown', reason: observation.caveats?.join('; ') || 'observation unavailable' })),
      ],
    };
  });
}

export function buildSiteRollup(elementRollups, componentRollups, sectionRollups, ctx, runDir) {
  const observations = elementRollups.flatMap((element) => element.observations);
  const dwellRows = readNdjson(join(runDir, 'telemetry', 'dwell.ndjson'));
  const cursorRows = readNdjson(join(runDir, 'telemetry', 'cursor-probes.ndjson'), projectCursorRow);
  const causalRows = readNdjson(join(runDir, 'telemetry', 'causal-deltas.ndjson'));
  const motion = stateMotion(runDir, ctx);
  const causalLabels = {};
  for (const row of causalRows) causalLabels[row.label] = (causalLabels[row.label] || 0) + 1;
  const runtimeIds = new Set(motion.animations.filter((record) => record.status === 'Observed').map((record) => record.value?.id || record.id));
  const runtimeUnknown = motion.animations.filter((record) => record.status === 'Unknown').length;
  const gsapIds = new Set(motion.gsap.filter((record) => record.status === 'Observed').flatMap((record) => record.value?.children || []).map((node) => node.id).filter(Boolean));
  const triggerIds = new Set(motion.triggers.filter((record) => record.status === 'Observed').flatMap((record) => record.value?.triggers || []).map((trigger) => trigger.id).filter(Boolean));
  const coverage = {
    stylePropertyObservations: { captured: observations.filter((observation) => observation.props || observation.sameAsObservationId).length, propertySet: ctx.evidence.stylePropertySet || 'phase-b-v1' },
    transitionStates: { captured: observations.filter((observation) => observation.transitions).length },
    cssKeyframeRules: { captured: ctx.evidence.keyframes?.filter((record) => record.status === 'Observed').length || 0, unknown: ctx.evidence.keyframes?.filter((record) => record.status === 'Unknown').length || 0 },
    runtimeCssWaapiAnimations: { captured: runtimeIds.size, observations: motion.animations.length, unknown: runtimeUnknown },
    gsapTimelinesTweens: { captured: gsapIds.size, observations: motion.gsap.length, unknown: motion.gsap.filter((record) => record.status === 'Unknown').length },
    scrollTriggers: { captured: triggerIds.size, observations: motion.triggers.length, unknown: motion.triggers.filter((record) => record.status === 'Unknown').length },
    pseudoElements: { captured: motion.pseudos.length + observations.filter((observation) => observation.pseudoState).length * 2, meaningful: motion.pseudos.filter((record) => record.value?.meaningful).length, interactiveStatePairs: observations.filter((observation) => observation.pseudoState).length },
    transform3dAncestorChains: { captured: observations.filter((observation) => observation.transform3d?.ancestorChain?.chain?.length).length },
    layoutContainersItems: { captured: observations.filter((observation) => observation.layout).length },
    scrollStops: { captured: ctx.scroll.stops?.filter((stop) => stop.status === 'complete').length || 0, partial: ctx.scroll.stops?.filter((stop) => stop.status !== 'complete').length || 0 },
    stationaryDwellSeries: { sampled: dwellRows.length, frames: dwellRows.reduce((sum, row) => sum + (row.samples?.length || 0), 0) },
    cursorGridPositions: { sampled: cursorRows.reduce((sum, row) => sum + (row.positions?.length || 0), 0), pathWaypoints: cursorRows.reduce((sum, row) => sum + (row.positions || []).reduce((inner, position) => inner + (position.pathSamples?.length || 0), 0), 0) },
    interactiveTargets: { ...((ctx.scroll.interactiveCoverage) || { discovered: 0, captured: 0, skipped: 0 }) },
    causalLabels,
  };
  return {
    id: 'site-rollup', status: 'Observed',
    elementCount: elementRollups.length, componentCount: componentRollups.length, sectionCount: sectionRollups.length,
    routeStateGraph: { routesObserved: [ctx.url], statesObserved: [...new Set(observations.map((observation) => observation.stateRef))], unobservedRoutesFilledByAnalogy: false },
    transitionVocabulary: rollupTransitionVocabulary(elementRollups), layoutVocabulary: rollupLayout(elementRollups),
    animationNames: [...new Set(observations.flatMap((observation) => observation.cssAnimations?.tracks?.map((track) => track.name) || []).filter((name) => name && name !== 'none'))],
    coverage,
    unknownLedger: ctx.evidence.unknowns || [],
    caveat: 'This rollup summarizes only observed/sampled states and never fills an unobserved section by analogy.',
  };
}

export function buildRollups(runDir, ctx) {
  const elements = buildElementRollups(runDir, ctx);
  const components = buildComponentRollups(elements, ctx, runDir);
  const sections = buildSectionRollups(elements, ctx, runDir);
  const site = buildSiteRollup(elements, components, sections, ctx, runDir);
  atomicWriteJson(join(runDir, 'source-evidence', 'element-rollups.json'), elements);
  atomicWriteJson(join(runDir, 'source-evidence', 'component-rollups.json'), components);
  atomicWriteJson(join(runDir, 'source-evidence', 'section-rollups.json'), sections);
  atomicWriteJson(join(runDir, 'source-evidence', 'site-rollup.json'), site);
  return { elements, components, sections, site };
}

export function writeRecreateDraft(runDir, ctx) {
  const template = readFileSync(join(HERE, '..', 'templates', 'RECREATE.template.md'), 'utf8');
  const paletteTop = Object.entries(ctx.evidence.palette || {}).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([c, n]) => `| \`${c}\` | ${n} |`).join('\n');
  const fonts = [...new Set((ctx.evidence.loadedFonts || []).map((f) => `${f.family} ${f.weight}`))].slice(0, 12).map((f) => `- ${f}`).join('\n') || '- none observed';
  const tech = (ctx.technology.detected || []).map((t) => `- ${t.name}${t.version ? ' ' + t.version : ''} (${t.confidence}: ${t.signals.join(' + ')})`).join('\n') || '- none detected';
  const sceneRows = (ctx.scroll.scenes || []).map((s) => `| ${s.id} | ${s.startY}px - ${s.endY}px | ${(s.keyframes || []).length} keyframes |`).join('\n');
  const sheetRows = (ctx.sheets || []).map((s) => `- ${s.scene}: \`${s.file}\``).join('\n') || '- none';
  const outline = (ctx.evidence.textOutline || []).slice(0, 20).map((h) => `- [y=${h.y}] ${h.tag}: ${h.text}`).join('\n') || '- none captured';
  const gaps = ctx.gaps.map((g) => `- ${g.kind}: ${g.note}`).join('\n') || '- none recorded';
  const audioEvents = ctx.audioEvents.length ? ctx.audioEvents.slice(0, 20).map((e) => `- ${e.type} @ ${Math.round(e.t)}ms ${e.src || ''}`).join('\n') : '- no media/audio activity observed in covered states';
  const transitionRows = (ctx.rollups?.site?.transitionVocabulary || []).slice(0, 30).map((track) => `| ${track.property} | ${track.durationMs ?? 'Unknown'} ms | ${track.delayMs ?? 'Unknown'} ms | \`${track.easingToken || 'Unknown'}\` | ${track.status} |`).join('\n') || '| Unknown | Unknown | Unknown | Unknown | Unknown |';
  const rollupSummary = ctx.rollups ? `- Elements: ${ctx.rollups.elements.length} raw-linked rollups\n- Components: ${ctx.rollups.components.length} (${ctx.rollups.components.filter((item) => item.status === 'Inferred').length} inferred groupings)\n- Sections: ${ctx.rollups.sections.length}\n- Site coverage remains the vector in \`evidence.json -> rollups.site.coverage\`.` : '- Unknown: rollups were not produced';
  const walkthroughs = (ctx.walkthroughs || []).map((video) => `- ${video.kind}${video.selector ? ` \`${video.selector}\`` : ''}: \`${video.mp4}\` (30 fps; ${video.status})`).join('\n') || '- Unknown: no walkthrough deliverable was produced';
  const filled = template
    .replaceAll('{{URL}}', ctx.url).replaceAll('{{DATE}}', new Date().toISOString().slice(0, 10))
    .replaceAll('{{RUN_ID}}', ctx.runId).replaceAll('{{LEVEL}}', ctx.level).replaceAll('{{STATUS}}', ctx.status)
    .replaceAll('{{COVERAGE}}', ctx.coverageTable).replaceAll('{{SCENES}}', sceneRows || '| - | - | - |')
    .replaceAll('{{SHEETS}}', sheetRows).replaceAll('{{PALETTE}}', paletteTop || '| - | - |')
    .replaceAll('{{FONTS}}', fonts).replaceAll('{{TECH}}', tech).replaceAll('{{OUTLINE}}', outline)
    .replaceAll('{{GAPS}}', gaps).replaceAll('{{AUDIO}}', audioEvents)
    .replaceAll('{{PHASE}}', 'B').replaceAll('{{THOROUGH}}', ctx.thorough ? 'enabled' : 'disabled')
    .replaceAll('{{TRANSITIONS}}', transitionRows).replaceAll('{{ROLLUPS}}', rollupSummary)
    .replaceAll('{{WALKTHROUGHS}}', walkthroughs);
  const path = join(runDir, 'RECREATE.md');
  writeFileSync(path, redactSecrets(filled));
  return path;
}

const collectTextEvidenceFiles = (root) => {
  const out = [];
  const visit = (directory) => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { visit(path); continue; }
      if (entry.isFile() && /(?:\.json|\.ndjson|\.md|\.txt|\.css|\.html|\.svg|\.xml|\.csv|\.log)$/i.test(entry.name)) out.push(path);
    }
  };
  visit(root);
  return out;
};

const parseJson = (path) => {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
};

export function verify(runDir, ctx) {
  const checks = [];
  const add = (name, pass, note = '') => checks.push({ name, pass, note });
  const framesOk = (ctx.scroll.frames || []).filter((f) => f.keyframe && !f.blank);
  add('main-document-visual-evidence', framesOk.length > 0, `${framesOk.length} non-blank keyframes`);
  add('every-scene-has-keyframe', (ctx.scroll.scenes || []).every((s) => (s.keyframes || []).length > 0 || s.note), '');
  add('scroll-ordered-or-flagged', ctx.scroll.moved || ctx.scroll.shortPage || (ctx.gaps || []).some((g) => g.kind === 'scroll-hijack'), ctx.scroll.shortPage ? 'page fits in ~one viewport; nothing to scroll' : '');
  add('stylesheets-or-canvas-exception', (ctx.evidence.stylesheets || []).length > 0 || ctx.technology.canvasCount > 0, '');
  add('frame-files-exist', (ctx.scroll.frames || []).filter((f) => f.keyframe).every((f) => existsSync(join(runDir, f.keyframe))), '');
  add('phase-b-evidence-collections', ['style-states.ndjson', 'transition-states.ndjson', 'animation-states.ndjson', 'keyframes.json', 'transition-inventory.json', 'animation-inventory.json', 'pseudo-states.ndjson', 'stagger-systems.json', 'stagger-states.ndjson', 'interactive-states.ndjson', 'gsap.ndjson', 'scroll-triggers.ndjson', 'section-rollups.json'].every((file) => existsSync(join(runDir, 'source-evidence', file))), '');
  // A deadline-degraded partial that names its reason and caveat is the graceful-degradation
  // contract working, not a wiring failure; only a missing/unlabelled video stays red.
  const walkthroughOk = (video) => video.mp4 && video.frameRate === 30 && existsSync(join(runDir, video.mp4)) && (video.status === 'Observed' || (video.terminalReason === 'walkthrough-deadline' && video.caveat));
  add('human-walkthrough-30fps', (ctx.walkthroughs || []).some((video) => video.kind === 'full-site' && walkthroughOk(video)), (ctx.walkthroughs || []).some((video) => video.kind === 'full-site' && video.status === 'Observed') ? '' : 'deadline-degraded partial accepted with recorded caveat');
  const requestedComponents = ctx.requestedComponents || [];
  add('component-target-screenshots', requestedComponents.every((selector) => (ctx.components || []).some((component) => component.selector === selector && component.frame && existsSync(join(runDir, component.frame)))), `${requestedComponents.length} requested`);
  add('component-walkthroughs', requestedComponents.every((selector) => (ctx.walkthroughs || []).some((video) => video.selector === selector && walkthroughOk(video))), `${requestedComponents.length} requested`);
  if (ctx.thorough) {
    const completeStops = (ctx.scroll.stops || []).filter((stop) => stop.status === 'complete');
    add('thorough-has-complete-stop', completeStops.length > 0, `${completeStops.length} complete`);
    add('thorough-atomic-stop-contract', completeStops.every((stop) => stop.phases?.settle?.status && stop.phases?.dwell?.sampleCount === 6 && stop.phases?.interactiveTargets?.status === 'complete' && stop.phases?.cursor?.terminalCount === 5 && stop.phases?.restore?.status && stop.phases?.deepSnapshot?.status === 'complete'), 'settle + six dwell + interactive terminal records + five cursor terminals + restore + deep snapshot');
    add('thorough-stop-files-exist', completeStops.every((stop) => existsSync(join(runDir, 'frames', 'desktop', 'scroll', stop.id, 'stop.json'))), '');
    add('refinement-effective-band', completeStops.filter((stop) => stop.kind === 'forensic-refinement').every((stop) => stop.phases?.movement?.travelCssPx >= 4 && stop.phases?.movement?.travelCssPx <= 12), 'complete forensic refinement stops remain inside 4–12px observed travel');
    add('cap-skips-name-remaining-range', ctx.scroll.termination?.status !== 'cap-skipped' || (ctx.scroll.remainingStoryRange?.status === 'Unknown' && ctx.scroll.remainingStoryRange.reason), ctx.scroll.termination?.reason || 'not cap-stopped');
    const dwellRows = readNdjson(join(runDir, 'telemetry', 'dwell.ndjson'));
    const cursorRows = readNdjson(join(runDir, 'telemetry', 'cursor-probes.ndjson'), projectCursorRow);
    const dwellStopIds = new Set(dwellRows.map((row) => row.stopId));
    const cursorStopIds = new Set(cursorRows.map((row) => row.stopId));
    add('complete-stops-have-raw-dwell-records', completeStops.every((stop) => dwellStopIds.has(stop.id)), `${dwellStopIds.size} stop records`);
    add('complete-stops-have-raw-cursor-records', completeStops.every((stop) => cursorStopIds.has(stop.id)), `${cursorStopIds.size} stop records`);
    add('cursor-path-frame-and-readable-data', cursorRows.every((row) => (row.positions || []).every((position) => {
      if (position.status !== 'captured') return true;
      const expected = position.pathSampling === 'continuous-nine-waypoint' ? 9 : 1;
      return position.pathSamples?.length === expected && position.pathSamples.every((sample) => sample.frameRef && sample.frameHash && sample.readableData && sample.canvasReaction);
    })), 'nine samples per normal move; one only when explicitly cap-degraded');
  }
  const ledger = join(runDir, 'network', 'responses.ndjson');
  // fails closed: a missing ledger means attachNetwork never fired, which is a wiring bug
  add('network-ledger-exists-and-parseable', existsSync(ledger) && ndjsonParseable(ledger), '');
  const allTextFiles = collectTextEvidenceFiles(runDir);
  const ndjsonFiles = allTextFiles.filter((file) => file.endsWith('.ndjson'));
  const jsonFiles = allTextFiles.filter((file) => file.endsWith('.json') && !file.endsWith('verification.json'));
  add('all-ndjson-parseable', ndjsonFiles.every((file) => ndjsonParseable(file)), `${ndjsonFiles.length} ledgers`);
  add('all-json-parseable', jsonFiles.every((file) => parseJson(file) != null), `${jsonFiles.length} documents`);
  const secretRe = /(authorization:|set-cookie:|bearer\s+[a-z0-9._~+/=-]{16,}|https?:\/\/[^\s/@:]+:[^\s/@]+@|(?:[?&](?:sig|signature|token|api[_-]?key|auth|session|password|secret|credential|x-amz-[^=]*)=)(?!REDACTED(?:[&#\s]|$))[^&#\s"']+|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password|passwd)["']?\s*[:=]\s*["']?[a-z0-9._~+/-]{12,})/i;
  const scanFiles = allTextFiles;
  add('no-secret-patterns-on-disk', scanFiles.every((file) => !fileContainsPattern(file, secretRe)), `${scanFiles.length} text evidence files scanned recursively`);
  const cleanupPath = join(runDir, 'logs', 'cleanup.json');
  const cleanup = existsSync(cleanupPath) ? parseJson(cleanupPath) : null;
  add('zero-run-owned-process-survivors', cleanup?.survivors?.length === 0 && ctx.cleanup?.zeroSurvivors === true, cleanup ? `${cleanup.survivors.length} survivors` : 'cleanup audit missing');

  const referencedFiles = [
    ...(ctx.scroll.frames || []).map((frame) => frame.keyframe),
    ...(ctx.scroll.scenes || []).flatMap((scene) => scene.keyframes || []),
    ...(ctx.components || []).map((component) => component.frame),
    ...(ctx.walkthroughs || []).flatMap((video) => [video.rawWebm, video.mp4]),
    ...(ctx.sheets || []).map((sheet) => sheet.file),
    ...(ctx.scroll.stops || []).flatMap((stop) => [stop.phases?.preStep?.frameRef, stop.phases?.restore?.frameRef]),
    ...readNdjson(join(runDir, 'telemetry', 'dwell.ndjson')).flatMap((row) => (row.samples || []).map((sample) => sample.frameRef)),
    ...readNdjson(join(runDir, 'telemetry', 'cursor-probes.ndjson'), projectCursorRow).flatMap((row) => [row.restore?.frameRef, ...(row.positions || []).flatMap((position) => [position.baselineFrameRef, position.targetBaselineFrameRef, position.settledFrameRef, position.targetSettledFrameRef, ...(position.pathSamples || []).map((sample) => sample.frameRef)])]),
    ...readNdjson(join(runDir, 'source-evidence', 'interactive-states.ndjson')).flatMap((row) => [row.phases?.base?.frameRef, row.phases?.hover?.immediateFrame?.frameRef, row.phases?.hover?.settledFrame?.frameRef, row.phases?.restored?.frameRef]),
  ].filter(Boolean);
  add('all-file-evidence-refs-resolve', referencedFiles.every((path) => existsSync(join(runDir, path))), `${referencedFiles.length} refs checked`);
  const assetRows = readNdjson(join(runDir, 'assets', 'index.ndjson'));
  add('saved-asset-refs-resolve', assetRows.filter((row) => row.file).every((row) => existsSync(join(runDir, row.file))), `${assetRows.filter((row) => row.file).length} saved assets`);
  add('report-exists', existsSync(join(runDir, 'RECREATE.md')), '');
  const result = { t: new Date().toISOString(), pass: checks.every((c) => c.pass), checks };
  atomicWriteJson(join(runDir, 'verification.json'), result);
  return result;
}

export function writeEvidenceIndex(runDir, ctx) {
  atomicWriteJson(join(runDir, 'evidence.json'), {
    run: { id: ctx.runId, url: ctx.url, date: new Date().toISOString(), level: ctx.level, thorough: !!ctx.thorough, status: ctx.status, phase: 'B', schemaVersion: 'phase-b-v1', stylePropertySet: ctx.evidence.stylePropertySet || 'phase-b-v1', skillVersion: '0.2.0' },
    environment: ctx.environment, coverage: ctx.coverage,
    scenes: ctx.scroll.scenes, frames: ctx.scroll.frames, adaptiveRefinement: ctx.scroll.boundaries || [], contactSheets: ctx.sheets,
    styles: { tokens: ctx.evidence.tokens, stylesheets: ctx.evidence.stylesheets, fontFaces: ctx.evidence.fontFaces?.length, computedSamples: ctx.evidence.computed?.length },
    typography: ctx.evidence.loadedFonts, palettes: ctx.evidence.palette, animations: ctx.evidence.animations,
    motionEvidence: {
      transitionInventory: { file: 'source-evidence/transition-inventory.json', perStateFile: 'source-evidence/transition-states.ndjson', count: ctx.evidence.transitionInventory?.length || 0, status: 'Observed' },
      keyframes: { file: 'source-evidence/keyframes.json', count: ctx.evidence.keyframes?.length || 0, names: [...new Set((ctx.evidence.keyframes || []).map((record) => record.value?.name).filter(Boolean))] },
      runtimeAnimations: { file: 'source-evidence/animation-inventory.json', perStateFile: 'source-evidence/animation-states.ndjson', count: ctx.evidence.runtimeAnimations?.length || 0 },
      pseudos: { file: 'source-evidence/pseudo-states.ndjson', count: ctx.evidence.pseudoStates?.length || 0 },
      staggerSystems: { file: 'source-evidence/stagger-systems.json', perStateFile: 'source-evidence/stagger-states.ndjson', count: ctx.evidence.staggerSystems?.length || 0 },
      interactiveStateSeries: { file: 'source-evidence/interactive-states.ndjson', coverage: ctx.scroll.interactiveCoverage || { discovered: 0, captured: 0, skipped: 0 }, status: ctx.thorough ? 'Observed' : 'Unknown', caveat: ctx.thorough ? null : 'interactive state timelines require --thorough' },
      gsap: { file: 'source-evidence/gsap.ndjson', status: ctx.evidence.gsap?.status || 'Unknown' },
      scrollTriggers: { file: 'source-evidence/scroll-triggers.ndjson', status: ctx.evidence.scrollTriggers?.status || 'Unknown' },
      lifecycleEvents: { file: 'source-evidence/motion-events.ndjson', count: ctx.motionEvents?.length || 0, status: ctx.motionEvents?.length ? 'Observed' : 'Unknown', caveat: ctx.motionEvents?.length ? null : 'no transition/animation lifecycle event fired during covered states' },
    },
    behaviorEvidence: {
      atomicScrollStops: { file: 'telemetry/scroll.ndjson', count: ctx.scroll.stops?.length || 0, status: ctx.thorough ? 'Observed' : 'Unknown', caveat: ctx.thorough ? null : 'atomic stop records require --thorough' },
      stationaryDwell: { file: 'telemetry/dwell.ndjson', series: ctx.rollups?.site?.coverage?.stationaryDwellSeries || { sampled: 0, frames: 0 }, status: ctx.thorough ? 'Observed' : 'Unknown' },
      cursorPaths: { file: 'telemetry/cursor-probes.ndjson', samples: ctx.rollups?.site?.coverage?.cursorGridPositions || { sampled: 0, pathWaypoints: 0 }, status: ctx.thorough ? 'Observed' : 'Unknown' },
      causalDeltas: { file: 'telemetry/causal-deltas.ndjson', labels: ctx.rollups?.site?.coverage?.causalLabels || {}, status: ctx.thorough ? 'Observed' : 'Unknown' },
      adaptiveRefinement: { boundaries: ctx.scroll.boundaries || [], status: ctx.thorough ? 'Observed' : 'Unknown' },
    },
    hoverSelectorsFound: ctx.evidence.hoverSelectors, listenerCounts: ctx.evidence.listenerCounts,
    technology: ctx.technology, audioEvents: ctx.audioEvents.length, motionEvents: ctx.motionEvents?.length || 0, gaps: ctx.gaps, mobileSmoke: ctx.mobileShots,
    requestedComponents: ctx.requestedComponents || [], components: ctx.components || [], walkthroughs: ctx.walkthroughs || [],
    rollups: ctx.rollups ? {
      elements: { count: ctx.rollups.elements.length, file: 'source-evidence/element-rollups.json', timingAttachedPerElement: true },
      components: { count: ctx.rollups.components.length, file: 'source-evidence/component-rollups.json' },
      sections: { count: ctx.rollups.sections.length, file: 'source-evidence/section-rollups.json' },
      site: ctx.rollups.site,
    } : { status: 'Unknown', reason: 'rollups not built' },
    unknownLedger: ctx.evidence.unknowns || [],
  });
}
