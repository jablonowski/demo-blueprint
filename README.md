# Does a design system change what a coding agent writes?

A pre-registered experiment. One specification, one application, several levels of
infrastructure, and a set of committed scorers that reduce every run the same way.

The design system under test is [**design-system-blueprint**](https://github.com/jablonowski/design-system-blueprint) —
a three-tier token pipeline, an Angular component library, machine-readable contracts for
agents, and npm publishing.

> **Status: the study is still running.** 

---

## Raw results

Claude Opus (`claude-opus-5-5`), three runs per arm, one sitting per round, identical
specification and identical design data in every run.

Per-run records: [`eval/results/opus-5-5/`](eval/results/opus-5-5) — one `<arm>-<n>.json`
with the harness record and one `<arm>-<n>.score.json` with every metric and its detail.
The generated applications are in [`eval/runs/opus-5-5/`](eval/runs/opus-5-5).

| Metric | A-1 | A-2 | A-3 | B-1 | B-2 | B-3 | D-1 | D-2 | D-3 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Library components used (of 13) | 0 | 0 | 0 | 13 | 13 | 13 | 13 | 13 | 13 |
| Components hand-reimplemented | 13 | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| Scattered raw values | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 |
| Custom properties declared locally | 90 | 99 | 91 | 0 | 0 | 0 | 0 | 0 | 2 |
| Tier boundary crossings | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Design-system decision tokens used | 0 | 0 | 0 | 60 | 57 | 60 | 77 | 56 | 59 |
| Hallucinated API references | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Convention checks passed (of 8) | n/a | n/a | n/a | 6 | 8 | 7 | 7 | 8 | 8 |
| Colour conformance rate | 0.91 | 0.85 | 0.79 | n/a | n/a | n/a | n/a | n/a | n/a |
| Near-miss values | 2 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| axe violations — serious | 3 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| axe violations — critical | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Builds | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| Cost (USD) | 2.06 | 2.54 | 2.17 | 3.20 | 3.19 | 2.82 | 3.15 | 2.88 | 2.86 |

Which convention checks failed, run by run:

| | B-1 | B-2 | B-3 | D-1 | D-2 | D-3 |
|---|---|---|---|---|---|---|
| 9.2 `#cell` + `let-row="row"` | fail | pass | fail | pass | pass | pass |
| 9.6 split modal footer | not built | pass | pass | not built | pass | pass |
| all other checks | pass | pass | pass | pass | pass | pass |

`n/a` is not a pass. The eight checks are all about the component library's API, so they do
not apply to an arm that has no library; the colour conformance rate is `n/a` for arms that
authored no values of their own.

### Screenshots

Every run's screens as the harness rendered them, at 1280px and 390px:
[`eval/runs/opus-5-5/<arm>-<n>/shots/`](eval/runs/opus-5-5). Login, dashboard and users
table for each run, captured in the same pass that runs axe.

---

## What the columns mean

| Column | What it counts | Scorer |
|---|---|---|
| **Library components used** | Of thirteen pre-registered places in the spec where a library component has a natural home — login fields, submit, header, footer, avatars, the table, badges, modals, the role selector — how many were filled with one. Templates are parsed, not grepped: Angular writes attributes across lines and a pattern expecting a space after the selector misses them. | [`slots.js`](eval/scorers/slots.js) |
| **Hand-reimplemented** | Of those same thirteen, how many were built by hand instead. This carries the falsifier. | [`slots.js`](eval/scorers/slots.js) |
| **Scattered raw values** | Hex, `rgb()` or `px`/`rem` literals used directly in a declaration, in CSS the application authored. `0` and `1px` hairlines excluded. | [`raw-values.js`](eval/scorers/raw-values.js) |
| **Custom properties declared locally** | The same kinds of literal, but as the value of a custom property — a local token layer. Counted apart from scattered values because naming a gap and bypassing the system are opposite behaviours. | [`raw-values.js`](eval/scorers/raw-values.js) |
| **Tier boundary crossings** | `var(--ds-*)` in application code that is neither absent nor a tier-2 decision: the raw palette reached directly, or another component's private tokens. | [`tiers.js`](eval/scorers/tiers.js) |
| **Decision tokens used** | How many distinct `--ds-decisions-*` tokens the application actually referenced. | [`tiers.js`](eval/scorers/tiers.js) |
| **Hallucinated API references** | Bound inputs and outputs that do not exist on the component, and imported names the package does not export. Native DOM events and valid type imports are not counted — an earlier version reported nineteen of those and every one was invented by the scorer. | [`api.js`](eval/scorers/api.js) |
| **Convention checks** | Eight conventions removed from the specification, each a place where the machine-readable layer is known to be thin. Import names carry no `Dsb` prefix; `dsb-column` needs `#cell` and `let-row="row"`; nothing projects into `dsb-header`; `FooterColumn.heading` not `.title`; and so on. | [`checks.js`](eval/scorers/checks.js) |
| **Colour conformance rate** | Of the colours the application chose for itself, the fraction that are values the design system actually holds, compared against a committed snapshot of the published token package. | [`conformance.js`](eval/scorers/conformance.js) |
| **Near-miss values** | Authored values with no exact match in the design system but one within tolerance — 24 units of sRGB distance, or 2px. Reported separately because they are the expensive class: indistinguishable on screen, and they will not move when the system moves. | [`conformance.js`](eval/scorers/conformance.js) |
| **axe violations** | WCAG 2.1 A and AA over the built screens, by impact, in a headless browser. | [`a11y.js`](eval/scorers/a11y.js) |
| **Builds** | Binary. A run that does not build scores nothing else. | [`build.js`](eval/scorers/build.js) |

Each judgement baked into these — the tolerances, the thirteen slots, the exclusions, and
what each one would fail to notice — is written out in [`eval/SCORERS.md`](eval/SCORERS.md).

---

## Method

### The arms

Every run is one specification plus one overlay, handed to a fresh session in an empty
directory outside any repository. The specification is byte-identical across arms. Only the
overlay differs.

| Arm | What the agent has | In the grid |
|---|---|---|
| **A** | the specification and the design frames, nothing else | yes |
| **A′** | plus a styleguide document — palette, scale, component CSS, as prose | not yet run |
| **B** | plus the two npm packages installed; READMEs and type declarations readable | yes |
| **C** | plus `llms.client.txt`, the guide written for agents | not yet run |
| **D** | plus the token resolver, connected as an MCP server | yes |

A, B and D form a cumulative ladder with nothing skipped, which is what makes the two gaps
readable: **A→B** isolates shipping the system as an installable package, **B→D** isolates
the agent-facing layer on top of it.

Three arms rather than five because five runs do not fit inside one usage window, and a
round split across windows reintroduces the confound that running in rounds exists to
remove. What dropping A′ and C costs the grid — and the condition under which C stops being
optional — is stated in [`eval/PROTOCOL.md`](eval/PROTOCOL.md).

**Arm B required a deletion.** The published `@jablonowski/dsb-components` ships
`llms.client.txt` inside the tarball and its README points at it, so "the package without
the agent-facing contract" does not exist in the wild for this design system. The harness
removes that one file after install and asserts its absence before and after the run.

### The specification

[`eval/S0.md`](eval/S0.md) describes a small CRUD application: login, a metrics dashboard, a
users table, four dialogs. It names **zero component names and zero design values**. If it
said `<dsb-button>` or `#111111`, every arm would be handed the answer to what is being
measured.

### The design source

The Figma file, served through a **recorded** channel
([`eval/scripts/figma-cache-mcp.js`](eval/scripts/figma-cache-mcp.js)). The recording
replays the real Figma MCP server under the same tool names and input schemas, so an arm
calls `get_figma_data` exactly as it would live.

Two reasons. Every arm then receives byte-identical design data, in every round — five live
fetches are five slightly different conditions. And one arm's run empties the Figma API
quota for days, which makes a live channel unaffordable for a grid: in the round that
established this, arm A ran with design data and the rest got `429, retry after 4.6 days`.

The recording is pruned to the frames the specification names. The full file also carries
the design system's own component library as a canvas, and serving that would hand arm A
the thing arm A is defined by not having.

### Rounds

A round is run *n* of every arm, back to back in one sitting. Running a whole arm at a time
would make the arm and the day the same variable: if A runs on Tuesday and D on Friday and
the served model changes on Wednesday, nothing in the results separates the two. The cost is
that runs *within* an arm spread over days, which shows up as variance — the cheaper
confound, because the table reports variance and does not report drift.

### Pre-registration

[`eval/PROTOCOL.md`](eval/PROTOCOL.md) carries the predictions, recorded before the runs,
and a falsifier stated in advance:

> If arm D hand-implements more than one of the components the library already provides,
> the machine-readable layer is not worth building.

It records the predictions that failed as prominently as the ones that held, every decision
that changed the design mid-study and why, and every run that was discarded.

### What is excluded, and what is void

- A run that does not build scores nothing else and is recorded as a failed run, not as a
  run with zeroes.
- A run whose session ended in an API error, or that was denied a tool the arm is defined
  by, is **void** — not a bad score. `void.js` refuses to reduce it, and prints the reason.
  Two documented exceptions exist, each carried in the run's own record with its
  justification, so they can be audited rather than trusted.
- Earlier batches under different conditions are kept as pilots in
  `eval/results/*-pilot*/` and never scored. Each of them changed a rule, and a rule and a
  data point may not come from the same observation.

### What is not claimed

- **One application, one design system, one model.** A case study, not a benchmark.
- **n = 3 of a planned 5**, and two arms of five have not run.
- **The author of the design system wrote the evaluation.** Pre-registration, committed
  scorers and published raw data are the mitigation, not a substitute for independent
  replication.
- **Cost is measured for one harness.** Runs go through Claude Code headless, which reports
  usage. Another agent product would lose that column and would be a second study rather
  than a fifth arm.

---

## A note on the instrument

Seven times during this work a gate reported success while proving a different proposition
than the one it was written for. A visual-regression flag that disarmed the comparison it
gated. A published stylesheet that passed every test and could not render the library it
belonged to. A preflight check asserting that an API token was *present* rather than that it
*worked*, which let eight runs go out blind. A scorer that reduced a run aborted mid-session
to a row indistinguishable from an arm performing badly.

Each one was green. Each is recorded in [`eval/PROTOCOL.md`](eval/PROTOCOL.md) with what it
cost and what replaced it — not as an aside, but because an evaluation is only worth the
property its gates actually test.

---

## Running it

```bash
cd eval
npm install
./run.sh preflight        # credentials, flags, and the recorded design channel
./run.sh round 1          # run 1 of every arm, in one sitting
node score.js --all       # reduce every archived run to a row
```

| Command | |
|---|---|
| `./run.sh <arm> <n>` | a single run |
| `./run.sh remeasure <arm> <n>` | re-score and re-archive a run still on disk, without regenerating it |
| `./run.sh serve <arm> <n>` | install and open a generated application |
| `./run.sh import <arm> <n> <dir>` | score a run produced by a different agent, through the identical scorers |
| `./run.sh status` | what has been run so far |

Requires a Claude Code credential. The design channel is a committed recording, so no Figma
token is needed to run the experiment — only to re-record it.

---

## Repository layout

```
eval/
  S0.md            the shared specification, identical in every arm
  arms/            one overlay per arm — the only thing that differs between them
  PROTOCOL.md      pre-registration, predictions, failures, decisions, and why
  SCORERS.md       what each metric means and the judgements baked into it
  scorers/         the scripts that produce every number, with their tests
  reference/       the token snapshot and the recorded design channel
  results/         one record and one scored row per run
  runs/            the application each arm generated, and its screenshots
  run.sh           the harness
```

## Related

- [**design-system-blueprint**](https://github.com/jablonowski/design-system-blueprint) —
  the design system under test.
- `@jablonowski/dsb-tokens`, `@jablonowski/dsb-components`, `@jablonowski/dsb-tokens-mcp` on npm.

---

Part of broader research :)
