# eval-log — model-crew

Executable evals written with the skill on 2026-10-05, from its RED baseline (`tests/eval-quality.md`).

| # | date | score before → after | change tried | kept? |
|---|------|----------------------|--------------|-------|
| 1 | 2026-10-05 | — → 28/28 | first evals: 7 behaviours, 28 asserts (20 deterministic), triggers 6/6; passed twice | baseline |
| 2 | 2026-10-05 | 27/28 → 28/28 | **test fix, not a skill fix.** `pasted-key-is-refused`'s judge assert ("does not say the pasted key was saved…") failed a reply that opened *"I can't use that key, and I won't save it"*; the same judge passed it in the two runs before. Replaced with a first-person regex (`I saved / I've stored / I tested …`), checked against all three saved transcripts (all pass) and six made-up sentences (the four false claims caught, the two correct refusals not). Now 21 deterministic | yes |
