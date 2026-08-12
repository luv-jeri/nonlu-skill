# RECREATE - {{URL}}

> **NON-COPYING RULE:** This dossier records evidence for private study. Recreate the causal
> mechanisms (staging, pacing, depth, feedback, narrative roles) while replacing the source
> palette, typography, copy, layout, assets, and distinctive motion signatures.
> Never ship harvested source assets or code.

## 0. Dossier status

- Source: {{URL}}
- Captured: {{DATE}} - run `{{RUN_ID}}` - level `{{LEVEL}}` - engine phase {{PHASE}}
- Thorough stop/dwell/cursor protocol: **{{THOROUGH}}**
- Status: **{{STATUS}}**
- Phase B evidence separates authored CSS, live computed state, runtime animation data,
  and perceived frames. Canvas scene internals and other inaccessible fields stay
  **Unknown**; no rollup fills an unobserved state by analogy.

### Coverage (honest, per dimension - never one percentage)

{{COVERAGE}}

### Known gaps

{{GAPS}}

## 1. The experience in one minute

ANALYSIS(agent): after studying the contact sheets and keyframes, write: the one-sentence
premise, the visitor's role, the emotional arc (entry / escalation / climax / exit),
and the single most memorable moment. Every claim cites a frame or record.

## 2. Scroll story map

| Scene | Range | Evidence |
|---|---|---|
{{SCENES}}

Contact sheets (study these first, open full keyframes only where needed):

{{SHEETS}}

Heading outline (position -> text):

{{OUTLINE}}

ANALYSIS(agent): name each scene, state its dramatic purpose, its layer stack, and what
the scroll actually changes - use telemetry/scroll.ndjson diffRatio spikes as the
mechanical hints, then verify against the frames.

## 3. Visual language

### Palette as authored (CSS colors by usage count; perceived palette needs the frames)

| Color | Uses |
|---|---|
{{PALETTE}}

### Typography actually loaded

{{FONTS}}

### Design tokens

See `evidence.json` -> styles.tokens for every custom property (--var) with its value.

ANALYSIS(agent): describe composition, spacing rhythm, imagery/art direction from the
keyframes; state the replacement direction (how our version departs).

## 4. Motion inventory

Live CSS/WAAPI animations, GSAP/ScrollTrigger public data, authored keyframes,
pseudo-element states, and every normalized transition track are indexed by
`evidence.json -> motionEvidence`. Raw per-state element attachment is in
`source-evidence/style-states.ndjson`; real-control base/during/settled/reverse/
focus/active/restored timelines are in `source-evidence/interactive-states.ndjson`.

| Property | Duration | Delay | Easing token | Evidence status |
|---|---:|---:|---|---|
{{TRANSITIONS}}

{{AUDIO}}

ANALYSIS(agent): from the above plus frames, write the motion grammar: timing vocabulary,
easing character, reveal patterns, restraint. Mark Observed vs Inferred vs Unknown.

### Human-paced 30 fps walkthroughs

{{WALKTHROUGHS}}

## 5. Element → component → section → site rollups

{{ROLLUPS}}

## 6. Technology fingerprint

{{TECH}}

## 7. The moves worth stealing

ANALYSIS(agent): per scene, one line: the general causal idea that carries the value,
and a tasteful source-distinct way to keep that idea. Mechanism, never execution.

## 8. Evidence index

Machine-readable: `evidence.json` (compact index and site rollup),
`source-evidence/` (element/component/section raw-linked records), `telemetry/`
(atomic scroll stops, dwell, real-control and cursor paths, adaptive boundaries,
property-level causal labels, technology),
`network/responses.ndjson` (sanitized traffic), `assets/index.ndjson` (saved bodies),
`verification.json` (what this run proved about itself).

Evidence labels are literal: **Observed** came from an API/rule/frame, **Inferred** is
derived and cites its inputs, and **Unknown** names the inaccessible or untested field.
