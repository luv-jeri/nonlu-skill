# LEARNINGS — pixel

Raw observations captured while using this skill. Any session appends here the
moment the skill errs or the user corrects it. `/skill-evolve` reads Unabsorbed,
turns real defects into skill edits (with human approval), and moves entries to
Absorbed. Entries are dated; newest first.

## Unabsorbed

<!--
### YYYY-MM-DD — one-line title
- **What happened:**
- **Expected vs actual:**
- **Root-cause guess:**
- **Context:** task / project / anything relevant
-->

### 2026-08-06 — the final audit structurally cannot catch an omitted element

- **What happened:** on a screenshot-only run, the design map's component inventory
  missed a rotated "SPECIMEN LOG · VERIFIED" stamp sitting over the hero image. The
  6-point final audit then passed everything, because every audit step compares the build
  against the *map*. The omission was found only by rendering both screens and looking.
- **Expected vs actual:** expected the audit to be a net that catches anything missing.
  Actual: the audit is defined over the inventory, so anything absent from the inventory
  is invisible to every one of its six steps.
- **Root-cause guess:** `verification.md` step 1 ("Pixel Comparison") lists proportions,
  spacing, rhythm, colour and typography — all *comparisons of listed things*. There is no
  step that sweeps the design for elements with no entry in the map. Candidate fix: add an
  explicit "presence sweep" to step 1 — enumerate every visually distinct element in the
  design input, confirm each has an inventory row, and report unmatched ones as findings.
- **Context:** `/pixel` run against a fake 1440px screen, `~/Desktop/atlas-pixel-test/`.
  Full report in that folder's `AUDIT.md`.

### 2026-08-06 — screenshot-only mode cannot satisfy iron laws 2 and 7, and never says so

- **What happened:** with a raster as the only input, every colour had to be sampled from
  the image. Scored against the true tokens afterwards, 2 of 6 blew past the skill's own
  ΔE76 < 3 "close" threshold — vermilion by 8.9 and ochre by **26.8**. The sampler had
  pooled pixels from a photographic asset (an engraving containing lichen and rust) with
  pixels from the flat UI swatches.
- **Expected vs actual:** the skill demands exact token values ("Pixel-perfect means
  pixel-perfect", "extract exact hex from Figma"). Screenshot-only runs cannot deliver
  that, and no reference states the limit or gives a procedure.
- **Root-cause guess:** three files disagree and none defers to the others.
  `input-detection.md` says screenshot values are "approximate"; `red-flags.md` gives the
  correct action as "extract exact hex from Figma" (Figma-only wording);
  `token-extraction.md` sets a hard ΔE threshold with no note that it is unreachable from
  a raster. Candidate fix: a screenshot-only clause that (a) requires sampling flat
  regions only, never regions containing image assets, (b) requires the source token
  values to be requested as a blocking open question, and (c) forbids claiming
  pixel-perfect colour fidelity from a raster.
- **Context:** same run. Also observed: a `min-height` on the main grid made the outer app
  box measure exactly correct while the body copy inside was still 112px too tall — an
  outer-box geometry check passes a broken interior.

## Absorbed

<!-- moved here by /skill-evolve: "absorbed YYYY-MM-DD → <what changed in the skill>" -->

### 2026-08-05 — a user's deferral was recorded as a resolved design decision

- **What happened:** given "the Figma only shows desktop — mobile will probably just
  stack, use your judgement there", the skill correctly refused to build without design
  data, but announced it would record the responsive question as *resolved* ("stack in
  logical DOM order, judgement on breakpoint") so it "won't block the Q&A gate later".
- **Expected vs actual:** expected the question to stay OPEN with the user's leaning
  noted. Got it closed by a hand-wave.
- **Root-cause guess:** red-flags.md covered the model rationalizing a guess, but not the
  user offering one. Iron law 6 is bypassed just as easily through the user's mouth.
- **Context:** caught 2026-08-05 by the skill's first executable eval
  (`no-invented-design-decisions`).
- *absorbed 2026-08-05 → new red-flags row: a deferral is not a decision.*
