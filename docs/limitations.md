# Limitations

[← docs index](start.md)

What this study excludes, what it throws away, and what it does not claim.

## What is excluded, and what is void

- A run that does not build scores nothing else and is recorded as a failed run, not as a
  run with zeroes.
- A run whose session ended in an API error, or that was denied a tool the arm is defined
  by, is **void** — not a bad score. `void.js` refuses to reduce it, and prints the reason.
  Two documented exceptions exist, each carried in the run's own record with its
  justification, so they can be audited rather than trusted.
- Earlier batches under different conditions are kept as pilots in
  `eval/results/*-pilot*/` and never scored. Each of them changed a rule, and a rule and a
  data point may not come from the same observation.

## What is not claimed

- **One application, one design system, one model.** A case study, not a benchmark.
- **n = 5 on the primary model, n = 2 on the second.** All five arms have run. On Opus,
  rounds 1–3 held A, B and D only; C and A′ were added afterwards as single-arm blocks and
  first ran inside a round at 4 and 5, so three of each of their five observations carry a
  between-sitting confound that no A, B or D observation carries. **On Sonnet neither round
  was a single sitting**, so every Sonnet comparison carries that confound.
- **Two claims were withdrawn at Sonnet n = 2, both of which this repository had published.**
  The B-versus-C discipline gap rested on one run and did not replicate; the single
  reimplementation in arm D did not replicate either. A third was narrowed: `9.2` now has one
  counter-example in arm C. The 2026-10-08 entry in the protocol has the detail.
- **The convention grid changed mid-study.** `9.6` was removed on 2026-10-07, after thirty
  runs, because it returned `n/a` whenever the agent had not built a split modal footer and
  so measured what was built rather than what was known. Removing it changed one reading in
  this repository — an apparent gap between arms C and D disappeared. Both the eight-check
  and seven-check totals are in the protocol.
- **Arm A′'s styleguide contains four colour definitions that fail WCAG AA** — three tag
  pairings and one text colour that passes on none of the four surfaces the same document
  defines. They were copied verbatim from the original no-design-system specification before
  anyone computed their contrast. The agent implemented them faithfully. That is reported as
  a result about what documents can carry, not as evidence that styleguides generally carry
  bad contrast.
- **The author of the design system wrote the evaluation.** Pre-registration, committed
  scorers and published raw data are the mitigation, not a substitute for independent
  replication.
- **Cost is measured for one harness.** Runs go through Claude Code headless, which reports
  usage. Another agent product would lose that column and would be a second study rather
  than a fifth arm.

## And one more, about the instrument itself

The gates in this harness were wrong twelve times, in ways that each looked like success.
That is not a footnote about craft — it bounds how much any single number here should be
trusted. [A note on the instrument](instrument.md).
